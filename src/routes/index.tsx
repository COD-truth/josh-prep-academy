import { createFileRoute } from "@tanstack/react-router";
import drJosh from "@/assets/dr-josh.jpg";
import { LandingPage } from "@/components/site/LandingPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Josh & Co — Soutien scolaire & préparation aux concours" },
      { name: "description", content: "Plateforme bilingue FR/EN. Tuteurs experts, banque d'épreuves, paiement Mobile Money et intégration Google Classroom." },
      { property: "og:title", content: "Josh & Co — Excellence académique" },
      { property: "og:description", content: "Soutien scolaire & préparation aux concours par le Dr. Josh et son équipe." },
      { property: "og:image", content: drJosh },
      { name: "twitter:image", content: drJosh },
    ],
  }),
  component: Index,
});

function Index() {
  return <LandingPage />;
}
