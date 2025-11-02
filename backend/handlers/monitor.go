package handlers

import (
    "context"
    "net/http"
    "time"

    "github.com/gin-gonic/gin"
    "go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/bson/primitive"

    "intelliops-ai-copilot/database"
    "intelliops-ai-copilot/models"
)

type MonitorHandler struct {
    db *database.MongoDB
}

func NewMonitorHandler(db *database.MongoDB) *MonitorHandler {
    return &MonitorHandler{db: db}
}

// Resources CRUD
func (h *MonitorHandler) CreateResource(c *gin.Context) {
    var r models.MonitoredResource
    if err := c.ShouldBindJSON(&r); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    r.ID = primitive.NewObjectID()
    r.CreatedAt = time.Now()
    r.UpdatedAt = time.Now()
    _, err := h.db.GetCollection("mon_resources").InsertOne(context.Background(), r)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create resource"})
        return
    }
    c.JSON(http.StatusCreated, r)
}

func (h *MonitorHandler) ListResources(c *gin.Context) {
    cur, err := h.db.GetCollection("mon_resources").Find(context.Background(), bson.M{})
    if err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": "fetch failed"}); return }
    defer cur.Close(context.Background())
    var items []models.MonitoredResource
    if err := cur.All(context.Background(), &items); err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": "decode failed"}); return }
    c.JSON(http.StatusOK, items)
}

func (h *MonitorHandler) UpdateResource(c *gin.Context) {
    id := c.Param("id")
    oid, err := primitive.ObjectIDFromHex(id)
    if err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"}); return }
    var r bson.M
    if err := c.ShouldBindJSON(&r); err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}); return }
    r["updatedAt"] = time.Now()
    _, err = h.db.GetCollection("mon_resources").UpdateByID(context.Background(), oid, bson.M{"$set": r})
    if err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": "update failed"}); return }
    c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

func (h *MonitorHandler) DeleteResource(c *gin.Context) {
    id := c.Param("id")
    oid, err := primitive.ObjectIDFromHex(id)
    if err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"}); return }
    _, err = h.db.GetCollection("mon_resources").DeleteOne(context.Background(), bson.M{"_id": oid})
    if err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": "delete failed"}); return }
    c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

// Metric configs CRUD
func (h *MonitorHandler) CreateMetric(c *gin.Context) {
    var m models.MetricConfig
    if err := c.ShouldBindJSON(&m); err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}); return }
    m.ID = primitive.NewObjectID()
    m.CreatedAt = time.Now()
    m.UpdatedAt = time.Now()
    _, err := h.db.GetCollection("mon_metrics").InsertOne(context.Background(), m)
    if err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create metric"}); return }
    c.JSON(http.StatusCreated, m)
}

func (h *MonitorHandler) ListMetrics(c *gin.Context) {
    filter := bson.M{}
    if rid := c.Query("resourceId"); rid != "" {
        if oid, err := primitive.ObjectIDFromHex(rid); err == nil {
            filter["resourceId"] = oid
        }
    }
    cur, err := h.db.GetCollection("mon_metrics").Find(context.Background(), filter)
    if err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": "fetch failed"}); return }
    defer cur.Close(context.Background())
    var items []models.MetricConfig
    if err := cur.All(context.Background(), &items); err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": "decode failed"}); return }
    c.JSON(http.StatusOK, items)
}

func (h *MonitorHandler) UpdateMetric(c *gin.Context) {
    id := c.Param("id")
    oid, err := primitive.ObjectIDFromHex(id)
    if err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"}); return }
    var m bson.M
    if err := c.ShouldBindJSON(&m); err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}); return }
    m["updatedAt"] = time.Now()
    _, err = h.db.GetCollection("mon_metrics").UpdateByID(context.Background(), oid, bson.M{"$set": m})
    if err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": "update failed"}); return }
    c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

func (h *MonitorHandler) DeleteMetric(c *gin.Context) {
    id := c.Param("id")
    oid, err := primitive.ObjectIDFromHex(id)
    if err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"}); return }
    _, err = h.db.GetCollection("mon_metrics").DeleteOne(context.Background(), bson.M{"_id": oid})
    if err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": "delete failed"}); return }
    c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

// List anomalies
func (h *MonitorHandler) ListAnomalies(c *gin.Context) {
    filter := bson.M{}
    if s := c.Query("status"); s != "" { filter["status"] = s }
    cur, err := h.db.GetCollection("mon_anomalies").Find(context.Background(), filter)
    if err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": "fetch failed"}); return }
    defer cur.Close(context.Background())
    var items []models.AnomalyRecord
    if err := cur.All(context.Background(), &items); err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": "decode failed"}); return }
    c.JSON(http.StatusOK, items)
}


