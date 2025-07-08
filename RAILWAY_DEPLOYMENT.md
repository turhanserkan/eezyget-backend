# 🚀 Railway Deployment Guide

## Adım 1: Railway Hesabı
1. **railway.app** sitesine git
2. GitHub ile giriş yap
3. **New Project** → **Deploy from GitHub repo**

## Adım 2: Repository Hazırla
1. GitHub'da yeni repo oluştur: `eezyget-backend`
2. `backend/` klasörü içeriğini upload et:
   ```
   backend/
   ├── src/
   ├── package.json
   ├── railway.json
   ├── Procfile
   └── .env.railway
   ```

## Adım 3: Railway'de Deploy
1. GitHub repo'yu seç
2. **Root Directory**: `/` (backend klasörü root olacak)
3. **Build Command**: `npm install`
4. **Start Command**: `npm start`

## Adım 4: Environment Variables
Railway dashboard'da ekle:
```
NODE_ENV=production
CORS_ORIGINS=https://eezyget.com,https://www.eezyget.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Adım 5: Domain
1. Railway size URL verecek: `your-app.railway.app`
2. Custom domain: `api.eezyget.com` (opsiyonel)

## Adım 6: Frontend Güncelle
Railway URL'i alıp JavaScript dosyalarında güncelle:
```javascript
// assets/js/script.js ve download.js
const API_BASE_URL = 'https://your-app.railway.app';
```

## ✅ Test
- `https://your-app.railway.app/health` → Status: OK
- Frontend'den API çağrıları test et

## 💰 Maliyet
- **İlk 500 saat/ay**: Ücretsiz
- **Sonrası**: ~$5/ay

---
**Sonraki Adım**: Frontend'i Hostinger'a deploy et!