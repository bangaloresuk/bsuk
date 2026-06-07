# BSUK — Bangalore Satsang Upayojana Kendra

## Repo structure

```
bsuk-repo/
├── frontend/          React + Vite app → deployed to GitHub Pages
├── business-logic/    Python microservices (booking, satsang, gallery, auth, messages, prayer-times)
├── backend/           FastAPI gateway + shared GAS client
├── requirements.txt   Python dependencies
└── render.yaml        Render deployment config
```

## Secrets — where they live

| Secret | Location |
|--------|----------|
| GAS_SCRIPT_URL | Render dashboard env vars only |
| API_KEYS | Render dashboard env vars only |
| VITE_API_URL | GitHub repo Settings → Secrets → Actions |

Nothing sensitive is in this repo. Safe to be public.

## Local development

### Backend
```bash
pip install -r requirements.txt
# Create .env at repo root (gitignored):
# GAS_SCRIPT_URL=https://script.google.com/macros/s/.../exec
# API_KEYS=bannerghatta,peenya-2nd-stage,banashankari
# ALLOWED_ORIGINS=http://localhost:5173
uvicorn backend.gateway.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
# Create .env.local (gitignored):
# VITE_API_URL=http://localhost:8000
npm install
npm run dev
```
