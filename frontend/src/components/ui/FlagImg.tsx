const COUNTRY_ISO: Record<string, string> = {
  // Sudamérica
  "Argentina":       "ar",
  "Brasil":          "br",
  "Brazil":          "br",
  "Uruguay":         "uy",
  "Paraguay":        "py",
  "Colombia":        "co",
  "Chile":           "cl",
  "Bolivia":         "bo",
  "Perú":            "pe",
  "Peru":            "pe",
  "Ecuador":         "ec",
  "Venezuela":       "ve",
  // Centroamérica / Caribe
  "México":          "mx",
  "Mexico":          "mx",
  "Costa Rica":      "cr",
  "Honduras":        "hn",
  "Guatemala":       "gt",
  "El Salvador":     "sv",
  "Panamá":          "pa",
  "Cuba":            "cu",
  "Jamaica":         "jm",
  // Norteamérica
  "Estados Unidos":  "us",
  "USA":             "us",
  "Canadá":          "ca",
  "Canada":          "ca",
  // Europa
  "España":          "es",
  "Spain":           "es",
  "Francia":         "fr",
  "France":          "fr",
  "Italia":          "it",
  "Italy":           "it",
  "Alemania":        "de",
  "Germany":         "de",
  "Portugal":        "pt",
  "Inglaterra":      "gb-eng",
  "England":         "gb-eng",
  "Holanda":         "nl",
  "Netherlands":     "nl",
  "Bélgica":         "be",
  "Belgium":         "be",
  "Croacia":         "hr",
  "Croatia":         "hr",
  "Serbia":          "rs",
  "Suiza":           "ch",
  "Switzerland":     "ch",
  "Turquía":         "tr",
  "Turkey":          "tr",
  "Armenia":         "am",
  "Ucrania":         "ua",
  "Ukraine":         "ua",
  "Polonia":         "pl",
  "Poland":          "pl",
  "Eslovenia":       "si",
  "Slovenia":        "si",
  "Austria":         "at",
  "Dinamarca":       "dk",
  "Denmark":         "dk",
  "Suecia":          "se",
  "Sweden":          "se",
  "Noruega":         "no",
  "Norway":          "no",
  // África
  "Senegal":         "sn",
  "Costa de Marfil": "ci",
  "Ghana":           "gh",
  "Nigeria":         "ng",
  "Marruecos":       "ma",
  "Morocco":         "ma",
  "Camerún":         "cm",
  "Cameroon":        "cm",
  "Argelia":         "dz",
  "Algeria":         "dz",
  // Asia / Oceanía
  "Japón":           "jp",
  "Japan":           "jp",
  "Corea del Sur":   "kr",
  "Australia":       "au",
};

interface FlagImgProps {
  nationality: string;
  /** Tamaño base en px (alto). Ancho = alto × 4/3. Default 15 */
  size?: number;
  className?: string;
}

export default function FlagImg({ nationality, size = 15, className = "" }: FlagImgProps) {
  const code = COUNTRY_ISO[nationality];
  if (!code) return null;

  const w = Math.round(size * (4 / 3));
  // flagcdn.com size variants: 20x15, 40x30, 80x60, 160x120, 320x240
  const cdnSize = size <= 15 ? "20x15" : size <= 30 ? "40x30" : "80x60";

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/${cdnSize}/${code}.png`}
      alt={nationality}
      width={w}
      height={size}
      className={`rounded-[2px] object-cover flex-shrink-0 ${className}`}
    />
  );
}
