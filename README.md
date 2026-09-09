# 🇪🇹 EthioMart (GechExpress) — Multi-Vendor E-Commerce Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Django](https://img.shields.io/badge/Django-5.1-092E20?style=for-the-badge&logo=django)](https://www.djangoproject.com/)
[![DRF](https://img.shields.io/badge/Django_REST-3.15-red?style=for-the-badge&logo=django)](https://www.django-rest-framework.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-Cache-DC382D?style=for-the-badge&logo=redis)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)

EthioMart is a high-performance, full-stack multi-vendor e-commerce platform tailored for modern digital commerce in Ethiopia and East Africa. It features an automated vendor onboarding engine, dynamic multi-attribute product matrix builder, localized payment integration (Chapa), escrow-backed payout system, and an administrative moderation workflow.

---

## 🌟 Key Architecture & Features

### 🛒 Customer Storefront (Next.js 16 + React 19)
* **Instantaneous Navigation:** Powered by Next.js Turbopack and Incremental Static Regeneration (ISR).
* **Localized Category Taxonomy:** Multi-level cascading hierarchy (Main Category › Subcategory › Leaf Category) designed for Ethiopian regional products, fashion, and electronics.
* **Hybrid Trending Shelf:** Dynamically highlights newly arrived products with automated backfill from top-rated items.
* **Cart & Instant Checkout:** Client-side persisted cart with guest checkout and authenticated customer flows.
* **Responsive Image Pipeline:** Edge-optimized WebP/AVIF delivery using Cloudinary image transformations.

### 🏪 Vendor / Seller Portal
* **Variant Matrix Generator:** Cartesian product generator supporting multi-dimensional attributes (Color × Size × Material) with auto-generated SKUs.
* **Custom Attribute Creation:** Allows sellers to introduce custom values (e.g., custom colors, specialized clothing sizes) scoped to their vendor profile.
* **Escrow-Backed Wallet:** Automatic locking and unlocking of vendor payout funds based on order delivery confirmations.
* **KYC Onboarding:** Business license verification, bank account provisioning, and moderation status banners.

### 🛡️ Admin & Operational Suite
* **Listing Moderation:** Batch approval, rejection with feedback, and category assignment workflows.
* **Commission Management:** Category-based and store-level commission overrides.
* **Audit Logs:** Immutable audit trail recording administrative and financial actions.
* **Dispute Resolution:** Built-in dispute filing, evidence attachment, and escrow release controls.

### 💳 Ethiopian Payment & Financial Services
* **Chapa Integration:** Direct payment checkout supporting Telebirr, CBE Birr, Awash, and international cards.
* **Escrow Lifecycle:** Funds are safely held in escrow until goods are delivered and the dispute period expires.

---

## 🏗️ System Architecture

```
                       ┌────────────────────────┐
                       │   Vercel Edge Network  │
                       │   Next.js 16 Frontend  │
                       └───────────┬────────────┘
                                   │ HTTPS / REST
                                   ▼
                       ┌────────────────────────┐
                       │   Render Web Service   │
                       │   Django 5 + Gunicorn  │
                       └─────┬────────────┬─────┘
                             │            │
             ┌───────────────┴────┐  ┌────┴────────────────┐
             │ PostgreSQL 16 (DB) │  │ Redis (Cache/Tasks) │
             └────────────────────┘  └─────────────────────┘
```

---

## 📁 Repository Structure

```text
├── backend/
│   ├── apps/
│   │   ├── audit_logs/       # Audit trail and event tracking
│   │   ├── carts/            # Shopping cart services
│   │   ├── catalog/          # Products, categories, variants, and pricing
│   │   ├── common/           # Shared models, permissions, and validators
│   │   ├── core_settings/    # Dynamic platform configuration
│   │   ├── disputes/         # Order disputes and refunds
│   │   ├── inventory/        # Stock management and reservations
│   │   ├── notifications/    # In-app and system alerts
│   │   ├── orders/           # Orders, escrow, and Chapa payments
│   │   ├── promotions/       # Coupons, discounts, and flash sales
│   │   ├── reviews/          # Ratings and customer feedback
│   │   ├── shipping/         # Zones, rates, and delivery tracking
│   │   ├── users/            # Customer, vendor, and admin accounts
│   │   ├── vendors/          # Vendor profiles, KYC, and wallets
│   │   └── wishlists/        # Customer wishlists
│   ├── config/               # Django settings (base, local, production)
│   ├── requirements/         # Modular requirements (base, local, production)
│   ├── scripts/              # Database seeding and migration utilities
│   ├── Dockerfile            # Container definition
│   ├── docker-compose.yml    # Full-stack local orchestration
│   ├── manage.py             # Django management CLI
│   └── build.sh              # Production build and migration script
│
├── frontend/
│   ├── app/                  # Next.js App Router (Customer, Seller, Admin)
│   ├── components/           # Reusable UI component library (Radix + Tailwind)
│   ├── features/             # Domain-driven client modules (auth, catalog, cart)
│   ├── lib/                  # Utilities, API client, and Cloudinary transforms
│   ├── stores/               # Zustand state management
│   └── types/                # TypeScript schema definitions
│
├── render.yaml               # Render Infrastructure as Code (Blueprint)
└── README.md                 # Project documentation
```

---

## 🚀 Quickstart & Local Development

### 1. Prerequisites
* [Docker Desktop](https://www.docker.com/products/docker-desktop/)
* [Node.js 20+](https://nodejs.org/)

### 2. Clone the Repository
```bash
git clone https://github.com/GetyeWudu/EthioMart.git
cd EthioMart
```

### 3. Start Backend Services (Docker)
```bash
cd backend
cp .env.example .env
docker compose up -d --build
```
* **API Server:** `http://localhost:8000`
* **Django Admin:** `http://localhost:8000/admin/`
* **API Documentation:** `http://localhost:8000/api/schema/swagger-ui/`

### 4. Seed Initial Taxonomy & Demo Data
```bash
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperadmin
docker compose exec backend python manage.py seed_catalog_taxonomy
docker compose exec backend python manage.py seed_platform_settings
```

### 5. Start Frontend (Turbopack)
```bash
cd ../frontend
cp .env.example .env.local  # configure NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
npm install
npm run dev
```
* **Storefront:** `http://localhost:3000`

---

## 🧪 Testing & Code Quality

```bash
# Frontend Type Checking & Linting
cd frontend
npm run lint          # 0 errors
npm run build         # Validates production builds & route generation

# Backend Syntax & Django System Checks
cd backend
docker compose exec backend python -m compileall apps config -q
docker compose exec backend python manage.py check
docker compose exec backend python manage.py makemigrations --check --dry-run
docker compose exec backend pytest
```

---

## ☁️ Deployment

### Backend (Render)
* **Runtime:** Python 3.12
* **Build Command:** `chmod +x build.sh && ./build.sh`
* **Start Command:** `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`
* **Settings:** `DJANGO_SETTINGS_MODULE=config.settings.production`

### Frontend (Vercel)
* **Framework:** Next.js
* **Root Directory:** `frontend`
* **Environment Variables:**
  * `NEXT_PUBLIC_API_URL=https://<your-backend-service>.onrender.com/api/v1`
  * `NEXT_PUBLIC_SITE_URL=https://<your-app>.vercel.app`

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
