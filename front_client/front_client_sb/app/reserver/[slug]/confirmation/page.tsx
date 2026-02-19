'use client';

import Link from "next/link";
import { useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { getProfile, saveUser } from "@/lib/api/auth";

const salonsData = {
  championnet: {
    name: "Studio Barber Championnet",
    address: "42 Rue Lesdiguieres, Grenoble, Auvergne-Rhone-Alpes",
    phone: "+33 4 XX XX XX XX",
  },
  clemenceau: {
    name: "Studio Barber Clemenceau",
    address: "47 Boulevard Clemenceau, Grenoble, Auvergne-Rhone-Alpes",
    phone: "+33 4 XX XX XX XX",
  },
};

export default function ConfirmationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const salonSlug = params.slug as string;
  const salon = salonsData[salonSlug as keyof typeof salonsData];
  const isVerifiedRedirect = searchParams.get("verified") === "1";

  useEffect(() => {
    if (!isVerifiedRedirect) {
      return;
    }

    async function syncSessionUser() {
      try {
        const profileResponse = await getProfile();
        if (profileResponse?.data) {
          saveUser(profileResponse.data);
        }
      } catch {
        // Ignore sync failure and keep confirmation visible.
      }
    }

    void syncSessionUser();
  }, [isVerifiedRedirect]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-2xl w-full bg-white border border-black p-6 sm:p-8 md:p-10 lg:p-12 text-center">
        {/* Success Icon */}
        <div className="mb-6 sm:mb-8 flex justify-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-green-500 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="font-archivo font-black text-2xl sm:text-3xl md:text-4xl text-black mb-3 sm:mb-4 uppercase">
          Reservation Confirmee !
        </h1>

        <p className="font-archivo text-base sm:text-lg md:text-xl text-gray-700 mb-6 sm:mb-8">
          Votre rendez-vous a ete enregistre avec succes
        </p>

        {/* Info */}
        {salon && (
          <div className="bg-gray-50 border border-gray-300 p-4 sm:p-6 mb-6 sm:mb-8 text-left">
            <h2 className="font-archivo font-black text-base sm:text-lg text-black mb-3 sm:mb-4 uppercase">
              Details de votre reservation
            </h2>

            <div className="space-y-3">
              <div>
                <p className="font-archivo font-bold text-xs sm:text-sm text-gray-600 uppercase">
                  Salon
                </p>
                <p className="font-archivo text-sm sm:text-base text-black">
                  {salon.name}
                </p>
                <p className="font-archivo text-xs sm:text-sm text-gray-600">
                  {salon.address}
                </p>
              </div>

              <div className="border-t border-gray-300 pt-3">
                <p className="font-archivo font-bold text-xs sm:text-sm text-gray-600 uppercase">
                  Contact
                </p>
                <p className="font-archivo text-sm sm:text-base text-black">
                  {salon.phone}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Email confirmation notice */}
        <div className="bg-[#DE2788] bg-opacity-10 border border-[#DE2788] p-4 sm:p-6 mb-6 sm:mb-8">
          <p className="font-archivo text-sm sm:text-base text-gray-800">
            Un email de confirmation vous a ete envoye avec tous les details de votre reservation.
          </p>
        </div>

        {/* Cancellation policy reminder */}
        <div className="mb-6 sm:mb-8">
          <p className="font-archivo text-xs sm:text-sm text-gray-600">
            <strong>Rappel :</strong> Vous pouvez annuler votre rendez-vous <strong>a tout moment</strong> depuis votre espace client.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Link
            href="/"
            className="bg-[#DE2788] hover:bg-black text-white font-archivo font-black text-sm sm:text-base uppercase py-3 sm:py-4 px-6 sm:px-8 transition-colors duration-300"
          >
            Retour a l&apos;accueil
          </Link>

          <Link
            href="/dashboard"
            className="bg-black hover:bg-[#DE2788] text-white font-archivo font-black text-sm sm:text-base uppercase py-3 sm:py-4 px-6 sm:px-8 transition-colors duration-300"
          >
            Voir mes reservations
          </Link>
        </div>
      </div>
    </div>
  );
}
