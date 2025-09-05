import React, { useState } from 'react';

interface Option {
  label: string;
  value: string;
}

interface CustomDropdownProps {
  label: string;
  options: Option[];
  onChange: (value: string) => void;
  required?: boolean;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({ label, options, onChange, required }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<Option | null>(null);

  const handleSelect = (option: Option) => {
    setSelected(option);
    onChange(option.value);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full mb-6">
      <label className="block text-sm font-semibold text-gray-800 mb-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>

      <div
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer w-full px-4 py-3 border border-gray-300 bg-white text-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {selected ? selected.label : `Select ${label}`}
      </div>

      {isOpen && (
        <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {options.map((option) => (
            <li
              key={option.value}
              onClick={() => handleSelect(option)}
              className="px-4 py-2 hover:bg-blue-100 cursor-pointer text-gray-800 transition"
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomDropdown;
