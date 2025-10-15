package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TicketStatus string
type TicketPriority string
type TicketCategory string

const (
	StatusOpen       TicketStatus = "open"
	StatusInProgress TicketStatus = "in_progress"
	StatusResolved   TicketStatus = "resolved"
	StatusClosed     TicketStatus = "closed"

	PriorityLow    TicketPriority = "low"
	PriorityMedium TicketPriority = "medium"
	PriorityHigh   TicketPriority = "high"
	PriorityCritical TicketPriority = "critical"

	CategoryNetwork     TicketCategory = "Network Issue"
	CategoryHardware    TicketCategory = "Hardware Issue"
	CategorySoftware    TicketCategory = "Software Issue"
	CategorySecurity    TicketCategory = "Security Issue"
	CategoryPerformance TicketCategory = "Performance Issue"
	CategoryOther       TicketCategory = "Other"
)

type Ticket struct {
	ID          primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	Title       string             `json:"title" bson:"title" binding:"required"`
	Description string             `json:"description" bson:"description" binding:"required"`
	Category    TicketCategory     `json:"category" bson:"category"`
	Priority    TicketPriority     `json:"priority" bson:"priority"`
	Status      TicketStatus       `json:"status" bson:"status"`
	AssignedTo  *primitive.ObjectID `json:"assignedTo,omitempty" bson:"assignedTo,omitempty"`
	CreatedBy   primitive.ObjectID `json:"createdBy" bson:"createdBy" binding:"required"`
	CreatedAt   time.Time          `json:"createdAt" bson:"createdAt"`
	UpdatedAt   time.Time          `json:"updatedAt" bson:"updatedAt"`
	ResolvedAt  *time.Time         `json:"resolvedAt,omitempty" bson:"resolvedAt,omitempty"`
}

type CreateTicketRequest struct {
	Title       string         `json:"title" binding:"required"`
	Description string         `json:"description" binding:"required"`
	Category    TicketCategory `json:"category,omitempty"`
	Priority    TicketPriority `json:"priority,omitempty"`
}

type UpdateTicketRequest struct {
	Title       string         `json:"title,omitempty"`
	Description string         `json:"description,omitempty"`
	Category    TicketCategory `json:"category,omitempty"`
	Priority    TicketPriority `json:"priority,omitempty"`
	Status      TicketStatus   `json:"status,omitempty"`
	AssignedTo  *primitive.ObjectID `json:"assignedTo,omitempty"`
}

type TicketWithUser struct {
	Ticket
	AssignedUser *User `json:"assignedUser,omitempty"`
	CreatedUser  User  `json:"createdUser"`
}
