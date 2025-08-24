import React from 'react';

interface FormGroupProps {
  label?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

const FormGroup: React.FC<FormGroupProps> = ({
  label,
  error,
  children,
  className = '',
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      {children}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default FormGroup; 
