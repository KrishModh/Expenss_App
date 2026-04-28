<div align="center">

# 💰 TrackMint — Smart Expense Tracker

**Track every rupee. Save more. Stress less.**

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![MIT License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

> A full-stack personal finance app with INR support, budget tracking, OAuth, and CSV export — all in one clean dashboard.

**[🚀 Live Demo](https://trackminttt.vercel.app)** &nbsp;·&nbsp; **[📁 Report Bug](https://github.com/KrishModh/Expenss_App/issues)** &nbsp;·&nbsp; **[✨ Request Feature](https://github.com/KrishModh/Expenss_App/issues)**

</div>

---
<!-- fixing -->
## 📸 Screenshots

| Dashboard | Expenses |
|-----------|----------|
|<img width="2560" height="1440" alt="Dashboard" src="https://github.com/user-attachments/assets/fed6aa11-5865-48d9-a0c9-56e280c544ba" /> | <img width="2560" height="1440" alt="Expenses" src="https://github.com/user-attachments/assets/f5370765-5e57-42eb-8229-7aae1c80c56f" /> |

| Income | Profile |
|--------|---------|
| <img width="2560" height="1440" alt="Income" src="https://github.com/user-attachments/assets/b7388caf-9312-472d-ab65-74363a010db8" /> | <img width="2560" height="1440" alt="Profile" src="https://github.com/user-attachments/assets/27d384c7-f3a1-46a9-a996-f05987d54dad" /> |

---

## ✨ What Can It Do?

| Feature | Description |
|--------|-------------|
| 🔐 **Auth System** | Signup, Login with JWT + Google OAuth email verification |
| 🔑 **Forgot Password** | Reset password via Google account verification |
| 💸 **Expense Tracking** | Add, edit, delete — with category & date filters |
| 💵 **Income Tracking** | Track income by payment method & date |
| 📊 **Smart Dashboard** | Live budget, income, expense & balance summary |
| 🏦 **Payment Breakdown** | Cash · UPI · Card · Online · Bank |
| 📅 **Date Range Filter** | From–To date filtering on all records |
| 📤 **CSV Export** | Download filtered income & expense reports |
| 🎯 **Budget Alerts** | Monthly progress bar with overspend warnings |
| 🇮🇳 **INR Formatting** | Full Indian number system (₹1,00,000) |
| 🖼️ **Profile Photo** | Cloudinary-powered profile picture upload |
| 📱 **Fully Responsive** | Works perfectly on mobile & desktop |

---

## 🛠️ Tech Stack

```
┌─────────────┬────────────────────────────────────────┐
│  Layer       │  Technology                             │
├─────────────┼────────────────────────────────────────┤
│  Frontend    │  React + Vite                           │
│  Backend     │  Node.js + Express                      │
│  Database    │  MongoDB + Mongoose                     │
│  Auth        │  JWT + Google OAuth                     │
│  Images      │  Cloudinary                             │
│  Currency    │  INR (₹) via Intl.NumberFormat          │
│  Styling     │  Modular CSS (Glassmorphism UI)          │
└─────────────┴────────────────────────────────────────┘
```

---

## 📂 Folder Structure

```
Expense-Tracker/
├── frontend/
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── pages/          # Route-level pages
│       ├── hooks/          # Custom React hooks
│       ├── services/       # API call functions
│       ├── styles/         # Modular CSS files
│       └── utils/          # Helper utilities
│
├── backend/
│   ├── controllers/        # Business logic
│   ├── routes/             # API route definitions
│   ├── models/             # Mongoose schemas
│   ├── middleware/         # Auth & error middleware
│   ├── config/             # DB & service configs
│   └── utils/              # Backend utilities
│
└── README.md
```

---

## ⚡ Getting Started

### 1. Clone the Repo

```bash
git clone https://github.com/yourusername/trackmint.git
cd trackmint
```

### 2. Backend Setup

```bash
cd backend
npm install
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

> Frontend runs on Vite dev server · Backend runs on configured Express port

---

## 🔑 Environment Variables

### `backend/.env`

```env
PORT=
MONGO_URI=
JWT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLIENT_URL=
```

### `frontend/.env`

```env
VITE_API_URL=
VITE_GOOGLE_CLIENT_ID=
VITE_CURRENCY=INR
VITE_CLOUDINARY_UPLOAD_URL=
```

> ⚠️ Never hardcode secrets. Always use `.env` files and add them to `.gitignore`.

---

## 🔌 API Reference

<details>
<summary><b>🔐 Auth Routes</b></summary>

```
POST  /api/auth/signup
POST  /api/auth/login
GET   /api/auth/me
GET   /api/auth/check-username/:username
POST  /api/auth/forgot-password
POST  /api/auth/verify-reset-account
POST  /api/auth/reset-password
```
</details>

<details>
<summary><b>💸 Expense Routes</b></summary>

```
GET    /api/expenses
POST   /api/expenses
PUT    /api/expenses/:id
DELETE /api/expenses/:id
```
</details>

<details>
<summary><b>💵 Income Routes</b></summary>

```
GET    /api/income
POST   /api/income
PUT    /api/income/:id
DELETE /api/income/:id
```
</details>

<details>
<summary><b>🎯 Budget & Profile Routes</b></summary>

```
GET  /api/budget
POST /api/budget/set
GET  /api/user/profile
PUT  /api/user/profile
```
</details>

---

## 🔒 Security Highlights

- ✅ JWT-based route protection (frontend + backend)
- ✅ Google OAuth for email verification & password reset
- ✅ Strong password hashing (bcrypt)
- ✅ All secrets stored in environment variables
- ✅ No currency symbols stored in DB — only numeric values

---

## 🗺️ How It Works

```
1. 📝  Sign up with name, username, email & password
2. 📧  Verify email via Google OAuth
3. 🔐  Log in securely — JWT issued
4. ➕  Add income & expenses with categories, methods & dates
5. 📊  Dashboard auto-calculates budget, balance & totals
6. ⚠️  Budget progress bar warns when spending exceeds limit
7. 🔍  Filter records by date range & payment method
8. 📤  Export filtered data as CSV reports
9. 🖼️  Update profile photo via Cloudinary upload
```

---

## 🚀 Upcoming Features

- [ ] 🌙 Enhanced dark mode customization
- [ ] 🔔 Budget & spending push notifications
- [ ] 📱 Mobile app (React Native)
- [ ] 🤖 AI-powered spending insights
- [ ] 🔁 Recurring income & expense support
- [ ] 📈 Advanced analytics & monthly comparisons

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

## 👨‍💻 Author

**Krish Modh**

*Building useful things, one commit at a time.*

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/krish-modh-b38447300)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/KrishModh)

---

⭐ **If TrackMint helped you, drop a star on GitHub — it means a lot!** ⭐

</div>
