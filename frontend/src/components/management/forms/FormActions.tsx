import React from 'react';
import Button from '../common/Button';

interface FormActionsProps {
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  isLoading?: boolean;
  className?: string;
}

const FormActions: React.FC<FormActionsProps> = ({
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  onCancel,
  isLoading = false,
  className = '',
}) => {
  return (
    <div className={`flex justify-end space-x-4 ${className}`}>
      {onCancel && (
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
        >
          {cancelLabel}
        </Button>
      )}
      <Button
        type="submit"
        isLoading={isLoading}
      >
        {submitLabel}
      </Button>
    </div>
  );
};

export default FormActions; 
