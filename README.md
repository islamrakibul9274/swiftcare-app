-----

# 🏥 SwiftCare - Modern Behavioral Health Practice Management Platform

A high-performance, responsive **Next.js 16** application designed for seamless clinical data and practice management. This project features a polished, glassmorphic user interface, strict role-based authentication, and a robust architecture for real-time behavior tracking, AI-assisted clinical notes, and billing management.

## 🚀 Live Links

  * **Production Application (Vercel):** [https://swiftcare-app.vercel.app/](https://swiftcare-app.vercel.app/)

-----

## ✨ Key Features

### 👤 Clinical Staff (RBT & BCBA) Features

  * **Role-Based Portals:** Dedicated dashboard views customized for Technicians (RBTs) and Clinical Directors (BCBAs).
  * **AI-Assisted Workflows:** Integration with Groq API for rapid, compliant clinical note generation and drafting.
  * **Behavior Graphs:** Real-time data visualization and tracking for client progress.
  * **Session Management:** Streamlined daily data collection and note approval pipelines.

### 🛠 Admin Features

  * **Centralized Dashboard:** Comprehensive overview of clinic operations, billing, and staff metrics.
  * **Staff Management:** Secure access provisioning and role assignment for new employees.
  * **Billing & Claims:** Financial ledger interfaces for tracking clinic revenue and claim statuses.
  * **Strict Route Protection:** Edge-compatible middleware ensures rock-solid security, instantly verifying JWTs and preventing unauthorized portal access.

-----

## 💻 Tech Stack

**Frontend & Framework:**

  * Next.js 16 (App Router & Turbopack)
  * React.js & TypeScript
  * Tailwind CSS (Styling & Glassmorphism)
  * Recharts (Data Visualization)

**Backend & Database:**

  * Next.js Server Actions & API Routes
  * MongoDB Atlas (Database)
  * Mongoose (ODM)
  * Auth.js / NextAuth v5 (Security & JWT)
  * BcryptJS (Password Hashing)
  * Groq API (AI Integration)

-----

## 🛠 Local Setup Instructions

### 1\. Prerequisites

  * Node.js (v18 or higher)
  * MongoDB Atlas account
  * Groq API Key

### 2\. Clone the Repository

```bash
git clone https://github.com/islamrakibul9274/swiftcare-app.git
cd swiftcare-app
```

### 3\. Install Dependencies

```bash
npm install
```

### 4\. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Database Configuration
MONGODB_URI=your_mongodb_connection_string

# Authentication (Auth.js v5)
AUTH_SECRET=your_generated_secret_key
AUTH_URL=http://localhost:3000
AUTH_TRUST_HOST=true

# AI Integration
GROQ_API_KEY=your_groq_api_key
```

### 5\. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) with your browser to see the result.

-----

## ⚙️ Production Deployment

This application is fully optimized for edge deployment on Vercel. The custom NextAuth v5 middleware and Server Actions ensure secure, fast, and reliable performance in a serverless environment.

-----

## 👤 Author

**Rakibul Islam Rumel**

  * GitHub: [@islamrakibul9274](https://www.google.com/search?q=https://github.com/islamrakibul9274)

-----