# Tennis Fun

Ett fullstack-projekt för tennishantering med React frontend och Spring Boot backend.

## Projektstruktur

```
Tennis_Fun/
├── FE/          # Frontend (React + Vite)
└── BE/          # Backend (Spring Boot)
```

## Frontend (FE)

### Teknologier
- React 18
- Vite
- JavaScript
- Axios för API-anrop
- React Router för routing

### Komma igång

```bash
cd FE
npm install
npm run dev
```

Frontend körs på: http://localhost:5173

## Backend (BE)

### Teknologier
- Java 17
- Spring Boot 3.2.2
- Spring Web
- Spring Data JPA
- Lombok
- H2 Database (utveckling)
- MySQL Driver (produktion)
- Spring Boot DevTools
- Validation

### Komma igång

```bash
cd BE
mvn spring-boot:run
```

Backend körs på: http://localhost:8080

### H2 Console
Tillgänglig på: http://localhost:8080/h2-console
- JDBC URL: jdbc:h2:mem:tennisfundb
- Username: sa
- Password: (lämna tomt)

## API Endpoints

- `GET /api/health` - Kontrollera backend-status

## Utveckling

Projektet är konfigurerat för lokal utveckling med:
- Hot reload i både frontend och backend
- CORS konfigurerad för lokal utveckling
- H2 in-memory databas för snabb utveckling
- Möjlighet att byta till MySQL för produktion

## Nästa steg

1. Installera beroenden i frontend: `cd FE && npm install`
2. Starta backend: `cd BE && mvn spring-boot:run`
3. Starta frontend: `cd FE && npm run dev`
