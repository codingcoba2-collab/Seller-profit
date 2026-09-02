import React, { useState, useEffect } from 'react';
import { formatInputComma, parseInputComma } from '../utils/formatters';

interface CommaNumberInputProps {
  id?: string;
  value: number;
  onChange: (val: number) => void;
  placeholder?: string;
  className?: string;
  prefix?: string;
  suffix?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  required?: boolean;
}

export const CommaNumberInput: React.FC<CommaNumberInputProps> = ({
  id,
  value,
  onChange,
  placeholder = '0',
  className = '',
  prefix,
  suffix,
  disabled = false,
  required = false,
}) => {
  const [displayValue, setDisplayValue] = useState<string>(
    value !== undefined && value !== null && value !== 0 ? formatInputComma(value) : ''
  );

  useEffect(() => {
    if (value === 0 && displayValue === '') return;
    const currentParsed = parseInputComma(displayValue);
    if (currentParsed !== value) {
      setDisplayValue(value && value !== 0 ? formatInputComma(value) : '');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatInputComma(raw);
    setDisplayValue(formatted);
    const parsed = parseInputComma(formatted);
    onChange(parsed);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  return (
    <div className="relative flex items-center w-full">
      {prefix && (
        <span className="absolute left-3 text-zinc-400 font-semibold text-xs select-none pointer-events-none">
          {prefix}
        </span>
      )}
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`w-full rounded-xl border border-white/10 bg-[#0b0c10] px-3 py-2.5 text-white text-xs font-semibold placeholder-zinc-500 transition focus:border-[#25F4EE] focus:outline-none focus:ring-1 focus:ring-[#25F4EE] disabled:bg-zinc-900/60 disabled:text-zinc-600 ${
          prefix ? 'pl-8' : ''
        } ${suffix ? 'pr-8' : ''} ${className}`}
      />
      {suffix && (
        <span className="absolute right-3 text-zinc-400 font-semibold text-[11px] select-none pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  );
};
