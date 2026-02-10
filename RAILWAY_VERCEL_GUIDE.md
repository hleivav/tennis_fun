# Tennis Fun - Railway Deployment Checklist

## Före deployment

- [ ] Pusha all kod till GitHub
- [ ] Se till att `application-prod.properties` finns i `BE/src/main/resources/`
- [ ] Se till att `system.properties` finns i `BE/`

## Railway Backend Setup

### 1. Skapa nytt projekt
1. Gå till [railway.app](https://railway.app)
2. Klicka "New Project"
3. Välj "Deploy from GitHub repo"
4. Välj Tennis_fun repository
5. Railway upptäcker Spring Boot och börjar bygga

### 2. Lägg till PostgreSQL
1. I ditt Railway-projekt, klicka "+ New"
2. Välj "Database"
3. Välj "Add PostgreSQL"
4. Railway skapar automatiskt databasen och sätter `DATABASE_URL`

### 3. Konfigurera miljövariabler
I Railway projekt → Variables (eller Settings → Variables):

**Obligatoriska:**
```
SPRING_PROFILES_ACTIVE=prod
```

**Valfria (sätts automatiskt):**
- `PORT` (Railway sätter automatiskt)
- `DATABASE_URL` (sätts automatiskt när du lägger till PostgreSQL)

### 4. Uppdatera CORS efter Vercel deployment
När du har din Vercel-URL, lägg till:
```
cors.allowed.origins=https://your-app.vercel.app,http://localhost:5173
```

## Vercel Frontend Setup

### 1. Skapa nytt projekt
1. Gå till [vercel.com](https://vercel.com)
2. Klicka "Add New..." → "Project"
3. Importera Tennis_fun från GitHub

### 2. Konfigurera build settings
- **Framework Preset**: Vite
- **Root Directory**: `FE` ⚠️ VIKTIGT!
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `dist` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

### 3. Lägg till miljövariabler
I Vercel Project Settings → Environment Variables:

**Production:**
```
VITE_API_URL=https://web-production-XXXX.up.railway.app/api
```
(Ersätt med din Railway-URL)

**Preview (optional):**
```
VITE_API_URL=https://web-production-XXXX.up.railway.app/api
```

### 4. Deploy
Klicka "Deploy" - Vercel bygger och deployar automatiskt

## Efter deployment

### Testa applikationen
1. Gå till din Vercel-URL: `https://your-app.vercel.app`
2. Logga in:
   - Email: `admin@admin.se`
   - Password: `admin123`
3. Testa skapa en turnering
4. Kontrollera att data sparas (refresha sidan)

### Felsökning

**Problem: Frontend kan inte nå backend**
- Öppna DevTools (F12) → Network tab
- Kolla att requests går till rätt URL
- Verifiera `VITE_API_URL` i Vercel environment variables
- Se till att URL slutar med `/api` (t.ex. `https://xxx.railway.app/api`)

**Problem: CORS error**
- Gå till Railway → Variables
- Lägg till `cors.allowed.origins=https://your-app.vercel.app`
- Railway kommer automatiskt redeploya

**Problem: Backend startar inte**
- Gå till Railway → Deployments → Latest deployment → Logs
- Kolla efter fel i loggarna
- Vanliga problem:
  - `DATABASE_URL` saknas → Lägg till PostgreSQL service
  - Java version fel → Kontrollera `system.properties` (java.runtime.version=17)
  - Build fails → Kontrollera att alla dependencies finns i `pom.xml`

**Problem: 404 på React routes (t.ex. /admin)**
- Kontrollera att `vercel.json` finns i `FE/` mappen
- Vercel borde automatiskt hantera rewrites

## Tips

- **Auto-deploy**: Både Railway och Vercel deployer automatiskt när du pushar till main/master
- **Logs**: Använd Railway och Vercel dashboards för att se logs i realtid
- **Free tier limits**: 
  - Railway: $5 gratis credit per månad
  - Vercel: 100 GB bandbredd per månad
- **Custom domain**: Du kan lägga till egen domän i båda plattformarna

## Nästa deploy

När du gör ändringar:
1. Commita och pusha till GitHub
2. Railway och Vercel deployer automatiskt
3. Vänta 1-2 minuter på build
4. Testa ändringarna live

## Kostnader

**Railway:**
- Gratis: $5 kredit/månad
- Efter gratis kredit: ~$0.000463 per GB transfer
- PostgreSQL inkluderad

**Vercel:**
- Hobby (gratis): 100 GB bandbredd, unlimited requests
- Mycket generöst för hobby-projekt

För Tennis Fun-appen borde gratis tiers räcka gott och väl! 🎾
