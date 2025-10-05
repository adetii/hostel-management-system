# Hostel Management System

Production-ready Hostel Management System (backend + frontend) tailored for small to medium private hostels. This repository contains a Node.js/Express backend and a React + Vite frontend. The app supports multi-role authentication (student, admin, super-admin), room and booking management, real-time notifications (Socket.IO), Redis caching, scheduled tasks, PDF/Excel export, and simple CMS for public-facing content.

This README is prepared for sale and handover to a buyer (e.g., private hostels near UPSA). It includes a feature summary, quickstart, deployment hints, and what’s included in typical sale packages.

---

## Key Features

- Multi-role authentication: Students, Admins, Super Admins
- Tab-scoped session support (multiple concurrent browser tabs/contexts)
- Room management (capacity, occupancy, publicId-based public routes)
- Booking flow: create, cancel, admin-assisted booking, booking archives and restore
- Room assignments and occupancy sync scripts
- Academic workflows: semester transition, archive bookings, period management
- Real-time notifications via Socket.IO (joins rooms, admin notifications)
- Redis caching and session/cache utilities
- File uploads and notices (attachments), SMTP/email integration (nodemailer/resend/mailtrap)
- PDF and Excel exports for students and bookings
- Scheduler (cron jobs) and scripts for DB seeding/migrations
- Production middleware: helmet, rate-limiter, compression, morgan
- SPA static serving for the React/Vite frontend with sitemap and robots.txt

---

## Quickstart (developer / buyer)

1. Clone the repository

   git clone <repo-url>
   cd hostel-page

2. Copy environment example

   - Create a file at `backend/.env` from `backend/.env.example` (not included in repo for security). See "Environment" below for required variables.

3. Install dependencies

   - Backend

     cd backend
     npm install

   - Frontend

     cd ../frontend
     npm install

4. Seed database (optional, from backend)

   cd ../backend
   npm run seed:admin
   npm run seed:rooms

5. Run in development

   - In two terminals or using `concurrently` from the root scripts:

     # Backend (dev)
     cd backend && npm run dev

     # Frontend (dev)
     cd frontend && npm run dev

6. Production build (serve static frontend by backend)

   cd frontend
   npm run build

   cd ../backend
   npm start

   The backend serves built frontend from `../frontend/dist`.

---

## Environment (important variables)

Create `backend/.env` (this repo does not include secrets). Minimum variables the backend reads:

- MONGODB_URI (MongoDB connection string)
- REDIS_URL (optional Redis connection string)
- JWT_SECRET
- FRONTEND_URL (frontend origin for CORS)
- NODE_ENV (development|production)
- PORT (optional; default 5500)
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (for email)
- SITE_URL (used in sitemap/robots)

Include `.env.example` in the sale package with placeholders and explanations.

---

## Deployment hints (recommended for buyers)

- VPS: A small VPS (1-2 CPU, 2-4GB RAM) is sufficient for a single hostel. Use Ubuntu 22.04 or similar.
- Use a process manager (PM2) for backend; run the frontend build and let backend serve it as static assets.
- Use Let's Encrypt for SSL (Certbot) when serving the app on a domain.
- For higher availability or growth: use a managed MongoDB (MongoDB Atlas) and a managed Redis provider.
- Containerization: Provide a `Dockerfile` + `docker-compose.yml` (recommended — I can add one as part of the sale package).

Example minimal production commands (VPS / Powershell adaptation):

```powershell
# Build frontend
cd frontend
npm ci
npm run build

# Start backend with pm2
cd ../backend
npm ci
# set env (or use .env file)
pm2 start server.js --name hostel-backend --env production
```

---

## What to include in the sale package

- Source code (backend + frontend) and selected branches
- `backend/.env.example` (documented)
- Seed data and instructions (`npm run seed:admin`, `npm run seed:rooms`)
- `README.md` (this file), deployment instructions, and support terms
- Small license or transfer-of-ownership document
- Optional: Dockerfile + docker-compose, hosted demo URL, short video walkthrough

---

## Support & Handover options (suggested)

- Free: 7 days email support — quick setup guidance
- Standard: 30 days setup + one deployment assistance (recommended for buyers) — included in Standard package
- Premium: 3 months priority support and 2 small customizations

Suggested pricing examples for local buyers (Ghana, UPSA area)
- Quick sale (DIY): 2,000 GHS (~$135)
- Standard (recommended, includes deployment): 7,500 GHS (~$500)
- Premium (customizations + extended support): 30,000–45,000 GHS (~$2k–3k)

---

## Next steps I can provide (optional add-ons)

- Add `backend/.env.example` with all variables and descriptions
- Create a `Dockerfile` and `docker-compose.yml` for one-command deployment
- Produce a `LICENSE` and a short contract template for transfer of ownership
- Create a short demo script and seed data tailored to UPSA student names and rooms

If you want, I can create the `backend/.env.example` and the Docker compose files next — tell me which package (Quick sale / Standard / Premium) to prepare materials for.

---

Contact & support

Include a short buyer support paragraph and how buyers will contact you (phone/Mobile Money/bank details) in the final sale package.

---

Thank you — tell me which package to generate full sale artifacts for and I'll add them (`.env.example`, Docker files, short contract, and a one-page features/pricing PDF).
