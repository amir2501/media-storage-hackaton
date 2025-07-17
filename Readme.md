# 📦 Merged Server for Hackaton + Connect Apps

A **Node.js Express** server combining backend features for:
- ✅ Hackaton App
- ✅ Connect App

---

## 🛠️ How to Start

1. **Install dependencies**
```bash
npm install express fs cors path multer
```

2. **Run the server**
```bash
node mergedServer.js
```

- Server runs locally at:  
  **https://media-storage-hackaton.onrender.com**

---

## 🚀 Features

### 🔵 Hackaton App
*(use `type: 1` in body/query)*

#### 🧍 User


| Method | Endpoint    | Body/Query | Description        |
| ------ | ----------- | ---------- | ------------------ |
| POST   | `/register` | `{ email, password, type:1 }` | Register a user |
| POST   | `/login`    | `{ email, password, type:1 }` | Login a user |
| GET    | `/profile`  | `?email=xxx&type=1` | Get profile info |

#### 📈 Projects

| Method | Endpoint    | Query | Description        |
| ------ | ----------- | ----- | ------------------ |
| GET    | `/projects` | `?type=1` | Get all Hackaton projects |

#### 💬 Chats

| Method | Endpoint              | Body/Query | Description            |
| ------ | --------------------- | ---------- | ---------------------- |
| GET    | `/chats`              | `?email=xxx&type=1` | Get user’s chats |
| POST   | `/chats/create`       | `{ from, to, type:1 }` | Create private chat |
| POST   | `/chats/group/create` | `{ groupName, participants, creator, type:1 }` | Create group chat |
| POST   | `/chats/send`         | `{ from, to, message, type:1 }` | Send private message |
| POST   | `/chats/group/send`   | `{ chatId, from, message, type:1 }` | Send group message |
| POST   | `/chats/sendImage`    | Form Data: `image` <br> Body: `{ from, to, chatId, type:1 }` | Send image message |

#### 💵 Money / Investment

| Method | Endpoint         | Body | Query | Description |
| ------ | ---------------- | ---- | ----- | ----------- |
| POST   | `/updateMoney`   | `{ email, amount, projectId?, type:1 }` | `?type=invest` or `?type=add` | Invest in project or add money |

#### 🖼️ Event Images Upload

| Method | Endpoint           | FormData | Description |
| ------ | ------------------ | -------- | ----------- |
| POST   | `/hackaton/upload` | `email, eventId, image` | Upload event image |

#### 📅 Events

| Method | Endpoint            | Body | Description |
| ------ | ------------------- | ---- | ----------- |
| POST   | `/events/create`    | `{ title, description, amount?, isEmergency, imageName?, uploadedImagePath?, creatorEmail, groupId? }` | Create event |
| GET    | `/events`           | none | Get all events |
| PUT    | `/events/:id`       | `{ any updatable event fields }` | Edit event by ID |

---

### 🟣 Connect App
*(use `type: 2` in body/query)*

#### 🧍 User

| Method | Endpoint                   | Body | Description |
| ------ | -------------------------- | ---- | ----------- |
| POST   | `/register`                | `{ email, password, type:2, name?, bio?, bals? }` | Register a user |
| POST   | `/login`                   | `{ email, password, type:2 }` | Login |
| GET    | `/connect/profile/:email`  | - | Get profile by email |
| PUT    | `/connect/profile/:email`  | `{ fields to update }` | Update profile |

#### 👥 Social

| Method | Endpoint                 | Body | Description |
| ------ | ------------------------ | ---- | ----------- |
| GET    | `/connect/users`         | -    | Get all users (public info) |
| GET    | `/connect/search`        | `?query=abc` | Search users by name or email |
| POST   | `/connect/follow`        | `{ from, to }` | Follow user |
| POST   | `/connect/unfollow`      | `{ from, to }` | Unfollow user |

#### 🖼️ Profile/Post Image Upload

| Method | Endpoint            | FormData | Description |
| ------ | ------------------- | -------- | ----------- |
| POST   | `/connect/upload`   | `email, image` | Upload user/profile/post image |

#### 📝 Posts System

| Method | Endpoint                           | Body | Description |
| ------ | ---------------------------------- | ---- | ----------- |
| POST   | `/connect/posts/create`           | `{ title, imagePath, creatorEmail }` | Create post |
| GET    | `/connect/posts`                  | -    | Get all posts |
| PUT    | `/connect/posts/:id`              | `{ fields to update }` | Update post |
| DELETE | `/connect/posts/:id`              | -    | Delete post |
| POST   | `/connect/posts/:id/like`         | `{ userEmail }` | Like/unlike post |
| POST   | `/connect/posts/:id/comment`      | `{ sender, text }` | Comment on post |
| PUT    | `/connect/posts/:id/comment/:cid` | `{ text }` | Edit comment |
| DELETE | `/connect/posts/:id/comment/:cid` | - | Delete comment |

---

## 📁 Uploaded Images Path

| Purpose                  | Path Example |
| ------------------------ | ------------ |
| Hackaton Event Images    | `/hackaton/img/{email}/{eventId}/{filename}` |
| Hackaton Chat Images     | `/hackaton/chat_images/{filename}` |
| Connect Profile/Post Images | `/connect/img/{email}/{filename}` |

---

## ✅ Example Body Data

### `/register`
```json
{
  "email": "test@example.com",
  "password": "1234",
  "type": 1
}
```

### `/events/create`
```json
{
  "title": "Fundraising",
  "description": "We need funds for new project",
  "amount": 500,
  "isEmergency": true,
  "creatorEmail": "test@example.com",
  "groupId": "group_12345"
}
```

### `/updateMoney`
```json
{
  "email": "test@example.com",
  "amount": 200,
  "projectId": "proj_123",
  "type": 1
}
```
Query param for investing:
```
?type=invest
```

---

✅ **You can now copy this to your README.md for easy understanding!**