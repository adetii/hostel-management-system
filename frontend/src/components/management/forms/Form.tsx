import React from 'react';

type FormProps = {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  children: React.ReactNode;
  className?: string;
} & Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'>;

const Form = ({
  onSubmit,
  children,
  className = '',
  ...props
}: FormProps): JSX.Element => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`space-y-6 ${className}`}
      {...props}
    >
      {children}
    </form>
  );
};

export default Form; 
