import React from 'react';
import type { Staff } from '../../services/staff.service';
import { fixTextEncoding } from '../../utils/textEncoding';

interface StaffMobileCardProps {
  staff: Staff;
  onEdit: (staff: Staff) => void;
  onDelete: (staffId: string) => void;
}

export const StaffMobileCard: React.FC<StaffMobileCardProps> = ({
  staff,
  onEdit,
  onDelete
}) => {
  return (
    <div className="border rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400 font-semibold text-lg flex-shrink-0">
              {staff.firstName?.[0]}{staff.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white text-base truncate">
                {fixTextEncoding(staff.firstName)} {fixTextEncoding(staff.lastName)}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {staff.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 ml-2">
            <button
              onClick={() => onEdit(staff)}
              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              aria-label="Modifier"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(staff.id)}
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
          {staff.phone && (
            <div className="flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="text-gray-700 dark:text-gray-300">{staff.phone}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-gray-700 dark:text-gray-300 capitalize">
              {staff.role === 'MANAGER' ? 'Manager' : 'Employé'}
            </span>
          </div>

          {staff.specialties && staff.specialties.length > 0 && (
            <div className="flex items-start gap-2 text-sm">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex flex-wrap gap-1">
                {staff.specialties.slice(0, 3).map((specialty, idx) => (
                  <span key={idx} className="px-2 py-0.5 text-xs bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 rounded">
                    {fixTextEncoding(specialty)}
                  </span>
                ))}
                {staff.specialties.length > 3 && (
                  <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded">
                    +{staff.specialties.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffMobileCard;
