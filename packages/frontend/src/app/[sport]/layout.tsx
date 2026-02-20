import { notFound } from "next/navigation";
import { isValidSport, SPORT_SLUGS } from "@/lib/sportConfig";

export const dynamicParams = false;

export function generateStaticParams() {
  return SPORT_SLUGS.map((sport) => ({ sport }));
}

export default function SportLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { sport: string };
}) {
  if (!isValidSport(params.sport)) {
    notFound();
  }
  return <>{children}</>;
}
