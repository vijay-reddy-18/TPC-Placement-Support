# 🎓 TPC Support System Architecture & Presentation Guide 🎓

This document provides a comprehensive overview of the **TPC Support System** architecture, data flow, features, and technical details. Use this guide to explain the system during your presentation tomorrow.

---

## 🏗️ System Overview

The TPC (Training and Placement Cell) Support System is an enterprise-grade ticketing and support platform designed for a university or college environment. It bridges the communication gap between students and the placement cell.

### Core Architecture
*   **Frontend:** React.js single-page application using modern UI components, Context API (Theme, Auth), and a custom Design System built with CSS variables.
*   **Backend:** Node.js + Express.js REST API.
*   **Database:** MongoDB via Mongoose ODM.
*   **Authentication:** JWT (JSON Web Tokens) with hashed passwords (bcrypt).

### Role-Based Access Control (RBAC)
The system is divided into three distinct portals based on the user session:
1.  **Student Portal:** For end-users to raise and track support tickets.
2.  **TPC Portal:** For the placement cell staff to resolve tickets and manage queues.
3.  **Admin Portal:** For system administrators to manage users, settings, and monitor system health.

---

## 🚀 Ticket Lifecycle (The Core Workflow)

### 1. Creation (Student)
1.  **Request:** A student navigates to the **Raise Ticket** page in the Student Portal.
2.  **Input:** They provide a Title, Category (e.g., Placement Drive, Mock Interview), Priority, and Description.
3.  **Backend Action:** The `ticketController.createTicket` handles the POST request. It assigns the `studentId` from the active JWT token, sets the initial status to `open`, and logs the creation action in the `activityLog`. The ticket is saved to MongoDB.

### 2. Fetching & Routing (TPC)
1.  **Queue Management:** A TPC member logs into their dashboard. The system fetches tickets from the backend (`ticketAPI.getPendingTickets`).
2.  **Claiming/Assignment:** TPC staff can pick up `open` tickets. This calls the `ticketController.assignTicket` endpoint, updating the ticket's `assignedTo` field to the TPC member's ID and changing the status to `in-progress`.
3.  **Real-time Board:** The TPC Dashboard features Kanban-style columns (New Queries, In Progress, Resolved) updating dynamically to reflect changes.

### 3. Resolution & Communication (TPC & Student)
1.  **Messaging:** The TPC member can communicate with the student via the Ticket Detail View. Messages are pushed to the `responses` array in the MongoDB Ticket document.
2.  **Internal Notes:** Staff can add private notes (visible only to TPC/Admin) using the `internalNotes` array.
3.  **Closure:** The TPC member provides a resolution message and marks the ticket as `resolved`. The `resolvedAt` timestamp is recorded, halting the SLA timer.

### 4. Oversight (Admin)
1.  **Global View:** Admins have a bird's-eye view of all tickets, regardless of assignment.
2.  **Analytics:** The Admin dashboard computes average resolution times, SLA breaches, and agent performance actively reading from the entire MongoDB collection.

---

## ⏱️ SLA Engine (Service Level Agreement)

The SLA system ensures tickets are resolved within an acceptable timeframe.

### How it Works:
1.  **Threshold Setup:** Admins configure standard resolution times in the **System Settings** engine (e.g., High Priority = 4 hours, Normal = 24 hours).
2.  **Calculation:** The backend `adminSettingsController` and dedicated analytics endpoints calculate the time between `createdAt` and `resolvedAt`.
3.  **Status Badges:** Wait times are continuously evaluated. Tickets exceeding the SLA limits are flagged with `slaStatus: 'breached'` or `at-risk`.
4.  **Reporting:** The TPC Manager and Admin dashboards highlight breached tickets, allowing them to prioritize or reassign them to prevent further delays.

---

## 🔍 Feature Breakdown by Dashboard

### 🎓 1. Student Portal (The End-User Experience)
*   **Modern UI:** A clean, responsive sidebar layout with quick action cards.
*   **My Tickets:** Data tables showing all historical and current tickets with color-coded status badges (Open, In-Progress, Resolved).
*   **Live Notifications:** Real-time bell icon (polled via API) alerts the student of ticket updates and system announcements.
*   **Knowledge Base (FAQ):** A searchable directory of published help articles.
*   **Resolver Transparency:** When a ticket is resolved, students see a "Resolver Profile Card" showing exactly which TPC member handled their case.

### 💼 2. TPC Portal (The Agent Experience)
*   **Kanban Workflow:** Visual boards separating tickets by state (Incoming, Active, Resolved).
*   **Detailed Ticket View:** split-screen layout offering immediate context. It shows the primary issue on one side, and threaded conversation, internal notes, and student history on the other.
*   **SLA Monitor Panel:** A dedicated page strictly for tracking time-sensitive and escalated tickets.
*   **Team Workload:** A view allowing staff to see what their peers are currently handling to avoid duplication.
*   **Analytics Tab:** Personal performance metrics (average resolve time, total handled).

### ⚙️ 3. Admin Dashboard (The Command Center)
*   **System Settings Engine:** A dynamic configuration panel to change the Application Name, Logo, Theme, Timezones, and Ticket Categories on the fly. Settings are stored in a dedicated `SystemSettings` MongoDB collection and broadcast globally to the frontend.
*   **User Management:** Centralized control to create, ban, or modify roles for Students and TPC staff.
*   **Knowledge Base Controls:** A full Markdown editor allowing admins to create, draft, and publish global help articles.
*   **Broadcast Engine:** The ability to push instant system notifications to all users, specific roles, or individuals.
*   **Comprehensive Analytics:** Rich charts (powered by Chart.js) visualizing daily ticket volumes, department distribution, agent performance, and system health.
*   **Audit Logs:** A security feature tracking sensitive changes across the system.

---

## 🎨 Global UI Engineering Features
*   **Theme Engine:** A robust Light/Dark/System-Auto mode switcher utilizing CSS variables and React Context. It prevents UI flickering and persists state via `localStorage`.
*   **Localization (Multi-Language):** Real-time language switching (English, Hindi, Tamil, Telugu) built into the global Context, translating the UI dynamically.
*   **Quick Settings FAB:** A floating action button providing immediate access to preferences across any route.

## 💾 Core Database Models Overview
1.  `User`: Handles authentication and roles.
2.  `Ticket`: The central entity storing descriptions, arrays of messages/notes, timestamps, and SLA data.
3.  `KnowledgeBase`: Holds article markdown, target audience settings, and publish status.
4.  `Notification`: Tracks individual and broadcast unread/read states.
5.  `SystemSettings`: The global JSON configuration document controlling the application's behavior and UI defaults.

---
**Good luck with your presentation tomorrow!** This system represents a highly structured, scalable, and modern approach to enterprise support.
