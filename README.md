# 🎓 TPC Placement Support System

A full-stack web application designed to streamline communication between **Students**, **TPC (Training & Placement Cell)**, and **Admin** through a structured ticket-based support system.

---

## 📌 Project Overview

The **TPC Placement Support System** enables students to raise placement-related queries and allows the TPC/Admin team to efficiently manage, track, and resolve them.

This system ensures:
- Faster query resolution
- Better communication
- Centralized management of placement-related issues

---

## 🏗️ Architecture

- **Frontend**: React.js (Role-based dashboards)
- **Backend**: Node.js + Express.js (REST APIs)
- **Database**: MongoDB
- **Authentication**: JWT-based authentication

---

## 👥 User Roles & Access

### 👨‍🎓 Student
- Register with Student ID
- Login to dashboard
- Create support tickets
- Track ticket status
- Update profile & password

### 🧑‍💼 TPC Department
- View all student queries
- Assign tickets
- Update ticket status
- Respond to queries

### 👨‍💻 Admin
- Full system control
- View all users
- Manage user roles/status
- Monitor system statistics
- Access admin dashboard

---

## ✨ Core Features

### 🔐 Authentication System
- Role-based login (Student / TPC / Admin)
- JWT authentication
- Secure protected routes

---

### 🎫 Ticket Management System
- Create, update, assign, and close tickets
- Ticket categories & priorities
- Status tracking (Open, In Progress, Closed)
- Role-based ticket visibility

---

### 📊 Dashboards

#### 📌 Student Dashboard
- View personal tickets
- Create new queries
- Track progress

#### 📌 TPC Dashboard
- Manage all student tickets
- Assign and resolve queries

#### 📌 Admin Dashboard
- System analytics
- User management
- All queries overview

---

### 👤 Profile Management
- Update personal details
- Upload profile photo
- Change password

---

### 📈 Admin Features
- View all users
- Filter users by role
- Update user status
- Dashboard statistics API

---

### ⚙️ Backend Features
- RESTful API architecture
- Middleware for authentication & error handling
- MongoDB models (User, Ticket)
- Logging utility

---

## 📂 Project Structure


TPC-Placement-Support/
│
├── backend/
│ ├── src/
│ │ ├── config/
│ │ ├── controllers/
│ │ ├── middleware/
│ │ ├── models/
│ │ ├── routes/
│ │ └── utils/
│ ├── scripts/
│ └── server.js
│
├── frontend/
│ ├── src/
│ │ ├── api/
│ │ ├── components/
│ │ ├── context/
│ │ └── pages/
│
└── README.md


---

## ⚙️ Installation & Setup

### 1️⃣ Clone Repository
```bash
git clone https://github.com/vijay-reddy-18/TPC-Placement-Support.git
cd TPC-Placement-Support
2️⃣ Backend Setup
cd backend
npm install

Create .env file:

MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret_key

Run backend:

npm run dev

Server runs at:
👉 http://localhost:5000

3️⃣ Frontend Setup
cd frontend
npm install
npm start

Frontend runs at:
👉 http://localhost:3000

🔑 Default Credentials
Admin
ID: 10000000
Password: admin@12345
TPC
ID: 10000001
Password: tpc@12345
🔌 API Endpoints
Authentication
POST /api/auth/register
POST /api/auth/login
GET /api/auth/me
Tickets
POST /api/tickets
GET /api/tickets
PUT /api/tickets/:id
PUT /api/tickets/:id/assign
PUT /api/tickets/:id/close
Admin
GET /api/admin/users
GET /api/admin/stats
PUT /api/admin/users/:id/status
🚀 Key Highlights

✅ Role-Based Access Control
✅ Clean MVC Backend Structure
✅ Real-Time Ticket Workflow
✅ Full Admin Control Panel
✅ Scalable & Modular Design

🔮 Future Enhancements
Email notifications system
AI-based query suggestions
Resume & placement analytics
Interview scheduling module
🤝 Contributing

Feel free to fork and contribute to this project.

👨‍💻 Author

Vijay Reddy
GitHub: https://github.com/vijay-reddy-18
