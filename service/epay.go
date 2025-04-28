package service

import (
	"veloera/setting"
)

func GetCallbackAddress() string {
	if setting.CustomCallbackAddress == "" {
		return setting.ServerAddress
	}
	return setting.CustomCallbackAddress
}
