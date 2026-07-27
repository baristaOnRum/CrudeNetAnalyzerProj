import React, { useRef } from 'react';

interface DateInputProps {
  value: string; // Format: YYYY-MM-DD or empty
  onChange: (value: string) => void;
  title?: string;
  className?: string;
}

export const DateInput: React.FC<DateInputProps> = ({
  value,
  onChange,
  title,
  className = "px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
}) => {
  const datePickerRef = useRef<HTMLInputElement>(null);

  // Convert YYYY-MM-DD to DD/MM/YYYY for display
  const formatDisplayValue = (val: string) => {
    if (!val) return '';
    if (val.includes('-')) {
      const parts = val.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }
    return val;
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    if (!text) {
      onChange('');
      return;
    }
    if (text.includes('/')) {
      const parts = text.split('/');
      if (parts.length === 3 && parts[2].length === 4) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        onChange(`${year}-${month}-${day}`);
        return;
      }
    }
  };

  const handleOpenPicker = () => {
    if (datePickerRef.current) {
      if (typeof datePickerRef.current.showPicker === 'function') {
        try {
          datePickerRef.current.showPicker();
        } catch {
          datePickerRef.current.focus();
        }
      } else {
        datePickerRef.current.focus();
      }
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <input
        type="text"
        placeholder="dd/mm/aaaa"
        title={title}
        value={formatDisplayValue(value)}
        onChange={handleTextChange}
        onClick={handleOpenPicker}
        className={`${className} pr-7 font-sans text-slate-700 font-medium`}
      />
      <input
        ref={datePickerRef}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute right-1 opacity-0 w-6 h-6 cursor-pointer pointer-events-auto"
        tabIndex={-1}
      />
      <span 
        onClick={handleOpenPicker}
        className="material-symbols-outlined absolute right-2 text-slate-400 text-[16px] cursor-pointer hover:text-primary pointer-events-none"
      >
        calendar_today
      </span>
    </div>
  );
};
