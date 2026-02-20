export type SportSlug = "cricket" | "soccer" | "basketball" | "football" | "tennis";

export interface SportConfig {
  slug: SportSlug;
  name: string;        // Brand name shown in navbar
  label: string;       // Display label for the sport
  sportValue: string;  // Value stored in user.sport field in DB
  tagline: string;     // Landing page tagline
}

export const SPORTS: Record<SportSlug, SportConfig> = {
  cricket: {
    slug: "cricket",
    name: "CricRewards",
    label: "Cricket",
    sportValue: "Cricket",
    tagline: "Reward Your Favorite Cricket Players",
  },
  soccer: {
    slug: "soccer",
    name: "SoccerRewards",
    label: "Soccer",
    sportValue: "Soccer",
    tagline: "Reward Your Favorite Soccer Players",
  },
  basketball: {
    slug: "basketball",
    name: "BasketballRewards",
    label: "Basketball",
    sportValue: "Basketball",
    tagline: "Reward Your Favorite Basketball Players",
  },
  football: {
    slug: "football",
    name: "FootballRewards",
    label: "Football",
    sportValue: "Football",
    tagline: "Reward Your Favorite Football Players",
  },
  tennis: {
    slug: "tennis",
    name: "TennisRewards",
    label: "Tennis",
    sportValue: "Tennis",
    tagline: "Reward Your Favorite Tennis Players",
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
