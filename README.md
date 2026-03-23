# 🚀 PRIMESTACK — Corporate Web Platform

**IT kompaniya uchun to'liq korporativ web platforma**

> Next.js 14 + TypeScript + Go 1.21 + PostgreSQL + Redis + Docker

---

## 📋 Loyiha haqida

PRIMESTACK — marketing sayt va admin paneldan iborat korporativ web platforma.

- **Public sayt**: Kompaniya, xizmatlar, portfolio, jamoa, blog, vakansiyalar, kontakt
- **Admin panel**: Barcha kontentni kodga teginmasdan boshqarish
- **REST API**: Go Gin framework, JWT autentifikatsiya, RBAC
- **SEO-ready**: SSR/ISR, sitemap, Open Graph, canonical URLs

---

## 🛠 Tech Stack

| Qatlam | Texnologiya |
|--------|-------------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Framer Motion |
| Backend | Go 1.21, Gin Framework, JWT, Clean Architecture |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Storage | MinIO (S3-compatible) |
| Deploy | Docker Compose, Nginx |

---

## 🚀 Ishga tushirish

### Talablar
- Node.js 20+
- Go 1.21+
- Docker & Docker Compose
- PostgreSQL 16+ (yoki Docker orqali)

### 1. Repository clone qilish

```bash
git clone https://github.com/yourorg/primestack.git
cd primestack
```

### 2. Environment fayllar sozlash

```bash
# Backend
cp backend/.env.example backend/.env
# Qiymatlarni to'ldiring

# Frontend
cp frontend/.env.local.example frontend/.env.local
# NEXT_PUBLIC_API_URL ni to'ldiring
```

### 3. Docker Compose bilan ishga tushirish (tavsiya etiladi)

```bash
docker-compose up -d
```

`docker-compose v1.29.x` ishlatayotgan muhitlarda ba'zan `KeyError: 'ContainerConfig'` chiqishi mumkin. Shunda quyidagi safe scriptdan foydalaning:

```bash
# Hammasi uchun
./scripts/compose-safe-up.sh

# Faqat backend + frontend uchun
./scripts/compose-safe-up.sh backend frontend
```

Bu buyruq quyidagilarni ishga tushiradi:
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- MinIO: `localhost:9000` (console: `localhost:9001`)
- Backend API: `localhost:8080`
- Frontend: `localhost:3000`
- Nginx: `localhost:80`

### 4. Local development (Docker-siz)

**Backend:**
```bash
cd backend
cp .env.example .env
go mod download
go run cmd/server/main.go
# API: http://localhost:8080
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
# Sayt: http://localhost:3000
```

---

## 🔑 Admin Panel

**URL:** `http://localhost:3000/admin`

**Demo credentials:**
```
Email:    admin@primestack.uz
Password: admin123
```

> ⚠️ Production'da parolni o'zgartiring!

### Admin panel imkoniyatlari

| Bo'lim | Imkoniyatlar |
|--------|-------------|
| Dashboard | Statistika, so'nggi xabarlar, tizim holati |
| Xizmatlar | CRUD, tartib, faol/nofaol |
| Loyihalar | CRUD, portfolio boshqaruvi |
| Jamoa | CRUD, a'zolar, lavozimlar |
| Blog | CRUD, draft/publish, kategoriyalar |
| Vakansiyalar | CRUD, ochiq/yopiq holat |
| Xabarlar | Ko'rish, filtrlash, holat yangilash, CSV export |
| Media | Yuklab olish, o'chirish |
| Sozlamalar | Global sayt sozlamalari |

---

## 📡 API Dokumentatsiya

**Swagger UI:** `http://localhost:8080/swagger/index.html`

### Public Endpoints

```
GET  /api/v1/settings           → Sayt sozlamalari
GET  /api/v1/services           → Xizmatlar ro'yxati
GET  /api/v1/services/:slug     → Xizmat detail
GET  /api/v1/projects           → Portfolio ro'yxati
GET  /api/v1/projects/:slug     → Portfolio detail
GET  /api/v1/team               → Jamoa ro'yxati
GET  /api/v1/blog               → Blog maqolalar
GET  /api/v1/blog/:slug         → Maqola detail
GET  /api/v1/vacancies          → Vakansiyalar
POST /api/v1/contact            → Kontakt formasi
POST /api/v1/telegram/webhook   → Telegram bot webhook
GET  /health                    → Tizim holati
GET  /sitemap.xml               → SEO sitemap
GET  /robots.txt                → Robots
```

### Admin Endpoints (JWT kerak)

```
POST /api/v1/auth/login         → Kirish
POST /api/v1/auth/logout        → Chiqish
GET  /api/v1/admin/me           → Joriy foydalanuvchi

CRUD /api/v1/admin/services     → Xizmatlar boshqaruvi
CRUD /api/v1/admin/projects     → Portfolio boshqaruvi
CRUD /api/v1/admin/team         → Jamoa boshqaruvi
CRUD /api/v1/admin/posts        → Blog boshqaruvi
CRUD /api/v1/admin/vacancies    → Vakansiyalar boshqaruvi
GET  /api/v1/admin/messages     → Xabarlar
GET  /api/v1/admin/bot-leads    → Telegram botdan kelgan leadlar
PATCH /api/v1/admin/bot-leads/:id/status → Bot lead statusi
GET  /api/v1/admin/telegram-admins → Telegram admin ID lar
POST /api/v1/admin/telegram-admins → Telegram admin qo'shish (max 3 faol)
POST /api/v1/admin/media/upload → Media yuklash
GET  /api/v1/admin/settings     → Sozlamalar
PUT  /api/v1/admin/settings     → Sozlamalarni saqlash
```

---

## 🤖 Telegram Bot (Webhook + Railway)

Bot vazifasi: mijozdan loyiha uchun kerakli ma'lumotlarni bosqichma-bosqich yig'ish va admin panelga lead sifatida tushirish.

### Botda mavjud buyruqlar
- `/start` — botni boshlash
- `/loyiha` — yangi loyiha arizasini boshlash
- `/cancel` — joriy arizani bekor qilish
- `/id` yoki `/myid` — o'z Telegram ID ni ko'rish
- `/admin` yoki `/panel` — bot ichidagi admin summary (`telegram_admins` ro'yxatida bo'lsa)
- `/leads` — so'nggi leadlar
- `/lead <id>` — bitta lead detail
- `/messages` — so'nggi kontakt xabarlari
- `/message <id>` — bitta xabar detail

### Kerakli backend env'lar
```env
TELEGRAM_BOT_TOKEN=...
TELEGRAM_WEBHOOK_SECRET=...
TELEGRAM_WEBHOOK_BASE_URL=https://your-backend.up.railway.app
TELEGRAM_CHAT_ID=... # ixtiyoriy (notify uchun)
```

`TELEGRAM_WEBHOOK_BASE_URL` berilsa backend start paytida `setWebhook` avtomatik chaqiriladi.

### Qo'lda webhook o'rnatish (script)
```bash
export TELEGRAM_BOT_TOKEN=...
export TELEGRAM_WEBHOOK_SECRET=...
export TELEGRAM_WEBHOOK_BASE_URL=https://your-backend.up.railway.app

./scripts/telegram-webhook.sh set
./scripts/telegram-webhook.sh info
```

### Admin panel
- `/admin/bot-leads` — botdan kelgan leadlarni ko'rish va status yuritish
- `/admin/telegram-admins` — bot admin ID larni boshqarish (faol limit: 3 ta)

---

## 🗄 Database Schema

```
users           → Admin foydalanuvchilar
roles           → super_admin | editor | hr
services        → Xizmatlar
projects        → Portfolio/case study
team_members    → Jamoa a'zolari
blog_posts      → Blog maqolalar
categories      → Blog va portfolio filterlari
vacancies       → Vakansiyalar
contact_messages → Kontakt formasi so'rovlari
bot_project_leads → Telegram botdan kelgan loyiha leadlari
bot_lead_sessions → Telegram intake jarayoni state'i
telegram_admins → Telegram admin ID lar (max 3 faol)
media_files     → Media kutubxona
site_settings   → Global sozlamalar
seo_meta        → SEO metadata
audit_logs      → Admin audit trail
pages           → Static sahifalar
```

Migratsiyani ishlatish:
```bash
psql $DATABASE_URL < backend/migrations/001_init.sql
```

---

## 👥 Foydalanuvchi rollari (RBAC)

| Rol | Huquqlar |
|-----|---------|
| `super_admin` | Barcha amallar, foydalanuvchi boshqaruvi, sozlamalar |
| `editor` | Kontent CRUD, blog, loyihalar, media |
| `hr` | Vakansiyalar CRUD, kontakt xabarlarni ko'rish |

---

## 🚀 Production Deploy

```bash
# 1. SSL sertifikat (Let's Encrypt)
certbot certonly --standalone -d primestack.uz -d www.primestack.uz

cp /etc/letsencrypt/live/primestack.uz/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/primestack.uz/privkey.pem nginx/ssl/

# 2. Environment variables sozlash
cp backend/.env.example backend/.env
# JWT_SECRET, DATABASE_URL, ADMIN_PASSWORD ni o'zgartiring!

# 3. Build va ishga tushirish
docker-compose -f docker-compose.yml up -d --build

# 4. Loglarni kuzatish
docker-compose logs -f
```

---

## 📁 Loyiha tuzilmasi

```
primestack/
├── frontend/                   # Next.js frontend
│   ├── app/                    # App Router sahifalar
│   │   ├── page.tsx            # Bosh sahifa
│   │   ├── about/              # Biz haqimizda
│   │   ├── services/           # Xizmatlar
│   │   ├── projects/           # Portfolio
│   │   ├── team/               # Jamoa
│   │   ├── blog/               # Blog
│   │   ├── careers/            # Vakansiyalar
│   │   ├── contact/            # Kontakt
│   │   └── admin/              # Admin panel
│   │       ├── page.tsx        # Login
│   │       ├── layout.tsx      # Admin sidebar
│   │       ├── dashboard/      # Dashboard
│   │       ├── services/       # Xizmatlar boshqaruvi
│   │       ├── projects/       # Loyihalar boshqaruvi
│   │       ├── team/           # Jamoa boshqaruvi
│   │       ├── blog/           # Blog boshqaruvi
│   │       ├── vacancies/      # Vakansiyalar
│   │       ├── messages/       # Xabarlar
│   │       └── settings/       # Sozlamalar
│   ├── components/
│   │   ├── layout/             # Navbar, Footer
│   │   ├── sections/           # Hero, Services, Projects, ...
│   │   ├── admin/              # AdminTable va boshqalar
│   │   ├── ui/                 # SectionBadge, AnimatedSection, ...
│   │   └── providers/          # QueryProvider
│   └── Dockerfile
│
├── backend/                    # Go backend
│   ├── cmd/server/main.go      # Entry point
│   ├── internal/
│   │   ├── config/             # Environment config
│   │   ├── handlers/           # HTTP handlers
│   │   ├── middleware/         # Auth, CORS, rate limit
│   │   ├── models/             # Data models
│   │   └── server/             # Router va server
│   ├── migrations/             # SQL migratsiyalar
│   └── Dockerfile
│
├── nginx/
│   └── nginx.conf              # Nginx konfiguratsiya
│
├── docker-compose.yml          # To'liq stack
└── README.md
```

---

## ✅ Acceptance Criteria

- [x] Responsive ishlashi (mobile, tablet, desktop)
- [x] Admin CRUD (services, projects, team, blog, vacancies)
- [x] Auth va role-based access control (RBAC)
- [x] SEO: SSR/ISR, sitemap.xml, robots.txt, Open Graph
- [x] Kontakt formasi DB ga yoziladi
- [x] Docker deploy konfiguratsiyasi
- [x] README va API dokumentatsiyasi

---

## 📄 Litsenziya

© 2026 PRIMESTACK. Barcha huquqlar himoyalangan.
