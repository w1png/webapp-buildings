package models

import (
	"gorm.io/gorm"
)

const USERS_PER_PAGE = 20

type User struct {
	gorm.Model

	Username   string `json:"username"`
	TelegramId int64  `json:"telegram_id"`
}

func NewUser(telegram_id int64) *User {
	return &User{
		TelegramId: telegram_id,
	}
}
