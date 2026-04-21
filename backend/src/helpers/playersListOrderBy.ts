/**
 * Whitelist de ORDER BY para GET /api/players (listado con SQL raw).
 * Centralizado para mantenibilidad y para evitar inyección SQL vía sortBy.
 */
export const PLAYERS_LIST_ORDER_BY_MAP: Record<string, string> = {
  name_asc:    "p.name ASC",
  name_desc:   "p.name DESC",
  age_asc:     "p.date_of_birth DESC",
  age_desc:    "p.date_of_birth ASC",
  value_asc:   "p.market_value_m ASC NULLS LAST",
  value_desc:  "p.market_value_m DESC NULLS LAST",
  rating_asc:  "COALESCE(ps.sofascore_rating, 0) ASC",
  rating_desc: "COALESCE(ps.sofascore_rating, 0) DESC",
};
