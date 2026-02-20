// Convert ISO 3166-1 alpha-2 country code to flag emoji
export function countryCodeToFlag(code: string): string {
  if (!code || code.length !== 2) return "";
  const upper = code.toUpperCase();
  return String.fromCodePoint(
    ...upper.split("").map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
}

export const COUNTRIES = [
  { code: "IN", name: "India" },
  { code: "AU", name: "Australia" },
  { code: "GB", name: "England" },
  { code: "ZA", name: "South Africa" },
  { code: "NZ", name: "New Zealand" },
  { code: "PK", name: "Pakistan" },
  { code: "LK", name: "Sri Lanka" },
  { code: "BD", name: "Bangladesh" },
  { code: "WI", name: "West Indies" },
  { code: "AF", name: "Afghanistan" },
  { code: "IE", name: "Ireland" },
  { code: "ZW", name: "Zimbabwe" },
  { code: "NP", name: "Nepal" },
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "AE", name: "UAE" },
  { code: "OM", name: "Oman" },
  { code: "NL", name: "Netherlands" },
  { code: "SC", name: "Scotland" },
  { code: "NG", name: "Nigeria" },
  { code: "KE", name: "Kenya" },
  { code: "BR", name: "Brazil" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "CN", name: "China" },
  { code: "MX", name: "Mexico" },
  { code: "AR", name: "Argentina" },
];

// Flag-inspired gradients keyed by country code
const FLAG_GRADIENTS: Record<string, string> = {
  IN: "linear-gradient(135deg, #FF9933 0%, #FFFFFF 50%, #138808 100%)",
  AU: "linear-gradient(135deg, #00008B 0%, #002366 40%, #FFD700 100%)",
  GB: "linear-gradient(135deg, #00247D 0%, #CF142B 50%, #FFFFFF 100%)",
  ZA: "linear-gradient(135deg, #007749 0%, #FFB81C 30%, #DE3831 60%, #002395 100%)",
  NZ: "linear-gradient(135deg, #00247D 0%, #CC142B 50%, #FFFFFF 100%)",
  PK: "linear-gradient(135deg, #01411C 0%, #01411C 60%, #FFFFFF 100%)",
  LK: "linear-gradient(135deg, #FFBE29 0%, #8D153A 50%, #EB7400 100%)",
  BD: "linear-gradient(135deg, #006A4E 0%, #F42A41 50%, #006A4E 100%)",
  AF: "linear-gradient(135deg, #000000 0%, #D32011 50%, #007A36 100%)",
  US: "linear-gradient(135deg, #3C3B6E 0%, #FFFFFF 50%, #B22234 100%)",
  BR: "linear-gradient(135deg, #009739 0%, #FEDD00 50%, #002776 100%)",
  DE: "linear-gradient(135deg, #000000 0%, #DD0000 50%, #FFCC00 100%)",
  FR: "linear-gradient(135deg, #002395 0%, #FFFFFF 50%, #ED2939 100%)",
  ES: "linear-gradient(135deg, #AA151B 0%, #F1BF00 50%, #AA151B 100%)",
  IT: "linear-gradient(135deg, #008C45 0%, #FFFFFF 50%, #CD212A 100%)",
  JP: "linear-gradient(135deg, #FFFFFF 0%, #BC002D 50%, #FFFFFF 100%)",
  AR: "linear-gradient(135deg, #74ACDF 0%, #FFFFFF 50%, #74ACDF 100%)",
};

export interface BackgroundTheme {
  key: string;
  label: string;
  style: string; // CSS background value
}

export const BACKGROUND_THEMES: BackgroundTheme[] = [
  { key: "flag", label: "Country Flag", style: "" }, // resolved dynamically
  { key: "gradient-blue", label: "Blue", style: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
  { key: "gradient-gold", label: "Gold", style: "linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #fda085 100%)" },
  { key: "gradient-green", label: "Green", style: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)" },
  { key: "gradient-purple", label: "Purple", style: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)" },
  { key: "dark", label: "Dark", style: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)" },
  { key: "sunset", label: "Sunset", style: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)" },
  { key: "ocean", label: "Ocean", style: "linear-gradient(135deg, #0093E9 0%, #80D0C7 100%)" },
];

// Default gradient when nothing is set
const DEFAULT_BG = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";

export function getBackgroundStyle(theme: string, nationality: string, bannerUrl?: string): string {
  if (!theme) return DEFAULT_BG;
  if (theme === "custom" && bannerUrl) {
    return `url(${bannerUrl}) center/cover no-repeat`;
  }
  if (theme === "flag") {
    return FLAG_GRADIENTS[nationality?.toUpperCase()] || DEFAULT_BG;
  }
  // Hex color
  if (theme.startsWith("#")) {
    return theme;
  }
  const found = BACKGROUND_THEMES.find((t) => t.key === theme);
  return found?.style || DEFAULT_BG;
}
