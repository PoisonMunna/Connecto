# 🌐 SocialApp — Full-Stack Social Media Platform

<div align="center">

![SocialApp Banner](https://img.shields.io/badge/SocialApp-v1.0-6366f1?style=for-the-badge&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

**A feature-rich, modern social media platform with real-time messaging, admin control panel, Google authentication, and a beautiful responsive UI.**

[Live Demo](https://connecto-psi.vercel.app)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Endpoints](#-api-endpoints)
- [Admin Panel](#-admin-panel)
- [Firebase Setup](#-firebase-google-authentication-setup)
- [Database Schema](#-database-schema)
- [Screenshots](#-screenshots)

---

## 🚀 Overview

SocialApp is a **full-stack social media web application** built with React + Vite on the frontend and Node.js/Express on the backend, powered by a MySQL relational database. It supports the complete social media lifecycle — authentication, posting, liking, commenting, following, direct messaging, notifications, and a powerful admin control panel with analytics.

Designed with modern aesthetics: **dual light/dark theme**, glassmorphism UI, smooth animations, and a fully responsive layout.

---

## ✨ Features

### 👤 Authentication
- **Email/Password** signup and login with JWT authentication
- **Google Sign-In** via Firebase Authentication (OAuth 2.0)
- Separate **Admin Login** tab on the auth page
- JWT stored in `localStorage` with 7-day expiry
- Protected routes with React guards

### 📰 Feed & Posts
- Global feed (all posts) and personalized feed (from followed users)
- Create posts with **text and image uploads**
- Like and unlike posts with real-time counters
- Delete your own posts
- Verified user **🔵 blue tick badge** next to usernames
- Infinite scroll-ready card layout

### 💬 Comments
- Threaded comment sections on every post
- Add and view comments with timestamps
- Collapsible comment area

### 👥 Social Graph (Follow System)
- Follow and unfollow any user
- Mutual follow detection with **🤝 Mutual badge** on profiles
- Followers and following lists on profile pages

### 🔔 Notifications
- Real-time notification feed for follows, likes, and comments
- Unread notification count badge in the navbar (auto-polling)

### 💌 Direct Messaging
- One-to-one text messaging between users
- Message thread view with sent/read receipts (✓ / ✓✓)
- **Delete your own messages** on hover
- Unread message count badge in navbar
- User search to start new conversations
- Auto-polling for new messages every 10 seconds

### 🧑 Profile Pages
- **Cover photo** — upload, change, or remove with hover controls
- **Profile picture** — upload, change, or remove with camera overlay
- Edit username and bio from the profile page
- Username change automatically updates the page URL
- Verified badge (bluetick.png) displayed on verified accounts
- Stats: posts, followers, following count

### 🛡️ Admin Panel
- **Dedicated admin login** tab — rejects non-admin accounts
- **User Management:**
  - View all registered users with their stats
  - 📊 **Dashboard** button per user — opens a stats modal with charts
  - ✅ **Promote** — grant or revoke the blue tick verified badge (with confirmation)
  - 🗑 **Delete** — permanently remove a user and all their data (with confirmation)
  - Admin accounts are protected from promotion/deletion
- **Analytics Dashboard:**
  - 5 summary tiles: Users, Posts, Likes, Comments, Follows
  - User Growth — Area chart
  - Activity Trends — Multi-line chart (Posts / Likes / Comments)
  - Likes Over Time — Gradient bar chart
  - Content Distribution — Donut pie chart
  - Most Active Users — Ranked table
  - Period filter: **Day / Week / Month / Year**

### 🎨 UI/UX
- Dark / Light mode toggle with `localStorage` persistence and no flash-on-load
- Glassmorphism cards, gradient accents, smooth micro-animations
- Fully responsive — mobile, tablet, and desktop
- Toast notifications for all user actions
- Search users from the navbar with live results

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | UI framework |
| **Vite** | Build tool & dev server |
| **Tailwind CSS** | Utility-first styling |
| **React Router v6** | Client-side routing |
| **Axios** | HTTP client |
| **Recharts** | Analytics charts |
| **Firebase SDK** | Google Authentication |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express** | REST API server |
| **MySQL 2** | Relational database driver |
| **JSON Web Tokens** | Stateless authentication |
| **bcrypt** | Password hashing |
| **Multer** | File upload handling |
| **dotenv** | Environment configuration |
| **Nodemon** | Development auto-restart |

### Database
| Technology | Purpose |
|---|---|
| **MySQL 8** | Primary relational database |

### External Services
| Service | Purpose |
|---|---|
| **Firebase (Google Auth)** | OAuth 2.0 social login |
| **Firebase Analytics** | Usage analytics |
| **Google Identity Toolkit API** | Server-side token verification |

---

## 📁 Project Structure

```
social-app/
├── backend/
│   ├── config/
│   │   └── db.js                  # MySQL connection pool
│   ├── controllers/
│   │   ├── authController.js      # Signup, Login, Google Auth, JWT
│   │   ├── postController.js      # CRUD for posts & feed
│   │   ├── commentController.js   # Comment management
│   │   ├── likeController.js      # Like/unlike logic
│   │   ├── followController.js    # Follow/unfollow, lists
│   │   ├── notificationController.js  # Notification feed
│   │   ├── messageController.js   # Direct messaging, delete
│   │   ├── userController.js      # Profiles, search, image upload
│   │   └── adminController.js     # Admin: users, promote, delete, analytics
│   ├── middleware/
│   │   ├── auth.js                # JWT verification middleware
│   │   └── adminAuth.js           # Admin-only route guard
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── postRoutes.js
│   │   ├── commentRoutes.js
│   │   ├── likeRoutes.js
│   │   ├── followRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── messageRoutes.js
│   │   ├── userRoutes.js
│   │   └── adminRoutes.js
│   ├── uploads/                   # User-uploaded images + bluetick.png
│   ├── migrate.js                 # Messages table migration
│   ├── migrate_admin.js           # Admin columns migration
│   ├── migrate_cover.js           # Cover photo migration
│   ├── check_and_promote.js       # CLI tool to promote users to admin
│   ├── server.js                  # Express app entry point
│   └── .env                       # Environment variables
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── api.js             # Axios instance + helpers
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── PostCard.jsx
│   │   │   ├── CommentSection.jsx
│   │   │   ├── Avatar.jsx
│   │   │   ├── Spinner.jsx
│   │   │   └── Footer.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx    # Global auth state
│   │   │   ├── ThemeContext.jsx   # Dark/light mode
│   │   │   └── ToastContext.jsx   # Toast notifications
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx       # Login / Register / Admin Login
│   │   │   ├── FeedPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   ├── MessagesPage.jsx
│   │   │   ├── NotificationsPage.jsx
│   │   │   └── AdminPage.jsx
│   │   ├── firebase.js            # Firebase config & Google Sign-In helper
│   │   ├── guards.jsx             # ProtectedLayout, GuestOnly, AdminOnly
│   │   ├── App.jsx                # Routes
│   │   └── index.css              # Global Tailwind + design tokens
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── database/
│   └── schema.sql                 # Full MySQL schema
│
└── README.md
```

---

## 🏁 Getting Started

### Prerequisites

- **Node.js** v18+ → [Download](https://nodejs.org)
- **MySQL** 8.0+ → [Download](https://dev.mysql.com/downloads/)
- **Git** → [Download](https://git-scm.com)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/social-app.git
cd social-app
```

### 2. Set Up the Database

```bash
# Log in to MySQL
mysql -u root -p

# Run the schema file
source database/schema.sql
```

### 3. Configure Backend Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your values (see [Environment Variables](#-environment-variables)).

### 4. Install Backend Dependencies & Run Migrations

```bash
cd backend
npm install

# Run all migrations (run each once)
node migrate.js          # Creates messages table
node migrate_admin.js    # Adds is_admin, is_verified columns
node migrate_cover.js    # Adds cover_pic column
```

### 5. Promote Your Account to Admin

```bash
# Auto-promotes the first user (ID=1)
node check_and_promote.js

# Or promote a specific account by email
node check_and_promote.js your@email.com
```

### 6. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 7. Configure Firebase (for Google Login)

See [Firebase Setup](#-firebase-google-authentication-setup) section below.

### 8. Start the Application

Open **two terminals**:

```bash
# Terminal 1 — Backend (port 5000)
cd backend
npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 🔐 Environment Variables

Create `backend/.env` with the following:

```env
# ── Database ──────────────────────────────────────────────
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=social_app

# ── JWT ───────────────────────────────────────────────────
JWT_SECRET=your_super_secret_jwt_key_change_in_production

# ── Server ────────────────────────────────────────────────
PORT=5000

# ── Firebase ───────────────────────────────────────────────
FIREBASE_API_KEY=your_firebase_web_api_key
```

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/auth/signup` | Register new user | ❌ |
| `POST` | `/api/auth/login` | Email/password login | ❌ |
| `POST` | `/api/auth/google` | Firebase Google login | ❌ |
| `GET`  | `/api/auth/me` | Get current user | ✅ |

### Posts
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET`  | `/api/posts/feed` | All posts (global feed) | ✅ |
| `GET`  | `/api/posts/myfeed` | Personalized feed | ✅ |
| `POST` | `/api/posts` | Create post (with image) | ✅ |
| `DELETE` | `/api/posts/:id` | Delete own post | ✅ |

### Users & Profiles
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET`  | `/api/users/:username` | Get user profile + posts | ✅ |
| `GET`  | `/api/users/search?q=` | Search users | ✅ |
| `PUT`  | `/api/users/update` | Update bio, username, images | ✅ |
| `DELETE` | `/api/users/remove-profile-pic` | Remove profile picture | ✅ |
| `DELETE` | `/api/users/remove-cover-pic` | Remove cover photo | ✅ |

### Social
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/follow/:id` | Follow / Unfollow toggle | ✅ |
| `GET`  | `/api/follow/:id/followers` | Get followers list | ✅ |
| `GET`  | `/api/follow/:id/following` | Get following list | ✅ |

### Messages
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET`  | `/api/messages/conversations` | All conversations | ✅ |
| `GET`  | `/api/messages/unread/count` | Unread message count | ✅ |
| `GET`  | `/api/messages/:userId` | Message thread | ✅ |
| `POST` | `/api/messages/:userId` | Send a message | ✅ |
| `PUT`  | `/api/messages/:userId/read` | Mark thread as read | ✅ |
| `DELETE` | `/api/messages/msg/:messageId` | Delete own message | ✅ |

### Admin *(admin token required)*
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/admin/users` | All users with stats |
| `GET`  | `/api/admin/users/:id/dashboard` | Individual user dashboard |
| `POST` | `/api/admin/users/:id/promote` | Toggle verified (blue tick) |
| `DELETE` | `/api/admin/users/:id` | Permanently delete user |
| `GET`  | `/api/admin/analytics?period=` | App-wide analytics data |

---

## 🛡️ Admin Panel

### Access
1. Go to the login page → click the **🛡️ Admin** tab
2. Sign in with an admin-enabled account
3. Non-admin logins are rejected with an error message

### Promoting a User to Admin (CLI)
```bash
cd backend
node check_and_promote.js your@email.com
```

### Features
- **Users Tab** — every user has: `📊 Dashboard` | `✅ Promote` | `🗑 Delete`
- **Dashboard Modal** — per-user stats: posts, likes received, comments, followers, following, messages sent — plus 2 activity charts and recent posts
- **Analytics Tab** — app-wide charts with period selector (Day / Week / Month / Year)

---

## 🔥 Firebase Google Authentication Setup

1. Go to **[Firebase Console](https://console.firebase.google.com)** → Create a project
2. **Authentication** → Get Started → Enable **Google** provider
3. **Project Settings** → General → Add a Web App → Copy config
4. Update `frontend/src/firebase.js`:

```js
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  projectId:         "YOUR_PROJECT",
  storageBucket:     "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID",
  measurementId:     "G-XXXXXXXXXX",  // optional, for Analytics
};
```

5. Add your web API key to `backend/.env`:
```env
FIREBASE_API_KEY=AIzaSy...
```

6. Ensure **`localhost`** is in Firebase Console → Authentication → Settings → Authorized Domains

---

## 🗄️ Database Schema

Key tables:

| Table | Description |
|---|---|
| `users` | Accounts — `id, username, email, password, bio, profile_pic, cover_pic, is_admin, is_verified` |
| `posts` | User posts — `id, user_id, content, image_url` |
| `likes` | Post likes — `user_id, post_id` |
| `comments` | Post comments — `id, user_id, post_id, content` |
| `followers` | Follow graph — `follower_id, followed_id` |
| `notifications` | Activity alerts — `user_id, actor_id, type, post_id` |
| `messages` | DMs — `id, sender_id, receiver_id, content, is_read` |

Full schema: [`database/schema.sql`](database/schema.sql)

---

## 🖼 Screenshots

> Run the app locally and visit `http://localhost:5173`

| Page | Description |
|---|---|
| `/` | Auth page with Login / Register / Admin tabs + Google Sign-In |
| `/feed` | Global & personalized post feed |
| `/profile/:username` | Profile with cover photo, avatar, posts, followers |
| `/messages` | Direct messaging with thread view |
| `/notifications` | Activity notification feed |
| `/admin` | Admin control panel — users & analytics |

---

## 🔒 Security Features

- All passwords hashed with **bcrypt** (10 salt rounds)
- JWTs signed with a secret key, expire in 7 days
- Firebase tokens verified server-side via **Google Identity Toolkit API**
- Admin routes double-protected: `verifyToken` + `requireAdmin` middleware
- Admin accounts cannot be deleted or modified by other admins
- File uploads restricted to **image types only**, max **5 MB**
- SQL queries use **parameterized statements** — no string concatenation

---

## 🚀 Scripts

### Backend
```bash
npm run dev      # Start with nodemon (auto-restart)
npm start        # Production start
```

### Frontend
```bash
npm run dev      # Vite dev server (HMR)
npm run build    # Production build → dist/
npm run preview  # Preview production build
```

---

## 📦 Dependencies

### Backend
```json
"bcrypt", "cors", "dotenv", "express",
"jsonwebtoken", "multer", "mysql2"
```

### Frontend
```json
"react", "react-dom", "react-router-dom",
"axios", "recharts", "firebase",
"@vitejs/plugin-react", "tailwindcss"
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

[Mayank Raj](https://github.com/poisonmunna)
Built with ❤️ using React, Node.js, MySQL, and Firebase.

---

<div align="center">

⭐ **Star this repo if you found it useful!** ⭐

</div>
