package product

import (
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
)

const maxImageSize = 5 << 20 // 5 MB

var allowedImageTypes = map[string]string{
	"image/jpeg": ".jpg",
	"image/png":  ".png",
	"image/webp": ".webp",
	"image/gif":  ".gif",
}

func SaveProductImage(companyID uint, header *multipart.FileHeader) (string, error) {
	if header.Size > maxImageSize {
		return "", fmt.Errorf("file too large (max 5MB)")
	}

	ext, ok := allowedImageTypes[header.Header.Get("Content-Type")]
	if !ok {
		ext = strings.ToLower(filepath.Ext(header.Filename))
		switch ext {
		case ".jpg", ".jpeg", ".png", ".webp", ".gif":
		default:
			return "", fmt.Errorf("unsupported image type")
		}
	}

	dir := filepath.Join("uploads", "products", fmt.Sprintf("%d", companyID))
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", err
	}

	filename := uuid.New().String() + ext
	destPath := filepath.Join(dir, filename)

	src, err := header.Open()
	if err != nil {
		return "", err
	}
	defer src.Close()

	dst, err := os.Create(destPath)
	if err != nil {
		return "", err
	}
	defer dst.Close()

	if _, err := io.Copy(dst, src); err != nil {
		return "", err
	}

	return "/uploads/products/" + fmt.Sprintf("%d", companyID) + "/" + filename, nil
}
