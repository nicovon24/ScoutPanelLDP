import type { teams } from "../schema";

/** Filas para `db.insert(teams).values(...)` */
export const TEAM_SEED_ROWS = [
  {
    "name": "Vélez Sarsfield",
    "country": "Argentina",
    "logoUrl": "https://images.fotmob.com/image_resources/logo/teamlogo/10079.png"
  },
  {
    "name": "Estudiantes (LP)",
    "country": "Argentina",
    "logoUrl": "https://images.fotmob.com/image_resources/logo/teamlogo/10094.png"
  },
  {
    "name": "Lanús",
    "country": "Argentina",
    "logoUrl": "https://images.fotmob.com/image_resources/logo/teamlogo/10082.png"
  },
  {
    "name": "Boca Juniors",
    "country": "Argentina",
    "logoUrl": "https://images.fotmob.com/image_resources/logo/teamlogo/10077.png"
  },
  {
    "name": "Talleres (C)",
    "country": "Argentina",
    "logoUrl": "https://images.fotmob.com/image_resources/logo/teamlogo/10101.png"
  },
  {
    "name": "Unión (SF)",
    "country": "Argentina",
    "logoUrl": "https://images.fotmob.com/image_resources/logo/teamlogo/10096.png"
  },
  {
    "name": "Defensa y Justicia",
    "country": "Argentina",
    "logoUrl": "https://images.fotmob.com/image_resources/logo/teamlogo/161730.png"
  },
  {
    "name": "Independiente",
    "country": "Argentina",
    "logoUrl": "https://images.fotmob.com/image_resources/logo/teamlogo/10078.png"
  },
  {
    "name": "San Lorenzo",
    "country": "Argentina",
    "logoUrl": "https://images.fotmob.com/image_resources/logo/teamlogo/10083.png"
  },
  {
    "name": "Instituto (C)",
    "country": "Argentina",
    "logoUrl": "https://images.fotmob.com/image_resources/logo/teamlogo/10090.png"
  },
  {
    "name": "Platense",
    "country": "Argentina",
    "logoUrl": "https://images.fotmob.com/image_resources/logo/teamlogo/10089.png"
  },
  {
    "name": "Gimnasia y Esgrima (M)",
    "country": "Argentina",
    "logoUrl": "https://images.fotmob.com/image_resources/logo/teamlogo/568727.png"
  },
  {
    "name": "Newell's Old Boys",
    "country": "Argentina",
    "logoUrl": "https://images.fotmob.com/image_resources/logo/teamlogo/10201.png"
  },
  {
    "name": "Central Córdoba (SdE)",
    "country": "Argentina",
    "logoUrl": "https://images.fotmob.com/image_resources/logo/teamlogo/213596.png"
  },
  {
    "name": "Deportivo Riestra",
    "country": "Argentina",
    "logoUrl": "https://images.fotmob.com/image_resources/logo/teamlogo/298629.png"
  },
  {
    "name": "Independiente Rivadavia",
    "country": "Argentina",
    "logoUrl": "https://images.fotmob.com/image_resources/logo/teamlogo/161729.png"
  },
  {
    "name": "River Plate",
    "country": "Argentina",
    "logoUrl": "https://images.fotmob.com/image_resources/logo/teamlogo/10076.png"
  },
  {
    "name": "Argentinos Juniors",
    "country": "Argentina",
    "logoUrl": "https://images.fotmob.com/image_resources/logo/teamlogo/10086.png"
  },
  {
    "name": "Belgrano",
    "country": "Argentina",
    "logoUrl": "https://images.fotmob.com/image_resources/logo/teamlogo/10092.png"
  },
  {
    "name": "Rosario Central",
    "country": "Argentina",
    "logoUrl": "https://images.fotmob.com/image_resources/logo/teamlogo/10084.png"
  },
  {
    "name": "Huracán",
    "country": "Argentina",
    "logoUrl": "https://images.fotmob.com/image_resources/logo/teamlogo/10081.png"
  },
  {
    "name": "Barracas Central",
    "country": "Argentina",
    "logoUrl": "https://images.fotmob.com/image_resources/logo/teamlogo/213534.png"
  },
  {
    "name": "Tigre",
    "country": "Argentina",
    "logoUrl": "https://images.fotmob.com/image_resources/logo/teamlogo/89396.png"
  },
  {
    "name": "Racing Club",
    "country": "Argentina",
    "logoUrl": "https://images.fotmob.com/image_resources/logo/teamlogo/10080.png"
  },
  {
    "name": "Gimnasia (LP)",
    "country": "Argentina",
    "logoUrl": "https://images.fotmob.com/image_resources/logo/teamlogo/10103.png"
  },
  {
    "name": "Sarmiento (J)",
    "country": "Argentina",
    "logoUrl": "https://images.fotmob.com/image_resources/logo/teamlogo/202757.png"
  },
  {
    "name": "Banfield",
    "country": "Argentina",
    "logoUrl": "https://images.fotmob.com/image_resources/logo/teamlogo/10087.png"
  },
  {
    "name": "Atlético Tucumán",
    "country": "Argentina",
    "logoUrl": "https://images.fotmob.com/image_resources/logo/teamlogo/161727.png"
  },
  {
    "name": "Aldosivi",
    "country": "Argentina",
    "logoUrl": "https://images.fotmob.com/image_resources/logo/teamlogo/161728.png"
  },
  {
    "name": "Estudiantes (RC)",
    "country": "Argentina",
    "logoUrl": "https://images.fotmob.com/image_resources/logo/teamlogo/213591.png"
  }
] as const satisfies ReadonlyArray<typeof teams.$inferInsert>;
