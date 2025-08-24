import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const cardVariants = cva(
  'rounded-xl shadow-sm border transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:shadow-md dark:hover:shadow-slate-900/20',
        glass: 'bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-white/20 dark:border-slate-700/20 hover:bg-white/80 dark:hover:bg-slate-800/80',
        gradient: 'bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 border-gray-200 dark:border-slate-700 hover:shadow-lg dark:hover:shadow-slate-900/20',
        elevated: 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 shadow-lg hover:shadow-xl dark:hover:shadow-slate-900/30',
      },
      size: {
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

interface CardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  title, 
  subtitle,
  icon,
  actions,
  variant, 
  size, 
  className = '',
  ...props 
}) => {
  return (
    <div className={cardVariants({ variant, size, className })} {...props}>
      {(title || subtitle || icon || actions) && (
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {icon && (
              <div className="flex-shrink-0">
                {icon}
              </div>
            )}
            <div>
              {title && (
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
              )}
              {subtitle && (
                <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">{subtitle}</p>
              )}
            </div>
          </div>
          {actions && (
            <div className="flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

// Specialized card components
export const StatsCard: React.FC<{
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  className?: string;
}> = ({ title, value, change, changeType = 'neutral', icon, className = '' }) => {
  const changeColors = {
    positive: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
    negative: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30',
    neutral: 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800',
  };

  return (
    <Card variant="glass" className={className}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-slate-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
          {change && (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
              changeColors[changeType]
            }`}>
              {change}
            </span>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              {icon}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
