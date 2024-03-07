package main

import (
	"log"

	"github.com/w1png/htmx-template/config"
	"github.com/w1png/htmx-template/models"
	"github.com/w1png/htmx-template/storage"
)

func createDefaultAdmin() error {
	if err := storage.GormStorageInstance.DB.Where("telegram_id = ?", config.ConfigInstance.MainAdminId).First(&models.User{}).Error; err == nil {
		return nil
	}

	return storage.GormStorageInstance.DB.Create(models.NewUser(config.ConfigInstance.MainAdminId)).Error
}

func main() {
	if err := config.InitConfig(); err != nil {
		log.Fatal(err)
	}

	if err := storage.InitStorage(); err != nil {
		log.Fatal(err)
	}

	if err := createDefaultAdmin(); err != nil {
		log.Fatal(err)
	}

	server := NewHTTPServer()

	log.Fatal(server.Run())
}
