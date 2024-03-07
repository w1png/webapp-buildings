package models

import "gorm.io/gorm"

type Region struct {
	gorm.Model

	ID uint

	Name string

	Adresses []Adress `gorm:"-"`
}

func NewRegion(name string) *Region {
	return &Region{
		Name: name,
	}
}

func (r *Region) AfterFind(tx *gorm.DB) error {
	return tx.Where("region_id = ?", r.ID).Find(&r.Adresses).Error
}
