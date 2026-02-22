import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialite",
  description:
    "Politique de confidentialite de Studio Barber Grenoble concernant les donnees clients.",
  alternates: {
    canonical: "/politique-confidentialite",
  },
};

export default function PolitiqueConfidentialitePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-archivo text-3xl font-black text-black sm:text-4xl">
        Politique de confidentialite
      </h1>
      <div className="mt-6 space-y-4 font-archivo text-base text-gray-700">
        <p>
          Les donnees collectees servent uniquement a la gestion des rendez-vous
          et au suivi client.
        </p>
        <p>
          Vous pouvez demander la modification ou la suppression de vos donnees
          via le contact officiel du salon.
        </p>
      </div>
    </main>
  );
}
