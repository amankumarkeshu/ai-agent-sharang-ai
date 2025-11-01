package models

import (
    "time"
    "go.mongodb.org/mongo-driver/bson/primitive"
)

type MonitoredResourceType string

const (
    ResourceEC2 MonitoredResourceType = "ec2"
    ResourceALB MonitoredResourceType = "alb"
    ResourceECS MonitoredResourceType = "ecs"
)

type MonitoredResource struct {
    ID          primitive.ObjectID     `bson:"_id,omitempty" json:"id"`
    Type        MonitoredResourceType  `bson:"type" json:"type"`
    Identifier  string                 `bson:"identifier" json:"identifier"` // e.g., i-123, alb/xyz, service name
    Namespace   string                 `bson:"namespace" json:"namespace"`   // AWS namespace, e.g., AWS/EC2
    Dimensions  map[string]string      `bson:"dimensions" json:"dimensions"`
    Enabled     bool                   `bson:"enabled" json:"enabled"`
    CreatedAt   time.Time              `bson:"createdAt" json:"createdAt"`
    UpdatedAt   time.Time              `bson:"updatedAt" json:"updatedAt"`
}

type MetricConfigDirection string

const (
    DirectionAbove MetricConfigDirection = "above"
    DirectionBelow MetricConfigDirection = "below"
)

type MetricConfig struct {
    ID             primitive.ObjectID      `bson:"_id,omitempty" json:"id"`
    ResourceID     primitive.ObjectID      `bson:"resourceId" json:"resourceId"`
    MetricName     string                  `bson:"metricName" json:"metricName"`
    Statistic      string                  `bson:"statistic" json:"statistic"` // Average, Sum, p90
    PeriodSeconds  int                     `bson:"periodSeconds" json:"periodSeconds"`
    WindowSize     int                     `bson:"windowSize" json:"windowSize"` // number of points
    ZScore         float64                 `bson:"zScore" json:"zScore"`
    MinConsecutive int                     `bson:"minConsecutive" json:"minConsecutive"`
    Direction      MetricConfigDirection   `bson:"direction" json:"direction"`
    PriorityMap    map[string]TicketPriority `bson:"priorityMap" json:"priorityMap"`
    Enabled        bool                    `bson:"enabled" json:"enabled"`
    CreatedAt      time.Time               `bson:"createdAt" json:"createdAt"`
    UpdatedAt      time.Time               `bson:"updatedAt" json:"updatedAt"`
}

type AnomalyStatus string

const (
    AnomalyOpen   AnomalyStatus = "open"
    AnomalyClosed AnomalyStatus = "closed"
)

type AnomalyRecord struct {
    ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
    ResourceID    primitive.ObjectID `bson:"resourceId" json:"resourceId"`
    MetricName    string             `bson:"metricName" json:"metricName"`
    Timestamp     time.Time          `bson:"timestamp" json:"timestamp"`
    Value         float64            `bson:"value" json:"value"`
    BaselineMean  float64            `bson:"baselineMean" json:"baselineMean"`
    BaselineStd   float64            `bson:"baselineStd" json:"baselineStd"`
    ZScore        float64            `bson:"zScore" json:"zScore"`
    Severity      string             `bson:"severity" json:"severity"` // critical, high, medium, low
    DedupKey      string             `bson:"dedupKey" json:"dedupKey"`
    TicketID      *primitive.ObjectID `bson:"ticketId,omitempty" json:"ticketId,omitempty"`
    Status        AnomalyStatus      `bson:"status" json:"status"`
    CreatedAt     time.Time          `bson:"createdAt" json:"createdAt"`
}


