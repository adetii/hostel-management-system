import React from 'react';

interface FormRowProps {
  children: React.ReactNode;
  className?: string;
}

const FormRow: React.FC<FormRowProps> = ({ children, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${className}`}>
      {children}
    </div>
  );
};

export default FormRow; 
