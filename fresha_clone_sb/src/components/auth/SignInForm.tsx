import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import { useAuth } from "../../context/AuthContext";
import staffAuthService from "../../services/staffAuth.service";


export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loginType, setLoginType] = useState<'owner' | 'staff'>('owner');
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [searchParams] = useSearchParams();
  const inviteToken = (searchParams.get("staffInviteToken") || "").trim();
  const isInvitationFlow = inviteToken.length > 0;
  const { login, staffLogin, isLoading, error, clearError } = useAuth();
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (isInvitationFlow) {
      setLoginType("staff");
      setIsFirstLogin(true);
      clearError();
      setLocalError(null);
    }
  }, [isInvitationFlow, clearError]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);
    const normalizedEmail = email.trim().toLowerCase();

    // Validation des champs requis
    if ((!isInvitationFlow && !normalizedEmail) || !password) {
      setLocalError("Veuillez remplir tous les champs requis");
      return;
    }

    // Si c'est une première connexion, on vérifie que les mots de passe correspondent
    if (isFirstLogin) {
      if (password !== confirmPassword) {
        setLocalError("Les mots de passe ne correspondent pas");
        return;
      }
      if (password.length < 6) {
        setLocalError("Le mot de passe doit contenir au moins 6 caractères");
        return;
      }

      try {
        // Appel à l'API de première connexion
        const response = isInvitationFlow
          ? await staffAuthService.completeInvitation(inviteToken, password)
          : await staffAuthService.firstLogin(normalizedEmail, password);

        // Sauvegarder l'utilisateur (token gere par cookie HttpOnly)
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('userType', 'staff');

        // Rediriger
        window.location.href = '/';
      } catch (error: any) {
        setLocalError(error.message || 'Erreur lors de la création du mot de passe');
      }
      return;
    }

    try {
      if (loginType === 'owner') {
        await login({ email: normalizedEmail, password });
      } else {
        await staffLogin({ email: normalizedEmail, password });
      }
      // La redirection est gérée dans le contexte
    } catch (error) {
      // L'erreur est gérée dans le contexte
      console.error("Erreur de connexion:", error);
    }
  };

  return (
    <div className="flex flex-col flex-1">

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Se connecter
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Renseignez vos coordonnées pour accéder à votre espace
            </p>
          </div>
          <div>

            {/* Toggle pour choisir le type de connexion (masqué si première connexion) */}
            {!isFirstLogin && !isInvitationFlow && (
              <div className="flex gap-2 p-1 mb-6 bg-gray-100 rounded-lg dark:bg-gray-800">
                <button
                  type="button"
                  onClick={() => {
                    setLoginType('owner');
                    clearError();
                    setLocalError(null);
                  }}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
                    loginType === 'owner'
                      ? 'bg-white text-gray-900 dark:bg-gray-700 dark:text-white shadow'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Propriétaire
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginType('staff');
                    clearError();
                    setLocalError(null);
                  }}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
                    loginType === 'staff'
                      ? 'bg-white text-gray-900 dark:bg-gray-700 dark:text-white shadow'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Employé
                </button>
              </div>
            )}

            {/* Message si première connexion */}
            {isFirstLogin && (
              <div className="p-3 mb-4 text-sm text-blue-700 bg-blue-100 rounded-lg dark:bg-blue-900 dark:text-blue-300">
                {isInvitationFlow
                  ? "Activation du compte : créez votre mot de passe"
                  : "Première connexion : créez votre mot de passe"}
              </div>
            )}

            {(error || localError) && (
              <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-300">
                {localError || error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {!isInvitationFlow && (
                  <div>
                    <Label>
                      Email <span className="text-error-500">*</span>{" "}
                    </Label>
                    <Input
                      type="email"
                      placeholder="info@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                )}
                <div>
                  <Label>
                    Mot de passe <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder={isFirstLogin ? "Choisir un mot de passe" : "Entrer votre mot de passe"}
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

                {/* Champ de confirmation de mot de passe (seulement pour première connexion) */}
                {isFirstLogin && (
                  <div>
                    <Label>
                      Confirmer le mot de passe <span className="text-error-500">*</span>{" "}
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirmer votre mot de passe"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-[#EB549E] hover:bg-[#D33982] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Connexion..." : isFirstLogin ? "Créer mon mot de passe" : "Se connecter"}
                  </button>
                </div>

                <div className="mt-5">
                  {!isFirstLogin && !isInvitationFlow && loginType === 'owner' && (
                    <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400">
                      Pas encore de compte?{" "}
                      <Link
                        to="/signup"
                        className="text-[#EB549E] hover:text-[#D33982]"
                      >
                        S'inscrire
                      </Link>
                    </p>
                  )}
                  {!isFirstLogin && !isInvitationFlow && loginType === 'staff' && (
                    <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400">
                      Première connexion?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setIsFirstLogin(true);
                          clearError();
                          setLocalError(null);
                          setPassword('');
                          setConfirmPassword('');
                        }}
                        className="text-[#EB549E] hover:text-[#D33982]"
                      >
                        Créer mon mot de passe
                      </button>
                    </p>
                  )}
                  {isFirstLogin && !isInvitationFlow && (
                    <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400">
                      Déjà un mot de passe?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setIsFirstLogin(false);
                          clearError();
                          setLocalError(null);
                          setPassword('');
                          setConfirmPassword('');
                        }}
                        className="text-[#EB549E] hover:text-[#D33982]"
                      >
                        Se connecter
                      </button>
                    </p>
                  )}
                </div>
              </div>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
}
