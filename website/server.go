package main

import (
	"fmt"
	"time"

	"github.com/labstack/echo/v4"
	echoMiddleware "github.com/labstack/echo/v4/middleware"
	"github.com/w1png/htmx-template/config"
	user_handlers "github.com/w1png/htmx-template/handlers/user"
	"github.com/w1png/htmx-template/middleware"
)

type HTTPServer struct {
	echo *echo.Echo
}

func NewHTTPServer() *HTTPServer {
	server := &HTTPServer{
		echo: echo.New(),
	}

	server.echo.Server.ReadTimeout = 1 * time.Hour
	server.echo.Server.WriteTimeout = 1 * time.Hour

	user_page_group := server.echo
	server.echo.Use(middleware.UseHost)
	server.echo.Use(middleware.UseAuth)
	server.echo.Use(middleware.UseNoCache)
	user_api_group := server.echo.Group("/api")

	admin_page_group := server.echo.Group("/admin")
	admin_api_group := admin_page_group.Group("/api")

	server.echo.Use(echoMiddleware.Logger())
	server.echo.Use(echoMiddleware.Recover())

	server.echo.Static("/static", "static")

	gather_funcs := []func(*echo.Echo, *echo.Group, *echo.Group, *echo.Group){
		user_handlers.GatherIndexHandlers,
	}

	for _, f := range gather_funcs {
		f(user_page_group, user_api_group, admin_page_group, admin_api_group)
	}

	return server
}

func (s *HTTPServer) Run() error {
	return s.echo.Start(fmt.Sprintf(":%s", config.ConfigInstance.Port))
}
