import React from 'react';
import type { Salon } from '../../services/salon.service';
import { fixTextEncoding } from '../../utils/textEncoding';

interface SalonMobileCardProps {
  salon: Salon;
  onEdit: (salon: Salon) => void;
  onDelete: (salonId: string) => void;
  onSelect?: (salon: Salon) => void;
}

export const SalonMobileCard: React.FC<SalonMobileCardProps> = ({
  salon,
  onEdit,
  onDelete,
  onSelect
}) => {
  return (
    <div
      className="border rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onSelect?.(salon)}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-1">
              {fixTextEncoding(salon.name)}
            </h3>
            {salon.city && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {fixTextEncoding(salon.city)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 ml-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onEdit(salon)}
              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              aria-label="Modifier"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(salon.id)}
              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              aria-label="Supprimer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
          {salon.address && (
            <div className="flex items-start gap-2 text-sm">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-gray-700 dark:text-gray-300 flex-1">
                {fixTextEncoding(salon.address)}
                {salon.zipCode && `, ${salon.zipCode}`}
              </span>
            </div>
          )}

          {salon.phone && (
            <div className="flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="text-gray-700 dark:text-gray-300">{salon.phone}</span>
            </div>
          )}

          {salon.email && (
            <div className="flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-gray-700 dark:text-gray-300">{salon.email}</span>
            </div>
          )}
        </div>

        {/* Bouton Gérer */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(salon);
          }}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Gérer (horaires, fermetures, absences)
        </button>
      </div>
    </div>
  );
};

export default SalonMobileCard;
