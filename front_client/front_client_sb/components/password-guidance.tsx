import { cn } from "@/lib/utils";
import {
  PASSWORD_MIN_LENGTH,
  getPasswordChecks,
  getPasswordStrength,
} from "@/lib/password-policy";

interface PasswordGuidanceProps {
  password: string;
  className?: string;
}

const getStrengthColorClass = (label: string): string => {
  switch (label) {
    case "Faible":
      return "text-red-600";
    case "Moyenne":
      return "text-amber-600";
    case "Forte":
      return "text-lime-700";
    case "Tres forte":
      return "text-green-700";
    default:
      return "text-gray-500";
  }
};

const getFilledSegments = (score: number): number => {
  if (score === 0) return 0;
  if (score <= 2) return 1;
  if (score <= 4) return 2;
  if (score === 5) return 3;
  return 4;
};

export function PasswordGuidance({ password, className }: PasswordGuidanceProps) {
  const checks = getPasswordChecks(password);
  const strength = getPasswordStrength(password);
  const filledSegments = getFilledSegments(strength.score);
  const strengthColorClass = getStrengthColorClass(strength.label);

  const requirements = [
    { label: `Au moins ${PASSWORD_MIN_LENGTH} caracteres`, passed: checks.hasMinLength },
    { label: "Une majuscule", passed: checks.hasUppercase },
    { label: "Une minuscule", passed: checks.hasLowercase },
    { label: "Un chiffre", passed: checks.hasNumber },
    { label: "Un caractere special (@$!%*?&)", passed: checks.hasSpecial },
  ];

  return (
    <div className={cn("rounded-lg border border-gray-200 bg-gray-50 p-4", className)}>
      <p className="mb-2 text-sm font-semibold text-gray-900 font-archivo">
        Votre mot de passe doit inclure
      </p>
      <ul className="space-y-1.5">
        {requirements.map((requirement) => (
          <li
            key={requirement.label}
            className={cn(
              "flex items-center gap-2 text-sm font-archivo",
              requirement.passed ? "text-green-700" : "text-gray-600"
            )}
          >
            <span
              className={cn(
                "inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px] font-bold",
                requirement.passed
                  ? "border-green-600 bg-green-100 text-green-700"
                  : "border-gray-300 bg-white text-gray-400"
              )}
            >
              {requirement.passed ? "✓" : ""}
            </span>
            <span>{requirement.label}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900 font-archivo">Force du mot de passe</p>
          <p className={cn("text-sm font-semibold font-archivo", strengthColorClass)}>
            {strength.label}
          </p>
        </div>
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {Array.from({ length: 4 }).map((_, index) => (
            <span
              key={index}
              className={cn(
                "h-1.5 rounded-full transition-colors",
                index < filledSegments ? "bg-green-600" : "bg-gray-200"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
