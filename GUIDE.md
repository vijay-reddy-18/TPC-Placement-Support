# Complete Project Setup Guide

## Project Overview
This is a full-stack placement support system with Backend API and Frontend React Application.

---

## Backend Setup Guide

### Prerequisites
- Node.js (v14+)
- MongoDB Atlas account
- Postman (optional, for API testing)

### Installation Steps

#### 1. Navigate to backend directory
```bash
cd backend
```

#### 2. Install dependencies
```bash
npm install
```

#### 3. Create .env file
Copy `.env.example` to `.env` and update with your MongoDB credentials:
```bash
cp .env.example .env
```

Update the following in `.env`:
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: A secure secret key for JWT

#### 4. Start the server
```bash
npm run dev
```

Server will run on `http://localhost:5000`

### API Endpoints

#### Authentication
- **POST** `/api/auth/register` - Student registration
- **POST** `/api/auth/login` - Student login
- **GET** `/api/auth/me` - Get current user (Protected)

#### Tickets (Protected)
- **POST** `/api/tickets` - Create new ticket (Student)
- **GET** `/api/tickets` - Get all tickets (filter by role)
- **GET** `/api/tickets/:id` - Get single ticket
- **PUT** `/api/tickets/:id` - Update ticket (TPC/Admin)
- **PUT** `/api/tickets/:id/close` - Close ticket (Student)
- **PUT** `/api/tickets/:id/assign` - Assign ticket (TPC/Admin)
- **GET** `/api/tickets/stats/dashboard` - Get dashboard stats

### Request/Response Examples

#### Register Request
```json
{
  "studentId": "22123456",
  "name": "John Doe",
  "password": "password123",
  "confirmPassword": "password123"
}
```

#### Login Request
```json
{
  "studentId": "22123456",
  "password": "password123"
}
```

#### Create Ticket Request
```json
{
  "title": "Placement Interview Query",
  "description": "How to prepare for group discussion?",
  "category": "interview",
  "priority": "high"
}
```

#### Update Ticket Request (TPC)
```json
{
  "status": "in-progress",
  "tpcResponse": "Your query has been noted. Check the placement portal for updates.",
  "deadline": "2026-02-20",
  "priority": "high"
}
```

---

## Frontend Setup Guide

### Prerequisites
- Node.js (v14+)
- npm or yarn
- React 18+

### Installation Steps

#### 1. Navigate to frontend directory
```bash
cd frontend
```

#### 2. Install dependencies
```bash
npm install
```

#### 3. Create .env file
Create a `.env` file in the frontend root:
```
REACT_APP_API_URL=http://localhost:5000/api
```

#### 4. Start the development server
```bash
npm start
```

Application will open at `http://localhost:3000`

### Features

#### Student Module
- **Register** using 8-digit Student ID
- **Login** with Student ID and password
- **Create Tickets** for placement-related issues
- **View Ticket Status** and TPC responses
- **Close Tickets** when resolved
- **Dashboard** with ticket statistics

#### UI Components
- Advanced Bootstrap 5 components
- Responsive design
- Status badges and priority indicators
- Modal forms for ticket creation
- Toast notifications for actions
- Clean, modern interface

### Project Structure
```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── NavBar.js
│   │   ├── ProtectedRoute.js
│   │   └── PublicRoute.js
│   ├── context/
│   │   └── AuthContext.js
│   ├── pages/
│   │   ├── LoginPage.js
│   │   ├── RegisterPage.js
│   │   └── StudentDashboard.js
│   ├── services/
│   │   └── api.js
│   ├── styles/
│   │   ├── Global.css
│   │   ├── Auth.css
│   │   ├── Dashboard.css
│   │   └── Navbar.css
│   ├── App.js
│   └── index.js
├── .env
├── .gitignore
└── package.json
```

### Key Technologies
- React 18
- React Router v6
- Bootstrap 5
- Axios
- React Icons
- React Toastify

### Styling Notes
- Custom CSS with Bootstrap integration
- Responsive grid system
- Animation effects for better UX
- Consistent color scheme
- Accessibility-friendly design

---

## Quick Start (Both Backend & Frontend)

### Terminal 1 - Backend
```bash
cd backend
npm install
cp .env.example .env
# Update .env with MongoDB credentials
npm run dev
```

### Terminal 2 - Frontend
```bash
cd frontend
npm install
# Create .env with REACT_APP_API_URL=http://localhost:5000/api
npm start
```

Both applications will be running:
- **Backend API**: http://localhost:5000
- **Frontend App**: http://localhost:3000
