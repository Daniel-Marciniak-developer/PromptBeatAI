import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface SelectDropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const SelectDropdown: React.FC<SelectDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select option...",
  className = "",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(option => option.value === value);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-left
          flex items-center justify-between transition-all duration-200
          ${disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:bg-white/10 focus:outline-none focus:border-blue-500/50 cursor-pointer'
          }
          ${isOpen ? 'border-blue-500/50 bg-white/10' : ''}
        `}
      >
        <span className={`text-sm ${selectedOption ? 'text-white' : 'text-white/40'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-white/60" />
        </motion.div>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1 z-50"
          >
            <div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl overflow-hidden">
              <div className="max-h-60 overflow-y-auto">
                {options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={`
                      w-full px-3 py-2 text-left text-sm transition-colors
                      flex items-center justify-between
                      ${option.value === value
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'text-white/80 hover:bg-white/10'
                      }
                    `}
                  >
                    <span>{option.label}</span>
                    {option.value === value && (
                      <Check className="w-4 h-4 text-blue-300" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SelectDropdown;
