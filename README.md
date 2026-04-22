# Scout Panel

Plataforma fullstack para scouts de fútbol. Buscá, filtrá y compará jugadores con gráficos estadísticos, historial de lesiones y shortlist personal. Estilo visual inspirado en LDP + Sofascore.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 14 (App Router) · TypeScript · Tailwind CSS · **HeroUI** (anteriormente NextUI) · Zustand · Recharts · React-hot-toast |
| Backend | Node.js 20 · Express 4 · Drizzle ORM · Zod |
| Base de datos | PostgreSQL 16 |
| Auth | JWT dual-token (access 15 min + refresh 7 días) · cookie httpOnly · bcrypt |
| Tests | Vitest · Supertest · Playwright |
| Deploy | Docker Compose (local) · Vercel + Render + Supabase (prod) |

---

## Enlaces y entornos

### Producción

| Qué | Enlace |
|-----|--------|
| **Panel (frontend, Vercel)** | https://scout-panel-ldp.vercel.app |
| **API (backend, Render)** | Recomendado en Vercel: `NEXT_PUBLIC_API_URL=/api` + `BACKEND_PROXY_URL=https://<tu-backend>` para mantener cookies first-party.

**Usuarios demo** (misma contraseña para todos: **`123456`**):

| Email | Uso típico |
|-------|------------|
| `demo@gmail.com` | Prueba manual del panel |
| `productionuser@gmail.com` | Cuenta extra de demo en el seed |

> La base en producción (Supabase) puede tardar unos segundos en el primer request si el proyecto estaba pausado (free tier). Ver nota al final del README.

### Desarrollo local

| Qué | Enlace / host |
|-----|----------------|
| **Frontend (Next.js)** | http://localhost:3000 |
| **Backend (Express, API)** | http://localhost:4000/api |
| **Postgres (Docker Compose)** | `localhost:5433` — credenciales por defecto en `docker-compose.yml` / `.env.example` (`POSTGRES_*`) |

Con `npm run dev` en `frontend/` y `backend/` (sin Docker para las apps), la DB puede levantarse solo con `docker compose up db -d` y `DATABASE_URL` apuntando al puerto mapeado.

Las mismas cuentas demo y contraseña **`123456`** aplican tras correr `npm run db:seed` en el backend contra esa base.

---

## Features implementadas

### Obligatorias (MVP)
- Búsqueda y filtros: por posición, nacionalidad, equipo, rango de edad
- Comparador side-by-side de hasta 3 jugadores con radar chart overlay y tabla comparativa
- Schema con 9 tablas relacionales y seed generado con IA (30 clubes, 61 jugadores, 4 temporadas, etc — datos ficticios/aleatorios, no reales)
- Tests: **unit (Vitest) en frontend** · **integration (Vitest + Supertest) en backend** (5 suites: auth, players, teams, shortlist, analytics) · **E2E (Playwright)** con happy path y smoke para prod
- Docker Compose — toda la infraestructura levanta con un comando
- README con instrucciones, decisiones técnicas y mejoras pendientes

### Bonus implementados
- Auth JWT (registro + login) con shortlist persistida en DB
- Responsive — mobile, tablet y desktop
- Performance — paginación en listado
- UX — loading skeletons, empty states, transiciones
- Historial de lesiones por jugador con correlación en line chart de rating — un período se resalta en rojo si el jugador estuvo lesionado **≥50% de los días** de ese mes o año (no con cualquier toque de lesión)
- Vista **reportes** y export a PDF y Excel 
- Sección **clubes** para elegir un equipo y ver todos sus jugadores
- **Mercado de transferencias** — valor de mercado, evolución temporal y contexto de fichaje (tipo de contrato en datos y filtros)
- **Historial de valores** — gráfico con valor de mercado por mes/año; meses o años con lesión resaltados en rojo (umbral ≥50% del período) para leer rendimiento + disponibilidad
- **Fortalezas y debilidades** — perfil cualitativo del jugador (rasgos de scouting) visible en la ficha junto a lo numérico
- **Heatmap de posición** — cancha táctica en la ficha del jugador para ver zonas de actuación según su rol (cuando aplica a la posición)

---

## Flujo de trabajo

Primero se armó **documentación y criterios** con **Claude** en el chat de **Claude Code** (modelado, README, decisiones). El **código** se avanzó en gran parte con **Google Antigravity**; después, al **subir de plan en Cursor**, se cerraron features, refactors y la entrega final sobre el mismo repo.

La arquitectura y las etapas de implementación siguieron un orden claro para no mezclar concerns y validar cada capa antes de la siguiente:

1. **Planificación** — alcance MVP, modelo de datos y rutas principales.
2. **Core** — decisiones de stack, estructura de carpetas (`backend/` + `frontend/`), contratos generales.
3. **Backend** — Express, Drizzle, `schema.ts`, rutas REST, auth JWT, seed.
4. **Frontend** — Next.js App Router, listado, ficha, comparador base, integración con API, **HeroUI / NextUI** (`@nextui-org/react`) para inputs, selects y patrones de UI.
5. **Segunda ola (v2)** — más analítica en backend (`/api/analytics`) y en frontend: reportes, export PDF/Excel, sección **clubes**, refinos de UX y datos en ficha.
6. **Tests** — Vitest + Supertest en endpoints; unit en lógica y store del front; Playwright para E2E y smoke contra prod.
7. **Docker y deploy online** — `docker-compose` reproducible; despliegue en Vercel + Render + Supabase.

### Agentes y herramientas en el IDE

Se integró al flujo el sistema **GSD** (*get-shit-done*, TÂCHES — https://github.com/gsd-build/get-shit-done): *meta-prompting*, *context engineering* y desarrollo **guiado por specs** pensado para **Claude Code**. Orquesta mejor **plan → implementación → revisión**, acota el contexto al código relevante y ordena los pasos para que el modelo no “dispare” cambios fuera de lugar. Sirve para **cerrar features** con menos deriva y para **code review** estructurado (checklist, severidad, diffs acotados).

En **Cursor** se conectaron **MCPs** (ver también fila en *Decisiones técnicas*):

- **PostgreSQL** — consultas e inspección contra el esquema real al tocar migraciones, seeds o índices.
- **Sequential Thinking** — razonamiento por pasos explícitos en tareas que cruzan backend y frontend (ej. orden: API → tipos → UI → tests).

### Bruno (API) en lugar de Postman

Para **probar y documentar** las llamadas HTTP del backend se usó **[Bruno](https://www.usebruno.com/)** en lugar de Postman: principalmente para pruebas del backend.

### Ramas Git del plan de implementación inicial

El desarrollo se ejecutó **por ramas**, alineadas al orden del plan (núcleo → API → front → analítica v2 → tests), con integración hacia `main`. El `docker-compose.yml` de la raíz documenta el stack local y se fue alineando con esas ramas.

| Orden | Rama | Rol aproximado |
|------:|------|----------------|
| 1 | `feat/core` | Base del proyecto: stack, estructura `backend/` + `frontend/`, primeros criterios |
| 2 | `feat/backend-api` | Express, Drizzle, `schema`, rutas REST, auth JWT, seed |
| 3 | `feat/frontend` | Next.js App Router, listado, ficha, comparador, consumo de API |
| 4 | `feat/advanced-analytics-v2` | Segunda ola: `/api/analytics`, reportes, export PDF/Excel, clubes, refinos de ficha |
| 5 | `feat/testing` | Vitest + Supertest (integración backend), unit en front, Playwright E2E |
| — | `main` | Rama estable (referencia de despliegue) |

### Cómo se fueron sumando features

Después del front “base”, muchas mejoras entraron como **mini planes de implementación** (objetivo + archivos + orden): **toasts** (`react-hot-toast`), **heatmaps** en ficha, **fortalezas y debilidades** (JSONB + UI), **carrera** (`player_career` + generador), **vista clubes** y **analytics / reportes** con export. Al acercarse a entregas, se corrieron **revisores de código** sobre los últimos commits para detectar regresiones o inconsistencias antes de merge.

La documentación de columnas de base de datos vive en **[DB_DOCS.md](./DB_DOCS.md)**.

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
| Base de datos (PostgreSQL) | localhost:5433 |

Las migraciones de base de datos corren **automáticamente** al iniciar el backend.

### Abrir la app

Ir a **http://localhost:3000** en el browser. Usuarios demo y contraseñas: ver la sección **Enlaces y entornos** más arriba.

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

La suite combina **tests unitarios en el frontend**, **integración HTTP en el backend** contra la DB real y **E2E** en navegador. Cada capa apunta a un nivel distinto del stack.

### Mapa de cobertura

| Capa | Runner | Archivos | Qué cubre |
|------|--------|----------|-----------|
| **Backend — Integration** | Vitest + Supertest | `backend/src/__tests__/integration/` | **5** archivos · HTTP real contra la DB: auth, jugadores, equipos, shortlist, analytics (ver detalle abajo). La validación de payloads (Zod) se ejerce en los flujos de auth y rutas. |
| **Frontend — Unit** | Vitest (jsdom) | `frontend/src/__tests__/unit/` | 5 archivos · funciones puras y store de Zustand (ver detalle abajo) |
| **E2E** | Playwright | `global-tests/e2e-happy-path.spec.ts` | Flujo completo en browser: login → dashboard → detalle de jugador → comparar · protección de rutas · viewport mobile |

### Detalle — Backend Integration

| Archivo | Endpoints cubiertos | Casos representativos |
|---------|--------------------|-----------------------|
| `auth.integration.test.ts` | `POST /api/auth/register` · `POST /api/auth/login` · `POST /api/auth/refresh` · `POST /api/auth/logout` · `GET /api/auth/me` | 201 registro sin token ni cookie · cookie `refreshToken` httpOnly solo en login · 200 refresh con cookie válida · nuevo access token da acceso a rutas protegidas · 401 sin cookie / token adulterado · logout borra cookie (Max-Age=0) · logout idempotente · 409 duplicado · 400 body inválido |
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

Los tests **unit (frontend) e integration (backend)** corren en local o en CI antes del deploy. No tienen sentido apuntarlos contra una URL pública salvo los E2E.

Los **E2E** son los únicos que apuntan a una URL real. Están diseñados para correr en 3 entornos sin cambiar el código — solo cambia la variable `BASE_URL`. **En local** tenés que tener **frontend y backend corriendo a la vez** (por ejemplo `http://localhost:3000` y `http://localhost:4000`): Playwright abre el navegador contra el front, y las acciones de la app llaman al API; si falta uno de los dos, los tests fallan por timeouts o errores de red. En prod el deploy ya expone ambos servicios. Los tests marcados con `@smoke` (login, happy path, protección de rutas) son seguros de correr en producción porque usan el usuario demo y no generan datos sucios.

### Correr los tests

```bash
# Backend — unit + integration (requiere DB corriendo)
cd backend && npm test
cd backend && npm run test      # equivalente

# Frontend — unit
cd frontend && npm test
cd frontend && npm run test     # equivalente

# E2E — local (requiere frontend :3000 y backend :4000 corriendo)
npm run test:e2e               # headless
npm run test:e2e:headed        # con browser visible
npm run test:e2e:ui            # UI interactiva de Playwright

# E2E —  producción (solo tests @smoke)
npm run test:e2e:prod
```

> **Nota:** los tests de integración del backend usan la DB real definida en `DATABASE_URL`. Crean usuarios con emails únicos (timestamp) y los limpian en `afterAll`, por lo que no requieren una DB de test separada.

> **Importante — seed:** `db:seed` ejecuta el script compilado del backend contra **`DATABASE_URL`** (conexión directa a Postgres). Hace falta la **DB levantada** y, en Docker, el contenedor **backend** con imagen construida (`npm run db:seed` dentro del backend). **No** requiere el frontend en marcha.

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
│   ├── vitest.config.mts
│   ├── package.json
│   └── src/
│       ├── index.ts         # arranque del servidor HTTP
│       ├── app.ts           # Express: CORS (multi-origin), montaje de rutas, /health
│       ├── routes/          # auth, players, teams, seasons, shortlist, analytics
│       ├── middleware/      # errorHandler global
│       ├── helpers/         # utilidades (p. ej. generación de carrera)
│       ├── types/           # tipos TS, ampliación de Express (req.user)
│       ├── __tests__/
│       │   └── integration/ # 5 suites: auth · players · teams · shortlist · analytics
│       └── db/
│           ├── schema.ts    # tablas Drizzle (fuente de verdad)
│           ├── index.ts     # pool + instancia db
│           ├── migrations/  # SQL generado por drizzle-kit
│           ├── initial-data.ts
│           └── seed-data/   # datos por entidad (equipos, jugadores, stats…)
└── frontend/
    ├── Dockerfile
    ├── vitest.config.mts
    ├── package.json
    └── src/
        ├── app/             # Next.js App Router (rutas = URLs)
        ├── components/      # layout, home, charts, player, compare, analytics, ui (HeroUI / NextUI + Tailwind)
        ├── store/           # Zustand (auth, compare, favoritos, UI)
        ├── lib/             # cliente API (Axios), radar, export PDF/Excel
        ├── hooks/
        ├── types/
        └── __tests__/
            ├── setup.ts     # mocks globales (next/navigation, next/image, js-cookie)
            └── unit/        # utils · analyticsConfig · playerStats · radarNorm · useScoutStore
```

**Flujo resumido:** el navegador habla solo con Next.js; el frontend llama al backend con `Authorization: Bearer <accessToken>` en cada request protegido. Si el token expira (15 min), el interceptor de Axios renueva la sesión automáticamente vía `POST /api/auth/refresh` (la cookie `refreshToken` httpOnly viaja sola), reintenta el request original y el usuario no nota la interrupción. Express valida el Bearer en las rutas bajo `/api` que lo requieren. Ver sección **Autenticación** para el flujo completo.

---

## Rutas del frontend (Next.js App Router)

Rutas públicas (sin layout de dashboard):

| Ruta | Vista |
|------|--------|
| `/login` | Inicio de sesión; guarda el access token en el store (memoria) y redirige al panel. Si ya hay sesión (token en memoria o cookie de refresh válida), redirige al panel. |
| `/register` | Alta de usuario; redirige a `/login` sin abrir sesión. Si ya hay sesión, redirige al panel. |

Rutas del panel `(dashboard)` — comparten layout con **sidebar**, **topbar** y protección por token en cliente (si no hay sesión, redirección a `/login`):

| Ruta | Vista |
|------|--------|
| `/` | **Jugadores:** grid o tabla, filtros (posición, nacionalidad, equipo, edad, etc.), ordenamiento, paginación y acceso al detalle. |
| `/players/[id]` | **Ficha del jugador:** cabecera, KPIs, radar por posición, evolución de rating (line chart), stats por temporada, heatmap si aplica, historial de lesiones y carrera en clubes. |
| `/compare` | **Comparador:** hasta 3 slots; búsqueda de jugadores, selector de temporada, radar superpuesto, tabla comparativa y heatmaps. |
| `/shortlist` | **Favoritos (shortlist):** listado de jugadores guardados con datos de última temporada. (`/favorites` redirige a `/shortlist`.) |
| `/clubs` | **Clubes:** listado de equipos del sistema. |
| `/clubs/[id]` | **Detalle de club:** jugadores asociados al equipo. |
| `/analytics` | **Reportes:** métricas agregadas / leaderboard, resumen de liga, export PDF o Excel. |

La barra lateral enlaza a `/`, `/compare`, `/shortlist`, `/analytics` y `/clubs`. El buscador global (`SearchBar`) permite saltar rápido a jugadores o clubes desde cualquier vista del dashboard.

---

## Schema de base de datos (resumen)

**9 tablas:** `teams`, `seasons`, `players`, `player_stats`, `player_ratings`, `player_injuries`, `player_career`, `users`, `shortlist_entries`. Además, enum PostgreSQL `contract_type` en la tabla `players`.

Documentación ampliada (columnas, relaciones, seed vs runtime, checklist y diferencias frente a `doc/ScoutPanel_V5 (1).txt`): **[DB_DOCS.md](./DB_DOCS.md)**.

### Datos seed

El seed (`backend/src/db/initial-data.ts` + `backend/src/db/seed-data/*`) **limpia** las tablas (incluye `shortlist_entries`) y vuelve a cargar **equipos, temporadas, jugadores, stats por temporada, ratings mensuales, lesiones, carrera y usuarios demo**. Los **favoritos** no vienen precargados: los crea cada usuario desde la app.

Resumen para contexto rápido: nombres de clubes y jugadores del torneo argentino en plantillas; **fotos** con URL estable de Fotmob; **stats** reales parciales en `real-player-stats.seed.ts` donde exista fila; el resto de métricas, **lesiones**, variaciones y **heatmaps** salen de **plantillas por posición + aleatoriedad controlada**; **fortalezas/debilidades** desde listas por posición; **carrera** con `career-generator`. Objetivo: volumen creíble sin inflar el repo ni depender de datos 100% verificados.

Los datos de seed fueron **generados con IA** y no son todos reales la mayoría. Gran parte de los valores (estadísticas, historial de lesiones, valores de mercado, carreras) fueron creados de forma aleatoria para poder poblar la base de datos sin sobrecargar tokens ni inflar el archivo de seed con datos reales. El volumen exacto cargado es:

| Entidad | Cantidad |
|---------|----------|
| Clubes (`teams`) | 30 |
| Jugadores (`players`) | 61 |
| Temporadas (`seasons`) | 4 |

---

## Autenticación

El sistema usa un esquema de **dos tokens JWT** separados, sin almacenamiento de sesión en base de datos (stateless):

| Token | Dónde vive | Duración | Secret |
|-------|-----------|----------|--------|
| **access token** | Memoria (Zustand store) · Header `Authorization: Bearer` | 15 min | `JWT_SECRET` |
| **refresh token** | Cookie `httpOnly` · `path: /api/auth` · no legible desde JS | 7 días | `JWT_SECRET_REFRESH` |

### Flujo paso a paso

**1. Registro (`POST /api/auth/register`)**
- Crea el usuario en la base de datos y responde `201` con `{ ok: true, user }` **sin** JWT ni cookie: no hay sesión hasta que el usuario vaya a `/login`.

**2. Login (`POST /api/auth/login`)**
- El frontend envía email y contraseña.
- El backend valida credenciales, firma access y refresh con secrets distintos y duraciones distintas.
- La respuesta JSON incluye `{ token, user }` (access token + datos del usuario).
- La cookie `refreshToken` se setea con flags `httpOnly`, `secure` (solo prod) y `sameSite: None` (prod) / `Lax` (dev), `path: /api/auth`.
- El frontend guarda el `accessToken` en el store de Zustand **en memoria** solamente (no `localStorage`, no otra cookie).

**3. Requests protegidos**
- El interceptor de Axios adjunta `Authorization: Bearer <accessToken>` en cada request.
- `requireAuth` en el backend solo acepta Bearer; ya no lee cookies para rutas de negocio.

**4. Access token expirado (401 silencioso)**
- Cuando cualquier request devuelve 401, el interceptor llama a `POST /api/auth/refresh` usando una instancia Axios sin interceptor (`plainApi`) para evitar bucles infinitos.
- El backend lee la cookie `refreshToken`, la verifica con `JWT_SECRET_REFRESH` y comprueba que el usuario siga existiendo en DB.
- Si la cookie es válida, devuelve un nuevo `{ token, user }` en JSON.
- El interceptor guarda el nuevo token en el store y reintenta el request original con el Bearer actualizado. **El usuario no nota la interrupción.**
- Si múltiples requests fallan a la vez, se encolan y esperan al mismo refresh (patrón `refreshSubscribers`).
- Si el refresh también falla (cookie expirada o revocada), se limpia el store y se redirige a `/login` con un toast.

**5. Restaurar sesión tras F5 o nueva pestaña**
- Al montar el dashboard layout, si el store no tiene token (memoria limpia), se llama automáticamente a `POST /api/auth/refresh`.
- La cookie `refreshToken` viaja con el request (gracias a `withCredentials: true`) y el backend devuelve un nuevo access token.
- `setAuth(token, user)` carga el token en memoria y el usuario queda autenticado sin pasar por el login.

**6. Logout**
- El frontend llama a `POST /api/auth/logout`.
- El backend elimina la cookie con `clearCookie` usando exactamente los mismos flags (`httpOnly`, `secure`, `sameSite`, `path`) que al setearla (necesario para que el borrado funcione cross-origin).
- El frontend llama a `clearAuth()` y limpia el store.

### Variables de entorno relevantes

```
JWT_SECRET="..."           # Firma los access tokens
JWT_SECRET_REFRESH="..."   # Firma los refresh tokens (secret independiente)
JWT_EXPIRATION_ACCESS="15m"
JWT_EXPIRATION_REFRESH="7d"
NEXT_PUBLIC_API_URL="/api" # Recomendado en prod para calls same-origin
BACKEND_PROXY_URL="https://tu-backend.onrender.com" # Rewrite server-side en Next.js
NEXT_PUBLIC_ALLOW_CROSS_ORIGIN_API="false" # Solo "true" en casos excepcionales
```

---

## API REST (rutas principales)

**Base URL:** `http://localhost:4000` — los endpoints de negocio viven bajo **`/api/...`**.

### Autenticación (`/api/auth`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Body JSON: `email`, `password`, `name` → crea usuario y responde `201` con `{ ok: true, user }`. **No** emite tokens ni cookies; el cliente debe ir a login. |
| POST | `/api/auth/login` | No | Body JSON: `email`, `password` → `{ token, user }` y cookie `refreshToken` (httpOnly, 7d). |
| POST | `/api/auth/refresh` | Cookie | Lee la cookie `refreshToken` httpOnly, verifica con `JWT_SECRET_REFRESH`, consulta que el usuario siga en DB y devuelve un nuevo `{ token, user }` (access 15 min). Usado por el interceptor Axios y en el bootstrap de sesión tras F5. |
| POST | `/api/auth/logout` | No | Borra la cookie `refreshToken` (clearCookie con los mismos flags que al setear). |
| GET | `/api/auth/me` | Bearer | Perfil actualizado del usuario autenticado (requiere access token válido). |

### Jugadores, equipos y temporadas

Todas requieren **JWT** en `Authorization: Bearer …`.

| Método | Ruta | Descripción breve |
|--------|------|-------------------|
| GET | `/api/players` | Listado paginado con filtros (posición, nacionalidad, equipo, edad, valor, rating, etc.) y ordenamiento. |
| GET | `/api/players/nationalities` | Lista de nacionalidades distintas (para filtros). |
| GET | `/api/players/search?q=` | Autocomplete: jugadores y equipos que coinciden con `q`. |
| GET | `/api/players/compare?ids=1,2,3` | Comparación (API: hasta **10** IDs; la UI del comparador usa **3** slots); `seasonId` opcional (si falta, temporada más reciente). |
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

## Decisiones técnicas

| Área | Tecnología / Decisión | Razón |
|---|---|---|
| ORM | Drizzle (vs Prisma) | Más liviano, TypeScript nativo, sin generación de código. |
| Estado global | Zustand (vs Redux) | Sin boilerplate, suficiente para la complejidad del panel. |
| Charts | Recharts (vs Chart.js) | Radar nativo, integración React de primera clase. |
| UI de componentes | **HeroUI** (antes **NextUI**; paquete npm `@nextui-org/react`) | El proyecto sigue el paquete legacy mientras exista migración oficial a `@heroui/*`. Sobre Tailwind: `Input`, `Select`, `Avatar`, modales y estilos coherentes con menos CSS custom; se combina con clases propias (`sharedStyles`, tema oscuro LDP). |
| Infra local | Docker Compose | Todo el stack levanta con un comando. |
| Auth | JWT dual-token (access 15 min + refresh 7 días) con secrets separados. Cookie `refreshToken` httpOnly restringida a `path: /api/auth`; access token solo en memoria. Interceptor Axios renueva en silencio en 401 y encola requests simultáneos. | Reduce la ventana de exposición del access token sin forzar re-login frecuente; la cookie httpOnly es inaccesible desde JS (mitiga XSS). |
| Ratings en DB | JSONB en `player_ratings` | Flexibilidad temporal sin saturar la UI con columnas fijas. |
| Comparador | `seasonId` explícito por request | Garantiza comparación justa entre jugadores. |
| Lesiones | Tabla separada `player_injuries` + umbral ≥50% | Permite filtrar por temporada y tipo; mantiene `players` limpia. El marcado rojo en gráficos requiere ≥50% de cobertura del período (mes o año) — lesiones breves no distorsionan la lectura visual. |
| Panel de filtros | Drawer lateral (portal) + Zustand | Filtros combinados sin romper el layout; portal resuelve z-index y scroll en mobile. Parte del estado (filtros de búsqueda, `pageSize`, comparador, sidebar) **persiste en `localStorage`** vía middleware `persist` de Zustand. |
| Skeletons | Componentes custom con shimmer (`framer-motion`) | Replican la forma exacta de cada vista, eliminando layout shift. |
| Reportes | Leaderboard client-side + export PDF/Excel (SheetJS/jsPDF) | Filtrado instantáneo sin round-trips; dataset por temporada es acotado. |
| Clubes | Vista dedicada `/clubs` + `/clubs/[id]` | Contexto de plantel completo reutilizando `/api/teams` sin endpoints extra. |
| Tests unitarios | Vitest en **frontend** — lógica pura (radar, stats, store, utils) | Cubre normalización de radar, stats, límite del comparador (3) y utilidades sin montar toda la UI. El backend se valida principalmente por **integración** (Supertest + DB). |
| Tests de integración | Vitest + Supertest contra DB real | Valida contrato HTTP real (status, JSON shape, JWT) sin mocks que enmascaren bugs. |
| Tests E2E | Playwright con `@smoke` tags | Happy path en browser real; smoke corre automáticamente post-deploy en prod. |
| Proceso con IA | **GSD** (*get-shit-done*, TÂCHES) para **Claude Code** | Sistema liviano de meta-prompting, *context engineering* y desarrollo por especificación: mejor orden de trabajo, menos contexto ruidoso y revisiones acotadas al repo. Repo: https://github.com/gsd-build/get-shit-done |
| Herramientas IDE | **MCPs** — PostgreSQL + Sequential Thinking (Cursor) | Postgres ancla decisiones de esquema y datos; Sequential Thinking desglosa cambios multi-capa antes de tocar código (menos errores de orden entre API, tipos y UI). |
| Exploración HTTP | **Bruno** (en lugar de Postman) | Colecciones versionables y entornos por URL de API; ver sección *Bruno (API)* en *Flujo de trabajo*. |

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

- **Historial partido a partido** — tabla o timeline por encuentro: rival, competición, minutos, goles, asistencias, rating del partido, resultado; para contextualizar el rendimiento (no es lo mismo un buen partido contra un grande de Primera que contra un equipo de menor exigencia). Base para comparar evolución real frente al calendario.
- **Roles y permisos** — distinción scout vs admin (lectura vs gestión de seeds/usuarios) si el producto crece.
- **Internacionalización** — opción para inglés o español si el panel deja de ser solo mercado local.
- **Perfil de jugador enriquecido y filtrable** — vista de “ficha extendida” con secciones colapsables o tabs, y filtros dentro del perfil (por temporada, rival, competición) sin salir de la ficha.
- **Rate limiting**
- **Integración con API real** — Transfermarkt / SofaScore (o feed propio) para datos y planteles actualizados.
- **Notas en shortlist** — `PATCH /api/shortlist/:playerId` + campo en UI (el `note` ya existe en DB).
- **Auth más robusta** — recuperación de contraseña y verificación de email en registro/cambio de credenciales; rotación de refresh token en cada uso (refresh token rotation) para detectar reutilización; tabla `refresh_tokens` en DB para revocación server-side al logout.
- **Accesibilidad** — foco visible, orden de tab, `aria-*` en tablas/filtros, contraste en gráficos, pruebas con axe o Playwright a11y.
- **Observabilidad** — logs estructurados, `request-id`, Sentry (o similar) en front y back en producción.
- **Contrato de API** — OpenAPI/Swagger generado a partir de Zod o rutas para documentar y versionar (`/api/v1`).
- **Búsqueda avanzada** — índices full-text en Postgres (`pg_trgm` / `tsvector`) para nombres y clubes; mejoraría el autocomplete en búsquedas largas y con errores tipográficos.
- **Evolución de valor de mercado mensual real** — el gráfico mensual usa una oscilación sintética (`Math.sin`) como aproximación visual porque el modelo no almacena el valor mes a mes, solo por temporada. Requeriría una tabla `player_market_values` con granularidad mensual o una fuente externa.

---

## Nota sobre producción (Supabase gratuito)

La base en producción corre en **Supabase en plan gratuito**. En ese tier el proyecto puede **pausarse** si no recibe tráfico durante un rato; al volver a usarlo, el primer arranque puede tardar **varios segundos** (cold start) hasta que Postgres responda con normalidad. No es un fallo del código: es habitual en el free tier. Para probar con respuesta inmediata, usá el **setup con Docker** (sección más arriba en este README).