# Frontend Setup Guide

## Prerequisites
- Node.js (v14+)
- npm or yarn
- React 18+

## Installation Steps

### 1. Navigate to frontend directory
```bash
cd frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create .env file
Create a `.env` file in the frontend root:
```
REACT_APP_API_URL=http://localhost:5000/api
```

### 4. Start the development server
```bash
npm start
```

Application will open at `http://localhost:3000`

## Features

### Student Module
- **Register** using 8-digit Student ID
- **Login** with Student ID and password
- **Create Tickets** for placement-related issues
- **View Ticket Status** and TPC responses
- **Close Tickets** when resolved
- **Dashboard** with ticket statistics

### UI Components
- Advanced Bootstrap 5 components
- Responsive design
- Status badges and priority indicators
- Modal forms for ticket creation
- Toast notifications for actions
- Clean, modern interface

## Project Structure
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

## Key Technologies
- React 18
- React Router v6
- Bootstrap 5
- Axios
- React Icons
- React Toastify

## Styling Notes
- Custom CSS with Bootstrap integration
- Responsive grid system
- Animation effects for better UX
- Consistent color scheme
- Accessibility-friendly design
