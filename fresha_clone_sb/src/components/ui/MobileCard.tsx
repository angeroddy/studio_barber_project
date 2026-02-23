import React from 'react';

interface MobileCardProps {
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const MobileCard: React.FC<MobileCardProps> = ({
  children,
  actions,
  className = ''
}) => {
  return (
    <div className={`border rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm ${className}`}>
      {children}
      {actions && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {actions}
        </div>
      )}
    </div>
  );
};

export default MobileCard;
