import type React from "react";
import { useState, useEffect, useRef } from "react";
import { searchClients, type Client } from "../../../services/client.service";

interface ClientAutocompleteProps {
  salonId?: string;
  value?: Client | null;
  onChange: (client: Client | null) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  hint?: string;
}

const ClientAutocomplete: React.FC<ClientAutocompleteProps> = ({
  salonId,
  value,
  onChange,
  placeholder = "Rechercher un client...",
  disabled = false,
  error = false,
  hint,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<Client[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fermer le dropdown quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Afficher le nom du client sélectionné dans l'input
  useEffect(() => {
    if (value) {
      setSearchTerm(`${value.firstName} ${value.lastName}`);
    }
  }, [value]);

  // Fonction de recherche avec debounce
  const performSearch = async (term: string) => {
    if (term.trim().length < 2) {
      setResults([]);
      setShowDropdown(false);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    console.log('🔍 [ClientAutocomplete] Recherche:', { term, salonId });

    try {
      const response = await searchClients(term, salonId, 1, 15);
      console.log('✅ [ClientAutocomplete] Résultats:', response);
      setResults(response.clients);
      setShowDropdown(true);
    } catch (error) {
      console.error("❌ [ClientAutocomplete] Erreur lors de la recherche de clients:", error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Gérer le changement de texte avec debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);

    // Si l'utilisateur efface, réinitialiser la sélection
    if (term.trim() === "") {
      onChange(null);
      setResults([]);
      setShowDropdown(false);
      setHasSearched(false);
    }

    // Clear timeout précédent
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Nouveau timeout de 300ms
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(term);
    }, 300);
  };

  // Gérer la sélection d'un client
  const handleSelectClient = (client: Client) => {
    onChange(client);
    setSearchTerm(`${client.firstName} ${client.lastName}`);
    setShowDropdown(false);
    setResults([]);
    setHasSearched(false);
  };

  // Gérer le focus sur l'input
  const handleFocus = () => {
    if (results.length > 0) {
      setShowDropdown(true);
    }
  };

  // Classes CSS pour l'input
  let inputClasses = `h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30`;

  if (disabled) {
    inputClasses += ` text-gray-500 border-gray-300 opacity-40 bg-gray-100 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700`;
  } else if (error) {
    inputClasses += ` border-error-500 focus:border-error-300 focus:ring-error-500/20 dark:text-error-400 dark:border-error-500 dark:focus:border-error-800`;
  } else {
    inputClasses += ` bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800`;
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={handleFocus}
        placeholder={placeholder}
        disabled={disabled}
        className={inputClasses}
        autoComplete="off"
      />

      {/* Dropdown des résultats */}
      {showDropdown && !disabled && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto"
        >
          {isSearching ? (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 flex items-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-4 w-4 text-brand-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Recherche en cours...
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                {results.length} résultat{results.length > 1 ? "s" : ""} trouvé{results.length > 1 ? "s" : ""}
              </div>
              {results.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => handleSelectClient(client)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 last:border-b-0 transition-colors"
                >
                  <div className="font-medium text-sm text-gray-900 dark:text-white">
                    {client.firstName} {client.lastName}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-3">
                    {client.email && (
                      <span className="flex items-center gap-1">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        {client.email}
                      </span>
                    )}
                    {client.phone && (
                      <span className="flex items-center gap-1">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                        {client.phone}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </>
          ) : hasSearched ? (
            <div className="px-4 py-6 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Aucun client trouvé
              </p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Essayez une autre recherche
              </p>
            </div>
          ) : null}
        </div>
      )}

      {/* Message d'aide */}
      {hint && (
        <p
          className={`mt-1.5 text-xs ${
            error ? "text-error-500" : "text-gray-500"
          }`}
        >
          {hint}
        </p>
      )}

      {/* Message pour guider l'utilisateur */}
      {!showDropdown && !value && !isSearching && searchTerm.length > 0 && searchTerm.length < 2 && (
        <p className="mt-1.5 text-xs text-gray-400">
          Tapez au moins 2 caractères pour rechercher
        </p>
      )}
    </div>
  );
};

export default ClientAutocomplete;
