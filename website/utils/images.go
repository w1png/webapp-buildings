package utils

import (
	"crypto/md5"
	"fmt"
	"io"

	"github.com/h2non/bimg"
)

func ProcessImage(file io.Reader) ([]byte, error) {
	buffer, err := io.ReadAll(file)
	if err != nil {
		return []byte{}, err
	}

	webp, err := bimg.NewImage(buffer).Convert(bimg.PNG)
	if err != nil {
		return []byte{}, err
	}

	processed, err := bimg.NewImage(webp).Process(bimg.Options{Quality: bimg.Quality})
	if err != nil {
		return []byte{}, err
	}

	return processed, nil
}

func SaveImage(img []byte) (string, error) {
	md5hash := md5.Sum(img)
	filename := "static/images/" + fmt.Sprintf("%x", md5hash) + ".webp"

	if err := bimg.Write(filename, img); err != nil {
		return "", err
	}

	return filename, nil
}
