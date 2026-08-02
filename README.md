# Mishra Library — Reading Room ERP

A production-ready ERP for managing a reading room / study centre: seats, students, memberships, payments, reminders, reports, and (future) CCTV — built MERN stack.

**Developed by Adarsh Kumar**

## Structure

```
mishra-library/
├── backend/     Express + MongoDB API
└── frontend/    React 19 + Vite + Tailwind SPA
```

## What's already working

- JWT auth (login, protected routes, change password)
- 100-seat management (grid + table view, transfer, status updates, history)
- Student CRUD with search/filter/pagination, seat auto-assignment, 30-day renewal
- Payments with duplicate-for-month prevention, receipts, collection summaries
- Dashboard with real aggregated stats + charts (revenue, admissions, occupancy)
- Notification/reminder generation (fee due, expiring soon)
- Settings (library details, default fee, timings)
- Excel export for reports (students, payments, seats, collection)
- Rate limiting, centralized error handling, consistent API response format

## What's stubbed for later (as scoped)

- SMS / WhatsApp / Email reminder delivery (notification records are generated; sending isn't wired up)
- CCTV live feed (page scaffolded, needs a WebRTC/HLS or RTSP-to-HLS bridge)
- PDF export (currently via browser print-to-PDF; dedicated PDF templates not yet built)
- Dark mode toggle (Tailwind `darkMode: 'class'` is configured, toggle UI not yet added)

## Getting Started

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
- `MONGO_URI` → your MongoDB Atlas connection string
- `JWT_SECRET` → any long random string
- `CLOUDINARY_*` → your Cloudinary credentials (for student photo uploads)

Then seed the database:

```bash
npm run seed:seats     # creates all 100 seats
npm run seed:admin     # creates admin@mishralibrary.com / ChangeMe123!
```

Start the server:

```bash
npm run dev             # nodemon, http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env    # VITE_API_URL=http://localhost:5000/api
npm run dev              # http://localhost:5173
```

Log in with `admin@mishralibrary.com` / `ChangeMe123!`, then change the password from Settings immediately.

## Next steps to extend this skeleton

1. **Student photo upload** — wire up Multer + Cloudinary (config is already in place at `backend/config/cloudinary.js`) to the student create/edit form.
2. **Reminder delivery** — integrate an SMS/WhatsApp provider (e.g. Twilio, Gupshup, Meta Cloud API) to actually send the reminders that `generate-reminders` creates.
3. **Cron jobs** — schedule `generate-reminders` and automatic membership status updates (active → expiring-soon → expired) to run daily, e.g. with `node-cron`.
4. **PDF reports** — build dedicated printable templates (e.g. with `pdfkit` or `puppeteer`) instead of relying on browser print.
5. **Role-based access** — the Admin model already has a `role` field (`superadmin`/`admin`); add role checks to middleware if you bring on staff accounts.
6. **CCTV** — pick a camera integration approach (WiFi camera's own RTSP/HTTP stream → HLS bridge) and connect it to the CCTV page.

## Tech Stack

**Frontend:** React 19, Vite, React Router DOM, Axios, Tailwind CSS, React Icons, React Hot Toast, Recharts, XLSX, File Saver
**Backend:** Node.js, Express, MongoDB (Mongoose), JWT, Multer, Cloudinary, Bcrypt, express-rate-limit
