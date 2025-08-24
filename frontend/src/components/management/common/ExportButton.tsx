import React, { useState } from 'react';
import { ChevronDownIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import Button from './Button';

interface ExportOption {
  label: string;
  action: () => void;
  icon?: React.ReactNode;
}

interface ExportButtonProps {
  options: ExportOption[];
  className?: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({ options, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        className="flex items-center space-x-2"
      >
        <DocumentArrowDownIcon className="w-5 h-5" />
        <span>Export</span>
        <ChevronDownIcon className="w-4 h-4" />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-20 border border-gray-200 dark:border-gray-700">
            <div className="py-1">
              {options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => {
                    option.action();
                    setIsOpen(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  {option.icon && <span className="mr-3">{option.icon}</span>}
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ExportButton;
