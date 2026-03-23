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
INSERT INTO services (title, slug, short_description, "order", is_active) VALUES
('Web ilovalar', 'web-apps', 'Next.js, React va zamonaviy texnologiyalar bilan tezkor web platformalar.', 1, true),
('Mobil ilovalar', 'mobile-apps', 'Flutter va React Native bilan iOS/Android uchun native-quality ilovalar.', 2, true),
('Cloud yechimlar', 'cloud', 'AWS, GCP va DigitalOcean''da skalalanadigan infratuzilma xizmatlari.', 3, true),
('UI/UX Dizayn', 'design', 'Foydalanuvchi tajribasini birinchi o''ringa qo''yuvchi estetik dizayn.', 4, true),
('Backend & API', 'backend', 'Go, Python va Node.js bilan kuchli, xavfsiz backend tizimlar.', 5, true),
('Xavfsizlik audit', 'security', 'Ilovangiz xavfsizligini tekshirish va himoya strategiyalari.', 6, true)
ON CONFLICT DO NOTHING;

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
