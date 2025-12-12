# Comment System Backend - MERN Stack

A robust, scalable backend for a real-time comment system built with MongoDB, Express.js, Node.js, TypeScript, and Socket.io. Features JWT authentication, like/dislike functionality, comment replies, pagination, and real-time updates.

## 🚀 Features

### Authentication

- ✅ User registration with email and username validation
- ✅ JWT-based authentication
- ✅ Secure password hashing with bcrypt
- ✅ Protected routes with authentication middleware

### Comment System

- ✅ Create, read, update, and delete comments
- ✅ Like and dislike functionality (toggle-able)
- ✅ Nested comments/replies support
- ✅ Pagination for efficient data loading
- ✅ Sorting by newest, most liked, most disliked
- ✅ Soft delete for comments
- ✅ User authorization (only authors can edit/delete)
- ✅ One like/dislike per user validation

### Real-time Updates

- ✅ Socket.io integration for real-time events
- ✅ Live comment creation notifications
- ✅ Real-time like/dislike updates
- ✅ Instant comment updates and deletions
- ✅ Page-specific room management

### Architecture

- ✅ Modular and scalable architecture
- ✅ TypeScript for type safety
- ✅ Service layer separation
- ✅ Middleware for authentication and validation
- ✅ Comprehensive error handling
- ✅ Input validation with express-validator

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account or local MongoDB instance
- npm or yarn package manager

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd comments-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory (use `.env.example` as reference):

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/comments-db?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# CORS Configuration
CLIENT_URL=http://localhost:3000
```

### 4. MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free tier available)
3. Create a database user
4. **Important:** Whitelist all IPs (0.0.0.0/0) for development:
   - Go to Network Access
   - Click "Add IP Address"
   - Select "Allow Access from Anywhere"
5. Get your connection string and update `MONGODB_URI` in `.env`

### 5. Run the application

#### Development mode (with hot reload)

```bash
npm run dev
```

#### Build TypeScript

```bash
npm run build
```

#### Production mode

```bash
npm start
```

The server will start on `http://localhost:5000` (or your specified PORT)

## 🌱 Seeding Data

To populate the database with sample users and comments for testing:

```bash
npm run seed
```

This will create:

- 5 sample users (Alice, Bob, Charlie, Diana, Eve)
- 25 comments (5 per user) with random likes/dislikes
- Random replies to comments

**Note:** Ensure MongoDB is running before seeding.

## 📡 API Documentation

### Base URL

```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_id",
      "username": "johndoe",
      "email": "john@example.com"
    }
  }
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User

```http
GET /api/auth/me
Authorization: Bearer <your_jwt_token>
```

### Comment Endpoints

#### Get Comments for a Page

```http
GET /api/comments/:pageId?page=1&limit=10&sort=newest
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Comments per page (default: 10, max: 100)
- `sort` (optional): 'newest', 'mostLiked', 'mostDisliked' (default: 'newest')

**Response:**

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "totalComments": 47
  }
}
```

#### Create Comment

```http
POST /api/comments
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "content": "This is a great comment!",
  "pageId": "page-123",
  "parentCommentId": "optional_parent_comment_id"
}
```

#### Update Comment

```http
PUT /api/comments/:commentId
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "content": "Updated comment content"
}
```

#### Delete Comment

```http
DELETE /api/comments/:commentId
Authorization: Bearer <your_jwt_token>
```

#### Like Comment

```http
POST /api/comments/:commentId/like
Authorization: Bearer <your_jwt_token>
```

#### Dislike Comment

```http
POST /api/comments/:commentId/dislike
Authorization: Bearer <your_jwt_token>
```

#### Get Replies

```http
GET /api/comments/:commentId/replies
```

## 🔌 Socket.io Events

### Client Connection

```javascript
import io from "socket.io-client";

const socket = io("http://localhost:5000", {
  auth: {
    token: "your_jwt_token",
  },
});
```

### Events to Emit

#### Join Page

```javascript
socket.emit("joinPage", "page-123");
```

#### Leave Page

```javascript
socket.emit("leavePage", "page-123");
```

### Events to Listen

#### New Comment

```javascript
socket.on("newComment", (comment) => {
  console.log("New comment:", comment);
  // Update your UI
});
```

#### Update Comment

```javascript
socket.on("updateComment", (comment) => {
  console.log("Comment updated:", comment);
});
```

#### Delete Comment

```javascript
socket.on("deleteComment", ({ commentId }) => {
  console.log("Comment deleted:", commentId);
});
```

#### Like Comment

```javascript
socket.on("likeComment", (comment) => {
  console.log("Comment liked:", comment);
});
```

#### Dislike Comment

```javascript
socket.on("dislikeComment", (comment) => {
  console.log("Comment disliked:", comment);
});
```

## 🏗️ Project Structure

```
comments-backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.ts  # MongoDB connection
│   │   └── jwt.ts       # JWT utilities
│   ├── controllers/     # Route controllers
│   │   ├── authController.ts
│   │   └── commentController.ts
│   ├── middleware/      # Custom middleware
│   │   ├── auth.ts      # Authentication middleware
│   │   ├── validator.ts # Validation middleware
│   │   └── errorHandler.ts
│   ├── models/          # Mongoose models
│   │   ├── User.ts
│   │   └── Comment.ts
│   ├── routes/          # API routes
│   │   ├── authRoutes.ts
│   │   └── commentRoutes.ts
│   ├── types/           # TypeScript types
│   │   └── index.ts
│   ├── utils/           # Utility functions
│   │   └── socket.ts    # Socket.io setup
│   └── index.ts         # Express app setup
├── server.ts            # Server entry point
├── tsconfig.json        # TypeScript configuration
├── package.json         # Dependencies
├── .env.example         # Environment variables example
├── .gitignore           # Git ignore rules
└── README.md            # Documentation
```

## 🔒 Security Features

- Password hashing with bcrypt (10 salt rounds)
- JWT token-based authentication
- Protected routes with authentication middleware
- Authorization checks for edit/delete operations
- Input validation and sanitization
- CORS configuration
- Environment variable protection

## 🧪 Testing the API

You can test the API using:

- [Postman](https://www.postman.com/)
- [Insomnia](https://insomnia.rest/)
- [Thunder Client](https://www.thunderclient.com/) (VS Code extension)
- cURL commands

### Example cURL Request

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Create Comment (replace YOUR_TOKEN)
curl -X POST http://localhost:5000/api/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"content":"Test comment","pageId":"page-1"}'
```

## 🚀 Deployment

### Environment Variables for Production

Make sure to set these in your production environment:

- `NODE_ENV=production`
- `MONGODB_URI` (your production MongoDB URI)
- `JWT_SECRET` (strong random secret)
- `CLIENT_URL` (your frontend URL)

### Recommended Platforms

- [Heroku](https://www.heroku.com/)
- [Railway](https://railway.app/)
- [Render](https://render.com/)
- [DigitalOcean](https://www.digitalocean.com/)
- [AWS EC2](https://aws.amazon.com/ec2/)

## 📝 Git Workflow

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Complete comment system backend"

# Add remote
git remote add origin <your-repo-url>

# Push
git push -u origin main
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👤 Author

**Md. Asaduzzman Arabin**

## 🙏 Acknowledgments

- Express.js for the web framework
- MongoDB for the database
- Socket.io for real-time functionality
- JWT for authentication
- TypeScript for type safety

---

**Happy Coding! 🎉**
