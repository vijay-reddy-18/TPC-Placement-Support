# Email Notification System - Setup & Implementation Guide

## 🎯 Overview

Your TPC Support System now has a **professional email notification system** that:
- ✅ Sends emails when tickets are created
- ✅ Sends emails when tickets are resolved
- ✅ Respects user notification preferences
- ✅ Uses professional HTML templates from Placement Department

---

## 📋 What We Implemented

### Backend Changes:

1. **Created Email Service** (`src/utils/emailService.js`)
   - Uses Nodemailer with Gmail SMTP
   - Sends emails with professional formatting
   - Logs all email transactions

2. **Created Email Templates** (`src/utils/emailTemplates.js`)
   - Professional HTML templates
   - Branded as "Placement Department"
   - Responsive design for all devices
   - Three templates:
     - `ticketCreatedTemplate` - When ticket is created
     - `ticketSolvedTemplate` - When ticket is resolved
     - `ticketUpdatedTemplate` - For other updates

3. **Updated Ticket Controller** (`src/controllers/ticketController.js`)
   - Added email sending on ticket creation
   - Added email sending on ticket resolution
   - Checks user's `emailNotifications` setting before sending
   - Gracefully handles email failures (doesn't break ticket creation)

4. **Updated User Controller** (`src/controllers/userController.js`)
   - Updated `getUserProfile()` to return notification settings
   - `updateUserSettings()` already handles notification preferences

5. **Updated .env Configuration**
   - Added email service credentials

### Frontend Changes:

1. **Updated StudentDashboard.js**
   - Added useEffect to fetch settings on mount
   - Settings toggle now reflects actual database state
   - `handleSettingChange()` updates backend when toggle changes

2. **UI Already Exists**
   - Email Notifications toggle in Settings → Notification Preferences
   - Switch properly connected to backend

---

## 🔧 SETUP STEPS (IMPORTANT!)

### Step 1: Configure Gmail Email Account

You need Gmail with App-Specific Password (NOT your regular Gmail password):

1. **Enable 2-Factor Authentication** on your Google Account
2. **Generate App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Google will generate a 16-character password
   - Copy this password

3. **Update .env file** at `backend/.env`:

```env
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_16_character_app_password
EMAIL_FROM_NAME=Placement Department
```

**Example:**
```env
EMAIL_USER=placement.dept@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
EMAIL_FROM_NAME=Placement Department
```

### Step 2: Restart Backend Server

After updating .env:

1. Stop the current backend server (Ctrl+C)
2. Run: `npm run dev`
3. Check logs for: `✅ Server running on http://localhost:5000`

---

## 🧪 TESTING THE EMAIL SYSTEM

### Test Case 1: Create Ticket with Email Notifications ON

1. **Login as Student**
2. **Go to Settings** → Turn ON "Email Notifications"
3. **Create a Ticket**:
   - Title: "Test Ticket 1"
   - Description: "Testing email notification"
   - Category: "placement"
   - Priority: "medium"
4. **Check Email**:
   - You should receive an email from "Placement Department"
   - Subject: "Ticket Created - Placement Department"
   - Contains ticket title and professional message

**Example Email Body:**
```
Placement Department
TPC Support System

Dear [Your Name],

Your support ticket "Test Ticket 1" has been successfully created.

Our Placement Department team has received your request and we will resolve 
your issue as soon as possible.

Ticket ID: [ticket_id]

Thank you for your patience. You can track your ticket status in your dashboard.

Best Regards,
Placement Department
TPC Support System
```

### Test Case 2: Create Ticket with Email Notifications OFF

1. **Login as Student**
2. **Go to Settings** → Turn OFF "Email Notifications"
3. **Create a Ticket**
4. **Check Email**:
   - ❌ You should NOT receive any email
   - Backend logs will show the notification setting was false

### Test Case 3: Ticket Resolution Email

1. **Login as Admin**
2. **Go to Admin Dashboard** → Find a ticket
3. **Update Status to "Resolved"**
4. **Student receives email** (if notifications are ON):
   - Subject: "Ticket Resolved - Placement Department"
   - Contains resolution confirmation message

---

## 🔍 VERIFICATION CHECKLIST

- [ ] Backend .env has EMAIL_USER and EMAIL_PASS
- [ ] Backend restarted after .env changes
- [ ] Email Notifications toggle is visible in StudentDashboard Settings
- [ ] Created a test ticket
- [ ] Check email inbox for "Ticket Created - Placement Department"
- [ ] Toggle OFF email notifications
- [ ] Create another ticket
- [ ] No email received
- [ ] Toggle ON notifications
- [ ] Ask admin to resolve a ticket
- [ ] Check email for "Ticket Resolved - Placement Department"

---

## 📧 BACKEND LOGS TO WATCH

When everything works, you'll see logs like:

```
[TICKET CREATED EMAIL] Sent to vijayreddy@lpu.in, Ticket: 698db70f35ba70fda4edf9bb
[EMAIL SENT] To: vijayreddy@lpu.in, Subject: Ticket Created - Placement Department
```

**If emails fail**, you'll see:
```
[TICKET EMAIL ERROR] Error message details...
[EMAIL ERROR] {to, subject, error}
```

---

## 🐛 TROUBLESHOOTING

### Email Not Sending?

1. **Check Gmail credentials**:
   ```bash
   # Test in backend terminal
   node --eval "console.log(process.env.EMAIL_USER)"
   ```

2. **Check .env file exists** and has credentials:
   ```bash
   cat backend/.env
   ```

3. **Restart backend** after any .env changes:
   ```bash
   # Kill backend (Ctrl+C)
   npm run dev
   ```

4. **Check backend logs** for email errors:
   ```
   [EMAIL ERROR] - look for this in terminal
   ```

### Gmail App Password Issues?

- Make sure 2FA is enabled on Gmail
- Generate a NEW app password
- Don't use your regular Gmail password
- Use 16-character password without spaces: `abcdefghijklmnop`

### Email Coming from Wrong Sender?

- Update EMAIL_FROM_NAME in .env
- Restart backend
- Try again

---

## 📊 Database Fields

When you toggle a setting, this is saved in User model:

```javascript
{
  emailNotifications: true/false,
  smsNotifications: true/false,
  pushNotifications: true/false,
  twoFactorAuth: true/false,
  privateProfile: true/false
}
```

---

## 🚀 WORKFLOW IN ACTION

### Student Flow:

1. Student logs in
2. Goes to Settings
3. Toggles Email Notifications
4. Backend saves: `emailNotifications: true/false`
5. Student creates a ticket
6. Backend checks `emailNotifications` flag
7. If TRUE → sends email
8. If FALSE → skips email (ticket still created)

### Admin/TPC Flow:

1. Admin logs in to Admin Dashboard
2. Finds student's open ticket
3. Marks ticket as "Resolved"
4. Backend checks student's `emailNotifications`
5. If TRUE → sends resolution email
6. Student receives professional email

---

## ✅ FINAL CHECKLIST

- [x] nodemailer installed
- [x] emailService.js created
- [x] emailTemplates.js created
- [x] ticketController updated
- [x] userController updated
- [x] .env configured with placeholder values
- [x] Frontend fetches settings on mount
- [x] Frontend toggle connected to backend
- [x] Settings persisted in database

---

## 📝 FILES MODIFIED/CREATED

**Created:**
- `backend/src/utils/emailService.js` - Email sending utility
- `backend/src/utils/emailTemplates.js` - HTML email templates

**Modified:**
- `backend/src/controllers/ticketController.js` - Added email logic
- `backend/src/controllers/userController.js` - Return settings in profile
- `backend/.env` - Added email credentials
- `frontend/src/pages/StudentDashboard.js` - Fetch settings on mount

---

## ⚠️ IMPORTANT NOTES

1. **App-Specific Password**: Use Gmail's app-specific password, NOT your real Gmail password
2. **Email Delays**: Gmail may take 1-2 seconds to send
3. **Testing**: Use your own email or test account
4. **Production**: For production, use your organization's email service (Outlook, custom SMTP, etc)

---

## 🎉 YOU'RE DONE!

Your email notification system is now fully integrated and ready to use. Just configure your Gmail credentials and you're good to go!

For any issues, check the backend logs for `[EMAIL SENT]` or `[EMAIL ERROR]` messages.
