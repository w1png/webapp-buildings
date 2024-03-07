package utils

import (
	"context"

	"github.com/labstack/echo"
	"github.com/w1png/htmx-template/models"
)

type ResponseData struct {
	User *models.User
	Data interface{}
}

func MarshalResponse(c echo.Context, data interface{}) *ResponseData {
	var user *models.User
	userAny := c.Request().Context().Value("user")
	if userAny == nil {
		user = nil
	} else {
		user = userAny.(*models.User)
	}

	return &ResponseData{
		User: user,
		Data: data,
	}
}

func GetUserFromContext(ctx context.Context) *models.User {
	var user *models.User
	userAny := ctx.Value("user")
	if userAny == nil {
		user = nil
	} else {
		user = userAny.(*models.User)
	}

	return user
}

func GetHostFromContext(ctx context.Context) string {
	var host string
	hostAny := ctx.Value("host")
	if hostAny == nil {
		host = ""
	} else {
		host = hostAny.(string)
	}

	return host
}
