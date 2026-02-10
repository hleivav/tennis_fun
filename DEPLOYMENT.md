# Tennis Fun - Deployment Guide

## Översikt
Detta projekt använder:
- **Frontend**: Vercel
- **Backend + Database**: Railway (PostgreSQL)

## Backend Deployment (Railway)

### Steg 1: Skapa Railway-projekt
1. Gå till [railway.app](https://railway.app) och logga in
2. Klicka på "New Project"
3. Välj "Deploy from GitHub repo"
4. Välj din Tennis Fun repository
5. Railway upptäcker automatiskt Spring Boot-projektet

### Steg 2: Lägg till PostgreSQL-databas
1. I ditt Railway-projekt, klicka "New"
2. Välj "Database" → "PostgreSQL"
3. Railway skapar automatiskt databasen och sätter `DATABASE_URL`

### Steg 3: Konfigurera miljövariabler
I Railway-projektets Settings → Variables, lägg till:
```
SPRING_PROFILES_ACTIVE=prod
PORT=8080
```

Railway sätter automatiskt `DATABASE_URL` för PostgreSQL.

### Steg 4: Konfigurera CORS
När du har din Vercel-URL, uppdatera `cors.allowed.origins` i Railway:
```
cors.allowed.origins=https://your-app.vercel.app
```

### Steg 5: Deploy
1. Railway deployar automatiskt vid push till main/master
2. Din backend-URL blir: `https://your-app.up.railway.app`

## Frontend Deployment (Vercel)

### Steg 1: Förbered projektet
Se till att du har kört `npm install` i FE-mappen lokalt.

### Steg 2: Uppdatera miljövariabler
Redigera `FE/.env.production`:
```
VITE_API_URL=https://your-railway-app.up.railway.app/api
```

### Steg 3: Deploy till Vercel
1. Gå till [vercel.com](https://vercel.com) och logga in
2. Klicka "Add New" → "Project"
3. Importera din GitHub-repository
4. Konfigurera projektet:
   - **Framework Preset**: Vite
   - **Root Directory**: `FE`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   
### Steg 4: Lägg till miljövariabler i Vercel
I Vercel Project Settings → Environment Variables:
```
VITE_API_URL=https://your-railway-app.up.railway.app/api
```

### Steg 5: Deploy
1. Klicka "Deploy"
2. Vercel buildar och deployar din frontend
3. Din frontend-URL blir: `https://your-app.vercel.app`

## Efter deployment

### Uppdatera CORS i Railway
När du har din Vercel-URL, gå till Railway och uppdatera miljövariabeln:
```
cors.allowed.origins=https://your-app.vercel.app,http://localhost:5173
```

### Testa applikationen
1. Besök din Vercel-URL
2. Logga in med: `admin@admin.se` / `admin123`
3. Testa att skapa en turnering
4. Kontrollera att data sparas korrekt

## Felsökning

### Frontend kan inte nå backend
- Kontrollera att `VITE_API_URL` i Vercel pekar på rätt Railway-URL
- Se till att URL:en slutar med `/api`
- Öppna browser DevTools och kolla Network-fliken

### CORS-fel
- Kontrollera att din Vercel-URL finns i `cors.allowed.origins` i Railway
- Se till att Railway-appen har startat om efter ändringen

### Database-fel
- Kontrollera att `DATABASE_URL` är satt i Railway
- Kontrollera att `SPRING_PROFILES_ACTIVE=prod` är satt
- Kolla Railway-loggarna för felmeddelanden

### Backend startar inte
- Kontrollera Railway-loggarna
- Se till att Java 17 används
- Kontrollera att `application-prod.properties` finns

## Lokal utveckling

### Backend
```bash
cd BE
./mvnw spring-boot:run
```

### Frontend
```bash
cd FE
npm install
npm run dev
```

## Tips

1. **Gratis tier-begränsningar**: Railway och Vercel har gratis tiers med begränsningar
2. **Auto-deploy**: Båda plattformarna deployer automatiskt vid push till GitHub
3. **Logs**: Använd Railway och Vercel dashboards för att se loggar
4. **Custom domains**: Du kan lägga till egna domäner i båda plattformarna
5. **Environment secrets**: Lägg aldrig känslig data i koden, använd miljövariabler

## Nästa steg

- [ ] Deploy backend till Railway
- [ ] Deploy frontend till Vercel
- [ ] Uppdatera CORS-inställningar
- [ ] Testa applikationen live
- [ ] Sätt upp riktigt användarhantering (ej hårdkodade lösenord)
- [ ] Lägg till authentication med JWT tokens
- [ ] Konfigurera custom domain (valfritt)
