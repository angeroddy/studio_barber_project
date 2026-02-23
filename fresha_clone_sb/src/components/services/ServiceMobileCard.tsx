import React from "react";
import type { Service } from "../../services/service.service";
import { fixTextEncoding } from "../../utils/textEncoding";

interface ServiceMobileCardProps {
  service: Service;
  onEdit: (service: Service) => void;
  onDelete: (serviceId: string) => void;
}

export const ServiceMobileCard: React.FC<ServiceMobileCardProps> = ({
  service,
  onEdit,
  onDelete,
}) => {
  const priceAsNumber = Number(service.price);
  const formattedPrice = Number.isFinite(priceAsNumber)
    ? priceAsNumber.toFixed(2)
    : "0.00";

  const formatDuration = (minutes: number) => {
    const safeMinutes = Number(minutes);
    if (!Number.isFinite(safeMinutes)) return "0min";

    const hours = Math.floor(safeMinutes / 60);
    const mins = safeMinutes % 60;
    if (hours > 0 && mins > 0) return `${hours}h${mins}`;
    if (hours > 0) return `${hours}h`;
    return `${mins}min`;
  };

  return (
    <div className="border rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-white text-base">
                {fixTextEncoding(service.name)}
              </h3>
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  service.isActive
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                }`}
              >
                {service.isActive ? "Actif" : "Inactif"}
              </span>
            </div>
            {service.category && (
              <span className="inline-block px-2 py-1 text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 rounded">
                {fixTextEncoding(service.category)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 ml-2">
            <button
              onClick={() => onEdit(service)}
              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              aria-label="Modifier"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
            <button
              onClick={() => onDelete(service.id)}
              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              aria-label="Supprimer"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm">
            <svg
              className="w-4 h-4 text-gray-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              {formatDuration(service.duration)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <svg
              className="w-4 h-4 text-gray-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-gray-700 dark:text-gray-300 font-semibold">
              {formattedPrice} €
            </span>
          </div>
        </div>

        {service.description && (
          <div className="pt-2">
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {fixTextEncoding(service.description)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceMobileCard;
