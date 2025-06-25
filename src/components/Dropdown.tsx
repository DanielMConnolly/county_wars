import React from 'react';
import { ChevronDown } from 'lucide-react';
import { DataTestIDs } from '../DataTestIDs';

export interface DropdownOption {
  value: string | number;
  label: string;
}

interface DropdownProps {
  value: string | number;
  onChange: (value: string | number) => void;
  options: DropdownOption[];
  placeholder?: string;
  label?: string;
  icon?: React.ReactNode;
  className?: string;
  renderPreview?: (value: string | number) => React.ReactNode;
  dataTestID?: DataTestIDs
}

export const Dropdown: React.FC<DropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  label,
  icon,
  className = "",
  dataTestID,
  renderPreview,
}) => {
  const selectedOption = options.find(option => option.value === value);
  const displayValue = selectedOption?.label || placeholder;

  return (
    <div className={className} data-testid={dataTestID}>
      {label && (
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
          {icon}
          {label}
        </label>
      )}

      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2
          focus:ring-blue-500 focus:border-transparent appearance-none bg-white cursor-pointer
          hover:border-gray-400 transition-colors"
        >
          {placeholder && !value && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Display current selected value */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <span className="text-gray-900 font-medium">
            {displayValue}
          </span>
        </div>

        {/* Custom elements in the dropdown */}
        <div className="absolute right-8 top-1/2 transform -translate-y-1/2 pointer-events-none">
          {renderPreview && renderPreview(value)}
        </div>

        {/* Dropdown arrow */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <ChevronDown size={16} className="text-gray-500" />
        </div>
      </div>
    </div>
  );
};
