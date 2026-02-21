export type SportSlug = "cricket" | "soccer" | "basketball" | "football" | "tennis" | "baseball";

export interface SportConfig {
  slug: SportSlug;
  name: string;        // Brand name shown in navbar
  label: string;       // Display label for the sport
  sportValue: string;  // Value stored in user.sport field in DB
  tagline: string;     // Landing page tagline
  color: string;       // Accent color for slideshow/branding
  image: string;       // Fan image for landing page slideshow
}

export const SPORTS: Record<SportSlug, SportConfig> = {
  cricket: {
    slug: "cricket",
    name: "CricRewards",
    label: "Cricket",
    sportValue: "Cricket",
    tagline: "Reward Your Favorite Cricket Players",
    color: "#2563eb",
    image: "/images/fans/cricket.jpg",
  },
  soccer: {
    slug: "soccer",
    name: "SoccerRewards",
    label: "Soccer",
    sportValue: "Soccer",
    tagline: "Reward Your Favorite Soccer Players",
    color: "#16a34a",
    image: "/images/fans/soccer.jpg",
  },
  basketball: {
    slug: "basketball",
    name: "BasketballRewards",
    label: "Basketball",
    sportValue: "Basketball",
    tagline: "Reward Your Favorite Basketball Players",
    color: "#ea580c",
    image: "/images/fans/basketball.jpg",
  },
  football: {
    slug: "football",
    name: "FootballRewards",
    label: "Football",
    sportValue: "Football",
    tagline: "Reward Your Favorite Football Players",
    color: "#4f46e5",
    image: "/images/fans/football.jpg",
  },
  tennis: {
    slug: "tennis",
    name: "TennisRewards",
    label: "Tennis",
    sportValue: "Tennis",
    tagline: "Reward Your Favorite Tennis Players",
    color: "#65a30d",
    image: "/images/fans/tennis.jpg",
  },
  baseball: {
    slug: "baseball",
    name: "BaseballRewards",
    label: "Baseball",
    sportValue: "Baseball",
    tagline: "Reward Your Favorite Baseball Players",
    color: "#dc2626",
    image: "/images/fans/baseball.jpg",
  },
};

export const SPORT_SLUGS = Object.keys(SPORTS) as SportSlug[];

export const DEFAULT_SPORT: SportSlug = "cricket";

export function isValidSport(slug: string): slug is SportSlug {
  return slug in SPORTS;
}

export function getSportFromPath(pathname: string): SportSlug {
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];
  if (first && isValidSport(first)) return first;
  return DEFAULT_SPORT;
}

export function sportPath(sport: string, path: string): string {
  return `/${sport}${path}`;
}
