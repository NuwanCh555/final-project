# Smart Expense Tracker Web System

An advanced, highly-responsive personal finance web application built as an academic final project (Course Code: **HNDIT4052**). 

The system implements the **MERN** (MongoDB, Express, React, Node.js) architecture, styled with **Tailwind CSS v3.x**, and leveraging **Recharts** for premium interactive analytics. It fully complies with the IEEE-compliant Software Requirements Specification (SRS v1.0) and Project Proposal.

---

## 🌟 Premium Multi-Mode Capability

To ensure seamless evaluation and robust delivery, the application features a **dual-mode architecture**:

1. **Seamless Standalone Preview Mode (Zero-Config):**
   * **Purpose:** Runs instantly in any standard browser without needing a local database or server installation.
   * **Mechanism:** Bypasses Axios network requests and utilizes a built-in stateful client-side emulator (`mockApiService.js`). It securely replicates the entire database, user registrations, logins, lockouts, transaction CRUD, dynamic budgeting progress, warnings, and PDF/CSV downloads inside **`localStorage`**.
   * **Evaluation:** Perfect for presenting immediately on the supervisor's system or testing on devices where Node/MongoDB is not configured.
2. **Standard MERN Production Mode:**
   * **Purpose:** Runs as a standard full-stack client-server app, connecting the React client with the Express Node API and MongoDB.
   * **Mechanism:** Change `USE_MOCK = false` inside `frontend/src/services/api.js` to route all operations to the Express backend.

---

## 📁 Project Directory Roadmap

```text
smart-expense-tracker/
├── README.md                          # Central project guide & compliance sheet
├── backend/                           # Express Node API Server
│   ├── package.json                   # Dependencies (express, mongoose, jwt, nodemailer, etc.)
│   ├── server.js                      # Entry point (initializes db, seeds defaults, mounts routing)
│   ├── .env                           # Config settings (PORT, MONGO_URI, JWT_SECRET, SMTP)
│   ├── config/
│   │   └── db.js                      # Mongoose MongoDB connection initializer
│   ├── models/
│   │   ├── User.js                    # User profile, password hashing, lockout checks
│   │   ├── Category.js                # Default system and custom categories schemas
│   │   ├── Transaction.js             # Income/Expense schemas, soft-delete compound indexes
│   │   └── Budget.js                  # Category-specific monthly budget limit bindings
│   ├── middleware/
│   │   ├── authMiddleware.js          # Route token protection and active lockout checker
│   │   └── errorMiddleware.js         # Mongoose validation & database cast error handles
│   ├── controllers/
│   │   ├── authController.js          # Controls password complexity, lockouts, register/login
│   │   ├── categoryController.js      # Controls default category checks and active transaction blocks
│   │   ├── transactionController.js   # Controls transaction CRUD, soft deletion, CSV exports & bulk imports
│   │   └── budgetController.js        # Controls spending limits and SMTP critical email alerts
│   └── routes/
│       ├── authRoutes.js              # Auth routes: /register, /login, /profile
│       ├── categoryRoutes.js          # Custom Category routes: CRUD mapping
│       ├── transactionRoutes.js       # Transaction routes: CRUD, /export, /import mapping
│       └── budgetRoutes.js            # Budget routes: Limit CRUD comparison mapping
│
└── frontend/                          # React Single Page Application (SPA)
    ├── package.json                   # React/Vite dependencies (recharts, lucide, tailwind, etc.)
    ├── index.html                     # Core HTML, metadata, and premium Google Fonts loaders
    ├── vite.config.js                 # Vite bundler configs with Express dev server proxy maps
    ├── tailwind.config.js             # Tailwind CSS customized HSL palettes and glassmorphism styling
    ├── postcss.config.js              # Style loaders config
    └── src/
        ├── main.jsx                   # React DOM mount loader
        ├── index.css                  # Core CSS styles, customized scrollbars, and micro-animations
        ├── App.jsx                    # Primary app router, sidebar, navbar, subpages, and modals
        ├── context/
        │   └── AuthContext.jsx        # JWT session provider with a 30-min inactivity timeout timer
        ├── components/
        │   └── Icons.jsx              # Offline-safe high-performance inline SVG custom icon library
        └── services/
            ├── api.js                 # Unified Axios Client & Mock/Real API router gateway
            └── mockApiService.js      # High-fidelity LocalStorage database mock simulator
```

---

## 🛠️ Complete Setup Guide (Standard MERN Mode)

To run the full stack with Node.js and MongoDB, follow these steps:

### Prerequisites
* Install **Node.js** (v18.x LTS or higher)
* Install **MongoDB** Community Server and make sure the database is running locally on port `27017`

### 1. Backend Server Setup
1. Open your terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Configure the environment variable secrets in `.env` if necessary (e.g. SMTP username/password for Nodemailer alerts).
4. Run the API server:
   ```bash
   npm run dev
   ```
   *The console will display `MongoDB Connected`. On initial boot, it will automatically seed default income/expense categories in the database.*

### 2. Frontend Client Setup
1. Open a new terminal window and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Toggle mock mode off by opening `frontend/src/services/api.js` and changing:
   ```javascript
   const USE_MOCK = false;
   ```
4. Start the Vite React development server:
   ```bash
   npm run dev
   ```
5. Open your web browser and navigate to `http://localhost:3000`.

---

## 🎓 IEEE-Compliant SRS Requirement Checklist

Here is a map of how the codebase matches the requirements defined in your **Software Requirements Specification (SRS)**:

| Requirement ID | Description | Code Implementation Location |
| :--- | :--- | :--- |
| **R-AUTH-2** | Password complexity enforcement (letters, numbers, symbols, capitalization). | `backend/controllers/authController.js:L24-L31`<br>`frontend/src/App.jsx` (Register form validator) |
| **R-AUTH-8** | Account lockout for 15 minutes after 5 consecutive failed login attempts. | `backend/models/User.js:L49-L51` (lockout checker)<br>`backend/controllers/authController.js:L109-L135` |
| **R-INC-7** / **R-EXP-7** | Support soft deletion for transaction records. | `backend/models/Transaction.js:L42-L49` (`isDeleted` flag)<br>`backend/controllers/transactionController.js:L196-L224` |
| **R-INC-8** | Prevent double submissions/duplicate entries within a 5-minute window for identical category/amount. | `backend/controllers/transactionController.js:L100-L119`<br>`frontend/src/services/mockApiService.js:L285-L300` |
| **R-INC-9** / **R-EXP-11** | Bulk export transaction ledgers to downloadable CSV format. | `backend/controllers/transactionController.js:L226-L255`<br>`frontend/src/services/api.js:L133-L151` |
| **R-EXP-9** | Bulk import transactions from CSV statement templates. | `backend/controllers/transactionController.js:L257-L330` (Mongoose)<br>`frontend/src/App.jsx:L780-L824` (CSV parser) |
| **R-CAT-3** | Block custom category deletion if active transactions are associated with it. | `backend/controllers/categoryController.js:L142-L162`<br>`frontend/src/services/mockApiService.js:L237-L245` |
| **R-BUD-4** / **R-BUD-5** | Auto-trigger warning notifications (at 80%) and critical email alerts via Nodemailer (at 100%). | `backend/controllers/budgetController.js:L192-L302`<br>`frontend/src/App.jsx:L143-L177` (visual warnings) |
| **R-SEC-8** | Session timeout and automated logout after 30 minutes of user inactivity. | `frontend/src/context/AuthContext.jsx:L28-L61` (mouse/key hooks)<br>`frontend/src/App.jsx:L1160-L1177` (timeout indicator) |
| **Accessibility** | Conform to WCAG 2.1 contrast ratios and touch-targets (44x44px min). | `frontend/index.html` (SEO tag headers)<br>`frontend/tailwind.config.js` (colors/contrast ratios) |

---

### Project Credits
**Prepared by:** M.C. Nuwan (RAT/IT/2324/F/0055)  
**Academic Evaluator Supervisor:** Mr. Thilina Bandara  
**Department of Information Technology, Advanced Technological Institute, Rathnapura.**
