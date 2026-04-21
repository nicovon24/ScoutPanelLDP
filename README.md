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
| Tests | Vitest · Supertest · Playwright |
| Deploy | Docker Compose (local) · Vercel + Railway + Supabase (prod) |

---

## Features implementadas

### Obligatorias (MVP)
- Búsqueda y filtros: por posición, nacionalidad, equipo, rango de edad
- Comparador side-by-side de hasta 3 jugadores con radar chart overlay y tabla comparativa
- Schema con 9 tablas relacionales y seed generado con IA (30 clubes, 61 jugadores, 4 temporadas, etc — datos ficticios/aleatorios, no reales)
- Tests en 4 capas: unit (Vitest) en backend y frontend · integration (Vitest + Supertest) para todos los endpoints · E2E (Playwright) con happy path y smoke tests para staging/prod
- Docker Compose — toda la infraestructura levanta con un comando
- README con instrucciones, decisiones técnicas y mejoras pendientes

### Bonus implementados
- Auth JWT (registro + login) con shortlist persistida en DB
- Responsive — mobile, tablet y desktop
- Performance — paginación en listado
- UX — loading skeletons, empty states, transiciones
- Historial de lesiones por jugador con correlación en line chart de rating
- Vista **reportes** y export a PDF y Excel 
- Sección **clubes** para elegir un equipo y ver todos sus jugadores
- Historial de valores del mercado con gráfico mensual; meses con lesión se muestran en rojo

---

## Setup con Docker (recomendado)

**Requisito único:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo.

### Primera vez

```bash
# 1. Crear el archivo de variables de entorno (los defaults ya funcionan)
cp .env.example .env

# 2. Buildear y levantar los 3 servicios
docker compose up --build

# 3. Cargar los datos iniciales (jugadores, equipos, temporadas)
docker compose exec backend npm run db:seed
```

Esto construye las imágenes y levanta:

| Servicio | URL |
|----------|-----|
| Frontend (Next.js) | http://localhost:3000 |
| Backend (Express API) | http://localhost:4000/api |
| Base de datos (PostgreSQL) | localhost:5432 |

Las migraciones de base de datos corren **automáticamente** al iniciar el backend.

### Abrir la app

Ir a **http://localhost:3000** en el browser.

**Usuario demo:** `demo@gmail.com` / `123456`

### Comandos útiles

```bash
# Ver logs en tiempo real
docker compose logs -f

# Ver logs de un servicio en particular
docker compose logs -f backend

# Detener todos los contenedores
docker compose down

# Detener y borrar la base de datos (reset completo)
docker compose down -v

# Rebuild después de cambios en código
docker compose up --build
```

---

## Setup local (modo desarrollo)

Para desarrollo con hot-reload, sin Docker para frontend/backend:

```bash
# 1. Levantar solo la DB en Docker
docker compose up db -d

# 2. Backend
cd backend
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

## Tests

La suite está organizada en **4 capas independientes**. Cada capa testea un nivel distinto del stack, sin duplicados reales entre ellas.

### Mapa de cobertura

| Capa | Runner | Archivos | Qué cubre |
|------|--------|----------|-----------|
| **Backend — Unit** | Vitest (Node) | `backend/src/__tests__/unit/authSchemas.test.ts` | Schemas Zod (`loginSchema`, `registerSchema`) en aislamiento: validaciones de email, password, nombre, normalización a lowercase |
| **Backend — Integration** | Vitest + Supertest | `backend/src/__tests__/integration/` | 4 archivos · endpoints HTTP reales contra la DB (ver detalle abajo) |
| **Frontend — Unit** | Vitest (jsdom) | `frontend/src/__tests__/unit/` | 5 archivos · funciones puras y store de Zustand (ver detalle abajo) |
| **E2E** | Playwright | `global-tests/e2e-happy-path.spec.ts` | Flujo completo en browser: login → dashboard → detalle de jugador → comparar · protección de rutas · viewport mobile |

### Detalle — Backend Integration

| Archivo | Endpoints cubiertos | Casos representativos |
|---------|--------------------|-----------------------|
| `players.integration.test.ts` | `GET /api/players` · `/nationalities` · `/search` · `/compare` · `/:id` | paginación · filtro por posición · búsqueda · 400 ID inválido · 404 no encontrado · protección JWT |
| `teams.integration.test.ts` | `GET /api/teams` · `GET /api/teams/:id` | array de equipos con campos obligatorios · roster de jugadores · 400 ID inválido · 404 no encontrado · protección JWT |
| `shortlist.integration.test.ts` | `GET /api/shortlist` · `/ids` · `POST /:playerId` · `DELETE /:playerId` | agregar/quitar favorito · idempotencia (sin duplicados) · 400 ID inválido · 404 jugador no existe · 404 entrada no encontrada al borrar · protección JWT |
| `analytics.integration.test.ts` | `GET /api/analytics/leaderboard` · `/summary` | ranking secuencial · todas las métricas válidas · filtro por posición · limit · 400 métrica inválida · 400 seasonId inválido · protección JWT |

### Detalle — Frontend Unit

| Archivo | Módulo testeado | Casos representativos |
|---------|----------------|-----------------------|
| `utils.test.ts` | `@/lib/utils` | `calcAge` (null, fecha inválida, hoy = 0) · `posStyle` (GK/CF/CM/CB, lowercase, fallback) · `fmt` (null, decimales, strings) · `fmtPct` · `contractTypeLabel` |
| `analyticsConfig.test.ts` | `@/lib/analyticsConfig` | `formatCell` con tipos `int`, `pct`, `float`; valores null/NaN/0 |
| `playerStats.test.ts` | `@/lib/playerStats` | `posGroup` (todas las posiciones + fallback) · `reorderSections` (sección relevante primero según posición) · `fmtNum` · `asNum` · `buildRatingHistory` (modo monthly y yearly) · `buildValueHistory` |
| `radarNorm.test.ts` | `@/lib/radarNorm` | `buildSingleRadar` (valores 0-100, stats vacías, null/undefined) · `buildMultiRadar` (2 y 3 jugadores, presencia de `playerC`) |
| `useScoutStore.test.ts` | `@/store/useScoutStore` | Favoritos (add/remove/isFavorite, sin duplicados) · Comparación (cap 3, removeFromCompare, clearCompare, isInCompare) · `setSearchFilters` (merge parcial) |

Los tests **unit e integration corren antes del deploy** (en tu máquina o en GitHub Actions). Son una red de seguridad pre-deploy, no tienen sentido contra una URL deployada.

Los **E2E** son los únicos que apuntan a una URL real. Están diseñados para correr en 3 entornos sin cambiar el código — solo cambia la variable `BASE_URL`. Los tests marcados con `@smoke` (login, happy path, protección de rutas) son seguros de correr en producción porque usan el usuario demo y no generan datos sucios.

### Correr los tests

```bash
# Backend — unit + integration (requiere DB corriendo)
cd backend && npm test
cd backend && npm run test      # equivalente

# Backend — solo unit (sin DB)
cd backend && npx vitest run src/__tests__/unit

# Frontend — unit
cd frontend && npm test
cd frontend && npm run test     # equivalente

# E2E — local (requiere frontend :3000 y backend :4000 corriendo)
npm run test:e2e               # headless
npm run test:e2e:headed        # con browser visible
npm run test:e2e:ui            # UI interactiva de Playwright

# E2E — staging y producción (solo tests @smoke)
npm run test:e2e:staging
npm run test:e2e:prod
```

> **Nota:** los tests de integración del backend usan la DB real definida en `DATABASE_URL`. Crean usuarios con emails únicos (timestamp) y los limpian en `afterAll`, por lo que no requieren una DB de test separada.

> **Importante — seed:** para que `npm run db:seed` funcione correctamente, el **backend y el frontend deben estar corriendo** (ya sea vía Docker Compose o en modo local). El seed depende de que la DB esté accesible a través del backend. Con Docker: levantar primero con `docker compose up` y luego ejecutar `docker compose exec backend npm run db:seed`.

---

## Arquitectura del repositorio

Monorepo **plano** (dos aplicaciones hermanas), no `apps/frontend`. La raíz del repo contiene `docker-compose.yml`, variables de entorno y carpetas `backend/` y `frontend/`.

```
app/
├── docker-compose.yml       # PostgreSQL + build opcional backend/frontend
├── .env                     # (no versionado) copiar desde .env.example
├── .env.example             # plantilla con todas las variables documentadas
├── playwright.config.ts     # configuración E2E
├── global-tests/
│   └── e2e-happy-path.spec.ts   # tests E2E: login, flujo completo, smoke @prod
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── entrypoint.sh        # corre migraciones y luego node dist/index.js
│   ├── drizzle.config.ts
│   ├── vitest.config.ts
│   ├── package.json
│   └── src/
│       ├── index.ts         # arranque del servidor HTTP
│       ├── app.ts           # Express: CORS (multi-origin), montaje de rutas, /health
│       ├── routes/          # auth, players, teams, seasons, shortlist, analytics
│       ├── middleware/      # errorHandler global
│       ├── helpers/         # utilidades (p. ej. generación de carrera)
│       ├── types/           # tipos TS, ampliación de Express (req.user)
│       ├── __tests__/
│       │   ├── unit/        # authSchemas.test.ts — schemas Zod en aislamiento
│       │   └── integration/ # auth · players · teams · shortlist · analytics
│       └── db/
│           ├── schema.ts    # tablas Drizzle (fuente de verdad)
│           ├── index.ts     # pool + instancia db
│           ├── migrations/  # SQL generado por drizzle-kit
│           ├── initial-data.ts
│           └── seed-data/   # datos por entidad (equipos, jugadores, stats…)
└── frontend/
    ├── Dockerfile
    ├── vitest.config.ts
    ├── package.json
    └── src/
        ├── app/             # Next.js App Router (rutas = URLs)
        ├── components/      # layout, home, charts, player, compare, analytics, ui
        ├── store/           # Zustand (auth, compare, favoritos, UI)
        ├── lib/             # cliente API (Axios), radar, export PDF/Excel
        ├── hooks/
        ├── types/
        └── __tests__/
            ├── setup.ts     # mocks globales (next/navigation, next/image, js-cookie)
            └── unit/        # utils · analyticsConfig · playerStats · radarNorm · useScoutStore
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
#
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

### Datos seed

Los datos de seed fueron **generados con IA** y no son todos reales la mayoría. Gran parte de los valores (estadísticas, historial de lesiones, valores de mercado, carreras) fueron creados de forma aleatoria para poder poblar la base de datos sin sobrecargar tokens ni inflar el archivo de seed con datos reales. El volumen exacto cargado es:

| Entidad | Cantidad |
|---------|----------|
| Clubes (`teams`) | 30 |
| Jugadores (`players`) | 61 |
| Temporadas (`seasons`) | 4 |

---

## API REST (rutas principales)

**Base URL:** `http://localhost:4000` — los endpoints de negocio viven bajo **`/api/...`**.

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
| PATCH | `/api/shortlist/:playerId` | ⚠️ **Pendiente** — actualiza la nota personal del jugador. El campo `note` existe en `shortlist_entries` pero el endpoint no está implementado. |

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

- **Notas en shortlist** — implementar `PATCH /api/shortlist/:playerId` + input en la UI de favoritos (el campo `note` ya existe en la DB)
- **Botón "Comparar seleccionados"** en `/favorites` — seleccionar jugadores de la shortlist y navegar a `/compare` con IDs precargados
- **CI/CD con GitHub Actions** — lint + test (unit + integration) + build en cada PR; E2E smoke automático post-deploy
- **Rate limiting más granular** — por endpoint y por user ID además de por IP
- **Integración con API real** — Transfermarkt / SofaScore para datos actualizados
- **Refresh token** — el JWT actual expira en 7 días sin rotación automática
