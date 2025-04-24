# Web Features Documentation

This document provides a comprehensive overview of all web pages in the application, including their functionality, layout, API calls, and requirements.

## Table of Contents

- [Home Page](#home-page)
- [User Management](#user-management)
  - [Login](#login)
  - [Register](#register)
  - [User Profile](#user-profile)
- [Channel Management](#channel-management)
  - [Channel List](#channel-list)
  - [Edit Channel](#edit-channel)
- [Token Management](#token-management)
  - [Token List](#token-list)
  - [Edit Token](#edit-token)
- [Usage & Analytics](#usage--analytics)
  - [Data Dashboard](#data-dashboard)
  - [Usage Logs](#usage-logs)
  - [Midjourney Logs](#midjourney-logs)
  - [Task Logs](#task-logs)
- [Chat & AI Features](#chat--ai-features)
  - [Chat Interface](#chat-interface)
  - [Chat2Link](#chat2link)
  - [Playground](#playground)
- [System Settings](#system-settings)
  - [Operation Settings](#operation-settings)
  - [System Settings](#system-settings-1)
  - [Other Settings](#other-settings)
- [Pricing & Redemption](#pricing--redemption)
  - [Pricing Page](#pricing-page)
  - [Redemption](#redemption)
  - [Top Up](#top-up)

---

## Home Page

### Functionality
- Displays system status and information
- Shows authentication methods enabled
- Can display custom content set by administrators
- Displays system notices to users

### Layout
- System status card showing:
  - System name
  - Version
  - Source code link
  - Start time
- Authentication methods card showing enabled/disabled status for:
  - Email verification
  - GitHub OAuth
  - OIDC authentication
  - WeChat authentication
  - Turnstile verification
  - Telegram authentication
  - Linux DO authentication
- Custom content area (can be Markdown or iframe URL)

### API Calls
- `GET /api/notice` - Retrieves system notices
- `GET /api/home_page_content` - Retrieves custom home page content
- `GET /api/status` - Retrieves system status information

### Response Format
```json
// /api/notice response
{
  "success": true,
  "message": "",
  "data": "# Notice content in markdown"
}

// /api/home_page_content response
{
  "success": true,
  "message": "",
  "data": "# Custom content in markdown or URL"
}

// /api/status response
{
  "success": true,
  "message": "",
  "data": {
    "system_name": "System Name",
    "version": "1.0.0",
    "start_time": 1234567890,
    "email_verification": true,
    "github_oauth": true,
    "oidc": false,
    "wechat_login": false,
    "turnstile_check": true,
    "telegram_oauth": false,
    "linuxdo_oauth": false
  }
}
```

---

## User Management

### Login

#### Functionality
- Allows users to log in with username/password
- Supports various OAuth methods if enabled
- Supports Turnstile verification if enabled

#### Layout
- Login form with username and password fields
- Login button
- OAuth login buttons (if enabled)
- Link to registration page

#### API Calls
- `POST /api/user/login` - Authenticates user credentials

#### Request Format
```json
{
  "username": "user",
  "password": "password",
  "turnstile": "turnstile_token" // if enabled
}
```

#### Response Format
```json
{
  "success": true,
  "message": "",
  "data": {
    "id": 1,
    "username": "user",
    "display_name": "User",
    "role": 1,
    "status": 1,
    "quota": 100000,
    "used_quota": 5000,
    "request_count": 100,
    "token": "jwt_token"
  }
}
```

### Register

#### Functionality
- Allows new users to create accounts
- Supports email verification if enabled
- Supports Turnstile verification if enabled

#### Layout
- Registration form with:
  - Username field
  - Password field
  - Email field (if email verification enabled)
  - Verification code field (if email verification enabled)
  - Turnstile widget (if enabled)
- Register button
- Link to login page

#### API Calls
- `POST /api/user/register` - Creates a new user account
- `POST /api/verification` - Sends verification code (if email verification enabled)

#### Request Format
```json
{
  "username": "newuser",
  "password": "password",
  "email": "user@example.com", // if email verification enabled
  "verification_code": "123456", // if email verification enabled
  "turnstile": "turnstile_token" // if enabled
}
```

#### Response Format
```json
{
  "success": true,
  "message": "Registration successful"
}
```

### User Profile

#### Functionality
- Displays user information
- Allows users to update their profile
- Shows quota and usage statistics
- Provides access to API tokens

#### Layout
- User information card with:
  - Username
  - Display name
  - Email
  - Role
  - Status
  - Registration time
- Quota information card with:
  - Current quota
  - Used quota
  - Request count
- Profile update form
- Password change form
- OAuth connection options (if enabled)

#### API Calls
- `GET /api/user/self` - Retrieves user information
- `PUT /api/user/self` - Updates user information
- `PUT /api/user/setting` - Updates user settings

#### Response Format
```json
// /api/user/self response
{
  "success": true,
  "message": "",
  "data": {
    "id": 1,
    "username": "user",
    "display_name": "User",
    "email": "user@example.com",
    "role": 1,
    "status": 1,
    "quota": 100000,
    "used_quota": 5000,
    "request_count": 100,
    "created_at": "2023-01-01T00:00:00Z"
  }
}
```

---

## Channel Management

### Channel List

#### Functionality
- Displays all channels (for admins)
- Allows filtering and searching channels
- Provides channel management actions (add, edit, delete)
- Shows channel status and statistics

#### Layout
- Channel management header
- Add channel button
- Search and filter controls
- Channel table with columns:
  - ID
  - Name
  - Type
  - Status
  - Balance
  - Models
  - Created time
  - Actions (edit, delete, test)

#### API Calls
- `GET /api/channel` - Retrieves all channels
- `GET /api/channel/search` - Searches channels
- `DELETE /api/channel/:id` - Deletes a channel
- `GET /api/channel/test/:id` - Tests a channel
- `GET /api/channel/update_balance/:id` - Updates channel balance

#### Response Format
```json
// /api/channel response
{
  "success": true,
  "message": "",
  "data": [
    {
      "id": 1,
      "name": "Channel 1",
      "type": 1,
      "status": 1,
      "balance": 1000,
      "models": "gpt-3.5-turbo,gpt-4",
      "created_at": "2023-01-01T00:00:00Z"
    }
  ]
}
```

### Edit Channel

#### Functionality
- Allows adding new channels
- Allows editing existing channels
- Supports fetching models from upstream providers
- Configures channel settings and model mappings

#### Layout
- Channel form with fields:
  - Name
  - Type (dropdown)
  - Base URL
  - Key
  - Models (multi-select)
  - Groups (multi-select)
  - Priority
  - Weight
  - Model mapping (JSON)
  - Auto ban toggle
- Fetch models button
- Save button

#### API Calls
- `GET /api/channel/:id` - Retrieves channel details
- `POST /api/channel` - Creates a new channel
- `PUT /api/channel` - Updates an existing channel
- `POST /api/channel/fetch_models` - Fetches models from upstream
- `GET /api/channel/fetch_models/:id` - Fetches models for existing channel

#### Request Format
```json
// POST/PUT /api/channel request
{
  "id": 1, // only for updates
  "name": "Channel Name",
  "type": 1,
  "base_url": "https://api.example.com",
  "key": "api_key",
  "models": "gpt-3.5-turbo,gpt-4",
  "group": "group1,group2",
  "priority": 1,
  "weight": 100,
  "model_mapping": "{\"gpt-3.5-turbo\":\"gpt-3.5-turbo-0613\"}",
  "auto_ban": 1
}
```

#### Response Format
```json
// GET /api/channel/:id response
{
  "success": true,
  "message": "",
  "data": {
    "id": 1,
    "name": "Channel Name",
    "type": 1,
    "base_url": "https://api.example.com",
    "key": "api_key",
    "models": "gpt-3.5-turbo,gpt-4",
    "group": "group1,group2",
    "priority": 1,
    "weight": 100,
    "model_mapping": "{\"gpt-3.5-turbo\":\"gpt-3.5-turbo-0613\"}",
    "auto_ban": 1
  }
}
```

---

## Token Management

### Token List

#### Functionality
- Displays all tokens for the current user
- Allows creating, editing, and deleting tokens
- Shows token status and usage statistics

#### Layout
- Warning banner about token usage
- Add token button
- Token table with columns:
  - ID
  - Name
  - Key
  - Status
  - Created time
  - Accessed time
  - Expired time
  - Remaining quota
  - Unlimited quota
  - Actions (edit, delete)

#### API Calls
- `GET /api/token` - Retrieves all tokens for the current user
- `DELETE /api/token/:id` - Deletes a token

#### Response Format
```json
// /api/token response
{
  "success": true,
  "message": "",
  "data": [
    {
      "id": 1,
      "name": "Token 1",
      "key": "sk-abcdef123456",
      "status": 1,
      "created_time": 1672531200,
      "accessed_time": 1672617600,
      "expired_time": 1704067200,
      "remain_quota": 10000,
      "unlimited_quota": false
    }
  ]
}
```

### Edit Token

#### Functionality
- Allows creating new tokens
- Allows editing existing tokens
- Configures token settings, quotas, and model limits

#### Layout
- Token form with fields:
  - Name
  - Remaining quota
  - Unlimited quota toggle
  - Expired time
  - Model limits toggle
  - Model limits (multi-select)
  - Allowed IPs
  - Group
  - Token count (for creating multiple tokens)
- Save button

#### API Calls
- `GET /api/token/:id` - Retrieves token details
- `POST /api/token` - Creates a new token
- `PUT /api/token` - Updates an existing token
- `GET /api/models` - Retrieves available models for limits
- `GET /api/user/self/groups` - Retrieves available groups

#### Request Format
```json
// POST/PUT /api/token request
{
  "id": 1, // only for updates
  "name": "Token Name",
  "remain_quota": 10000,
  "unlimited_quota": false,
  "expired_time": 1704067200,
  "model_limits_enabled": true,
  "model_limits": "gpt-3.5-turbo,gpt-4",
  "allow_ips": "192.168.1.1,10.0.0.1",
  "group": "group1"
}
```

#### Response Format
```json
// GET /api/token/:id response
{
  "success": true,
  "message": "",
  "data": {
    "id": 1,
    "name": "Token Name",
    "key": "sk-abcdef123456",
    "status": 1,
    "created_time": 1672531200,
    "accessed_time": 1672617600,
    "expired_time": 1704067200,
    "remain_quota": 10000,
    "unlimited_quota": false,
    "model_limits_enabled": true,
    "model_limits": "gpt-3.5-turbo,gpt-4",
    "allow_ips": "192.168.1.1,10.0.0.1",
    "group": "group1"
  }
}
```

---

## Usage & Analytics

### Data Dashboard

#### Functionality
- Displays usage statistics and analytics
- Shows quota consumption over time
- Visualizes model usage distribution
- Allows filtering by date range and user

#### Layout
- Filter form with:
  - Date range picker
  - Username field (for admins)
  - Query button
- Summary cards showing:
  - Current balance
  - Historical consumption
  - Request count
  - Statistical quota
  - Statistical tokens
  - Statistical count
  - Average RPM (requests per minute)
  - Average TPM (tokens per minute)
- Charts:
  - Consumption distribution chart
  - Call count distribution chart

#### API Calls
- `GET /api/data` - Retrieves usage data for admins
- `GET /api/data/self` - Retrieves usage data for current user

#### Request Parameters
- `username` - Filter by username (admin only)
- `start_timestamp` - Start date for data range
- `end_timestamp` - End date for data range
- `default_time` - Default time range

#### Response Format
```json
// /api/data response
{
  "success": true,
  "message": "",
  "data": {
    "quota_data": [
      {
        "model": "gpt-3.5-turbo",
        "quota": 5000,
        "tokens": 100000,
        "times": 50
      },
      {
        "model": "gpt-4",
        "quota": 10000,
        "tokens": 50000,
        "times": 20
      }
    ],
    "distribution_data": [
      {
        "date": "2023-01-01",
        "quota": 1000,
        "tokens": 20000,
        "times": 10
      }
    ]
  }
}
```

### Usage Logs

#### Functionality
- Displays detailed usage logs
- Shows request details, models, and quota consumption
- Allows filtering and searching logs

#### Layout
- Filter form with:
  - Date range picker
  - Model filter
  - Username filter (for admins)
  - Search field
  - Query button
- Logs table with columns:
  - ID
  - User
  - Model
  - Tokens
  - Quota
  - Time
  - Status
  - Details (expandable)

#### API Calls
- `GET /api/log` - Retrieves all logs (admin)
- `GET /api/log/search` - Searches logs (admin)
- `GET /api/log/self` - Retrieves logs for current user
- `GET /api/log/self/search` - Searches logs for current user

#### Request Parameters
- `p` - Page number
- `size` - Items per page
- `username` - Filter by username (admin only)
- `token_name` - Filter by token name
- `model` - Filter by model
- `start_timestamp` - Start date for log range
- `end_timestamp` - End date for log range
- `keyword` - Search keyword

#### Response Format
```json
// /api/log response
{
  "success": true,
  "message": "",
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "username": "user",
      "token_name": "Token 1",
      "model": "gpt-3.5-turbo",
      "prompt_tokens": 100,
      "completion_tokens": 50,
      "total_tokens": 150,
      "quota": 300,
      "created_at": "2023-01-01T00:00:00Z",
      "status": "success",
      "request": "Request content",
      "response": "Response content"
    }
  ]
}
```

### Midjourney Logs

#### Functionality
- Displays Midjourney image generation logs
- Shows image generation details and results
- Allows viewing generated images

#### Layout
- Filter form with:
  - Date range picker
  - MJ ID filter
  - Channel ID filter (for admins)
  - Query button
- Logs table with columns:
  - ID
  - User
  - Action
  - Prompt
  - Status
  - Progress
  - Submit time
  - Image preview
  - Details (expandable)

#### API Calls
- `GET /api/mj` - Retrieves all Midjourney logs (admin)
- `GET /api/mj/self` - Retrieves Midjourney logs for current user
- `GET /mj/image/:id` - Retrieves a specific Midjourney image

#### Request Parameters
- `p` - Page number
- `mj_id` - Filter by Midjourney ID
- `channel_id` - Filter by channel ID (admin only)
- `start_timestamp` - Start date for log range
- `end_timestamp` - End date for log range

#### Response Format
```json
// /api/mj response
{
  "success": true,
  "message": "",
  "data": [
    {
      "id": 1,
      "code": 1,
      "user_id": 1,
      "action": "imagine",
      "mj_id": "mj_123456",
      "prompt": "a beautiful landscape",
      "prompt_en": "a beautiful landscape",
      "description": "Task completed",
      "state": "COMPLETED",
      "submit_time": 1672531200000,
      "start_time": 1672531205000,
      "finish_time": 1672531300000,
      "image_url": "https://example.com/image.jpg",
      "status": "success",
      "progress": "100%",
      "fail_reason": "",
      "quota": 0.3
    }
  ]
}
```

### Task Logs

#### Functionality
- Displays task execution logs
- Shows task details and status
- Allows filtering and searching tasks

#### Layout
- Filter form with:
  - Date range picker
  - Task ID filter
  - Status filter
  - Query button
- Tasks table with columns:
  - ID
  - User
  - Type
  - Status
  - Created time
  - Updated time
  - Details (expandable)

#### API Calls
- `GET /api/task` - Retrieves all tasks (admin)
- `GET /api/task/self` - Retrieves tasks for current user

#### Request Parameters
- `p` - Page number
- `task_id` - Filter by task ID
- `status` - Filter by status
- `start_timestamp` - Start date for task range
- `end_timestamp` - End date for task range

#### Response Format
```json
// /api/task response
{
  "success": true,
  "message": "",
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "type": "midjourney",
      "status": "completed",
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:05:00Z",
      "details": "Task details"
    }
  ]
}
```

---

## Chat & AI Features

### Chat Interface

#### Functionality
- Provides an interface for chatting with AI models
- Embeds external chat interfaces via iframe
- Supports various chat applications

#### Layout
- Iframe embedding an external chat interface
- Loading indicator while initializing

#### API Calls
- `GET /api/user/token` - Retrieves user token for chat
- Uses token to authenticate with embedded chat interface

#### Response Format
```json
// /api/user/token response
{
  "success": true,
  "message": "",
  "data": {
    "token": "sk-abcdef123456"
  }
}
```

### Chat2Link

#### Functionality
- Redirects users to external chat interfaces
- Automatically configures chat with user's API key
- Simplifies access to chat applications

#### Layout
- Loading indicator while redirecting

#### API Calls
- `GET /api/user/token` - Retrieves user token for chat

#### Response Format
Same as Chat Interface

### Playground

#### Functionality
- Provides a built-in chat interface for testing
- Allows direct interaction with AI models
- Supports model and parameter configuration

#### Layout
- Chat interface with:
  - Message history display
  - Input area
  - Send button
  - Clear context button
- Settings panel with:
  - Model selection
  - Temperature control
  - Max tokens control
  - Other model parameters

#### API Calls
- Direct API calls to AI models using user's token
- `POST /v1/chat/completions` - For chat completions

#### Request Format
```json
// /v1/chat/completions request
{
  "model": "gpt-3.5-turbo",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello, how are you?"}
  ],
  "temperature": 0.7,
  "max_tokens": 1000
}
```

#### Response Format
```json
// /v1/chat/completions response
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677858242,
  "model": "gpt-3.5-turbo",
  "usage": {
    "prompt_tokens": 13,
    "completion_tokens": 7,
    "total_tokens": 20
  },
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "I'm doing well, thank you for asking! How can I help you today?"
      },
      "finish_reason": "stop",
      "index": 0
    }
  ]
}
```

---

## System Settings

### Operation Settings

#### Functionality
- Configures operational parameters
- Sets pricing and quota settings
- Configures model availability and pricing

#### Layout
- General settings section
- Quota settings section
- Model pricing settings section
- Chat settings section

#### API Calls
- `GET /api/option` - Retrieves current settings
- `PUT /api/option` - Updates settings

#### Request Format
```json
// PUT /api/option request
{
  "OptionKey": "OptionValue"
}
```

#### Response Format
```json
// GET /api/option response
{
  "success": true,
  "message": "",
  "data": {
    "OptionKey": "OptionValue"
  }
}
```

### System Settings

#### Functionality
- Configures system-wide settings
- Sets authentication methods
- Configures email and server settings

#### Layout
- System name and logo settings
- Authentication settings
- Email settings
- Server settings

#### API Calls
- Same as Operation Settings

### Other Settings

#### Functionality
- Configures miscellaneous settings
- Sets home page content
- Configures notices and about page

#### Layout
- Home page content settings
- Notice settings
- About page settings

#### API Calls
- Same as Operation Settings

---

## Pricing & Redemption

### Pricing Page

#### Functionality
- Displays pricing information
- Shows available subscription plans
- Allows users to purchase plans

#### Layout
- Pricing cards for different plans
- Plan features and quotas
- Purchase buttons

#### API Calls
- `GET /api/pricing` - Retrieves pricing information

#### Response Format
```json
// /api/pricing response
{
  "success": true,
  "message": "",
  "data": [
    {
      "id": 1,
      "name": "Basic Plan",
      "quota": 100000,
      "price": 10,
      "features": ["Feature 1", "Feature 2"]
    }
  ]
}
```

### Redemption

#### Functionality
- Allows users to redeem codes for quota
- Shows redemption history
- Displays available redemption codes

#### Layout
- Redemption code input
- Redeem button
- Redemption history table

#### API Calls
- `POST /api/redemption` - Redeems a code
- `GET /api/redemption/self` - Retrieves redemption history

#### Request Format
```json
// POST /api/redemption request
{
  "code": "REDEEM123"
}
```

#### Response Format
```json
// GET /api/redemption/self response
{
  "success": true,
  "message": "",
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "code": "REDEEM123",
      "quota": 10000,
      "redeemed_at": "2023-01-01T00:00:00Z"
    }
  ]
}
```

### Top Up

#### Functionality
- Allows users to add quota through payment
- Supports various payment methods
- Shows payment history

#### Layout
- Amount input
- Payment method selection
- Pay button
- Payment history table

#### API Calls
- `POST /api/user/topup` - Initiates a top-up
- `POST /api/user/pay` - Processes payment
- `GET /api/user/epay/notify` - Payment notification callback

#### Request Format
```json
// POST /api/user/topup request
{
  "amount": 100
}
```

#### Response Format
```json
// POST /api/user/topup response
{
  "success": true,
  "message": "",
  "data": {
    "payment_url": "https://payment.example.com/pay"
  }
}
```
