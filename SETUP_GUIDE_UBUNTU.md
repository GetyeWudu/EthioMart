# 🚀 GechExpress — Ubuntu Setup & Run Guide

Welcome to **GechExpress**! Follow these simple, copy-paste steps on your **Ubuntu machine** to get the entire project up, running, and seeded with realistic test data.

---

## 1. Prerequisites on Ubuntu

Make sure you have **Git**, **Docker**, **Docker Compose**, and **Node.js (v18+)** installed:

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Git, curl, build-essential
sudo apt install -y git curl build-essential

# Install Docker & Docker Compose plugin (if not already installed)
sudo apt install -y docker.io docker-compose-v2

# Add your user to the docker group (so you don't need 'sudo' for docker commands)
sudo usermod -aG docker $USER
newgrp docker

# Install Node.js (v20 LTS recommended)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify installations:
```bash
docker --version
docker compose version
node -v
npm -v
```

---

## 2. Clone the Repository

Clone the project from GitHub (checking out the `master` branch):

```bash
git clone https://github.com/GetyeWudu/GechExpress.git
cd GechExpress
git checkout master
```

---

## 3. Configure Environment Variables (`.env`)

### A. Backend `.env`
Create the `backend/.env` file from the provided example template:

```bash
cp backend/.env.example backend/.env
```

> **Note:** If your friend shared private credentials (such as Google OAuth or Chapa keys) via private message, open `backend/.env` with `nano backend/.env` and paste them in. For local development, the default database settings inside `.env.example` will work out of the box with Docker.

### B. Frontend `.env.local`
Create `frontend/.env.local`:

```bash
cat << 'EOF' > frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
EOF
```

---

## 4. Start the Backend Services (Docker)

Spin up PostgreSQL, Redis, Django API backend, Celery workers, and Mailpit:

```bash
# From the project root directory
cd backend

# Build and start all containers in the background
docker compose up -d --build
```

Check that all containers are healthy:
```bash
docker compose ps
```
*(You should see `backend`, `db`, `redis`, `celery_worker`, `celery_beat`, and `mailpit` running).*

---

## 5. Run Database Migrations & Seed Mock Data

Run these commands to prepare your database and populate it with full marketplace demo data:

```bash
# 1. Apply all database migrations
docker compose exec backend python manage.py migrate

# 2. Seed platform core settings & commission tiers
docker compose exec backend python manage.py seed_platform_settings

# 3. Seed demo taxonomy & categories (Fashion, Electronics, Home, Beauty, etc.)
docker compose exec backend python manage.py seed_catalog_taxonomy

# 4. Seed verified demo products, variants & inventory
docker compose exec backend python manage.py seed_catalog_matrix

# 5. Seed test accounts (Superadmin, Sellers, Customers)
docker compose exec backend python manage.py seed_demo_users
```

*(Optional: If you want to create a custom superuser for the Django admin at `http://localhost:8000/admin`)*:
```bash
docker compose exec backend python manage.py createsuperuser
```

---

## 6. Start the Frontend (Next.js)

Open a new terminal window or tab, navigate to the `frontend/` folder, install dependencies, and start the development server:

```bash
cd GechExpress/frontend

# Install dependencies
npm install

# Run dev server with hot reload
npm run dev
```

The frontend will start running at:  
👉 **http://localhost:3000**

---

## 7. Useful Test Credentials & Endpoints

| Service | URL | Default Credentials / Purpose |
| :--- | :--- | :--- |
| **Frontend Storefront** | [http://localhost:3000](http://localhost:3000) | Public customer marketplace |
| **Seller Dashboard** | [http://localhost:3000/seller](http://localhost:3000/seller) | Login with seller account |
| **Platform Admin** | [http://localhost:3000/admin](http://localhost:3000/admin) | Superadmin operations & moderation |
| **Backend REST API** | [http://localhost:8000/api/v1/](http://localhost:8000/api/v1/) | Swagger & API root |
| **Django Admin** | [http://localhost:8000/admin/](http://localhost:8000/admin/) | Direct database administrative interface |
| **Mailpit (Local Email)** | [http://localhost:8025](http://localhost:8025) | Intercepts all registration & notification emails |

### Seeded Accounts:
* **Admin / Staff:** `admin@gechexpress.com` | `Password123!` (or your custom superuser)
* **Demo Seller:** `seller@gechexpress.com` | `Password123!`
* **Demo Customer:** `customer@gechexpress.com` | `Password123!`

---

## 8. Troubleshooting Tips on Ubuntu

1. **Docker Permission Denied:**
   If you see `permission denied while trying to connect to the Docker daemon socket`, run:
   ```bash
   sudo chmod 666 /var/run/docker.sock
   ```
2. **Port 5432 or 8000 already in use:**
   If local PostgreSQL is already installed on your Ubuntu host:
   ```bash
   sudo systemctl stop postgresql
   ```
3. **Viewing Backend Logs:**
   ```bash
   cd backend && docker compose logs -f backend
   ```
4. **Stopping Services:**
   ```bash
   cd backend && docker compose down
   ```
