export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/;

export const PASSWORD_HINT =
  "Au moins 8 caracteres, une majuscule, une minuscule, un chiffre et un caractere special (@$!%*?&)";

export interface PasswordChecks {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export type PasswordStrengthLabel =
  | "A definir"
  | "Faible"
  | "Moyenne"
  | "Forte"
  | "Tres forte";

export interface PasswordStrength {
  label: PasswordStrengthLabel;
  score: number;
}

export function getPasswordChecks(password: string): PasswordChecks {
  return {
    hasMinLength: password.length >= PASSWORD_MIN_LENGTH,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[@$!%*?&]/.test(password),
  };
}

export function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return "Mot de passe minimum 8 caracteres";
  }

  if (!PASSWORD_REGEX.test(password)) {
    return PASSWORD_HINT;
  }

  return null;
}

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { label: "A definir", score: 0 };
  }

  const checks = getPasswordChecks(password);
  let score = 0;

  if (checks.hasMinLength) score += 1;
  if (checks.hasUppercase) score += 1;
  if (checks.hasLowercase) score += 1;
  if (checks.hasNumber) score += 1;
  if (checks.hasSpecial) score += 1;
  if (password.length >= 12) score += 1;

  if (score <= 2) {
    return { label: "Faible", score };
  }

  if (score <= 4) {
    return { label: "Moyenne", score };
  }

  if (score === 5) {
    return { label: "Forte", score };
  }

  return { label: "Tres forte", score };
}
