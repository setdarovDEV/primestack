-- PRIMESTACK Database Schema
-- Run with: psql $DATABASE_URL < migrations/001_init.sql

-- ─── Extensions ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Roles ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO roles (name) VALUES ('super_admin'), ('editor'), ('hr') ON CONFLICT DO NOTHING;

-- ─── Users ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            BIGSERIAL PRIMARY KEY,
    full_name     VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id       INT REFERENCES roles(id) DEFAULT 2,
    status        VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    last_login    TIMESTAMPTZ,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Default super admin (password: admin123 hashed)
-- Change this in production!
INSERT INTO users (full_name, email, password_hash, role_id, status)
VALUES ('Super Admin', 'admin@primestack.uz', '$2b$10$B0QmQloNFoaSLKmgIvs56e6Kbkkq374Bsk1qqYdJrhwTVpiPPSFAq', 1, 'active')
ON CONFLICT DO NOTHING;

-- ─── SEO Meta ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS seo_meta (
    id          BIGSERIAL PRIMARY KEY,
    title       VARCHAR(255),
    description TEXT,
    og_image    VARCHAR(500),
    canonical   VARCHAR(500),
    keywords    TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Pages ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pages (
    id         BIGSERIAL PRIMARY KEY,
    title      VARCHAR(255) NOT NULL,
    slug       VARCHAR(255) NOT NULL UNIQUE,
    body       TEXT,
    status     VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published')),
    seo_meta_id BIGINT REFERENCES seo_meta(id),
    "order"    INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);

-- ─── Services ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS services (
    id                BIGSERIAL PRIMARY KEY,
    title             VARCHAR(255) NOT NULL,
    slug              VARCHAR(255) NOT NULL UNIQUE,
    short_description TEXT,
    full_content      TEXT,
    icon              VARCHAR(100),
    cover_image       VARCHAR(500),
    "order"           INT DEFAULT 0,
    is_active         BOOLEAN DEFAULT TRUE,
    seo_meta_id       BIGINT REFERENCES seo_meta(id),
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_slug ON services(slug);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active);

-- Seed services
UPDATE services
SET slug = 'web-development'
WHERE slug = 'web-apps'
  AND NOT EXISTS (SELECT 1 FROM services s2 WHERE s2.slug = 'web-development');

UPDATE services
SET slug = 'cloud-devops'
WHERE slug = 'cloud'
  AND NOT EXISTS (SELECT 1 FROM services s2 WHERE s2.slug = 'cloud-devops');

UPDATE services
SET slug = 'ui-ux-design'
WHERE slug = 'design'
  AND NOT EXISTS (SELECT 1 FROM services s2 WHERE s2.slug = 'ui-ux-design');

UPDATE services
SET slug = 'backend-development'
WHERE slug = 'backend'
  AND NOT EXISTS (SELECT 1 FROM services s2 WHERE s2.slug = 'backend-development');

UPDATE services
SET slug = 'cybersecurity'
WHERE slug = 'security'
  AND NOT EXISTS (SELECT 1 FROM services s2 WHERE s2.slug = 'cybersecurity');

INSERT INTO services (title, slug, short_description, full_content, icon, "order", is_active) VALUES
(
  'Web dasturlash',
  'web-development',
  'Biz zamonaviy, tezkor va mobilga mos web saytlar hamda web ilovalar yaratamiz.',
  '{"features":["SSR/CSR Next.js","REST API / GraphQL","Admin panel yaratish","Responsive dizayn","SEO optimization"],"use_cases":["Korporativ saytlar","E-commerce platformalar","Startup loyihalar","Landing page"]}',
  'code',
  1,
  true
),
(
  'Mobil ilovalar',
  'mobile-apps',
  'Android va iOS uchun tezkor va foydalanuvchi qulay mobil ilovalar ishlab chiqamiz.',
  '{"features":["Flutter / React Native","Push notification","API integratsiya","Offline ishlash","UI/UX optimizatsiya"],"use_cases":["Startup ilovalar","Online xizmatlar","Delivery tizimlar","Fintech ilovalar"]}',
  'smartphone',
  2,
  true
),
(
  'Cloud va DevOps',
  'cloud-devops',
  'Server, deploy va infratuzilmani avtomatlashtiramiz va optimizatsiya qilamiz.',
  '{"features":["AWS / DigitalOcean","CI/CD pipeline","Docker / Kubernetes","Server monitoring","Auto scaling"],"use_cases":["Yuqori yuklama tizimlar","Startup backend","SaaS platformalar"]}',
  'cloud',
  3,
  true
),
(
  'Backend development',
  'backend-development',
  'Kuchli, xavfsiz va tez ishlaydigan server tomon logikalarni ishlab chiqamiz.',
  '{"features":["Node.js / Laravel / Django","REST API","Authentication & Security","Database optimization","Microservices"],"use_cases":["Mobil ilovalar backend","Web platformalar","CRM / ERP tizimlar"]}',
  'database',
  4,
  true
),
(
  'UI/UX dizayn',
  'ui-ux-design',
  'Foydalanuvchi tajribasiga asoslangan zamonaviy va chiroyli dizaynlar yaratamiz.',
  '{"features":["Figma / Adobe XD","Wireframe & Prototype","UX research","Design system","Mobile-first dizayn"],"use_cases":["Mobil ilovalar","Web saytlar","Dashboardlar"]}',
  'palette',
  5,
  true
),
(
  'Kiberxavfsizlik',
  'cybersecurity',
  'Tizimlaringizni xavfsizligini ta''minlaymiz va zaifliklarni aniqlaymiz.',
  '{"features":["Penetration testing","Security audit","Data protection","Firewall sozlash","Monitoring"],"use_cases":["Bank tizimlari","Startup platformalar","Korporativ tizimlar"]}',
  'shield',
  6,
  true
),
(
  'SEO va marketing',
  'seo-marketing',
  'Saytingizni Google''da yuqoriga olib chiqamiz va trafikni oshiramiz.',
  '{"features":["SEO audit","Keyword research","On-page SEO","Analytics","Content strategy"],"use_cases":["Biznes saytlar","Online do''konlar","Blog platformalar"]}',
  'chart',
  7,
  true
),
(
  'AI va chatbotlar',
  'ai-chatbots',
  'Sun''iy intellekt asosida chatbot va avtomatlashtirilgan tizimlar yaratamiz.',
  '{"features":["Telegram botlar","AI chatbot (GPT)","Automation","CRM integratsiya"],"use_cases":["Customer support","Sales automation","Lead generation"]}',
  'cpu',
  8,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  short_description = EXCLUDED.short_description,
  full_content = EXCLUDED.full_content,
  icon = EXCLUDED.icon,
  "order" = EXCLUDED."order",
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

UPDATE services
SET is_active = false, updated_at = NOW()
WHERE slug IN ('web-apps', 'cloud', 'design', 'backend', 'security');

-- ─── Projects ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
    id          BIGSERIAL PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    slug        VARCHAR(255) NOT NULL UNIQUE,
    client      VARCHAR(255),
    summary     TEXT,
    result_kpi  VARCHAR(255),
    tech_stack  VARCHAR(500),
    gallery     TEXT[], -- array of URLs
    cover_image VARCHAR(500),
    category    VARCHAR(100),
    year        VARCHAR(10),
    status      VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published')),
    seo_meta_id BIGINT REFERENCES seo_meta(id),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- ─── Team Members ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_members (
    id          BIGSERIAL PRIMARY KEY,
    full_name   VARCHAR(255) NOT NULL,
    position    VARCHAR(255) NOT NULL,
    bio         TEXT,
    photo       VARCHAR(500),
    department  VARCHAR(100),
    linkedin_url VARCHAR(500),
    github_url  VARCHAR(500),
    website_url VARCHAR(500),
    "order"     INT DEFAULT 0,
    visible     BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Categories ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    slug       VARCHAR(100) NOT NULL UNIQUE,
    type       VARCHAR(50) NOT NULL, -- blog | project
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Blog Posts ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blog_posts (
    id           BIGSERIAL PRIMARY KEY,
    title        VARCHAR(500) NOT NULL,
    slug         VARCHAR(500) NOT NULL UNIQUE,
    excerpt      TEXT,
    content      TEXT,
    cover_image  VARCHAR(500),
    category_id  BIGINT REFERENCES categories(id),
    tags         TEXT[],
    author_id    BIGINT REFERENCES users(id),
    status       VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled')),
    published_at TIMESTAMPTZ,
    read_time    INT DEFAULT 5,
    seo_meta_id  BIGINT REFERENCES seo_meta(id),
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published_at DESC);

-- ─── Vacancies ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vacancies (
    id          BIGSERIAL PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    department  VARCHAR(100),
    level       VARCHAR(50),
    location    VARCHAR(255),
    description TEXT,
    apply_url   VARCHAR(500),
    status      VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vacancies_status ON vacancies(status);

-- ─── Contact Messages ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_messages (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    company     VARCHAR(255),
    phone       VARCHAR(50),
    email       VARCHAR(255) NOT NULL,
    message     TEXT NOT NULL,
    source_page VARCHAR(255),
    status      VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'spam')),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_created ON contact_messages(created_at DESC);

-- ─── Telegram Bot Leads ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS bot_project_leads (
    id                BIGSERIAL PRIMARY KEY,
    telegram_user_id  BIGINT NOT NULL,
    telegram_chat_id  BIGINT NOT NULL,
    telegram_username VARCHAR(100),
    full_name         VARCHAR(255) NOT NULL,
    company           VARCHAR(255),
    phone             VARCHAR(50),
    email             VARCHAR(255),
    project_type      VARCHAR(100),
    budget            VARCHAR(100),
    deadline          VARCHAR(100),
    description       TEXT NOT NULL,
    status            VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'won', 'lost', 'archived')),
    source            VARCHAR(30) DEFAULT 'telegram_bot',
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bot_project_leads_status ON bot_project_leads(status);
CREATE INDEX IF NOT EXISTS idx_bot_project_leads_created ON bot_project_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bot_project_leads_user ON bot_project_leads(telegram_user_id);

-- ─── Telegram Bot Sessions (multi-step intake) ──────────────
CREATE TABLE IF NOT EXISTS bot_lead_sessions (
    chat_id       BIGINT PRIMARY KEY,
    user_id       BIGINT NOT NULL,
    username      VARCHAR(100),
    current_step  VARCHAR(50) NOT NULL,
    payload       JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bot_lead_sessions_updated ON bot_lead_sessions(updated_at DESC);

-- ─── Telegram Admins (max 3 active managed by API) ──────────
CREATE TABLE IF NOT EXISTS telegram_admins (
    id               BIGSERIAL PRIMARY KEY,
    telegram_user_id BIGINT NOT NULL UNIQUE,
    display_name     VARCHAR(255),
    username         VARCHAR(100),
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telegram_admins_active ON telegram_admins(is_active);

-- ─── Media Files ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS media_files (
    id          BIGSERIAL PRIMARY KEY,
    file_name   VARCHAR(500) NOT NULL,
    mime_type   VARCHAR(100),
    size        BIGINT,
    storage_key VARCHAR(500) NOT NULL UNIQUE,
    url         VARCHAR(500),
    alt_text    VARCHAR(255),
    uploaded_by BIGINT REFERENCES users(id),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Site Settings ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_settings (
    key        VARCHAR(100) PRIMARY KEY,
    value      TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO site_settings (key, value) VALUES
('site_name', 'PRIMESTACK'),
('tagline', 'Premium IT Solutions'),
('email', 'hello@primestack.uz'),
('phone', '+998 90 000 00 00'),
('address', 'Toshkent, Yunusobod, IT Park'),
('footer_text', '© 2026 PRIMESTACK. Barcha huquqlar himoyalangan.'),
('twitter', 'https://twitter.com/primestack'),
('linkedin', 'https://linkedin.com/company/primestack'),
('github', 'https://github.com/primestack'),
('instagram', 'https://instagram.com/primestack'),
('youtube', 'https://youtube.com/@primestack')
ON CONFLICT DO NOTHING;

-- ─── Audit Logs ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT REFERENCES users(id),
    action      VARCHAR(50) NOT NULL,  -- create | update | delete | login
    resource    VARCHAR(100) NOT NULL, -- services | projects | users | ...
    resource_id VARCHAR(50),
    detail      TEXT,
    ip          VARCHAR(50),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
