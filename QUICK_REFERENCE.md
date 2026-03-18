# 🚀 Quick Reference & Commands

## Starting the Application

### Terminal 1: Backend
```bash
cd c:\Users\hp\CAAAAA\backend
npm start
```
Expected output:
```
[APP] Registering routes...
[APP] ✓ Auth routes registered
[APP] ✓ Ticket routes registered
[APP] ✓ Admin routes registered
[APP] ✓ User settings routes registered
✅ Server running on http://localhost:5000
```

### Terminal 2: Frontend
```bash
cd c:\Users\hp\CAAAAA\frontend
npm start
```
Expected output:
```
Server is running on http://localhost:3000
```

---

## 📱 Testing Student Profile Features

### 1. Access Student Dashboard
- URL: `http://localhost:3000/dashboard`
- Login with a student account

### 2. Go to Profile Section
- Left sidebar → Click "Profile"

### 3. Upload Profile Photo
```
Step 1: Click "Choose Photo"
Step 2: Select an image (JPEG, PNG, GIF, WebP)
Step 3: Click "Upload Photo"
Expected: Success message + Photo appears
```

Backend logs should show:
```
[uploadProfilePhoto] Request received
[uploadProfilePhoto] User ID: 60d5ec49c
[uploadProfilePhoto] File: { name: 'image.jpg', size: 54321, mimetype: 'image/jpeg' }
```

### 4. Edit Profile Information
```
Step 1: Click "Edit" button
Step 2: Change name, email, mobile, student email
Step 3: Click "Save Changes"
Expected: Success message + Data saved to MongoDB
```

Backend logs should show:
```
[updateUserProfile] Request received
[updateUserProfile] User ID: 60d5ec49c
[updateUserProfile] Body: { name: '...', email: '...', ... }
```

### 5. Change Password (in Settings)
```
Step 1: Go to Settings → Security Settings
Step 2: Enter current password
Step 3: Enter new password (minimum 6 characters)
Step 4: Confirm new password
Step 5: Click "Update Password"
Expected: Success message + Password changed in MongoDB
```

Backend logs should show:
```
[changePassword] Request received
[changePassword] User ID: 60d5ec49c
```

---

## 🔍 Viewing Logs

### Backend Logs (Terminal running backend)
```
Every request shows:
[TIMESTAMP] METHOD /path
Request body (if POST/PUT)
Authentication verification
Controller method name
Database operations
```

### Frontend Logs (Browser Console)
```
F12 → Console tab

Shows:
[API] REQUEST details
[API RESPONSE] Status code
[API ERROR] Error details if any
```

---

## 🐛 Debugging Checklist

When something doesn't work:

1. **Check Backend Terminal**
   - Do you see the request logged?
   - Are there any error messages?
   - Is authentication working?

2. **Check Browser Console** (F12)
   - Any red error messages?
   - Is token being sent?
   - What's the error response?

3. **Check Network Tab** (F12 → Network)
   - Click the failed request
   - Check "Headers" → Authorization
   - Check "Response" → Error message

4. **Common Commands**
   ```bash
   # Stop backend
   Ctrl+C (in backend terminal)
   
   # Restart backend
   npm start
   
   # Stop frontend
   Ctrl+C (in frontend terminal)
   
   # Restart frontend
   npm start
   
   # Clear browser storage
   localStorage.clear() in console
   location.reload()
   ```

---

## 📊 Database Actions

All student profile changes save to MongoDB:

```
Profile Updates    → User collection
Profile Photo      → User collection (base64)
Password Changes   → User collection (hashed)
Settings Changes   → User collection
```

To verify in MongoDB:
```javascript
// In MongoDB shell or compass
db.users.findOne({ _id: ObjectId('...') })
// Shows all profile data including profilePhoto
```

---

## ✅ Troubleshooting Quick Fixes

### "Route Not Found" Error
```
1. Restart backend: Ctrl+C, npm start
2. Wait for "✓ User settings routes registered"
3. Try again
```

### "Invalid Token" Error
```
1. Open DevTools (F12)
2. localStorage.clear()
3. location.reload()
4. Login again
5. Try the operation again
```

### Profile Photo Not Uploading
```
1. Select a different image (< 5MB)
2. Make sure it's JPEG, PNG, GIF, or WebP
3. Check browser console for error message
4. Restart backend if error persists
```

### Changes Not Saving
```
1. Check internet connection
2. Verify token in localStorage
3. Check if database is connected
4. Look for errors in backend logs
5. Restart backend
```

---

## 🎯 Success Indicators

✅ Everything working when you see:

**Backend Terminal:**
```
[updateUserProfile] Request received
[updateUserProfile] User ID: 60d5ec49c
[updateUserProfile] Body: { name: 'John Doe', ... }
✅ Profile updated successfully
```

**Browser Console:**
```
[API] PUT /user/profile - Token attached
[API RESPONSE] 200 /user/profile
```

**User Interface:**
```
Green success message
Data updates immediately
No error messages
```

---

## 📞 Need to Reset Everything?

```bash
# Option 1: Just restart services
### Terminal 1 (Backend)
Ctrl+C
npm start

### Terminal 2 (Frontend)  
Ctrl+C
npm start

# Option 2: Clear everything and restart
### Browser
F12 → Application → Storage → Clear All
URL: http://localhost:3000/login
Login again

### Backend terminal: npm start
### Frontend terminal: npm start
```

---

## 📝 Notes

- All data persists to MongoDB
- Profile photos stored as base64 strings
- Passwords always hashed with bcrypt
- Tokens expire after a certain time
- Each request logged for debugging
- Check both terminal and browser console logs

🎉 **You're all set to debug and test!**
