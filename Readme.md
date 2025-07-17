# 📦 Merged Server for Hackaton + Connect Apps

This is a **Node.js Express** server that combines backend features for:
- ✅ **Hackaton App**
- ✅ **Connect App**

---

## 🛠️ How to Start

1. **Install dependencies:**
   ```bash
   npm install express fs cors path multer
   ```

2. **Run the server:**
   ```bash
   node mergedServer.js
   ```

- Server runs at:  
  **https://media-storage-hackaton.onrender.com**

---

## 🚀 Features

### 🔵 Hackaton App (type = 1)

| Endpoint                  | Description                  |
|---------------------------|------------------------------|
| `POST /register`          | Register a Hackaton user     |
| `POST /login`             | Login a Hackaton user        |
| `GET /profile`            | Get profile info             |
| `GET /projects`           | Get all projects             |
| `GET /chats`              | Get user’s chats             |
| `POST /chats/create`      | Create a private chat        |
| `POST /chats/group/create`| Create a group chat          |
| `POST /chats/send`        | Send message in private chat |
| `POST /chats/group/send`  | Send message in group chat   |
| `POST /chats/sendImage`   | Send image in a chat         |
| `POST /updateMoney`       | Add money / invest in project|
| `POST /hackaton/upload`   | Upload image for events      |
| `POST /events/create`     | Create an event              |
| `GET /events`             | Get all events               |
| `PUT /events/:id`         | Edit an event                |

---

### 🟣 Connect App (type = 2)

| Endpoint                           | Description                |
|------------------------------------|----------------------------|
| `POST /register`                  | Register a Connect user    |
| `POST /login`                     | Login a Connect user       |
| `GET /connect/profile/:email`     | Get user profile           |
| `PUT /connect/profile/:email`     | Update user profile        |
| `GET /connect/users`              | Get all users (minimal info)|
| `GET /connect/search?query=abc`   | Search users by name/email |
| `POST /connect/follow`            | Follow someone             |
| `POST /connect/unfollow`          | Unfollow someone           |
| `POST /connect/upload`            | Upload profile/post image  |

#### ➡️ Posts System

| Endpoint                                      | Description             |
|-----------------------------------------------|-------------------------|
| `POST /connect/posts/create`                  | Create a new post       |
| `GET /connect/posts`                         | Get all posts           |
| `PUT /connect/posts/:id`                     | Update post info        |
| `DELETE /connect/posts/:id`                  | Delete post             |
| `POST /connect/posts/:id/like`               | Like/unlike a post      |
| `POST /connect/posts/:id/comment`            | Add comment to a post   |
| `PUT /connect/posts/:id/comment/:cid`        | Edit a comment          |
| `DELETE /connect/posts/:id/comment/:cid`     | Delete a comment        |

---

## 📁 Uploaded Images Path

- **Hackaton Event Images:**  
  `/hackaton/img/{email}/{eventId}/{filename}`

- **Chat Images:**  
  `/hackaton/chat_images/{filename}`

- **Connect Profile/Post Images:**  
  `/connect/img/{email}/{filename}`