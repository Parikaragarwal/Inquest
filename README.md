# 📖 Inquest — Thoughtful Enquiries & Data Engine

> *"We usually rely on intuition, but we shouldn't. Because at the end, it is structured data that is truly reliable."*

**Inquest** is an end-to-end form creation, distribution, and data analysis system. Built on the metaphor of a physical diary/journal page, Inquest blends high-contrast neomorphic UX aesthetics with end-to-end type safety, real-time theming, granular security controls, and empirical analytical visualization.

---

## 🏗 System Architecture

Inquest is architected as an end-to-end type-safe monorepo powered by **Turborepo** and **pnpm workspaces**:

```mermaid
graph TD
    subgraph Client Layer
        Web["apps/web (Next.js 16 App Router)"]
    end

    subgraph API Layer
        API["apps/api (Express + tRPC Server)"]
        Scalar["apps/api (/docs Scalar OpenAPI)"]
    end

    subgraph Shared Monorepo Packages
        TRPC["packages/trpc (Type-safe Routers & Procedures)"]
        Services["packages/services (Domain Business Logic)"]
        DB["packages/database (Drizzle ORM + Schema)"]
        Logger["packages/logger (Winston Logger)"]
    end

    subgraph Data & Infrastructure Layer
        Postgres[(PostgreSQL 15 Database)]
        Redis[(Redis Cache & Rate Limiter)]
    end

    Web -->|tRPC / React Query| API
    API --> TRPC
    TRPC --> Services
    Services --> DB
    Services --> Redis
    DB --> Postgres
    API --> Scalar
```

### Monorepo Structure

```
Inquest/
├── apps/
│   ├── api/                 # Express REST & tRPC server + OpenAPI docs (/docs)
│   └── web/                 # Next.js 16 client application (Dashboard & Builder)
├── packages/
│   ├── database/            # Drizzle ORM schemas, migrations, and PostgreSQL connection
│   ├── logger/              # Shared Winston logger implementation
│   ├── services/            # Core business domain services (Form, Submission, User, OTP)
│   ├── trpc/                # Shared tRPC server routers, procedures, and context
│   └── typescript-config/   # Shared tsconfig definitions across workspaces
├── scripts/
│   └── deploy.sh            # Automated zero-downtime deployment script with locks & traps
├── docker-compose.dev.yml   # Local development PostgreSQL & Redis container stack
└── docker-compose.yml       # Production container orchestration setup
```

---

## 🛠 Tech Stack

| Domain | Technology | Description |
| :--- | :--- | :--- |
| **Monorepo** | Turborepo, pnpm Workspaces | Build orchestration, shared packages, and caching |
| **Frontend** | Next.js 16 (App Router), React 19 | Server & Client Components, Dynamic Imports |
| **Styling & UX** | Tailwind CSS v4, Framer Motion, Neomorphism | Warm diary palette, custom neomorphic input components |
| **API Transport** | tRPC v11, @tanstack/react-query | End-to-end TypeScript safety without manual code generation |
| **API Gateway** | Express.js, trpc-to-openapi, Scalar | Dual tRPC + REST OpenAPI 3.0 documentation suite at `/docs` |
| **Database & ORM**| PostgreSQL 15, Drizzle ORM | Type-safe SQL schema definitions, migrations, and queries |
| **Caching & Auth** | Redis, JsonWebToken | Rate limiting, OTP throttling, session management |
| **Email Delivery** | Resend API | Passwordless 6-digit OTP delivery |

---

## 🗄 Database Schema

The database consists of 5 core relational tables managed by **Drizzle ORM**:

```
+----------------+       +----------------+       +------------------+
|     users      | 1   * |     forms      | 1   * |   form_fields    |
+----------------+-------+----------------+-------+------------------+
| id (UUID)      |       | id (UUID)      |       | id (UUID)        |
| email          |       | created_by     |       | form_id (FK)     |
| full_name      |       | title          |       | label            |
| avatar_url     |       | description    |       | type             |
| created_at     |       | secure_code    |       | required         |
+----------------+       | is_open        |       | order_index      |
                         | requires_auth  |       | validation(JSONB)|
                         | theme (JSONB)  |       +------------------+
                         +----------------+
                                 | 1
                                 |
                                 *
                         +----------------+
                         |    answers     |
                         +----------------+
                         | id (UUID)      |
                         | form_id (FK)   |
                         | submitted_by   |
                         | response_data  |
                         | created_at     |
                         +----------------+
```

---

## 🗝 Core Feature Architecture

### 1. Passwordless Auth & Session Management
- **Email OTP**: 6-digit login codes issued via Resend and cached in Redis with expiration and rate limits.
- **Google OAuth 2.0**: Seamless single sign-on redirect flow.
- **HttpOnly JWT Cookies**: Cross-site, secure authentication tokens with 240-day retention (`authentication-token`).

### 2. Form Builder Engine (3-Step Wizard)
- **Step 1: Build**: 10 interactive field types (`Text`, `TextArea`, `Number`, `Single Select`, `Multi Select`, `Rating`, `Date`, `Phone`, `Email`, `URL`) with custom validation constraints (min/max, regex pattern, character caps). Features full drag-and-drop reordering.
- **Step 2: Theme**: Real-time live dual-mode renderer (Light parchment vs. Dark moonlit lake) with customizable background textures, accent colors, and surface hues.
- **Step 3: Publish**: Access control configuration (public vs. passcode protected) and shareable asset generation.
- **Draft Safety**: Auto-saves working state to `localStorage` (`inquest_draft_[id]`). If unsaved changes exist, an amber warning banner appears, editor borders glow with terracotta pulse animation, and direct share URLs/QR codes are safely hidden until saved.

### 3. Neomorphic & Diary Visual Aesthetics
- **Contrast-Enhanced Neomorphic Inputs**: `neo-input` CSS design pattern with soft inner shadows (`box-shadow: inset ...`) in both light parchment and dark moonlit modes.
- **Placeholder Safety**: New questions present an empty field with `"Untitled Question"` as a placeholder hint, preventing accidental submission of placeholder values.
- **Self-Hosted Assets**: Zero third-party network bottlenecks; background textures are preloaded from `/images/` for instant initial paint.

### 4. Granular Access & Quick Actions
- **Dashboard Quick-Action Toggles**: One-click toggles directly on form cards for **Accepting Responses** (`isOpenForSubmission`) and **Require Login** (`requiresAuth`).
- **Misclick Protection**: Every quick action opens an explicit confirmation dialog before executing the backend mutation.
- **Passcode Embedding Settings**: Granular toggles to include or omit passcodes in direct links and QR codes, with real-time security impact warnings.

### 5. Structured Analytics Engine
- **Chronological Velocity**: Visual response timeline charts breakdown submission velocity across time windows.
- **Field Metric Aggregations**: Automatic computation of min, max, average, and frequency distributions for rating and numeric fields.

---

## ⚡ Local Development Setup

### Prerequisites
- Node.js >= 18
- pnpm >= 9
- Docker & Docker Compose

### One-Command Setup

Run the integrated setup command from the project root. This command spins up PostgreSQL and Redis containers, generates database schemas, executes migrations, purges caches, and launches the development server:

```bash
pnpm dev:setup
```

### Available Development Scripts

```bash
# Full local environment setup (Docker + Migrations + Clean Cache + Dev Server)
pnpm dev:setup

# Start only the local Docker infrastructure (PostgreSQL on :5432, Redis on :6379)
pnpm dev:infra

# Clean all build & Turborepo cache artifacts
pnpm dev:clean

# Run development servers manually (Web on :3000, API on :8000)
pnpm dev

# Execute Drizzle database migrations
pnpm db:migrate

# Generate Drizzle schema types
pnpm db:generate
```

---

## 🌐 Environment Variables (.env)

| Variable | Description | Default / Local Value |
| :--- | :--- | :--- |
| `NODE_ENV` | Application runtime environment | `development` |
| `API_PORT` | Port for Express API server | `8000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://postgres:postgres@localhost:5432/dev` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `JWT_SECRET` | Secret key used for signing session JWTs | `inquest_local_dev_jwt_secret_key_12345` |
| `CLIENT_URL` | Public URL of Next.js frontend | `http://localhost:3000` |
| `BASE_URL` | Base URL of Express API server | `http://localhost:8000` |
| `NEXT_PUBLIC_API_URL` | Public API endpoint for Next.js browser queries | `http://localhost:8000` |
| `RESEND_API_KEY` | Resend email API credential | `re_...` |
| `GOOGLE_OAUTH_CLIENT_ID` | OAuth 2.0 Client ID for Google Login | `...apps.googleusercontent.com` |
| `GOOGLE_OAUTH_CLIENT_SECRET` | OAuth 2.0 Client Secret | `GOCSPX-...` |

---

## 📖 API Documentation & OpenAPI

Inquest automatically exposes a complete **OpenAPI 3.0** specification generated directly from the tRPC router schema.

- **Interactive API Documentation (Scalar)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Raw OpenAPI JSON Spec**: [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)

---

## 🚀 VPS Production Deployment

Deployments to VPS production environments run under a 3-layer architecture (`control/`, `infra/`, `projects/inquest`).

Refer to [DEPLOYMENT.md](file:///home/parikar/Projects/Inquest/DEPLOYMENT.md) for full deployment instructions, GitHub Actions CI/CD pipelines, log rotation setups, and Nginx reverse proxy configurations.
