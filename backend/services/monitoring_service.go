package services

import (
    "context"
    "fmt"
    "log"
    "time"

    "go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/bson/primitive"

    "intelliops-ai-copilot/config"
    "intelliops-ai-copilot/database"
    "intelliops-ai-copilot/models"
)

type MonitoringService struct {
    db           *database.MongoDB
    cw           *CloudWatchService
    cfg          *config.Config
    llm          *LLMService
}

func NewMonitoringService(db *database.MongoDB, cw *CloudWatchService, cfg *config.Config, llm *LLMService) *MonitoringService {
    return &MonitoringService{db: db, cw: cw, cfg: cfg, llm: llm}
}

func (m *MonitoringService) Start(ctx context.Context) {
    ticker := time.NewTicker(m.cfg.MonitorPollInterval)
    go func() {
        for {
            select {
            case <-ctx.Done():
                ticker.Stop()
                return
            case <-ticker.C:
                if err := m.pollOnce(ctx); err != nil {
                    log.Printf("monitoring poll error: %v", err)
                }
            }
        }
    }()
}

func (m *MonitoringService) pollOnce(ctx context.Context) error {
    // Load resources
    cur, err := m.db.GetCollection("mon_resources").Find(ctx, bson.M{"enabled": true})
    if err != nil { return err }
    defer cur.Close(ctx)

    var resources []models.MonitoredResource
    if err := cur.All(ctx, &resources); err != nil { return err }

    // For each resource, load metrics
    for _, r := range resources {
        var metrics []models.MetricConfig
        mc, err := m.db.GetCollection("mon_metrics").Find(ctx, bson.M{"resourceId": r.ID, "enabled": true})
        if err != nil { return err }
        if err := mc.All(ctx, &metrics); err != nil { return err }

        for _, mcg := range metrics {
            if err := m.evaluateMetric(ctx, r, mcg); err != nil {
                log.Printf("evaluate metric error: %v", err)
            }
        }
    }
    return nil
}

func (m *MonitoringService) evaluateMetric(ctx context.Context, r models.MonitoredResource, mcg models.MetricConfig) error {
    end := time.Now().UTC()
    totalPoints := mcg.WindowSize + mcg.MinConsecutive
    start := end.Add(-time.Duration(totalPoints*mcg.PeriodSeconds) * time.Second)

    series, err := m.cw.GetMetricSeries(ctx, MetricQueryInput{
        Namespace:  r.Namespace,
        MetricName: mcg.MetricName,
        Dimensions: r.Dimensions,
        Stat:       mcg.Statistic,
        Period:     int32(mcg.PeriodSeconds),
        StartTime:  start,
        EndTime:    end,
    })
    if err != nil { return err }
    if len(series.Values) < totalPoints { return nil }

    res := DetectZScoreAnomaly(series.Values, mcg.WindowSize, mcg.ZScore, mcg.MinConsecutive, string(mcg.Direction))
    if !res.IsAnomaly { return nil }

    // dedup key: resource+metric within 30m
    dedup := fmt.Sprintf("%s:%s:%s", r.ID.Hex(), r.Namespace, mcg.MetricName)
    since := time.Now().Add(-30 * time.Minute)
    count, err := m.db.GetCollection("mon_anomalies").CountDocuments(ctx, bson.M{"dedupKey": dedup, "createdAt": bson.M{"$gte": since}})
    if err == nil && count > 0 { return nil }

    severity := mapSeverity(res.ZScore)

    anomaly := models.AnomalyRecord{
        ID:           primitive.NewObjectID(),
        ResourceID:   r.ID,
        MetricName:   mcg.MetricName,
        Timestamp:    series.Timestamps[len(series.Timestamps)-1],
        Value:        series.Values[len(series.Values)-1],
        BaselineMean: res.BaselineMean,
        BaselineStd:  res.BaselineStd,
        ZScore:       res.ZScore,
        Severity:     severity,
        DedupKey:     dedup,
        Status:       models.AnomalyOpen,
        CreatedAt:    time.Now(),
    }

    var ticketID *primitive.ObjectID
    if m.cfg.AnomalyCreateTickets {
        tID, err := m.createTicketForAnomaly(ctx, r, mcg, series, anomaly)
        if err != nil {
            log.Printf("ticket creation failed: %v", err)
        } else if tID != nil {
            ticketID = tID
            anomaly.TicketID = ticketID
        }
    }

    _, err = m.db.GetCollection("mon_anomalies").InsertOne(ctx, anomaly)
    return err
}

func mapSeverity(z float64) string {
    az := z
    if az < 0 { az = -az }
    switch {
    case az >= 5:
        return "critical"
    case az >= 4:
        return "high"
    case az >= 3:
        return "medium"
    default:
        return "low"
    }
}

func (m *MonitoringService) createTicketForAnomaly(ctx context.Context, r models.MonitoredResource, mcg models.MetricConfig, series MetricSeries, a models.AnomalyRecord) (*primitive.ObjectID, error) {
    // Build ticket directly into DB using existing schema. Assign to admin if exists.
    // Find admin user
    var admin models.User
    err := m.db.GetCollection("users").FindOne(ctx, bson.M{"role": models.RoleAdmin}).Decode(&admin)
    if err != nil { return nil, err }

    title := fmt.Sprintf("Anomaly detected: %s on %s", mcg.MetricName, r.Identifier)
    desc := fmt.Sprintf("Metric %s in %s for %s breached z-score threshold.\nCurrent: %.2f, Baseline mean: %.2f, std: %.2f, z: %.2f\nWindow: last %d x %ds\n",
        mcg.MetricName, r.Namespace, r.Identifier, a.Value, a.BaselineMean, a.BaselineStd, a.ZScore, mcg.WindowSize, mcg.PeriodSeconds)

    priority := models.PriorityMedium
    switch a.Severity {
    case "critical":
        priority = models.PriorityCritical
    case "high":
        priority = models.PriorityHigh
    case "low":
        priority = models.PriorityLow
    }

    ticket := models.Ticket{
        ID:          primitive.NewObjectID(),
        Title:       title,
        Description: desc,
        Category:    models.CategoryPerformance,
        Priority:    priority,
        Status:      models.StatusOpen,
        CreatedBy:   admin.ID,
        CreatedAt:   time.Now(),
        UpdatedAt:   time.Now(),
    }
    _, err = m.db.GetCollection("tickets").InsertOne(ctx, ticket)
    if err != nil { return nil, err }
    return &ticket.ID, nil
}


