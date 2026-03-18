# 🔧 Complete Debugging & Troubleshooting Guide

## ✅ Everything Verified & Fixed

### 1. ✅ Backend Routes Are Defined
**File:** `backend/src/routes/userSettingsRoutes.js`

Routes defined:
```javascript
✓ GET    /user/profile
✓ PUT    /user/profile
✓ PUT    /user/settings
✓ POST   /user/change-password
✓ POST   /user/upload-photo
✓ GET    /user/download-data
✓ DELETE /user/delete-account
```

**Status:** ✅ All routes properly defined with middleware

---

### 2. ✅ Routes Connected in Backend
**File:** `backend/src/app.js`

```javascript
app.use('/api/auth', authRoutes);          ✓ Connected
app.use('/api/tickets', ticketRoutes);     ✓ Connected
app.use('/api/admin', adminRoutes);        ✓ Connected
app.use('/api/user', userSettingsRoutes);  ✓ Connected
```

**Status:** ✅ All routes properly connected

---

### 3. ✅ Frontend API URLs Match Backend
**File:** `frontend/src/services/api.js`

Base URL: `http://localhost:5000/api`

Frontend calls:
```javascript
✓ GET    /user/profile              → /api/user/profile
✓ PUT    /user/profile              → /api/user/profile
✓ PUT    /user/settings             → /api/user/settings
✓ POST   /user/change-password      → /api/user/change-password
✓ POST   /user/upload-photo         → /api/user/upload-photo
✓ GET    /user/download-data        → /api/user/download-data
✓ DELETE /user/delete-account       → /api/user/delete-account
```

**Status:** ✅ All URLs match backend routes

---

### 4. ✅ HTTP Methods Match
**Method Verification:**

| Operation | Backend | Frontend | Status |
|-----------|---------|----------|--------|
| Get Profile | GET | api.get() | ✓ Match |
| Update Profile | PUT | api.put() | ✓ Match |
| Change Password | POST | api.post() | ✓ Match |
| Upload Photo | POST | api.post() | ✓ Match |
| Update Settings | PUT | api.put() | ✓ Match |

**Status:** ✅ All HTTP methods match

---

### 5. ✅ Middleware Configured Properly
**File:** `backend/src/app.js`

Middleware order (CORRECT):
```javascript
1. Request logging middleware              ✓ Added
2. Security (helmet)                       ✓ Added
3. CORS                                    ✓ Added
4. Rate limiting                           ✓ Added
5. express.json() - BODY PARSER            ✓ Added (limit: 10mb)
6. express.urlencoded()                    ✓ Added (limit: 10mb)
7. Cookie parser                           ✓ Added
8. Health check endpoint                   ✓ Added
9. Routes                                  ✓ All registered
10. 404 handler                            ✓ Added with logging
11. Error handler                          ✓ Added (must be last)
```

**Status:** ✅ Middleware order is CORRECT

---

### 6. ✅ Multer Configured for File Uploads
**File:** `backend/src/routes/userSettingsRoutes.js`

```javascript
✓ Storage: Memory storage (base64 encoding)
✓ File size limit: 5MB
✓ Allowed types: JPEG, PNG, GIF, WebP
✓ Form field name: profilePhoto
✓ Route: POST /user/upload-photo with upload.single('profilePhoto')
```

**Status:** ✅ Multer properly configured

---

### 7. ✅ Route Order Is Correct
**Backend Startup Flow:**

```
1. Load environment variables          ✓
2. Initialize Express                  ✓
3. Apply middleware                    ✓
4. Register routes                     ✓ WITH LOGGING
5. 404 handler (after routes)          ✓
6. Error handler (last middleware)     ✓
```

**Status:** ✅ Route order prevents early 404

---

### 8. ✅ Error Handling Added
**Files:**
- `backend/src/middleware/errorHandler.js` - Comprehensive error handling
- `backend/src/app.js` - Error middleware wrapper with logging

**Features:**
```javascript
✓ Handles Mongoose errors
✓ Handles validation errors
✓ Handles JWT errors
✓ Handles multer file upload errors
✓ Logs all errors to console
✓ Returns proper JSON responses
```

**Status:** ✅ Error handling implemented

---

### 9. ✅ Comprehensive Logging Added

**Backend Logging:** `backend/src/app.js`
```javascript
[Timestamp] REQUEST: Method Path
[APP] ✓ Routes registered with names
[404] Route not found: Method URL
[ERROR HANDLER] Error details
```

**Controller Logging:** `backend/src/controllers/userController.js`
```javascript
[updateUserProfile] Request received
[updateUserProfile] User ID: xxx
[changePassword] Request received
[uploadProfilePhoto] Request received
[uploadProfilePhoto] File details
[getUserProfile] Request received
```

**Auth Middleware Logging:** `backend/src/middleware/auth.js`
```javascript
[authMiddleware] Token verified for user: xxx
[authMiddleware] No token provided
[authMiddleware] Token verification failed
```

**Frontend Logging:** `frontend/src/services/api.js`
```javascript
[API] METHOD URL - Token attached / No token found
[API RESPONSE] Status URL
[API ERROR] Status, URL, Method, Message
```

**Status:** ✅ Comprehensive logging for debugging

---

### 10. ✅ Authentication Working
**File:** `backend/src/middleware/auth.js`

Flow:
```javascript
1. Extract token from Authorization header (Bearer xxx)
2. Verify JWT token
3. Attach user info to req.user
4. All user routes require authMiddleware
5. Frontend attaches token automatically in interceptor
```

**Status:** ✅ JWT authentication configured

---

## 🚀 How to Debug Issues Now

### Step 1: Check Backend Console
When you make a request, you'll see:
```
[2026-02-25T10:30:45.123Z] POST /api/user/change-password
  Body: { currentPassword: '...', newPassword: '...' }
[authMiddleware] Token verified for user: 60d5ec49c
[changePassword] Request received
[changePassword] User ID: 60d5ec49c
```

### Step 2: Check Frontend Console
Open browser DevTools (F12) → Console tab:
```
[API] POST /user/change-password - Token attached
[API RESPONSE] 200 /user/change-password
```

### Step 3: Common Issues & Solutions

#### Issue: "Route Not Found"
**Check:**
1. Is backend running? → `PORT 5000`
2. Is token in localStorage? → Check Browser DevTools → Application → Local Storage
3. Is URL correct? → Check frontend API service
4. Did you restart backend after code changes?

**Fix:**
- Restart backend: Go to terminal, Ctrl+C, `npm start`
- Check token expires? → Clear localStorage, login again

#### Issue: "Invalid Token"
**Check:**
1. Backend logs show: `[authMiddleware] Token verification failed`
2. Token is expired or corrupted
3. Wrong JWT_SECRET in .env

**Fix:**
```bash
# Clear browser storage
localStorage.clear()
# Login again
# Check backend console for logs
```

#### Issue: "No File Uploaded" for Photo
**Check:**
1. Is file selected? → Check frontend form
2. Is file < 5MB?
3. Is file format valid? (JPEG, PNG, GIF, WebP)

**Fix:**
- Select a new image
- Check backend logs: `[uploadProfilePhoto] File: { name, size, mimetype }`

#### Issue: "CORS Error"
**Backend console will show:** `[cors] Origin not allowed`

**Fix:** Update `.env`
```
FRONTEND_URL=http://localhost:3000
```
Then restart backend.

---

## 📋 Complete Checklist for Running System

- [ ] Backend running: `npm start` in `/backend`
- [ ] Frontend running: `npm start` in `/frontend`
- [ ] Open browser: `http://localhost:3000`
- [ ] Open DevTools: F12 → Console tab
- [ ] Open backend terminal
- [ ] Go to dashboard → Click Profile in sidebar
- [ ] Try updating profile → Check logs
- [ ] Try uploading photo → Check logs
- [ ] Try changing password → Check logs

**All logs should appear in:**
1. Backend terminal (green logs)
2. Browser console (blue logs)

---

## 🔍 Key Files for Debugging

```
Backend:
├── src/app.js                              ← Routes & middleware order
├── src/routes/userSettingsRoutes.js        ← All user routes
├── src/controllers/userController.js       ← Business logic with logging
├── src/middleware/auth.js                  ← Auth middleware with logging
├── src/middleware/errorHandler.js          ← Error handling

Frontend:
├── src/services/api.js                     ← API calls with logging
├── src/pages/StudentDashboard.js           ← Profile section
├── src/context/AuthContext.js              ← Token management
└── .env (local)                            ← API URL
```

---

## ✅ Summary

### What Was Fixed:
1. ✅ Added comprehensive logging to backend and frontend
2. ✅ Verified all routes are properly defined
3. ✅ Confirmed routes are connected in app.js
4. ✅ Verified middleware order is correct
5. ✅ Guaranteed multer is properly configured
6. ✅ Enhanced error handling with logging
7. ✅ Added request/response logging  
8. ✅ Verified HTTP methods match
9. ✅ Confirmed authentication middleware
10. ✅ Restarted backend with new logging

### Now You Can See:
- Every request hitting backend
- User ID being verified
- File upload details
- Any errors with full context
- Token authentication flow

🎯 **Try it now:** Make a request and check both backend terminal and browser console!
