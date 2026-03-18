# Login Credentials Documentation

## System Overview
The system uses **Role-Based Access Control (RBAC)** with three user roles:
- **Student**
- **TPC (Training and Placement Cell)**
- **Admin**

All roles use the **same authentication endpoint** but with different credentials stored in the database.

---

## How to Setup TPC and Admin Users

### Step 1: Run the Seed Script
Before logging in with TPC or Admin credentials, you must create these users in the database.

Navigate to the backend directory and run:
```bash
cd backend
npm install
node scripts/seedAdminUsers.js
```

This will create:
- **Admin User**: Student ID `10000000`, Password `admin@12345`
- **TPC User**: Student ID `10000001`, Password `tpc@12345`

Output:
```
✓ Admin user created successfully
  Student ID: 10000000
  Password: admin@12345
✓ TPC user created successfully
  Student ID: 10000001
  Password: tpc@12345
```

---

## STUDENT MODULE

### Registration
**Endpoint:** `POST /api/auth/register`

**Required Fields:**
- Student ID (8-digit registration number) - e.g., `22123456`
- Name
- Password (minimum 6 characters)
- Confirm Password

**Example Request:**
```json
{
  "studentId": "22123456",
  "name": "John Doe",
  "password": "password123",
  "confirmPassword": "password123"
}
```

### Login
**Endpoint:** `POST /api/auth/login`

**Required Fields:**
- Student ID (8-digit number)
- Password

**Example Request:**
```json
{
  "studentId": "22123456",
  "password": "password123"
}
```

### Module Features
- Register using 8-digit Student ID
- Login using Student ID + Password
- Raise tickets for placement/internship related queries
- Select category and priority for tickets
- View ticket status and TPC responses
- Close tickets when resolved
- Dashboard with ticket statistics
- View Personal Dashboard with:
  - Total queries created
  - Open queries
  - In-progress queries
  - Resolved queries
  - Query listing with status filters

---

## TPC DEPARTMENT MODULE

### Login Credentials
```
Student ID: 10000001
Password: tpc@12345
```

**Note:** TPC cannot register themselves. Credentials are created by running the seed script.

### TPC Dashboard Features
- **View All Queries**: See placement-related tickets from all students
- **Filter Tickets**: 
  - By Status (open, in-progress, resolved)
  - By Priority (low, medium, high)
  - By Category (interview, internship, placement)
- **Respond to Queries**:
  - Provide detailed responses to student's placement queries
  - Attach deadlines for follow-ups
  - Update ticket status
- **Track Progress**: Monitor query resolution rates
- **Dashboard Statistics**:
  - Total queries received
  - Open queries count
  - In-progress queries count
  - Resolved queries count
  - View all student names and query details

### Protected Endpoints (TPC Only)
- `PUT /api/tickets/:id` - Update ticket with response
- `PUT /api/tickets/:id/assign` - Assign ticket to team member
- `GET /api/tickets/stats/dashboard` - View dashboard statistics

### TPC Dashboard Tabs
1. **All Tickets Tab**:
   - View all queries with full details
   - Filter by status and priority
   - Update query status
   - Add TPC responses

2. **Statistics**:
   - Total queries received
   - Open queries
   - In-progress queries
   - Resolved queries

---

## ADMIN MODULE

### Login Credentials
```
Student ID: 10000000
Password: admin@12345
```

**Note:** Admin cannot register themselves. Credentials are created by running the seed script.

### Admin Dashboard Features
- **System Overview**:
  - Total tickets in the system
  - Open tickets count
  - In-progress tickets count
  - Resolved tickets count
  - Total students registered
  - Active students status
  - System health metrics
  - Resolution rate percentage

- **View All Queries**:
  - Complete list of all student queries
  - Filter by status
  - View priority levels
  - Track query creation dates
  - Table view with all details

- **Student Management**:
  - View all registered students
  - Student ID and names
  - Email addresses (if provided)
  - Active/Inactive status
  - Registration dates
  - Modify student status

- **Unresolved Queries Tracking**:
  - Monitor all open and in-progress queries
  - Count of unresolved tickets
  - View detailed information
  - Track query age and priority

### Admin Dashboard Tabs
1. **Overview Tab**:
   - Statistics cards showing key metrics
   - System health dashboard
   - Resolution rate progress bar
   - Pending responses count
   - In-progress count

2. **All Queries Tab**:
   - Table view of all tickets
   - Filter by status
   - See student information
   - View priority and category

3. **Student List Tab**:
   - All registered students
   - Student IDs and names
   - Contact information
   - Active/Inactive status
   - Registration dates

4. **Unresolved Queries Tab**:
   - Track all open and in-progress tickets
   - Detailed card view of each query
   - TPC responses view
   - Monitor query status

### Protected Endpoints (Admin Only)
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/role/:role` - Get users by role
- `PUT /api/admin/users/:id/status` - Update user status
- `GET /api/admin/stats` - Get system statistics
- `GET /api/users` - Get all users (alias endpoint)

---

## Summary Table

| Module | Student ID | Password | Role | Access | Features |
|--------|-----------|----------|------|--------|----------|
| **Student** | 8-digit number (e.g., 22123456) | User defined | `student` | Portal Only | Create/View tickets, Dashboard |
| **TPC** | 10000001 | tpc@12345 | `tpc` | Portal + API | Manage all tickets, Respond, Update status |
| **Admin** | 10000000 | admin@12345 | `admin` | Portal + API | Full system access, Monitor all queries, View students |

---

## Login Flow (All Roles Use Same Endpoint)

1. **POST** `/api/auth/login`
2. Send `studentId` and `password`
3. Backend verifies credentials against database
4. If credentials match, JWT token is generated with user's role
5. Frontend automatically routes user to appropriate dashboard based on role:
   - `student` → Student Dashboard
   - `tpc` → TPC Dashboard  
   - `admin` → Admin Dashboard

---

## Authentication Response

**Success Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": "507f1f77bcf86cd799439011",
    "studentId": "22123456",
    "name": "John Doe",
    "role": "student"
  }
}
```

**Token contains:**
- userId
- studentId
- role
- Expires in: 7 days (default)

---

## Error Responses

**Invalid Credentials:**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**User Not Found:**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

## Important Notes

1. **Registration**: Only students can register through the portal
2. **TPC & Admin**: Must be created using the seed script
3. **Passwords**: Are hashed using bcrypt before storage
4. **Token Expiry**: JWT tokens expire in 7 days
5. **Role-Based Routing**: Frontend automatically shows different dashboards based on user role
6. **NavBar**: Shows user role badge (Student, TPC Department, or Admin)

---

## Quick Start Commands

### Setup Backend
```bash
cd backend
npm install
cp .env.example .env
# Update .env with MongoDB connection string
node scripts/seedAdminUsers.js  # Create TPC and Admin users
npm start  # or npm run dev
```

### Setup Frontend
```bash
cd frontend
npm install
npm start
```

### Access URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Login Page**: http://localhost:3000/login
- **Register Page**: http://localhost:3000/register

### Test Logins
```
Student Login:     studentId: 22123456, password: password123 (register first)
TPC Login:         studentId: 10000001, password: tpc@12345
Admin Login:       studentId: 10000000, password: admin@12345
```
