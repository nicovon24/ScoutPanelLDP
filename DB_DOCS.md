# Scout Panel — documentación técnica (DB y seed)

Referencia para tech lead: modelo de datos en PostgreSQL, qué pobla el seed y qué queda en runtime. La fuente de verdad del esquema es `backend/src/db/schema.ts`.

---

## Checklist: tablas en el código (9 + enum)

Si comparás con otro documento (p. ej. *ScoutPanel_V5*), estas son las **9 tablas físicas** y el **enum** que existen hoy en migraciones / Drizzle:

| # | Tabla SQL | Rol |
|---|-----------|-----|
| 1 | `teams` | Clubes |
| 2 | `seasons` | Temporadas (año + nombre) |
| 3 | `players` | Jugadores + FK a `teams` + enum `contract_type` |
| 4 | `player_stats` | Métricas agregadas **por jugador y temporada** (incluye `heatmap_data` JSONB) |
| 5 | `player_ratings` | Rating **mensual** por temporada (`rating_by_month` JSONB + `season_rating`) |
| 6 | `player_injuries` | Lesiones por jugador/temporada |
| 7 | `player_career` | Pasos de carrera (club, rango de años, apps, goles) |
| 8 | `users` | Cuentas (auth) |
| 9 | `shortlist_entries` | Favoritos por usuario (`user_id` + `player_id`, opcional `note`) |

**Enum PostgreSQL:** `contract_type` → valores `PERMANENT`, `LOAN`, `FREE` (columna en `players`).

**Lo que no es tabla:** los reportes / leaderboard (`/api/analytics/*`) se calculan con queries sobre `player_stats` (y joins); **no hay tabla `analytics`**.

---

## Enum PostgreSQL

| Nombre | Valores | Uso |
|--------|---------|-----|
| `contract_type` | `PERMANENT`, `LOAN`, `FREE` | Columna `players.contract_type` (default `PERMANENT`). |

---

## Esquema SQL — todas las columnas

Nombres de columna en **snake_case** como en la base (Drizzle mapea desde camelCase en TS). Tipos alineados a `backend/src/db/schema.ts` y migraciones.

### `teams`

| Columna | Tipo SQL | Notas |
|---------|----------|--------|
| `id` | `SERIAL` PK | — |
| `name` | `VARCHAR(150)` NOT NULL | Nombre del club |
| `country` | `VARCHAR(100)` NOT NULL | País |
| `logo_url` | `TEXT` | Nullable |
| `created_at` | `TIMESTAMP` NOT NULL | Default `now()` |

### `seasons`

| Columna | Tipo SQL | Notas |
|---------|----------|--------|
| `id` | `SERIAL` PK | — |
| `name` | `VARCHAR(50)` NOT NULL | Ej. `"2024"` |
| `year` | `SMALLINT` NOT NULL | Año calendario / temporada |

### `players`

Campos típicos del dominio: identidad, club actual, mercado, contrato y scouting cualitativo.

| Columna | Tipo SQL | Notas |
|---------|----------|--------|
| `id` | `SERIAL` PK | — |
| `name` | `VARCHAR(150)` NOT NULL | — |
| `position` | `VARCHAR(50)` NOT NULL | Ej. `CF`, `SS`, `CAM`, `LW`, `RW`, `CM`, `CDM`, `CB`, `LB`, `RB`, `GK` |
| `market_value_m` | `DECIMAL(6,2)` | Valor en millones (EUR en el producto) |
| `date_of_birth` | `DATE` | Nullable |
| `height_cm` | `SMALLINT` | Nullable |
| `weight_kg` | `SMALLINT` | Nullable |
| `preferred_foot` | `VARCHAR(10)` | `Left` \| `Right` \| `Both` |
| `nationality` | `VARCHAR(100)` | Nullable |
| `debut_year` | `INTEGER` | Año de debut profesional (en Drizzle es `integer`, no `SMALLINT`) |
| `photo_url` | `TEXT` | Nullable |
| `team_id` | `INTEGER` FK → `teams.id` | Nullable en esquema |
| `contract_type` | `ENUM contract_type` | `PERMANENT` \| `LOAN` \| `FREE` |
| `contract_until` | `DATE` | Nullable |
| `strengths` | `JSONB` | Array de strings; default `[]` |
| `weaknesses` | `JSONB` | Array de strings; default `[]` |
| `created_at` | `TIMESTAMP` NOT NULL | Default `now()` |

### `player_stats`

Una fila por **(jugador, temporada)**. Incluye métricas de juego, arquero, rating, valor histórico de esa temporada y heatmap.

| Columna | Tipo SQL | Notas |
|---------|----------|--------|
| `id` | `SERIAL` PK | — |
| `player_id` | `INTEGER` FK → `players.id` | `ON DELETE CASCADE` |
| `season_id` | `INTEGER` FK → `seasons.id` | `ON DELETE CASCADE` |
| **Juego** | | |
| `matches_played` | `SMALLINT` | Default `0` |
| `minutes_played` | `INTEGER` | Default `0` |
| **Ataque** | | |
| `goals` | `SMALLINT` | Default `0` |
| `xg_per_game` | `DECIMAL(4,2)` | Default `0.00` |
| `shots_per_game` | `DECIMAL(4,2)` | Default `0.00` |
| `shots_on_target_pct` | `DECIMAL(5,2)` | Default `0.00` |
| **Creación** | | |
| `assists` | `SMALLINT` | Default `0` |
| `xa_per_game` | `DECIMAL(4,2)` | Default `0.00` |
| `key_passes_per_game` | `DECIMAL(4,2)` | Default `0.00` |
| `pass_accuracy_pct` | `DECIMAL(5,2)` | Default `0.00` |
| **Duelos / defensa** | | |
| `tackles` | `SMALLINT` | Default `0` |
| `interceptions` | `SMALLINT` | Default `0` |
| `recoveries` | `SMALLINT` | Default `0` |
| `aerial_duels_won_pct` | `DECIMAL(5,2)` | Default `0.00` |
| **Regates** | | |
| `successful_dribbles_per_game` | `DECIMAL(4,2)` | Default `0.00` |
| `dribble_success_rate` | `DECIMAL(5,2)` | Default `0.00` |
| **Arquero (GK)** | | |
| `save_pct` | `DECIMAL(5,2)` | Nullable (no GK) |
| `clean_sheets` | `SMALLINT` | Nullable |
| `goals_conceded` | `SMALLINT` | Nullable |
| **Creación avanzada** | | |
| `big_chances_created` | `SMALLINT` | Default `0` |
| `fouls_drawn` | `SMALLINT` | Default `0` |
| **Heatmap** | | |
| `heatmap_data` | `JSONB` | Matriz numérica (p. ej. 5×5, intensidades 0–100) |
| **Rating / valor / disciplina** | | |
| `market_value_m` | `DECIMAL(6,2)` | Valor en contexto de esa temporada |
| `sofascore_rating` | `DECIMAL(3,1)` | Default `0.0` |
| `yellow_cards` | `SMALLINT` | Default `0` |
| `red_cards` | `SMALLINT` | Default `0` |

**Índice:** `player_stats_player_season_idx` en `(player_id, season_id)`.

### `player_ratings`

Rating **mensual** por temporada (JSONB) + resumen de temporada.

| Columna | Tipo SQL | Notas |
|---------|----------|--------|
| `id` | `SERIAL` PK | — |
| `player_id` | `INTEGER` FK → `players.id` | `ON DELETE CASCADE` |
| `season_id` | `INTEGER` FK → `seasons.id` | `ON DELETE CASCADE` |
| `rating_by_month` | `JSONB` NOT NULL | Ej. `{ "2024-08": 7.2, "2024-09": 8.1 }` |
| `season_rating` | `DECIMAL(3,1)` | Nullable |

### `player_injuries`

Una fila por lesión. Visible en detalle del jugador (y datos asociados en compare si el endpoint los incluye).

| Columna | Tipo SQL | Notas |
|---------|----------|--------|
| `id` | `SERIAL` PK | — |
| `player_id` | `INTEGER` FK NOT NULL → `players.id` | `ON DELETE CASCADE` |
| `season_id` | `INTEGER` FK NOT NULL → `seasons.id` | — |
| `injury_type` | `VARCHAR(100)` NOT NULL | Texto libre (ej. desgarro, esguince) |
| `started_at` | `DATE` NOT NULL | — |
| `returned_at` | `DATE` | Nullable si aún no volvió |
| `days_out` | `SMALLINT` NOT NULL | — |

**Índice:** `player_injuries_player_idx` en `player_id`.

### `player_career`

Trayectoria por **paso en un club** (texto + rango de años). **No** usa `team_id` / `season_id` / `contract_type` / fechas sueltas: es modelo desnormalizado para mostrar historial aunque el club no exista en `teams`.

| Columna | Tipo SQL | Notas |
|---------|----------|--------|
| `id` | `SERIAL` PK | — |
| `player_id` | `INTEGER` FK NOT NULL → `players.id` | `ON DELETE CASCADE` |
| `team_name` | `VARCHAR(150)` NOT NULL | Nombre del club en ese paso |
| `team_logo_url` | `TEXT` | Nullable |
| `year_range` | `VARCHAR(20)` NOT NULL | Ej. `"2018–2021"` |
| `appearances` | `SMALLINT` | Default `0` |
| `goals` | `SMALLINT` | Default `0` |

**Índice:** `player_career_player_idx` en `player_id`.

### `users`

| Columna | Tipo SQL | Notas |
|---------|----------|--------|
| `id` | `SERIAL` PK | — |
| `email` | `VARCHAR(255)` NOT NULL UNIQUE | Índice único `users_email_idx` |
| `password_hash` | `TEXT` NOT NULL | bcrypt (10 rounds en seed) |
| `name` | `VARCHAR(150)` NOT NULL | — |
| `created_at` | `TIMESTAMP` NOT NULL | Default `now()` |

### `shortlist_entries` — favoritos

| Columna | Tipo SQL | Notas |
|---------|----------|--------|
| `id` | `SERIAL` PK | — |
| `user_id` | `INTEGER` FK NOT NULL → `users.id` | `ON DELETE CASCADE` |
| `player_id` | `INTEGER` FK NOT NULL → `players.id` | `ON DELETE CASCADE` |
| `note` | `TEXT` | Nullable; **PATCH** para actualizarla pendiente en API |
| `added_at` | `TIMESTAMP` NOT NULL | Default `now()` |

**Índices:** único `(user_id, player_id)` (`shortlist_user_player_unique`); `shortlist_user_idx` en `user_id`.

**Seed:** se vacía en el `TRUNCATE`; las filas las crea cada usuario en runtime (no vienen en `initial-data.ts`).

---

## Cómo se generan los datos (`db:seed`)

Script principal: `backend/src/db/initial-data.ts` (compilado a `dist/db/initial-data.js` para `npm run db:seed`).

1. **TRUNCATE** de tablas en orden seguro (incluye `shortlist_entries`).
2. **`teams`** — filas desde `backend/src/db/seed-data/teams.seed.ts`.
3. **`seasons`** — 2023–2026 fijas en código.
4. **`players`** — plantillas en `players.seed.ts` (nombre, equipo, posición, fotos vía URL Fotmob por id, etc.); fortalezas/debilidades desde listas por posición en `scout-traits.seed.ts`; contrato rota según `CONTRACT_DISTRIBUTION`.
5. Por cada jugador y cada temporada ≥ `debut_year`:
   - **`player_stats`**: si existe entrada en `real-player-stats.seed.ts` para ese nombre y año, se usan esas bases; si no, se generan con `position-templates.seed.ts` + funciones `vary` / aleatoriedad. Heatmap con `HEATMAP_ZONES` por posición.
   - **`player_ratings`**: serie mensual derivada del rating base de esa temporada.
   - **`player_injuries`**: probabilística según posición y año (`injuries.seed.ts`).
6. **`player_career`** — `helpers/career-generator.ts` (con posibles overrides por nombre; hoy `CAREER_OVERRIDES` puede estar vacío).
7. **`users`** — tres usuarios demo con la misma contraseña hasheada.

Archivos de apoyo en `backend/src/db/seed-data/`: `teams`, `players`, `real-player-stats`, `position-templates`, `injuries`, `scout-traits`.

---

### Tablas no detalladas campo a campo en el V5

El `.txt` no abre subsecciones **4.x** para **`teams`** y **`seasons`** (solo aparecen en la tabla resumen). No faltan del modelo; falta **profundidad de documentación** si querés paridad con `players` / `player_stats`.

### Recordatorio rápido

- No existe tabla **`analytics`**; reportes = queries sobre **`player_stats`** (y joins).
- Diferencia **`player_stats`** (métricas + heatmap por temporada) vs **`player_ratings`** (JSONB mensual).
