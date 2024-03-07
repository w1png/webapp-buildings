package user_handlers

import (
	"archive/zip"
	"bytes"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"

	"github.com/h2non/bimg"
	"github.com/labstack/echo/v4"
	"github.com/labstack/gommon/log"
	"github.com/w1png/htmx-template/models"
	"github.com/w1png/htmx-template/storage"
	user_templates "github.com/w1png/htmx-template/templates/user"
	"github.com/w1png/htmx-template/utils"
)

func GatherIndexHandlers(user_page_group *echo.Echo, user_api_group, admin_page_group, admin_api_group *echo.Group) {
	user_page_group.GET("/", IndexHandler)
	user_api_group.GET("/index", IndexApiHandler)
	user_page_group.GET("/region/:id", RegionHandler)
	user_api_group.GET("/region/:id", RegionApiHandler)
	user_api_group.GET("/adress/:id", AdressApiHandler)
	user_page_group.GET("/adress/:id", AdressHandler)
	user_api_group.POST("/adress/:id/images", PostAdressImagesHandler)
	user_api_group.GET("/image/static/images/:img/modal", AdressImageModalHandler)

	user_api_group.GET("/adress/:id/download", DownloadAdressHandler)
	user_api_group.GET("/region/:id/download", DownloadRegionHandler)

	user_api_group.GET("/admin", AdminPanelHandler)

	user_api_group.GET("/admins", AdminsIndex)
	user_api_group.GET("/admins/add", AddAdminModalHandler)
	user_api_group.POST("/admins", PostAdminHandler)
	user_api_group.DELETE("/admins/:id", DeleteAdminHandler)

	user_api_group.GET("/regions", AdminRegionsHandler)
	user_api_group.GET("/regions/:id", AdminRegionPageHandler)
	user_api_group.POST("/regions", PostRegionHandler)
	user_api_group.DELETE("/regions/:id", DeleteRegionHandler)
	user_api_group.POST("/regions/:id/adresses", PostAdressHandler)
	user_api_group.DELETE("/adresses/:id", DeleteAdressHandler)

	user_api_group.GET("/json/admin_telegram_ids", GetAdminTelegramIds)
	user_api_group.GET("/json/regions", GetRegionsHandler)
	user_api_group.GET("/json/regions/:id", GetRegionHandler)
	user_api_group.GET("/json/adresses/:id", GetAdressHandler)
}

func GetAdressHandler(c echo.Context) error {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		return err
	}

	var adress *models.Adress
	if err := storage.GormStorageInstance.DB.Find(&adress, id).Error; err != nil {
		return err
	}

	return c.JSON(http.StatusOK, adress)
}

func GetRegionHandler(c echo.Context) error {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		return err
	}

	var region *models.Region
	if err := storage.GormStorageInstance.DB.Find(&region, id).Error; err != nil {
		return err
	}

	return c.JSON(http.StatusOK, region)
}

func GetRegionsHandler(c echo.Context) error {
	var regions []models.Region
	if err := storage.GormStorageInstance.DB.Find(&regions).Error; err != nil {
		return err
	}

	return c.JSON(http.StatusOK, regions)
}

func GetAdminTelegramIds(c echo.Context) error {
	var admin_telegram_ids []int64
	if err := storage.GormStorageInstance.DB.Model(&models.User{}).Select("telegram_id").Find(&admin_telegram_ids).Error; err != nil {
		return err
	}

	return c.JSON(http.StatusOK, admin_telegram_ids)
}

func DownloadAdressHandler(c echo.Context) error {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		return c.String(http.StatusBadRequest, "Id error")
	}

	var adress *models.Adress
	if err := storage.GormStorageInstance.DB.Find(&adress, id).Error; err != nil {
		return err
	}

	buf := new(bytes.Buffer)
	z := zip.NewWriter(buf)

	var region_name string
	if err := storage.GormStorageInstance.DB.Model(&models.Region{}).Where("id = ?", adress.RegionId).Select("name").Find(&region_name).Error; err != nil {
		return err
	}

	folder_name := fmt.Sprintf("%s_%s", strings.ReplaceAll(region_name, " ", "_"), strings.ReplaceAll(adress.Name, " ", "_"))

	for i, image := range adress.Images {
		f, err := os.Open(image)
		if err != nil {
			return err
		}
		defer f.Close()

		archive_file, err := z.Create(folder_name + "/" + folder_name + "/" + strconv.Itoa(i) + ".png")
		if err != nil {
			return err
		}

		content, err := io.ReadAll(f)
		if err != nil {
			return err
		}

		png, err := bimg.NewImage(content).Convert(bimg.PNG)
		if err != nil {
			return err
		}

		if _, err := archive_file.Write(png); err != nil {
			return err
		}
	}

	if err := z.Close(); err != nil {
		log.Error(err)
	}

	c.Response().Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s.zip", folder_name))
	return c.Blob(http.StatusOK, "application/zip", buf.Bytes())
}

func IndexHandler(c echo.Context) error {
	var regions []*models.Region
	if err := storage.GormStorageInstance.DB.Find(&regions).Error; err != nil {
		return err
	}

	return utils.Render(c, user_templates.Index(regions))
}

func IndexApiHandler(c echo.Context) error {
	var regions []*models.Region
	if err := storage.GormStorageInstance.DB.Find(&regions).Error; err != nil {
		return err
	}

	return utils.Render(c, user_templates.IndexApi(regions))
}

func RegionHandler(c echo.Context) error {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		return c.String(http.StatusBadRequest, "Id error")
	}

	var region *models.Region
	if err := storage.GormStorageInstance.DB.Order("created_at DESC").Find(&region, id).Error; err != nil {
		return err
	}

	return utils.Render(c, user_templates.RegionPage(region))
}

func RegionApiHandler(c echo.Context) error {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		return c.String(http.StatusBadRequest, "Id error")
	}

	var region *models.Region
	if err := storage.GormStorageInstance.DB.Order("created_at DESC").Find(&region, id).Error; err != nil {
		return err
	}

	return utils.Render(c, user_templates.RegionApiPage(region))
}

func AdressImageModalHandler(c echo.Context) error {
	img := c.Param("img")

	return utils.Render(c, user_templates.AdressImageModal(img))
}

func AdressHandler(c echo.Context) error {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		return c.String(http.StatusBadRequest, "Id error")
	}

	// get base url from request
	fmt.Printf("\n\n\n%+v\n\n\n", c.Request().Context())

	var adress *models.Adress
	if err := storage.GormStorageInstance.DB.Order("created_at DESC").Find(&adress, uint(id)).Error; err != nil {
		return err
	}

	return utils.Render(c, user_templates.AdressPage(adress))
}

func AdressApiHandler(c echo.Context) error {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		return c.String(http.StatusBadRequest, "Id error")
	}

	var adress *models.Adress
	if err := storage.GormStorageInstance.DB.Order("created_at DESC").Find(&adress, uint(id)).Error; err != nil {
		return err
	}

	return utils.Render(c, user_templates.AdressApiPage(adress))
}

func AdminsIndex(c echo.Context) error {
	user := utils.GetUserFromContext(c.Request().Context())
	if user == nil {
		return c.NoContent(http.StatusUnauthorized)
	}

	var users []*models.User
	if err := storage.GormStorageInstance.DB.Find(&users).Error; err != nil {
		return c.NoContent(http.StatusInternalServerError)
	}

	return utils.Render(c, user_templates.Admins(users))
}

func AddAdminModalHandler(c echo.Context) error {
	user := utils.GetUserFromContext(c.Request().Context())
	if user == nil {
		return c.NoContent(http.StatusUnauthorized)
	}

	return utils.Render(c, user_templates.AddAdminModal())
}

func PostAdminHandler(c echo.Context) error {
	if user := utils.GetUserFromContext(c.Request().Context()); user == nil {
		return c.NoContent(http.StatusUnauthorized)
	}

	if err := c.Request().ParseForm(); err != nil {
		return c.String(http.StatusBadRequest, "Неверный запрос")
	}

	telegram_id, err := strconv.ParseInt(c.FormValue("telegram_id"), 10, 64)
	if err != nil {
		return c.String(http.StatusBadRequest, "ID должен быть числом")
	}

	user := models.NewUser(telegram_id)

	if err := storage.GormStorageInstance.DB.Create(&user).Error; err != nil {
		log.Error(err)
		return c.String(http.StatusInternalServerError, "Ошибка добавления пользователя")
	}

	return utils.Render(c, user_templates.Admin(user))
}

func DeleteAdminHandler(c echo.Context) error {
	user := utils.GetUserFromContext(c.Request().Context())
	if user == nil {
		return c.NoContent(http.StatusUnauthorized)
	}

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return c.String(http.StatusBadRequest, "Неверный id")
	}

	var delete_user *models.User
	if err := storage.GormStorageInstance.DB.Where("telegram_id = ?", id).First(&delete_user).Error; err != nil {
		log.Error(err)
		return c.String(http.StatusInternalServerError, "Ошибка удаления пользователя")
	}

	if err := storage.GormStorageInstance.DB.Delete(&delete_user).Error; err != nil {
		log.Error(err)
		return c.String(http.StatusInternalServerError, "Ошибка удаления пользователя")
	}

	return c.NoContent(http.StatusOK)
}

func AdminPanelHandler(c echo.Context) error {
	user := utils.GetUserFromContext(c.Request().Context())
	if user == nil {
		return c.NoContent(http.StatusUnauthorized)
	}

	return utils.Render(c, user_templates.AdminPanel())
}

func AdminRegionsHandler(c echo.Context) error {
	user := utils.GetUserFromContext(c.Request().Context())
	if user == nil {
		return c.NoContent(http.StatusUnauthorized)
	}

	var regions []*models.Region
	if err := storage.GormStorageInstance.DB.Find(&regions).Error; err != nil {
		return c.NoContent(http.StatusInternalServerError)
	}

	return utils.Render(c, user_templates.AdminRegions(regions))
}

func PostRegionHandler(c echo.Context) error {
	user := utils.GetUserFromContext(c.Request().Context())
	if user == nil {
		return c.NoContent(http.StatusUnauthorized)
	}

	if err := c.Request().ParseForm(); err != nil {
		return c.String(http.StatusBadRequest, "Неверный запрос")
	}

	name := c.FormValue("name")
	if name == "" {
		return c.String(http.StatusBadRequest, "Не указано название региона")
	}

	region := models.NewRegion(name)
	if err := storage.GormStorageInstance.DB.Create(&region).Error; err != nil {
		return c.String(http.StatusInternalServerError, "Внутренняя ошибка сервера")
	}

	return utils.Render(c, user_templates.AdminRegion(region))
}

func DeleteRegionHandler(c echo.Context) error {
	user := utils.GetUserFromContext(c.Request().Context())
	if user == nil {
		return c.NoContent(http.StatusUnauthorized)
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		return c.String(http.StatusBadRequest, "Неверный запрос")
	}

	var region *models.Region
	if err := storage.GormStorageInstance.DB.Find(&region, uint(id)).Error; err != nil {
		return c.String(http.StatusInternalServerError, "Внутренняя ошибка сервера")
	}

	if err := storage.GormStorageInstance.DB.Delete(&region).Error; err != nil {
		return c.String(http.StatusInternalServerError, "Внутренняя ошибка сервера")
	}

	return c.NoContent(http.StatusOK)
}

func AdminRegionPageHandler(c echo.Context) error {
	user := utils.GetUserFromContext(c.Request().Context())
	if user == nil {
		return c.NoContent(http.StatusUnauthorized)
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		return c.String(http.StatusBadRequest, "Неверный id")
	}

	var region *models.Region
	if err := storage.GormStorageInstance.DB.Find(&region, id).Error; err != nil {
		return c.String(http.StatusNotFound, "Регион не найден")
	}

	return utils.Render(c, user_templates.AdminRegionPage(region))
}

func PostAdressHandler(c echo.Context) error {
	user := utils.GetUserFromContext(c.Request().Context())
	if user == nil {
		return c.NoContent(http.StatusUnauthorized)
	}

	region_id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		return c.String(http.StatusBadRequest, "Неверный id")
	}

	if err := c.Request().ParseForm(); err != nil {
		return c.String(http.StatusBadRequest, "Неверный запрос")
	}

	name := c.FormValue("name")
	if name == "" {
		return c.String(http.StatusBadRequest, "Адрес не может быть пустым")
	}

	adress := models.NewAdress(name, uint(region_id))
	if err := storage.GormStorageInstance.DB.Create(&adress).Error; err != nil {
		return c.String(http.StatusInternalServerError, "Ошибка при создании адреса")
	}

	return utils.Render(c, user_templates.AdminAdress(adress))
}

func DeleteAdressHandler(c echo.Context) error {
	user := utils.GetUserFromContext(c.Request().Context())
	if user == nil {
		return c.NoContent(http.StatusUnauthorized)
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		return c.String(http.StatusBadRequest, "Неверный id")
	}

	var adress *models.Adress
	if err := storage.GormStorageInstance.DB.Find(&adress, id).Error; err != nil {
		return c.String(http.StatusInternalServerError, "Ошибка при удалении адреса")
	}

	if err := storage.GormStorageInstance.DB.Delete(&adress).Error; err != nil {
		return c.String(http.StatusInternalServerError, "Ошибка при удалении адреса")
	}

	return c.NoContent(http.StatusOK)
}

func PostAdressImagesHandler(c echo.Context) error {
	if err := c.Request().ParseMultipartForm(int64(50 * 1024 * 1024)); err != nil {
		log.Error(err)
		return c.String(http.StatusBadRequest, "Неверный запрос")
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		return c.String(http.StatusBadRequest, "Неверный id")
	}

	var adress *models.Adress
	if err := storage.GormStorageInstance.DB.Find(&adress, id).Error; err != nil {
		return c.String(http.StatusInternalServerError, "Ошибка при удалении адреса")
	}

	// iterate over <input type"file" name="images" multiple />
	images := c.Request().MultipartForm.File["images"]
	images_len := len(images)
	if images_len == 0 {
		return c.String(http.StatusBadRequest, "Загрузите хотя бы 1 фото")
	}

	wg := sync.WaitGroup{}
	wg.Add(images_len)

	image_filenames := make(chan string, len(images))

	for _, image := range images {
		go func(image *multipart.FileHeader, wg *sync.WaitGroup) {
			defer wg.Done()

			opened_image, err := image.Open()
			if err != nil {
				log.Error(err)
				return
			}

			processed_image, err := utils.ProcessImage(opened_image)
			if err != nil {
				log.Error(err)
				return
			}

			filename, err := utils.SaveImage(processed_image)
			if err != nil {
				log.Error(err)
				return
			}

			image_filenames <- filename
		}(image, &wg)
	}

	wg.Wait()

	close(image_filenames)
	for image_filename := range image_filenames {
		adress.Images = append(adress.Images, image_filename)
	}

	if err := storage.GormStorageInstance.DB.Save(&adress).Error; err != nil {
		return c.String(http.StatusInternalServerError, "Ошибка при сохранении адреса")
	}

	return c.NoContent(http.StatusOK)
}

func DownloadRegionHandler(c echo.Context) error {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		return c.String(http.StatusBadRequest, "Id error")
	}

	var region *models.Region
	if err := storage.GormStorageInstance.DB.Find(&region, id).Error; err != nil {
		return err
	}

	buf := new(bytes.Buffer)
	z := zip.NewWriter(buf)

	folder_name := strings.ReplaceAll(region.Name, " ", "_")

	for _, adress := range region.Adresses {
		adress_folder_name := strings.ReplaceAll(adress.Name, " ", "_")

		for i, image := range adress.Images {
			f, err := os.Open(image)
			if err != nil {
				return err
			}
			defer f.Close()

			archive_file, err := z.Create(folder_name + "/" + folder_name + "/" + adress_folder_name + "/" + strconv.Itoa(i) + ".png")
			if err != nil {
				return err
			}

			content, err := io.ReadAll(f)
			if err != nil {
				return err
			}

			png, err := bimg.NewImage(content).Convert(bimg.PNG)
			if err != nil {
				return err
			}

			if _, err := archive_file.Write(png); err != nil {
				return err
			}
		}
	}

	if err := z.Close(); err != nil {
		return err
	}

	c.Response().Header().Set("Content-Length", strconv.Itoa(len(buf.Bytes())))
	c.Response().Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s.zip", folder_name))
	return c.Blob(http.StatusOK, "application/zip", buf.Bytes())
}
