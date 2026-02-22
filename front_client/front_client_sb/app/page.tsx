import type { Metadata } from "next";
import HomePageClient from "./home-page-client";
import { SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: `${SITE_NAME} | Barbier a Grenoble`,
  description:
    "Studio Barber Grenoble: deux salons, prestations barber premium et reservation en ligne en quelques clics.",
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return <HomePageClient />;
}
