import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions legales",
  description: "Informations legales de Studio Barber Grenoble.",
  alternates: {
    canonical: "/mentions-legales",
  },
};

export default function MentionsLegalesPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-archivo text-3xl font-black text-black sm:text-4xl">
        Mentions legales
      </h1>
      <div className="mt-6 space-y-4 font-archivo text-base text-gray-700">
        <p>
          Site edite par Studio Barber. Pour toute demande legale, utilisez
          l&apos;adresse email de contact affichee sur la page d&apos;accueil.
        </p>
        <p>
          Hebergeur: infrastructure web conforme aux standards de securite
          courants.
        </p>
      </div>
    </main>
  );
}
