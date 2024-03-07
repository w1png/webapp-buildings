package middleware

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/url"

	"github.com/labstack/echo/v4"
	"github.com/w1png/htmx-template/models"
	"github.com/w1png/htmx-template/storage"
)

// This function calculates HMAC-SHA-256 signature of the input data using the given key.
func computeHMACSHA256(data string, key []byte) string {
	h := hmac.New(sha256.New, key)
	h.Write([]byte(data))
	return hex.EncodeToString(h.Sum(nil))
}

func UseAuth(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		cookie, err := c.Cookie("token")
		if err != nil {
			return next(c)
		}

		token := cookie.Value
		params, err := url.ParseQuery(token)
		if err != nil {
			return next(c)
		}

		type TelegramUser struct {
			Id       int64  `json:"id"`
			Username string `json:"username"`
		}

		var telegramUser *TelegramUser
		if err := json.Unmarshal([]byte(params.Get("user")), &telegramUser); err != nil {
			return next(c)
		}

		fmt.Printf("telegramUser: %v\n", telegramUser)

		var user *models.User
		if storage.GormStorageInstance.DB.Where("telegram_id = ?", telegramUser.Id).First(&user).Error != nil {
			return next(c)
		}

		if user.Username != telegramUser.Username {
			user.Username = telegramUser.Username
			fmt.Printf("new user.Username: %v\n", user.Username)
			storage.GormStorageInstance.DB.Save(&user)
		}

		c.SetRequest(c.Request().WithContext(context.WithValue(c.Request().Context(), "user", user)))

		return next(c)
	}
}

func UseHost(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		// get current host
		host := c.Request().Host
		c.SetRequest(c.Request().WithContext(context.WithValue(c.Request().Context(), "host", host)))

		return next(c)
	}
}
