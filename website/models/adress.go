package models

import (
	"github.com/lib/pq"
	"gorm.io/gorm"
)

type Adress struct {
	gorm.Model

	ID uint

	Name     string
	RegionId uint

	Images pq.StringArray `gorm:"type:text[]"`
}

func NewAdress(name string, region_id uint) *Adress {
	return &Adress{
		Name:     name,
		RegionId: region_id,
	}
}
