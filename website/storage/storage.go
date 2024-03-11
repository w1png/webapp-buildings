package storage

import (
	"github.com/w1png/htmx-template/config"
	"github.com/w1png/htmx-template/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type GormStorage struct {
	DB *gorm.DB
}

var GormStorageInstance *GormStorage

func InitStorage() error {
	storage := &GormStorage{}

	var err error
	storage.DB, err = gorm.Open(sqlite.Open(config.ConfigInstance.SqlitePath), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		return err
	}

	GormStorageInstance = storage

	return storage.DB.AutoMigrate(
		&models.User{},
		&models.Region{},
		&models.Adress{},
	)
}
