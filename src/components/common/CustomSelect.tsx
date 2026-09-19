import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import clsx from 'clsx';

interface Option {
  label: string;
  value: string;
}

interface CustomSelectProps {
  options: (string | Option)[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'เลือกรายการ',
  icon,
  disabled = false,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizedOptions: Option[] = options.map(opt => 
    typeof opt === 'string' ? { label: opt, value: opt } : opt
  );

  const selectedOption = normalizedOptions.find(o => o.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={clsx("relative inline-block w-full text-left antialiased", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={clsx(
          "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border text-sm font-bold transition-all duration-200 outline-none select-none",
          isOpen
            ? "bg-white border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm"
            : "bg-slate-50/80 border-slate-200/80 hover:bg-white hover:border-slate-300 text-slate-800 shadow-xs",
          disabled && "opacity-50 cursor-not-allowed bg-slate-100 border-slate-200"
        )}
      >
        <div className="flex items-center gap-2.5 truncate">
          {icon && <span className="shrink-0">{icon}</span>}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown 
          className={clsx(
            "w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200",
            isOpen && "transform rotate-180 text-indigo-600"
          )} 
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 w-full bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 max-h-60 overflow-y-auto">
          {normalizedOptions.length === 0 ? (
            <div className="px-4 py-3 text-xs text-slate-400 text-center font-medium">
              ไม่มีรายการให้เลือก
            </div>
          ) : (
            normalizedOptions.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <div
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={clsx(
                    "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-colors duration-150",
                    isSelected 
                      ? "bg-indigo-50 text-indigo-700" 
                      : "text-slate-700 hover:bg-slate-100/70 hover:text-slate-900"
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
