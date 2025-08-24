import React from 'react';

type AlertVariant = 'success' | 'warning' | 'error' | 'info';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  message,
  onClose,
  className = '',
}) => {
  const getVariantClasses = (): { container: string; icon: string } => {
    switch (variant) {
      case 'success':
        return {
          container: 'bg-green-50 border-green-400 text-green-800',
          icon: 'text-green-400',
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-400 text-yellow-800',
          icon: 'text-yellow-400',
        };
      case 'error':
        return {
          container: 'bg-red-50 border-red-400 text-red-800',
          icon: 'text-red-400',
        };
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-400 text-blue-800',
          icon: 'text-blue-400',
        };
      default:
        return {
          container: 'bg-blue-50 border-blue-400 text-blue-800',
          icon: 'text-blue-400',
        };
    }
  };

  const getIcon = (): string => {
    switch (variant) {
      case 'success':
        return '✓';
      case 'warning':
        return '⚠';
      case 'error':
        return '✕';
      case 'info':
        return 'ℹ';
      default:
        return 'ℹ';
    }
  };

  const { container, icon } = getVariantClasses();

  return (
    <div
      className={`rounded-md p-4 border ${container} ${className}`}
      role="alert"
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <span className={`text-lg ${icon}`}>{getIcon()}</span>
        </div>
        <div className="ml-3">
          {title && (
            <h3 className="text-sm font-medium">{title}</h3>
          )}
          <div className="text-sm">{message}</div>
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <button
              type="button"
              className={`inline-flex rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${icon}`}
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <span className="text-lg">×</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alert; 
