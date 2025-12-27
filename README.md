# ResellerHub AI 🚀

SaaS Platform untuk **Reseller & Dropshipper Indonesia** dengan AI-powered features.

## 🛠️ Tech Stack

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Backend**: Vercel Serverless Functions
- **Database**: Turso (SQLite Cloud)
- **AI**: Groq API (Llama 3.1)
- **Payment**: Bank Transfer (Manual Confirmation)

## 📁 Struktur Project

```
resellerhub-ai/
├── *.html              # Frontend pages
├── css/                # Stylesheets
├── js/                 # Client-side JavaScript
├── lib/                # Shared utilities
│   ├── db.js           # Turso database
│   ├── groq.js         # Groq AI client
│   └── auth.js         # JWT auth
├── api/                # Vercel serverless functions
│   ├── auth/           # Authentication
│   ├── products/       # Product CRUD
│   ├── analytics/      # Dashboard stats
│   ├── ai/             # AI features
│   ├── payment/        # Bank transfer
│   └── plans/          # Subscription plans
├── vercel.json         # Vercel config
├── package.json        # Dependencies
└── .env.example        # Environment template
```

## 🚀 Deployment ke Vercel

### 1. Setup Turso Database

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Login
turso auth login

# Create database
turso db create resellerhub-prod

# Get URL dan token
turso db show resellerhub-prod --url
turso db tokens create resellerhub-prod
```

### 2. Setup Groq API

1. Buka https://console.groq.com
2. Sign up / Login
3. Create API Key
4. Copy dan simpan API Key

### 3. Push ke GitHub

```bash
# Initialize git
git init
git add .
git commit -m "Initial commit"

# Create repo di GitHub lalu:
git remote add origin https://github.com/USERNAME/resellerhub-ai.git
git branch -M main
git push -u origin main
```

### 4. Deploy ke Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Set environment variables
vercel env add TURSO_DATABASE_URL production
vercel env add TURSO_AUTH_TOKEN production
vercel env add GROQ_API_KEY production
vercel env add JWT_SECRET production
vercel env add BANK_NAME production
vercel env add BANK_ACCOUNT_NUMBER production
vercel env add BANK_ACCOUNT_NAME production

# Deploy production
vercel --prod
```

### 5. Initialize Database

Setelah deploy, panggil endpoint ini sekali:

```bash
curl -X POST https://your-app.vercel.app/api/init
```

## 💰 Konfigurasi Payment

Set environment variables untuk rekening bank:

```env
BANK_NAME=BCA
BANK_ACCOUNT_NUMBER=1234567890
BANK_ACCOUNT_NAME=Nama Anda
```

## 🔑 Environment Variables

| Variable | Description |
|----------|-------------|
| `TURSO_DATABASE_URL` | URL database Turso |
| `TURSO_AUTH_TOKEN` | Auth token Turso |
| `GROQ_API_KEY` | API key Groq |
| `JWT_SECRET` | Secret untuk JWT (random string) |
| `BANK_NAME` | Nama bank untuk transfer |
| `BANK_ACCOUNT_NUMBER` | Nomor rekening |
| `BANK_ACCOUNT_NAME` | Nama pemilik rekening |

## 📱 Fitur

- ✅ User Registration & Login
- ✅ Product Management (CRUD)
- ✅ Price Intelligence
- ✅ Multi-Platform Sync UI
- ✅ Analytics Dashboard
- ✅ Profit Calculator
- ✅ AI Suggestions (Groq)
- ✅ Bank Transfer Payment
- ✅ Subscription Plans

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/products` | Get products |
| POST | `/api/products` | Create product |
| PUT | `/api/products/[id]` | Update product |
| DELETE | `/api/products/[id]` | Delete product |
| GET | `/api/analytics/dashboard` | Dashboard stats |
| POST | `/api/ai/suggest` | AI suggestions |
| GET | `/api/plans` | Get plans |
| POST | `/api/payment/create` | Create payment |
| POST | `/api/payment/confirm` | Confirm payment |
| POST | `/api/init` | Init database |

## 📄 License

MIT
