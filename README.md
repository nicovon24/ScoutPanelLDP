# Scout Panel

Plataforma fullstack para scouts de fútbol. Buscá, filtrá y comparar jugadores con gráficos estadísticos, historial de lesiones y shortlist personal. Estilo visual inspirado en LDP + Sofascore.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 14 (App Router) · TypeScript · Tailwind CSS · Zustand · Recharts |
| Backend | Node.js 20 · Express 4 · Drizzle ORM · Zod |
| Base de datos | PostgreSQL 16 |
| Auth | JWT + bcrypt |
| Tests | Vitest · Supertest |
| Deploy | Docker Compose (local) · Vercel + Railway + Supabase (prod) |

---

## Features implementadas

### Obligatorias (MVP)
- Búsqueda y filtros: por posición, nacionalidad, equipo, rango de edad
- Comparador side-by-side de hasta 3 jugadores con radar chart overlay y tabla comparativa
- Schema con 9 tablas relacionales y seed realista con jugadores del fútbol argentino
- Unit tests en backend y frontend con Vitest
- Docker Compose — toda la infraestructura levanta con un comando
- README con instrucciones, decisiones técnicas y mejoras pendientes

### Bonus implementados
- Auth JWT (registro + login) con shortlist persistida en DB
- Responsive — mobile, tablet y desktop
- Performance — paginación en listado, índices compuestos en DB
- UX — loading skeletons, empty states, transiciones
- Historial de lesiones por jugador con correlación en line chart de rating
- Export a PDF y Excel desde la vista **Reportes** (tablas de analytics)
- Sección clubes para elegir un equipo y ver todos sus jugadores

---

## Setup local

**Requisitos:** Node.js 20 LTS y Docker Desktop.

```bash
# 1. Clonar el repo
git clone <repo-url> && cd app

# 2. Variables de entorno
cp doc/env.example .env
# (editar .env si querés cambiar credenciales — los defaults funcionan)

# 3. Levantar toda la infraestructura con Docker
docker-compose up -d

# Esto levanta: PostgreSQL (5432) + Backend (4000) + Frontend (3000)
# Migraciones y seed: el contenedor del backend solo arranca la API; hay que
# ejecutarlos una vez (ver abajo) o usar el flujo "solo DB + npm run dev".
```

**Primera vez con Docker (migraciones + seed en el contenedor del backend):**

```bash
docker-compose exec backend npm run db:migrate
docker-compose exec backend npm run db:seed
```

`NEXT_PUBLIC_API_URL` del frontend debe apuntar a la API con sufijo **`/api`** (por ejemplo `http://localhost:4000/api`) para que el cliente Axios coincida con las rutas de Express.

Abrir **http://localhost:3000** en el browser.

**Usuario demo:** `demo@gmail.com` / `123456`

---

## Setup local (modo desarrollo)

Para desarrollo con hot-reload, sin Docker para frontend/backend:

```bash
# 1. Levantar solo la DB en Docker
docker-compose up db -d

# 2. Backend
cd backend
cp ../doc/env.example .env   # ajustar DATABASE_URL si es necesario
npm install
npm run db:migrate
npm run db:seed
npm run dev                  # http://localhost:4000

# 3. Frontend (nueva terminal)
cd frontend
npm install
npm run dev                  # http://localhost:3000
```

---

## Correr tests

```bash
# Backend (unit tests)
cd backend && npm test

# Frontend (unit tests) — requiere instalar dependencias de test
cd frontend
npm install -D vitest @vitejs/plugin-react @testing-library/jest-dom jsdom
npm test
```

---

## Arquitectura del repositorio

Monorepo **plano** (dos aplicaciones hermanas), no `apps/frontend`. La raíz del repo contiene `docker-compose.yml`, variables de entorno y carpetas `backend/` y `frontend/`.

```
app/
├── docker-compose.yml       # PostgreSQL + build opcional backend/frontend
├── .env                     # (no versionado) copiar desde doc/env.example
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── drizzle.config.ts
│   ├── package.json
│   └── src/
│       ├── index.ts         # arranque del servidor HTTP
│       ├── app.ts           # Express: CORS, montaje de rutas, /health
│       ├── routes/          # auth, players, teams, seasons, shortlist, analytics
│       ├── middleware/      # errorHandler global
│       ├── helpers/         # utilidades (p. ej. generación de carrera)
│       ├── types/           # tipos TS, ampliación de Express (req.user)
│       └── db/
│           ├── schema.ts    # tablas Drizzle (fuente de verdad)
│           ├── index.ts     # pool + instancia db
│           ├── migrations/  # SQL generado por drizzle-kit
│           ├── initial-data.ts
│           └── seed-data/   # datos por entidad (equipos, jugadores, stats…)
└── frontend/
    ├── Dockerfile
    ├── package.json
    └── src/
        ├── app/             # Next.js App Router (rutas = URLs)
        ├── components/     # layout, home, charts, player, compare, analytics, ui
        ├── store/          # Zustand (auth, compare, favoritos, UI)
        ├── lib/            # cliente API (Axios), radar, export PDF/Excel
        ├── hooks/
        └── types/
```

**Flujo resumido:** el navegador habla solo con Next.js; el frontend llama al backend con `Authorization: Bearer <JWT>` (salvo registro/login). Express valida el token en las rutas bajo `/api` que lo requieren.

---

## Rutas del frontend (Next.js App Router)

Rutas públicas (sin layout de dashboard):

| Ruta | Vista |
|------|--------|
| `/login` | Inicio de sesión; guarda JWT en store + cookie y redirige al panel. |
| `/register` | Alta de usuario; mismo flujo de token que login. |

Rutas del panel `(dashboard)` — comparten layout con **sidebar**, **topbar** y protección por token en cliente (si no hay sesión, redirección a `/login`):

| Ruta | Vista |
|------|--------|
| `/` | **Jugadores:** grid o tabla, filtros (posición, nacionalidad, equipo, edad, etc.), ordenamiento, paginación y acceso al detalle. |
| `/players/[id]` | **Ficha del jugador:** cabecera, KPIs, radar por posición, evolución de rating (line chart), stats por temporada, heatmap si aplica, historial de lesiones y carrera en clubes. |
| `/compare` | **Comparador:** hasta 3 slots; búsqueda de jugadores, selector de temporada, radar superpuesto, tabla comparativa y heatmaps. |
| `/favorites` | **Favoritos (shortlist):** listado de jugadores guardados con datos de última temporada. |
| `/clubs` | **Clubes:** listado de equipos del sistema. |
| `/clubs/[id]` | **Detalle de club:** jugadores asociados al equipo. |
| `/analytics` | **Reportes:** métricas agregadas / leaderboard, resumen de liga, export PDF o Excel. |

La barra lateral enlaza a `/`, `/compare`, `/favorites`, `/analytics` y `/clubs`. El buscador global (`SearchBar`) permite saltar rápido a jugadores o clubes desde cualquier vista del dashboard.

---

## Schema de base de datos (resumen)

**9 tablas:** `teams`, `seasons`, `players`, `player_stats`, `player_ratings`, `player_injuries`, `player_career`, `users`, `shortlist_entries`. Además, enum PostgreSQL `contract_type` en la tabla `players`.

Detalle de campos y decisiones: `doc/ScoutPanel_Documentacion_V5.txt` y `backend/src/db/schema.ts`.

---

## API REST (rutas principales)

**Base URL:** `http://localhost:4000` — los endpoints de negocio viven bajo **`/api/...`**. Health check sin prefijo API:

| Método | Ruta | Auth |
|--------|------|------|
| GET | `/health` | No — estado del servidor |

### Autenticación (`/api/auth`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Body JSON: email, password, name → crea usuario y devuelve JWT. |
| POST | `/api/auth/login` | No | Body JSON: email, password → JWT. |
| GET | `/api/auth/me` | JWT | Perfil del usuario autenticado. |

### Jugadores, equipos y temporadas

Todas requieren **JWT** en `Authorization: Bearer …`.

| Método | Ruta | Descripción breve |
|--------|------|-------------------|
| GET | `/api/players` | Listado paginado con filtros (posición, nacionalidad, equipo, edad, valor, rating, etc.) y ordenamiento. |
| GET | `/api/players/nationalities` | Lista de nacionalidades distintas (para filtros). |
| GET | `/api/players/search?q=` | Autocomplete: jugadores y equipos que coinciden con `q`. |
| GET | `/api/players/compare?ids=1,2,3` | Comparación; `seasonId` opcional (si falta, usa la temporada más reciente). |
| GET | `/api/players/:id` | Detalle: jugador con stats, ratings, lesiones, carrera, equipo. |
| GET | `/api/teams` | Listado de equipos. |
| GET | `/api/teams/:id` | Detalle de un equipo. |
| GET | `/api/seasons` | Temporadas disponibles. |

### Shortlist (`/api/shortlist`)

Todas requieren **JWT**.

| Método | Ruta | Descripción breve |
|--------|------|-------------------|
| GET | `/api/shortlist` | Favoritos del usuario con jugador + equipo + última stat. |
| GET | `/api/shortlist/ids` | Solo los `playerId` en favoritos (checks rápidos en UI). |
| POST | `/api/shortlist/:playerId` | Agrega jugador a favoritos (ID en la URL). |
| DELETE | `/api/shortlist/:playerId` | Quita jugador de favoritos. |

### Analytics (`/api/analytics`)

Requieren **JWT**. Parámetros concretos (métricas, `seasonId`, límites): ver `backend/src/routes/analytics.ts`.

| Método | Ruta | Descripción breve |
|--------|------|-------------------|
| GET | `/api/analytics/leaderboard` | Ranking de jugadores por métrica configurable. |
| GET | `/api/analytics/summary` | Resumen agregado para reportes / cards de liga. |

---

## Paleta de colores LDP

| Variable | Hex | Uso |
|---|---|---|
| Background | `#0F0F0F` | Fondo principal |
| Textos | `#F2F2F2` | Texto sobre fondos oscuros |
| Primario | `#00E094` | Botones, badges, radar fill, mejor valor en comparador |
| Secundario A | `#0C65D4` | Links, botones secundarios |
| Secundario B | `#7533FC` | Tags de posición, acentos, gradientes |
| Alerta lesión | `#E53E3E` | Puntos de lesión en line chart |
| Tipografía | Nunito Sans | Todos los textos |

---

## Qué mejoraría con más tiempo

- **Rate limiting más granular** — por endpoint y por user ID además de por IP
- **Integración con API real** — Transfermarkt / SofaScore para datos actualizados
- **CI/CD con GitHub Actions** — lint + test + build en cada PR
- **Más métricas** — xA acumulado, duelos 1v1 detallados, heatmaps de posición
- **WebSockets** — notificaciones en tiempo real para cambios en shortlist compartida
