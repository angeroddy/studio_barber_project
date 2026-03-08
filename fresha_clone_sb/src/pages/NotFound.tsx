import { Link } from "react-router-dom";
import PageMeta from "../components/common/PageMeta";

export default function NotFound() {
  return (
    <>
      <PageMeta title="404 | Page introuvable" description="Page introuvable" />
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <p className="text-sm font-semibold text-[#EB549E]">Erreur 404</p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
            Page introuvable
          </h1>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            La page que vous cherchez n&apos;existe pas ou n&apos;est plus disponible.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-[#EB549E] px-4 py-2 text-sm font-medium text-white hover:bg-[#D33982]"
          >
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    </>
  );
}
