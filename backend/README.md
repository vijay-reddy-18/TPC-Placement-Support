# Backend Setup Guide

## Prerequisites
- Node.js (v14+)
- MongoDB Atlas account
- Postman (optional, for API testing)

## Installation Steps

### 1. Navigate to backend directory
```bash
cd backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create .env file
Copy `.env.example` to `.env` and update with your MongoDB credentials:
```bash
cp .env.example .env
```

Update the following in `.env`:
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: A secure secret key for JWT

### 4. Start the server
```bash
npm run dev
```

Server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- **POST** `/api/auth/register` - Student registration
- **POST** `/api/auth/login` - Student login
- **GET** `/api/auth/me` - Get current user (Protected)

### Tickets (Protected)
- **POST** `/api/tickets` - Create new ticket (Student)
- **GET** `/api/tickets` - Get all tickets (filter by role)
- **GET** `/api/tickets/:id` - Get single ticket
- **PUT** `/api/tickets/:id` - Update ticket (TPC/Admin)
- **PUT** `/api/tickets/:id/close` - Close ticket (Student)
- **PUT** `/api/tickets/:id/assign` - Assign ticket (TPC/Admin)
- **GET** `/api/tickets/stats/dashboard` - Get dashboard stats

## Request/Response Examples

### Register Request
```json
{
  "studentId": "22123456",
  "name": "John Doe",
  "password": "password123",
  "confirmPassword": "password123"
}
```

### Login Request
```json
{
  "studentId": "22123456",
  "password": "password123"
}
```

### Create Ticket Request
```json
{
  "title": "Placement Interview Query",
  "description": "How to prepare for group discussion?",
  "category": "interview",
  "priority": "high"
}
```

### Update Ticket Request (TPC)
```json
{
  "status": "in-progress",
  "tpcResponse": "Your query has been noted. Check the placement portal for updates.",
  "deadline": "2026-02-20",
  "priority": "high"
}
```
