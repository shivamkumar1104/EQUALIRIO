# 🏨 Equalirio — Eco Luxury Hotel & Sanctuary Spa

> A full-stack luxury hotel management and booking platform built for production freelancing deployment.

![Equalirio Hotel](https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80)

---

## ✨ Features

- 🏠 **Suite Showcase** with filtering, availability check, and real-time pricing
- 📅 **Multi-Step Booking Flow** (4-step: Suite → Add-ons → Guest Info → Confirmation)
- 🔐 **Authentication** — Email/password + Google OAuth + JWT
- 👤 **Role-Based Access** — Guest and Admin roles
- ⭐ **Verified Guest Reviews** — only guests with completed bookings can submit reviews; ratings are calculated from real reviews
- 🍽 **Dining Reservations** with time-slot capacity management
- 🌍 **Multi-language** support (Google Translate integration)
- 💱 **Multi-currency** display
- 📱 **Fully Responsive** — mobile-first design
- 🧾 **Admin CRM** — searchable, paginated guest records with booking and membership context
- 🔎 **SEO Basics** — search/social metadata and crawler access rules
- 🏡 **Stays Marketplace Foundation** — host dashboard, moderated listings, and public stay discovery

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS 3, Lucide React |
| **Backend** | Node.js (ES Modules), Express 5, Mongoose 9 |
| **Database** | MongoDB Atlas |
| **Auth** | JWT, bcrypt, Google OAuth 2.0 |
| **Security** | Helmet, CORS whitelist, Rate Limiting |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier)
- Google Cloud Console project (for OAuth)

### 1. Clone & Install

```bash
# Clone the repo
git clone <your-repo-url>
cd hotel

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure Environment Variables

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your MongoDB URL, JWT secret, Google Client ID
```

```bash
# Frontend
cd frontend
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000 for local development.
# For deployment, use the complete public backend origin, e.g. https://your-api.onrender.com
# Do not append /api; the frontend adds that path automatically.
# Add the Google Client ID as VITE_GOOGLE_CLIENT_ID.
```

### Google Sign-In Setup

1. In [Google Cloud Console](https://console.cloud.google.com/), create or select a project and configure the OAuth consent screen. While the app is in testing, add the accounts that need to sign in as test users.
2. Create an OAuth client ID with application type **Web application**.
3. Add the frontend's origin under **Authorized JavaScript origins**:
   - `http://localhost:3000` (this project's Vite port)
   - Add your deployed frontend origin when deploying.
4. Put the same client ID in both environment files:
   - `backend/.env`: `GOOGLE_CLIENT_ID=<client-id>.apps.googleusercontent.com`
   - `frontend/.env`: `VITE_GOOGLE_CLIENT_ID=<client-id>.apps.googleusercontent.com`
   - For deployment, set `FRONTEND_URL` in `backend/.env` to the deployed frontend origin so CORS allows it.
5. Restart both development servers after changing environment variables.

This app uses Google Identity Services to return an ID token; an OAuth client secret is not needed for this sign-in flow. Do not put a client secret in the frontend. The Google button appears when the frontend client ID is configured.

### Email Registration OTP (Brevo)

1. In Brevo, create and verify a sender email address.
2. In `backend/.env`, set `BREVO_API_KEY` and `BREVO_SENDER_EMAIL` to your Brevo API key and verified sender address. Optionally set `BREVO_SENDER_NAME`.
3. Restart the backend. Email/password registration first sends a 6-digit code that expires in 10 minutes. The user must verify the code before the name and password fields unlock and the account can be created. Google sign-in continues to trust Google's verified email.
4. `FRONTEND_URL` is still used by verification links for accounts created before OTP registration was enabled; set it to the deployed frontend origin in production.

Keep Brevo's API key only in the backend environment; never add it to a `VITE_` variable or frontend code.

### 3. Seed a Disposable Development Database

The seed script deletes and replaces hotel, suite, amenity, FAQ, and gallery
records. It refuses to run in production and requires explicit opt-in. Never
point it at production or a database containing data you need to keep.

```bash
cd backend
SEED_ALLOW_DESTRUCTIVE=true npm run seed
```

### Rehearse the Suite-to-StayListing Migration

The migration requires an approved host profile and explicit structured
location, bed-count, and currency values; it never infers these from the
legacy hotel address or invents a currency conversion. It creates unpublished
draft listings only and does not modify suites or bookings. A run without
`--apply` is read-only:

```bash
cd backend
npm run migrate:suites -- --host-profile <approved-host-profile-id> --country <country> --city <city> --beds <beds-per-suite> --currency <ISO-4217-code>
```

Review the dry-run report before applying. To write drafts, use a non-production
database, set `STAY_MIGRATION_ALLOW_WRITE=true`, and append `--apply`. The
script preflights every unmigrated suite and aborts before writing if any
record is invalid. Existing migrated suites are skipped; the unique source
reference makes reruns safe without replacing edited listings. Review each
draft's cancellation and check-in/out settings before publishing; migration
does not establish these marketplace policies.

### 4. Start Development Servers

```bash
# Terminal 1 — Backend (port 5000)
cd backend && npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/verify-email?token=...` | Public (one-time link) |
| POST | `/api/auth/resend-verification` | Public |
| POST | `/api/auth/google` | Public |
| GET | `/api/auth/me` | Protected |
| PUT | `/api/auth/profile` | Protected |

### Suites
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/suites` | Public |
| GET | `/api/suites/:id` | Public |
| GET | `/api/suites/:id/availability` | Public |
| POST | `/api/suites` | Admin |
| PUT | `/api/suites/:id` | Admin |
| DELETE | `/api/suites/:id` | Admin |

### Bookings
| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/bookings` | Protected |
| GET | `/api/bookings/my` | Protected |
| GET | `/api/bookings/:id` | Protected (owner/admin) |
| PATCH | `/api/bookings/:id/cancel` | Protected (owner/admin) |
| GET | `/api/bookings` | Admin |
| PATCH | `/api/bookings/:id/status` | Admin |

### Reviews
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/reviews` | Public |
| GET | `/api/reviews/suite/:suiteId` | Public |
| POST | `/api/reviews` | Protected |
| PUT | `/api/reviews/:id` | Protected (owner) |
| DELETE | `/api/reviews/:id` | Protected (owner/admin) |
| POST | `/api/reviews/:id/respond` | Admin |

Reviews are not seeded or supplied with sample/fallback text. Public review feeds
and rating totals include only reviews attached to a guest's checked-out booking.
A review with no completed booking is rejected by the API.

### Dining
| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/dining` | Public |
| GET | `/api/dining/my` | Protected |
| PATCH | `/api/dining/:id/cancel` | Protected |
| GET | `/api/dining` | Admin |
| PATCH | `/api/dining/:id/status` | Admin |

### Stays Marketplace
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/stays` | Public (published stays only) |
| GET | `/api/stays/:idOrSlug` | Public (published stays only) |
| POST | `/api/hosts/apply` | Authenticated |
| GET | `/api/hosts/me` | Authenticated |
| GET | `/api/hosts/me/listings` | Authenticated host |
| POST | `/api/hosts/me/listings` | Approved host |
| PUT | `/api/hosts/me/listings/:id` | Listing owner |
| POST | `/api/hosts/me/listings/:id/submit` | Approved host |
| POST | `/api/hosts/me/listings/:id/pause` | Approved listing owner |
| GET | `/api/hosts/admin/applications` | Admin |
| GET | `/api/hosts/admin/listings/review` | Admin |
| PATCH | `/api/hosts/admin/applications/:id` | Admin |
| PATCH | `/api/hosts/admin/listings/:id/review` | Admin |

Host applications and listings are moderated. Only published listings owned
by approved hosts appear in public stay search. Booking calendars, marketplace
payment/payouts, messaging, and reviews for marketplace listings remain follow-up
work and are not implied by these catalog endpoints.

---

## 🆓 Free Hosting Deployment

| Service | Purpose | Cost |
|---|---|---|
| **Vercel** | Frontend | Free |
| **Render.com** | Backend | Free |
| **MongoDB Atlas** | Database | Free (512MB) |
| **Cloudinary** | Images | Free |
| **Resend** | Email | Free (100/day) |

**Total: $0/month**

---

## 📁 Project Structure

```
hotel/
├── backend/
│   ├── src/
│   │   ├── controllers/   # Business logic
│   │   ├── models/        # Mongoose schemas
│   │   ├── routes/        # Express routes
│   │   ├── middlewares/   # Auth, rate limiting, validation
│   │   ├── utils/         # Helpers (token, response, bookingId)
│   │   └── scripts/       # seed.js
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/    # UI components
    │   ├── services/      # API service layer (api.js)
    │   └── data/          # Fallback static data
    ├── .env.example
    └── package.json
```

---

## 🔒 Security Features

- JWT with no hardcoded fallback secrets
- CORS strict whitelist
- Rate limiting (auth: 10/15min, API: 100/min, booking: 20/hr)
- Helmet security headers
- Request body size limit (10kb)
- bcrypt password hashing (rounds: 12)
- Role-based access control
- Admin-only customer and membership records; membership lookups are limited to the signed-in user or an admin

## Search Engine & Social Preview Setup

The frontend includes page metadata, Open Graph/Twitter preview tags, and a public `robots.txt`. Add a canonical URL and a `sitemap.xml` after choosing the permanent production domain; do not publish local URLs or placeholder resort contact/location details as structured business data.

---

*Built with ❤️ for freelancing — production-ready Equalirio Hotel Platform*
