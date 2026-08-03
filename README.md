# Mishra Library — Reading Room ERP

A production-ready ERP for managing a reading room / study centre: seats, students, memberships, payments, reminders, reports, and CCTV — built with the MERN stack.

**Developed by Adarsh Kumar**

## Structure

```
mishra-library/
├── backend/     Express + MongoDB API
└── frontend/    React 19 + Vite + Tailwind SPA
```

## Features & Optimizations

- **Auth & Password Recovery**: JWT auth (login, protected routes, change password) + complete "Forgot Password" OTP/link recovery flow via Nodemailer.
- **Seat Management**: 100 seats with shift-wise occupancy (morning, afternoon, evening, night), seat transfers, status updates, and history tracking.
- **Student Management**: Full CRUD, mobile card list view, live seat availability check, auto 30-day membership cycle renewal.
- **Payments & Receipts**: Single Student Name autocomplete search, month-duplicate prevention, custom receipts, and collection stats.
- **Dashboard & Analytics**: Shift-wise seat breakdown, fully/partially/available seat categories, Recharts revenue line chart, and admissions bar chart.
- **Performance & Infrastructure**:
  - Gzip/Brotli Express response compression (`compression`).
  - React Query (`@tanstack/react-query`) client-side caching & optimistic mutations.
  - Route-level code splitting (`React.lazy()`) reducing initial JS bundle size by ~70%.
  - Mongoose indexing (`expiryDate`, `joiningDate`, `paidAt`, slot status) for `IXSCAN` query speeds.

---

## 🌐 SPA Routing & 404 on Refresh Configuration

Single Page Applications using React Router handle routing client-side. To prevent 404 errors when refreshing internal routes (e.g. `/students`, `/payments`, `/settings`), the host must rewrite non-file requests to `/index.html`:

- **Vercel**: Configured in `frontend/vercel.json` (`rewrites: [{ source: "/(.*)", destination: "/index.html" }]`).
- **Netlify / Cloudflare Pages**: Configured in `frontend/public/_redirects` (`/* /index.html 200`).
- **Apache**: Configured in `frontend/public/.htaccess` (`FallbackResource /index.html`).
- **Render Static Site**: In Render Dashboard → Redirects/Rewrites, add a rule:
  - **Source**: `/*`
  - **Destination**: `/index.html`
  - **Action**: `Rewrite` (200)
- **Custom Nginx Server**: Add `try_files` in `nginx.conf`:
  ```nginx
  location / {
      try_files $uri $uri/ /index.html;
  }
  ```

---

## Production Deployment Guide

### 1. Eliminating Backend Cold Starts (Render / Railway / Heroku)
Free-tier backend hosts spin down after 15 minutes of inactivity, causing 30–50s cold-start delays.

To keep the backend warm 24/7 without paid instances:
1. Sign up for a free account on **[UptimeRobot](https://uptimerobot.com)** or **[cron-job.org](https://cron-job.org)**.
2. Create an **HTTP Monitor**:
   - **URL**: `https://your-backend-domain.onrender.com/api/health`
   - **Interval**: Every **5 minutes**
3. This keeps the Node.js process warm so all API requests respond instantly.

### 2. Database & Region Locality (MongoDB Atlas)
- Ensure your **MongoDB Atlas cluster region** is in the same geographic region as your backend hosting (e.g. AWS `ap-south-1` Mumbai for both Render and Atlas).

---

## Getting Started Locally

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Seed the database:

```bash
npm run seed:seats     # creates all 100 seats
npm run seed:admin     # creates admin@mishralibrary.com / ChangeMe123!
```

Start the server:

```bash
npm run dev             # nodemon, http://localhost:5000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env    # VITE_API_URL=http://localhost:5000/api
npm run dev              # http://localhost:5173
```

Log in with `admin@mishralibrary.com` / `ChangeMe123!`.

---

## Tech Stack

**Frontend:** React 19, Vite, TanStack React Query, React Router DOM, Axios, Tailwind CSS, React Icons, React Hot Toast, Recharts, XLSX, File Saver  
**Backend:** Node.js, Express, MongoDB (Mongoose), Compression, Nodemailer, JWT, Multer, Cloudinary, Bcrypt, express-rate-limit
