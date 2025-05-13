package model

import (
	"fmt"
	"log"
	"os"
	"strings"
	"sync"
	"time"
	"veloera/common"
	"veloera/constant"

	"github.com/glebarez/sqlite"
	"gorm.io/driver/mysql"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var groupCol string
var keyCol string

func initCol() {
	if common.UsingPostgreSQL {
		groupCol = `"group"`
		keyCol = `"key"`

	} else {
		groupCol = "`group`"
		keyCol = "`key`"
	}
}

var DB *gorm.DB

var LOG_DB *gorm.DB

func createRootAccountIfNeed() error {
	var user User
	//if user.Status != common.UserStatusEnabled {
	if err := DB.First(&user).Error; err != nil {
		common.SysLog("no user exists, create a root user for you: username is root, password is 123456")
		hashedPassword, err := common.Password2Hash("123456")
		if err != nil {
			return err
		}
		rootUser := User{
			Username:    "root",
			Password:    hashedPassword,
			Role:        common.RoleRootUser,
			Status:      common.UserStatusEnabled,
			DisplayName: "Root User",
			AccessToken: nil,
			Quota:       100000000,
		}
		DB.Create(&rootUser)
	}
	return nil
}

func CheckSetup() {
	setup := GetSetup()
	if setup == nil {
		// No setup record exists, check if we have a root user
		if RootUserExists() {
			common.SysLog("system is not initialized, but root user exists")
			// Create setup record
			newSetup := Setup{
				Version:       common.Version,
				InitializedAt: time.Now().Unix(),
			}
			err := DB.Create(&newSetup).Error
			if err != nil {
				common.SysLog("failed to create setup record: " + err.Error())
			}
			constant.Setup = true
		} else {
			common.SysLog("system is not initialized and no root user exists")
			constant.Setup = false
		}
	} else {
		// Setup record exists, system is initialized
		common.SysLog("system is already initialized at: " + time.Unix(setup.InitializedAt, 0).String())
		constant.Setup = true
	}
}

func chooseDB(envName string) (*gorm.DB, error) {
	defer func() {
		initCol()
	}()
	dsn := os.Getenv(envName)
	if dsn != "" {
		if strings.HasPrefix(dsn, "postgres://") || strings.HasPrefix(dsn, "postgresql://") {
			// Use PostgreSQL
			common.SysLog("using PostgreSQL as database")
			common.UsingPostgreSQL = true
			return gorm.Open(postgres.New(postgres.Config{
				DSN:                  dsn,
				PreferSimpleProtocol: true, // disables implicit prepared statement usage
			}), &gorm.Config{
				PrepareStmt: true, // precompile SQL
			})
		}
		if strings.HasPrefix(dsn, "local") {
			// Check and migrate from one-api.db to veloera.db
			oldPaths := []string{"./one-api.db", "./data/one-api.db"}
			newPaths := []string{"./veloera.db", "./data/veloera.db"}

			for i, oldPath := range oldPaths {
				if _, err := os.Stat(oldPath); err == nil {
					// Old database exists, copy it to new location if new db doesn't exist
					if _, err := os.Stat(newPaths[i]); os.IsNotExist(err) {
						data, err := os.ReadFile(oldPath)
						if err == nil {
							err = os.WriteFile(newPaths[i], data, 0644)
							if err == nil {
								common.SysLog("Migrated database from " + oldPath + " to " + newPaths[i])
							}
						}
					}
				}
			}

			common.SysLog("SQL_DSN not set, using SQLite as database")
			common.UsingSQLite = true
			return gorm.Open(sqlite.Open(common.SQLitePath), &gorm.Config{
				PrepareStmt: true, // precompile SQL
			})
		}
		// Use MySQL
		common.SysLog("using MySQL as database")
		// check parseTime
		if !strings.Contains(dsn, "parseTime") {
			if strings.Contains(dsn, "?") {
				dsn += "&parseTime=true"
			} else {
				dsn += "?parseTime=true"
			}
		}
		common.UsingMySQL = true
		return gorm.Open(mysql.Open(dsn), &gorm.Config{
			PrepareStmt: true, // precompile SQL
		})
	}
	// Use SQLite
	common.SysLog("SQL_DSN not set, using SQLite as database")
	common.UsingSQLite = true

	// Check and migrate from veloera.db to veloera.db
	oldPaths := []string{"./veloera.db", "./data/veloera.db"}
	newPaths := []string{"./veloera.db", "./data/veloera.db"}

	for i, oldPath := range oldPaths {
		if _, err := os.Stat(oldPath); err == nil {
			// Old database exists, copy it to new location if new db doesn't exist
			if _, err := os.Stat(newPaths[i]); os.IsNotExist(err) {
				data, err := os.ReadFile(oldPath)
				if err == nil {
					err = os.WriteFile(newPaths[i], data, 0644)
					if err == nil {
						common.SysLog("Migrated database from " + oldPath + " to " + newPaths[i])
					}
				}
			}
		}
	}

	return gorm.Open(sqlite.Open(common.SQLitePath), &gorm.Config{
		PrepareStmt: true, // precompile SQL
	})
}

func InitDB() (err error) {
	db, err := chooseDB("SQL_DSN")
	if err == nil {
		if common.DebugEnabled {
			db = db.Debug()
		}
		DB = db
		sqlDB, err := DB.DB()
		if err != nil {
			return err
		}
		sqlDB.SetMaxIdleConns(common.GetEnvOrDefault("SQL_MAX_IDLE_CONNS", 100))
		sqlDB.SetMaxOpenConns(common.GetEnvOrDefault("SQL_MAX_OPEN_CONNS", 1000))
		sqlDB.SetConnMaxLifetime(time.Second * time.Duration(common.GetEnvOrDefault("SQL_MAX_LIFETIME", 60)))

		if !common.IsMasterNode {
			return nil
		}
		if common.UsingMySQL {
			_, _ = sqlDB.Exec("ALTER TABLE channels MODIFY model_mapping TEXT;") // TODO: delete this line when most users have upgraded
		}
		common.SysLog("database migration started")
		err = migrateDB()
		return err
	} else {
		common.FatalLog(err)
	}
	return err
}

func InitLogDB() (err error) {
	if os.Getenv("LOG_SQL_DSN") == "" {
		LOG_DB = DB
		return
	}
	db, err := chooseDB("LOG_SQL_DSN")
	if err == nil {
		if common.DebugEnabled {
			db = db.Debug()
		}
		LOG_DB = db
		sqlDB, err := LOG_DB.DB()
		if err != nil {
			return err
		}
		sqlDB.SetMaxIdleConns(common.GetEnvOrDefault("SQL_MAX_IDLE_CONNS", 100))
		sqlDB.SetMaxOpenConns(common.GetEnvOrDefault("SQL_MAX_OPEN_CONNS", 1000))
		sqlDB.SetConnMaxLifetime(time.Second * time.Duration(common.GetEnvOrDefault("SQL_MAX_LIFETIME", 60)))

		if !common.IsMasterNode {
			return nil
		}
		//if common.UsingMySQL {
		//	_, _ = sqlDB.Exec("DROP INDEX idx_channels_key ON channels;")             // TODO: delete this line when most users have upgraded
		//	_, _ = sqlDB.Exec("ALTER TABLE midjourneys MODIFY action VARCHAR(40);")   // TODO: delete this line when most users have upgraded
		//	_, _ = sqlDB.Exec("ALTER TABLE midjourneys MODIFY progress VARCHAR(30);") // TODO: delete this line when most users have upgraded
		//	_, _ = sqlDB.Exec("ALTER TABLE midjourneys MODIFY status VARCHAR(20);")   // TODO: delete this line when most users have upgraded
		//}
		common.SysLog("database migration started")
		err = migrateLOGDB()
		return err
	} else {
		common.FatalLog(err)
	}
	return err
}

func migrateDB() error {
	common.SysLog("开始迁移数据库...")
	// 定义需要迁移的所有数据库模型
	models := []interface{}{
		&Channel{},
		&Token{},
		&User{},
		&Option{},
		&Redemption{},
		&RedemptionLog{},
		&Ability{},
		&Log{},
		&Midjourney{},
		&TopUp{},
		&QuotaData{},
		&Task{},
		&Setup{},
	}

	skippedTables := 0
	migratedTables := 0

	for _, model := range models {
		modelName := fmt.Sprintf("%T", model)
		modelName = strings.TrimPrefix(modelName, "*model.")

		err := DB.AutoMigrate(model)
		if err != nil {
			// 如果是表已存在的错误，我们记录并继续
			if strings.Contains(err.Error(), "already exists") {
				common.SysLog("表 " + modelName + " 已存在，跳过迁移")
				skippedTables++
				continue
			}
			// 其他错误则返回
			return fmt.Errorf("迁移表 %s 失败: %v", modelName, err)
		}
		migratedTables++
	}

	common.SysLog(fmt.Sprintf("数据库迁移完成，成功迁移 %d 个表，跳过 %d 个已存在的表", migratedTables, skippedTables))
	return nil
}

func migrateLOGDB() error {
	var err error
	if err = LOG_DB.AutoMigrate(&Log{}); err != nil {
		return err
	}
	return nil
}

func closeDB(db *gorm.DB) error {
	sqlDB, err := db.DB()
	if err != nil {
		return err
	}
	err = sqlDB.Close()
	return err
}

func CloseDB() error {
	if LOG_DB != DB {
		err := closeDB(LOG_DB)
		if err != nil {
			return err
		}
	}
	return closeDB(DB)
}

var (
	lastPingTime time.Time
	pingMutex    sync.Mutex
)

func PingDB() error {
	pingMutex.Lock()
	defer pingMutex.Unlock()

	if time.Since(lastPingTime) < time.Second*10 {
		return nil
	}

	sqlDB, err := DB.DB()
	if err != nil {
		log.Printf("Error getting sql.DB from GORM: %v", err)
		return err
	}

	err = sqlDB.Ping()
	if err != nil {
		log.Printf("Error pinging DB: %v", err)
		return err
	}

	lastPingTime = time.Now()
	common.SysLog("Database pinged successfully")
	return nil
}
