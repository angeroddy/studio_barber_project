import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import AuthLayout from "./AuthPageLayout";
import PageMeta from "../../components/common/PageMeta";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import { completeClientInvitation } from "../../services/clientAuth.service";

const AUTH_TOKEN_KEY = "authToken";

export default function ClientSetPassword() {
  const [searchParams] = useSearchParams();
  const token = (searchParams.get("token") || "").trim();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Lien invalide: token manquant.");
      return;
    }

    if (!password || !confirmPassword) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caracteres.");
      return;
    }

    try {
      setIsLoading(true);
      const result = await completeClientInvitation(token, password);
      localStorage.setItem(AUTH_TOKEN_KEY, result.token);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || "Erreur lors de la creation du mot de passe.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Creation mot de passe client"
        description="Definir le mot de passe client"
      />
      <AuthLayout>
        <div className="flex flex-col flex-1">
          <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
            <div className="mb-5 sm:mb-8">
              <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                Definir mon mot de passe
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Choisissez votre mot de passe pour activer votre acces client.
              </p>
            </div>

            {error && (
              <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-300">
                {error}
              </div>
            )}

            {success ? (
              <div className="space-y-4">
                <div className="p-3 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-900 dark:text-green-300">
                  Mot de passe defini avec succes.
                </div>
                <Link
                  to="/signin"
                  className="inline-flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-[#EB549E] hover:bg-[#D33982]"
                >
                  Aller a la connexion
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label>
                    Mot de passe <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Choisir un mot de passe"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>

                <div>
                  <Label>
                    Confirmer le mot de passe <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirmer votre mot de passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-[#EB549E] hover:bg-[#D33982] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Validation..." : "Creer mon mot de passe"}
                </button>
              </form>
            )}
          </div>
        </div>
      </AuthLayout>
    </>
  );
}
