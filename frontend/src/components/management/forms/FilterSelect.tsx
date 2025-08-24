import React from 'react';
import Select from '../common/Select';

interface Option {
  value: string;
  label: string;
}

interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
}

const FilterSelect: React.FC<FilterSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Filter by...',
  className = '',
}) => {
  return (
    <Select
      value={value}
      onChange={onChange}
      options={[
        { value: '', label: placeholder },
        ...options,
      ]}
      className={className}
    />
  );
};

export default FilterSelect; 
