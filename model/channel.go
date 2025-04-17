package model

import (
	"encoding/json"
	"one-api/common"
	"strings"
	"sync"

	"gorm.io/gorm"
)

type Channel struct {
	Id                 int     `json:"id"`
	Type               int     `json:"type" gorm:"default:0"`
	Key                string  `json:"key" gorm:"not null"`
	OpenAIOrganization *string `json:"openai_organization"`
	TestModel          *string `json:"test_model"`
	Status             int     `json:"status" gorm:"default:1"`
	Name               string  `json:"name" gorm:"index"`
	Weight             *uint   `json:"weight" gorm:"default:0"`
	CreatedTime        int64   `json:"created_time" gorm:"bigint"`
	TestTime           int64   `json:"test_time" gorm:"bigint"`
	ResponseTime       int     `json:"response_time"` // in milliseconds
	BaseURL            *string `json:"base_url" gorm:"column:base_url;default:''"`
	Other              string  `json:"other"`
	Balance            float64 `json:"balance"` // in USD
	BalanceUpdatedTime int64   `json:"balance_updated_time" gorm:"bigint"`
	Models             string  `json:"models"`
	Group              string  `json:"group" gorm:"type:varchar(64);default:'default'"`
	UsedQuota          int64   `json:"used_quota" gorm:"bigint;default:0"`
	ModelMapping       *string `json:"model_mapping" gorm:"type:text"`
	//MaxInputTokens     *int    `json:"max_input_tokens" gorm:"default:0"`
	StatusCodeMapping *string `json:"status_code_mapping" gorm:"type:varchar(1024);default:''"`
	Priority          *int64  `json:"priority" gorm:"bigint;default:0"`
	AutoBan           *int    `json:"auto_ban" gorm:"default:1"`
	OtherInfo         string  `json:"other_info"`
	Tag               *string `json:"tag" gorm:"index"`
	Setting           *string `json:"setting" gorm:"type:text"`
	ParamOverride     *string `json:"param_override" gorm:"type:text"`
}

func (channel *Channel) GetModels() []string {
	if channel.Models == "" {
		return []string{}
	}
	return strings.Split(strings.Trim(channel.Models, ","), ",")
}

func (channel *Channel) GetOtherInfo() map[string]interface{} {
	otherInfo := make(map[string]interface{})
	if channel.OtherInfo != "" {
		err := json.Unmarshal([]byte(channel.OtherInfo), &otherInfo)
		if err != nil {
			common.SysError("failed to unmarshal other info: " + err.Error())
		}
	}
	return otherInfo
}

func (channel *Channel) SetOtherInfo(otherInfo map[string]interface{}) {
	otherInfoBytes, err := json.Marshal(otherInfo)
	if err != nil {
		common.SysError("failed to marshal other info: " + err.Error())
		return
	}
	channel.OtherInfo = string(otherInfoBytes)
}

func (channel *Channel) GetTag() string {
	if channel.Tag == nil {
		return ""
	}
	return *channel.Tag
}

func (channel *Channel) SetTag(tag string) {
	channel.Tag = &tag
}

func (channel *Channel) GetAutoBan() bool {
	if channel.AutoBan == nil {
		return false
	}
	return *channel.AutoBan == 1
}

func (channel *Channel) Save() error {
	return DB.Save(channel).Error
}

func GetAllChannels(startIdx int, num int, selectAll bool, idSort bool) ([]*Channel, error) {
	var channels []*Channel
	var err error
	order := "priority desc"
	if idSort {
		order = "id desc"
	}
	if selectAll {
		err = DB.Order(order).Find(&channels).Error
	} else {
		err = DB.Order(order).Limit(num).Offset(startIdx).Omit("key").Find(&channels).Error
	}
	return channels, err
}

func GetChannelsByTag(tag string, idSort bool) ([]*Channel, error) {
	var channels []*Channel
	order := "priority desc"
	if idSort {
		order = "id desc"
	}
	err := DB.Where("tag = ?", tag).Order(order).Find(&channels).Error
	return channels, err
}

func SearchChannels(keyword string, group string, model string, idSort bool) ([]*Channel, error) {
	var channels []*Channel
	modelsCol := "`models`"

	// 如果是 PostgreSQL，使用双引号
	if common.UsingPostgreSQL {
		keyCol = `"key"`
		modelsCol = `"models"`
	}

	order := "priority desc"
	if idSort {
		order = "id desc"
	}

	// 构造基础查询
	baseQuery := DB.Model(&Channel{}).Omit(keyCol)

	// 构造WHERE子句
	var whereClause string
	var args []interface{}
	if group != "" && group != "null" {
		var groupCondition string
		if common.UsingMySQL {
			groupCondition = `CONCAT(',', ` + groupCol + `, ',') LIKE ?`
		} else {
			// sqlite, PostgreSQL
			groupCondition = `(',' || ` + groupCol + ` || ',') LIKE ?`
		}
		whereClause = "(id = ? OR name LIKE ? OR " + keyCol + " = ?) AND " + modelsCol + ` LIKE ? AND ` + groupCondition
		args = append(args, common.String2Int(keyword), "%"+keyword+"%", keyword, "%"+model+"%", "%,"+group+",%")
	} else {
		whereClause = "(id = ? OR name LIKE ? OR " + keyCol + " = ?) AND " + modelsCol + " LIKE ?"
		args = append(args, common.String2Int(keyword), "%"+keyword+"%", keyword, "%"+model+"%")
	}

	// 执行查询
	err := baseQuery.Where(whereClause, args...).Order(order).Find(&channels).Error
	if err != nil {
		return nil, err
	}
	return channels, nil
}

func GetChannelById(id int, selectAll bool) (*Channel, error) {
	channel := Channel{Id: id}
	var err error = nil
	if selectAll {
		err = DB.First(&channel, "id = ?", id).Error
	} else {
		err = DB.Omit("key").First(&channel, "id = ?", id).Error
	}
	return &channel, err
}

func BatchInsertChannels(channels []Channel) error {
	var err error
	err = DB.Create(&channels).Error
	if err != nil {
		return err
	}
	for _, channel_ := range channels {
		err = channel_.AddAbilities()
		if err != nil {
			return err
		}
	}
	return nil
}

func BatchDeleteChannels(ids []int) error {
	//使用事务 删除channel表和channel_ability表
	tx := DB.Begin()
	if tx.Error != nil {
		return tx.Error
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	if err := tx.Where("id in (?)", ids).Delete(&Channel{}).Error; err != nil {
		tx.Rollback()
		return err
	}

	if err := tx.Where("channel_id in (?)", ids).Delete(&Ability{}).Error; err != nil {
		tx.Rollback()
		return err
	}

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		return err
	}

	// 重新排序ID
	return ReorderChannelIds()
}

func (channel *Channel) GetPriority() int64 {
	if channel.Priority == nil {
		return 0
	}
	return *channel.Priority
}

func (channel *Channel) GetWeight() int {
	if channel.Weight == nil {
		return 0
	}
	return int(*channel.Weight)
}

func (channel *Channel) GetBaseURL() string {
	if channel.BaseURL == nil {
		return ""
	}
	return *channel.BaseURL
}

func (channel *Channel) GetModelMapping() string {
	if channel.ModelMapping == nil {
		return ""
	}
	return *channel.ModelMapping
}

func (channel *Channel) GetStatusCodeMapping() string {
	if channel.StatusCodeMapping == nil {
		return ""
	}
	return *channel.StatusCodeMapping
}

func (channel *Channel) Insert() error {
	var err error
	err = DB.Create(channel).Error
	if err != nil {
		return err
	}
	err = channel.AddAbilities()
	return err
}

func (channel *Channel) Update() error {
	var err error
	err = DB.Model(channel).Updates(channel).Error
	if err != nil {
		return err
	}
	DB.Model(channel).First(channel, "id = ?", channel.Id)
	err = channel.UpdateAbilities(nil)
	return err
}

func (channel *Channel) UpdateResponseTime(responseTime int64) {
	err := DB.Model(channel).Select("response_time", "test_time").Updates(Channel{
		TestTime:     common.GetTimestamp(),
		ResponseTime: int(responseTime),
	}).Error
	if err != nil {
		common.SysError("failed to update response time: " + err.Error())
	}
}

func (channel *Channel) UpdateBalance(balance float64) {
	err := DB.Model(channel).Select("balance_updated_time", "balance").Updates(Channel{
		BalanceUpdatedTime: common.GetTimestamp(),
		Balance:            balance,
	}).Error
	if err != nil {
		common.SysError("failed to update balance: " + err.Error())
	}
}

func (channel *Channel) Delete() error {
	var err error
	// 开启事务
	tx := DB.Begin()
	if tx.Error != nil {
		return tx.Error
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 删除渠道
	if err = tx.Delete(channel).Error; err != nil {
		tx.Rollback()
		return err
	}

	// 删除abilities
	if err = tx.Where("channel_id = ?", channel.Id).Delete(&Ability{}).Error; err != nil {
		tx.Rollback()
		return err
	}

	// 提交事务
	if err = tx.Commit().Error; err != nil {
		return err
	}

	// 重新排序ID
	return ReorderChannelIds()
}

var channelStatusLock sync.Mutex

func UpdateChannelStatusById(id int, status int, reason string) bool {
	if common.MemoryCacheEnabled {
		channelStatusLock.Lock()
		defer channelStatusLock.Unlock()

		channelCache, _ := CacheGetChannel(id)
		// 如果缓存渠道存在，且状态已是目标状态，直接返回
		if channelCache != nil && channelCache.Status == status {
			return false
		}
		// 如果缓存渠道不存在(说明已经被禁用)，且要设置的状态不为启用，直接返回
		if channelCache == nil && status != common.ChannelStatusEnabled {
			return false
		}
		CacheUpdateChannelStatus(id, status)
	}
	err := UpdateAbilityStatus(id, status == common.ChannelStatusEnabled)
	if err != nil {
		common.SysError("failed to update ability status: " + err.Error())
		return false
	}
	channel, err := GetChannelById(id, true)
	if err != nil {
		// find channel by id error, directly update status
		result := DB.Model(&Channel{}).Where("id = ?", id).Update("status", status)
		if result.Error != nil {
			common.SysError("failed to update channel status: " + result.Error.Error())
			return false
		}
		if result.RowsAffected == 0 {
			return false
		}
	} else {
		if channel.Status == status {
			return false
		}
		// find channel by id success, update status and other info
		info := channel.GetOtherInfo()
		info["status_reason"] = reason
		info["status_time"] = common.GetTimestamp()
		channel.SetOtherInfo(info)
		channel.Status = status
		err = channel.Save()
		if err != nil {
			common.SysError("failed to update channel status: " + err.Error())
			return false
		}
	}
	return true
}

func EnableChannelByTag(tag string) error {
	err := DB.Model(&Channel{}).Where("tag = ?", tag).Update("status", common.ChannelStatusEnabled).Error
	if err != nil {
		return err
	}
	err = UpdateAbilityStatusByTag(tag, true)
	return err
}

func DisableChannelByTag(tag string) error {
	err := DB.Model(&Channel{}).Where("tag = ?", tag).Update("status", common.ChannelStatusManuallyDisabled).Error
	if err != nil {
		return err
	}
	err = UpdateAbilityStatusByTag(tag, false)
	return err
}

func EditChannelByTag(tag string, newTag *string, modelMapping *string, models *string, group *string, priority *int64, weight *uint) error {
	updateData := Channel{}
	shouldReCreateAbilities := false
	updatedTag := tag
	// 如果 newTag 不为空且不等于 tag，则更新 tag
	if newTag != nil && *newTag != tag {
		updateData.Tag = newTag
		updatedTag = *newTag
	}
	if modelMapping != nil && *modelMapping != "" {
		updateData.ModelMapping = modelMapping
	}
	if models != nil && *models != "" {
		shouldReCreateAbilities = true
		updateData.Models = *models
	}
	if group != nil && *group != "" {
		shouldReCreateAbilities = true
		updateData.Group = *group
	}
	if priority != nil {
		updateData.Priority = priority
	}
	if weight != nil {
		updateData.Weight = weight
	}

	err := DB.Model(&Channel{}).Where("tag = ?", tag).Updates(updateData).Error
	if err != nil {
		return err
	}
	if shouldReCreateAbilities {
		channels, err := GetChannelsByTag(updatedTag, false)
		if err == nil {
			for _, channel := range channels {
				err = channel.UpdateAbilities(nil)
				if err != nil {
					common.SysError("failed to update abilities: " + err.Error())
				}
			}
		}
	} else {
		err := UpdateAbilityByTag(tag, newTag, priority, weight)
		if err != nil {
			return err
		}
	}
	return nil
}

func UpdateChannelUsedQuota(id int, quota int) {
	if common.BatchUpdateEnabled {
		addNewRecord(BatchUpdateTypeChannelUsedQuota, id, quota)
		return
	}
	updateChannelUsedQuota(id, quota)
}

func updateChannelUsedQuota(id int, quota int) {
	err := DB.Model(&Channel{}).Where("id = ?", id).Update("used_quota", gorm.Expr("used_quota + ?", quota)).Error
	if err != nil {
		common.SysError("failed to update channel used quota: " + err.Error())
	}
}

func DeleteChannelByStatus(status int64) (int64, error) {
	tx := DB.Begin()
	if tx.Error != nil {
		return 0, tx.Error
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	result := tx.Where("status = ?", status).Delete(&Channel{})
	if result.Error != nil {
		tx.Rollback()
		return 0, result.Error
	}

	if err := tx.Commit().Error; err != nil {
		return 0, err
	}

	// 重新排序ID
	if err := ReorderChannelIds(); err != nil {
		return result.RowsAffected, err
	}

	return result.RowsAffected, nil
}

func DeleteDisabledChannel() (int64, error) {
	tx := DB.Begin()
	if tx.Error != nil {
		return 0, tx.Error
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	result := tx.Where("status = ? or status = ?", common.ChannelStatusAutoDisabled, common.ChannelStatusManuallyDisabled).Delete(&Channel{})
	if result.Error != nil {
		tx.Rollback()
		return 0, result.Error
	}

	if err := tx.Commit().Error; err != nil {
		return 0, err
	}

	// 重新排序ID
	if err := ReorderChannelIds(); err != nil {
		return result.RowsAffected, err
	}

	return result.RowsAffected, nil
}

func GetPaginatedTags(offset int, limit int) ([]*string, error) {
	var tags []*string
	err := DB.Model(&Channel{}).Select("DISTINCT tag").Where("tag != ''").Offset(offset).Limit(limit).Find(&tags).Error
	return tags, err
}

func SearchTags(keyword string, group string, model string, idSort bool) ([]*string, error) {
	var tags []*string
	modelsCol := "`models`"

	// 如果是 PostgreSQL，使用双引号
	if common.UsingPostgreSQL {
		modelsCol = `"models"`
	}

	order := "priority desc"
	if idSort {
		order = "id desc"
	}

	// 构造基础查询
	baseQuery := DB.Model(&Channel{}).Omit(keyCol)

	// 构造WHERE子句
	var whereClause string
	var args []interface{}
	if group != "" && group != "null" {
		var groupCondition string
		if common.UsingMySQL {
			groupCondition = `CONCAT(',', ` + groupCol + `, ',') LIKE ?`
		} else {
			// sqlite, PostgreSQL
			groupCondition = `(',' || ` + groupCol + ` || ',') LIKE ?`
		}
		whereClause = "(id = ? OR name LIKE ? OR " + keyCol + " = ?) AND " + modelsCol + ` LIKE ? AND ` + groupCondition
		args = append(args, common.String2Int(keyword), "%"+keyword+"%", keyword, "%"+model+"%", "%,"+group+",%")
	} else {
		whereClause = "(id = ? OR name LIKE ? OR " + keyCol + " = ?) AND " + modelsCol + " LIKE ?"
		args = append(args, common.String2Int(keyword), "%"+keyword+"%", keyword, "%"+model+"%")
	}

	subQuery := baseQuery.Where(whereClause, args...).
		Select("tag").
		Where("tag != ''").
		Order(order)

	err := DB.Table("(?) as sub", subQuery).
		Select("DISTINCT tag").
		Find(&tags).Error

	if err != nil {
		return nil, err
	}

	return tags, nil
}

func (channel *Channel) GetSetting() map[string]interface{} {
	setting := make(map[string]interface{})
	if channel.Setting != nil && *channel.Setting != "" {
		err := json.Unmarshal([]byte(*channel.Setting), &setting)
		if err != nil {
			common.SysError("failed to unmarshal setting: " + err.Error())
		}
	}
	return setting
}

func (channel *Channel) SetSetting(setting map[string]interface{}) {
	settingBytes, err := json.Marshal(setting)
	if err != nil {
		common.SysError("failed to marshal setting: " + err.Error())
		return
	}
	channel.Setting = common.GetPointer[string](string(settingBytes))
}

func (channel *Channel) GetParamOverride() map[string]interface{} {
	paramOverride := make(map[string]interface{})
	if channel.ParamOverride != nil && *channel.ParamOverride != "" {
		err := json.Unmarshal([]byte(*channel.ParamOverride), &paramOverride)
		if err != nil {
			common.SysError("failed to unmarshal param override: " + err.Error())
		}
	}
	return paramOverride
}

func GetChannelsByIds(ids []int) ([]*Channel, error) {
	var channels []*Channel
	err := DB.Where("id in (?)", ids).Find(&channels).Error
	return channels, err
}

func BatchSetChannelTag(ids []int, tag *string) error {
	// 开启事务
	tx := DB.Begin()
	if tx.Error != nil {
		return tx.Error
	}

	// 更新标签
	err := tx.Model(&Channel{}).Where("id in (?)", ids).Update("tag", tag).Error
	if err != nil {
		tx.Rollback()
		return err
	}

	// update ability status
	channels, err := GetChannelsByIds(ids)
	if err != nil {
		tx.Rollback()
		return err
	}

	for _, channel := range channels {
		err = channel.UpdateAbilities(tx)
		if err != nil {
			tx.Rollback()
			return err
		}
	}

	// 提交事务
	return tx.Commit().Error
}

func ReorderChannelIds() error {
	tx := DB.Begin()
	if tx.Error != nil {
		return tx.Error
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var err error
	if common.UsingPostgreSQL {
		// PostgreSQL version
		// 创建临时表
		if err = tx.Exec(`CREATE TEMPORARY TABLE temp_channel_ids AS 
			SELECT id as old_id, ROW_NUMBER() OVER (ORDER BY id) as new_id 
			FROM channels`).Error; err != nil {
			tx.Rollback()
			return err
		}

		// 更新channels表
		if err = tx.Exec(`UPDATE channels 
			SET id = temp.new_id 
			FROM temp_channel_ids temp 
			WHERE channels.id = temp.old_id`).Error; err != nil {
			tx.Rollback()
			return err
		}

		// 更新abilities表
		if err = tx.Exec(`UPDATE abilities 
			SET channel_id = temp.new_id 
			FROM temp_channel_ids temp 
			WHERE abilities.channel_id = temp.old_id`).Error; err != nil {
			tx.Rollback()
			return err
		}

		// 删除临时表
		if err = tx.Exec(`DROP TABLE temp_channel_ids`).Error; err != nil {
			tx.Rollback()
			return err
		}
	} else if common.UsingMySQL {
		// MySQL version
		// 创建临时表
		if err = tx.Exec(`CREATE TEMPORARY TABLE temp_channel_ids 
			SELECT id as old_id, (@row_number:=@row_number + 1) as new_id 
			FROM channels, (SELECT @row_number:=0) as t 
			ORDER BY id`).Error; err != nil {
			tx.Rollback()
			return err
		}

		// 更新channels表
		if err = tx.Exec(`UPDATE channels, temp_channel_ids 
			SET channels.id = temp_channel_ids.new_id 
			WHERE channels.id = temp_channel_ids.old_id`).Error; err != nil {
			tx.Rollback()
			return err
		}

		// 更新abilities表
		if err = tx.Exec(`UPDATE abilities, temp_channel_ids 
			SET abilities.channel_id = temp_channel_ids.new_id 
			WHERE abilities.channel_id = temp_channel_ids.old_id`).Error; err != nil {
			tx.Rollback()
			return err
		}

		// 删除临时表
		if err = tx.Exec(`DROP TEMPORARY TABLE IF EXISTS temp_channel_ids`).Error; err != nil {
			tx.Rollback()
			return err
		}
	} else if common.UsingSQLite {
		// SQLite version
		// 创建临时表
		if err = tx.Exec(`CREATE TEMPORARY TABLE temp_channel_ids AS 
			SELECT id as old_id, ROW_NUMBER() OVER (ORDER BY id) as new_id 
			FROM channels`).Error; err != nil {
			tx.Rollback()
			return err
		}

		// 更新channels表
		if err = tx.Exec(`UPDATE channels 
			SET id = (SELECT new_id FROM temp_channel_ids WHERE old_id = channels.id)`).Error; err != nil {
			tx.Rollback()
			return err
		}

		// 更新abilities表
		if err = tx.Exec(`UPDATE abilities 
			SET channel_id = (SELECT new_id FROM temp_channel_ids WHERE old_id = channel_id)`).Error; err != nil {
			tx.Rollback()
			return err
		}

		// 删除临时表
		if err = tx.Exec(`DROP TABLE temp_channel_ids`).Error; err != nil {
			tx.Rollback()
			return err
		}
	}

	return tx.Commit().Error
}
