# 🍕 SliceCraft — Production-Grade Pizza Delivery & Inventory Management Platform

An end-to-end full-stack MERN application built with real-time Socket.IO synchronization, strict server-side price & stock verification, atomic inventory deduction, Razorpay payment gateway integration, automated low-stock email alerts via `node-cron`, and dedicated customer and super-admin operations portals.

---

## 🏗️ Architectural Overview & System Flow

```
                                  ┌────────────────────────┐
                                  │      Client (Vite)     │
                                  │  React 18 + Tailwind   │
                                  └───────────┬────────────┘
                                              │
                     HTTP / REST (Axios)      │      WebSockets (Socket.IO)
                     JWT Auth / CORS / Helmet │      Bidirectional Rooms
                                              │
                                  ┌───────────▼────────────┐
                                  │     Server (Express)   │
                                  │   Node.js v24 + Cron   │
                                  └─────┬────────────┬─────┘
                                        │            │
             Mongoose / Atomic Operations       Nodemailer (Ethereal/SMTP)
             Transaction Audit Logs             Low-stock Alerts & Auth Emails
                                        │            │
                                  ┌─────▼──────┐  ┌──▼───────────┐
                                  │  MongoDB   │  │ Razorpay API │
                                  │ (Port27017)│  │ (HMAC SHA256)│
                                  └────────────┘  └──────────────┘
```

---

## 🌟 Key Platform Features

### 1. 🔐 Multi-Role Authentication & Security
* **Customer Sign-in & Registration:** Bcrypt password hashing, secure token generation, email verification via Nodemailer with token expiration.
* **Dedicated Admin Authentication:** Separate endpoint (`/api/auth/admin/login`) with strict role guards (`requireAdmin` middleware) and separate portal UI.
* **Password Reset Workflow:** Secure random crypto hex tokens with 1-hour validity and HTML email dispatch.
* **API Security Hardening:** Helmet protection, rate limiting, and origin validation.

### 2. 🍕 Pizza Catalog & Custom Pizza Builder
* **Preset Artisanal Catalog:** 8 signature pizzas with categorization (Veg, Non-Veg, Specialty, Gourmet), search bar, and dynamic price sorting.
* **Custom Pizza Builder (Wizard):**
  * **5 Handcrafted Crusts:** Classic Hand Tossed, Thin & Crispy, Cheese Burst, Whole Wheat Multigrain, Gluten-Free Cauliflower.
  * **5 Signature Sauces:** Classic San Marzano, Spicy Arrabbiata, Creamy Garlic Alfredo, Smoky BBQ, Pesto Genovese.
  * **4 Artisan Cheeses:** Gourmet Mozzarella, Aged White Cheddar, Smoked Gouda, Quad-Formaggi Blend.
  * **8 Fresh Vegetables:** Bell Peppers, Button Mushrooms, Red Onions, Pickled Jalapeños, Black Olives, Sweet Corn, Baby Spinach, Cherry Tomatoes.
* **Visual Interactive Pizza Preview:** Live layer stacking visualizer with automatic price accumulator and out-of-stock validation.

### 3. 💳 Secure Order Flow & Razorpay Payments
* **Zero Client Trust:** Prices and stock availability are strictly recalculated and verified against authoritative MongoDB inventory records before order creation.
* **Razorpay Test Integration:** Server-side HMAC SHA256 cryptographic signature validation.
* **Instant Sandbox Simulator:** Local test mode allowing instant sandbox verification for prototyping.

### 4. 📦 Atomic Inventory Management & Audit Log
* **Race Condition Prevention:** Stock deduction executes via atomic `$inc: { quantity: -qty }` operations.
* **Immutable Audit Trail:** Every consumption, restock, or adjustment creates an `InventoryTransaction` log.

### 5. 🛡️ Admin Operations & Live Kitchen Board
* **Real-Time Order Queue:** Interactive kitchen board with customer contact info, custom ingredient recipes, and live status buttons (`Order Received` ➔ `In Kitchen` ➔ `Sent to Delivery` ➔ `Delivered`).
* **Bidirectional WebSocket Sync:** When an admin changes an order status, the customer's live tracking timeline updates instantly without page reload.
* **Inventory & Quick-Restock Hub:** Live stock level meters, low-stock threshold indicators, and instant `+Restock` modal.

### 6. ⏰ Automated Low-Stock Watchdog (`node-cron`)
* Background cron job running every 30 minutes scanning all 22 ingredients.
* Automatically drafts and dispatches high-visibility HTML alert emails to store managers when stock $le$ threshold.

---

## 🔑 Pre-Seeded User Credentials

| Role | Email | Password | Access Portal |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@slicecraft.com` | `Admin@123456` | `http://localhost:5173/admin/login` |
| **Verified Customer** | `customer@slicecraft.com` | `Customer@123456` | `http://localhost:5173/login` |

---

## 🛠️ Tech Stack

* **Frontend:** React 18, Vite, Tailwind CSS, Lucide React, React Router v6, React Hot Toast, Socket.IO Client, Axios.
* **Backend:** Node.js, Express, Socket.IO, Nodemailer, node-cron, Mongoose (MongoDB ODM), Razorpay SDK, Crypto, Helmet, Morgan, Express-Rate-Limit.
* **Database:** MongoDB Community Server (port 27017).

---

## 🚀 Running the Project Locally

### 1. Prerequisites
* Node.js v18+ (tested on Node v24.19.0)
* Local MongoDB service running on `mongodb://localhost:27017`

### 2. Start Backend API Server
```powershell
cd server
npm install
npm start
```
* API Server runs on `http://localhost:5000`

### 3. Start Frontend Dev Server
```powershell
cd client
npm install
npm run dev
```
* Frontend runs on `http://localhost:5173`

### 4. Run Automated Test Suite
```powershell
node server/tests/test-runner.js
```
* Runs 12 automated end-to-end integration tests (Health, Auth, RBAC, Catalog, Builder, Pricing, Orders, Admin, Cron alerts).

---

## 📑 Core REST API Reference

### Authentication
* `POST /api/auth/register` — Register customer account (dispatches email verification)
* `POST /api/auth/verify-email` — Confirm verification token
* `POST /api/auth/login` — Customer JWT authentication
* `POST /api/auth/admin/login` — Admin JWT authentication
* `POST /api/auth/forgot-password` — Dispatch password reset email
* `POST /api/auth/reset-password/:token` — Update password with valid token
* `GET /api/auth/me` — Get authenticated profile

### Pizzas & Inventory
* `GET /api/pizzas` — List preset pizzas (supports `?category=` & `?sort=`)
* `GET /api/pizzas/:id` — Get pizza details
* `GET /api/inventory` — List all ingredients grouped by category

### Orders & Payment
* `POST /api/orders` — Create validated order with server-calculated totals
* `GET /api/orders` — Get logged-in user's order history
* `GET /api/orders/:id` — Get single order tracking details
* `POST /api/payment/create-order` — Create Razorpay order
* `POST /api/payment/verify` — Verify HMAC signature & deduct inventory

### Admin Operations (Super Admin Token Required)
* `GET /api/admin/stats` — Real-time revenue, orders & stock KPIs
* `GET /api/admin/orders` — Full order queue with filters
* `PATCH /api/admin/orders/:id/status` — Advance order status & broadcast via WebSocket
* `GET /api/admin/inventory` — Stock levels with threshold alerts
* `PATCH /api/admin/inventory/:id` — Restock item or adjust threshold
* `POST /api/admin/inventory/check-alerts` — Trigger instant watchdog inventory scan
