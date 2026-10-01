'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X, Filter } from 'lucide-react';

export interface SelectOption {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: 'blue' | 'amber' | 'cyan' | 'emerald' | 'purple';
  category?: string;
  details?: string;
}

interface SearchableSelectProps {
  label: string;
  icon?: React.ReactNode;
  options: SelectOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  placeholder?: string;
  filterCategories?: string[];
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  icon,
  options,
  selectedId,
  onSelect,
  placeholder = 'Search item...',
  filterCategories,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.id === selectedId) || options[0],
    [options, selectedId]
  );

  const filteredOptions = useMemo(() => {
    return options.filter((opt) => {
      const matchesSearch =
        searchQuery === '' ||
        opt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (opt.subtitle && opt.subtitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (opt.details && opt.details.toLowerCase().includes(searchQuery.toLowerCase())) ||
        opt.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat =
        activeCategory === 'all' ||
        (opt.category && opt.category.toLowerCase() === activeCategory.toLowerCase());

      return matchesSearch && matchesCat;
    });
  }, [options, searchQuery, activeCategory]);

  return (
    <div className="relative font-mono text-xs w-full" ref={dropdownRef}>
      {/* Field Label */}
      <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          {icon}
          {label}
        </span>
        <span className="text-[10px] text-slate-400 font-normal">
          {options.length} in catalog
        </span>
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-950/90 border border-slate-700/80 hover:border-cyan-500/60 rounded-xl p-2.5 text-left flex items-center justify-between gap-2 shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-cyan-500"
      >
        <div className="truncate flex-1">
          <div className="flex items-center gap-2">
            {selectedOption?.badge && (
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                selectedOption.badgeColor === 'blue' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                selectedOption.badgeColor === 'amber' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                selectedOption.badgeColor === 'emerald' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              }`}>
                {selectedOption.badge}
              </span>
            )}
            <span className="font-bold text-slate-100 truncate text-xs">
              {selectedOption?.title}
            </span>
          </div>
          {selectedOption?.subtitle && (
            <div className="text-[11px] text-slate-400 truncate mt-0.5">
              {selectedOption.subtitle}
            </div>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-cyan-400' : ''}`} />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[#0b101c] border border-cyan-500/40 rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-96 flex flex-col">
          {/* Search Input Box */}
          <div className="p-2 border-b border-slate-800 bg-slate-950/90">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                autoFocus
                placeholder={placeholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Optional Category Filter Pills */}
            {filterCategories && filterCategories.length > 0 && (
              <div className="flex items-center gap-1 overflow-x-auto pt-2 scrollbar-none text-[10px]">
                <button
                  type="button"
                  onClick={() => setActiveCategory('all')}
                  className={`px-2 py-0.5 rounded uppercase font-semibold whitespace-nowrap ${
                    activeCategory === 'all'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  All
                </button>
                {filterCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`px-2 py-0.5 rounded uppercase font-semibold whitespace-nowrap ${
                      activeCategory === cat
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Options List */}
          <div className="overflow-y-auto max-h-64 p-1 space-y-0.5 divide-y divide-slate-800/40">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-xs">
                No matching catalog items found.
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.id === selectedId;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onSelect(opt.id);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={`w-full text-left p-2 rounded-lg transition-all flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'bg-cyan-950/60 border border-cyan-500/40 text-cyan-200'
                        : 'hover:bg-slate-900/90 text-slate-300'
                    }`}
                  >
                    <div className="truncate flex-1">
                      <div className="flex items-center gap-2">
                        {opt.badge && (
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                            opt.badgeColor === 'blue' ? 'bg-blue-500/20 text-blue-300' :
                            opt.badgeColor === 'amber' ? 'bg-amber-500/20 text-amber-300' :
                            opt.badgeColor === 'emerald' ? 'bg-emerald-500/20 text-emerald-300' :
                            'bg-cyan-500/20 text-cyan-300'
                          }`}>
                            {opt.badge}
                          </span>
                        )}
                        <span className="font-semibold text-slate-200 truncate">
                          {opt.title}
                        </span>
                      </div>
                      {opt.subtitle && (
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          {opt.subtitle}
                        </div>
                      )}
                      {opt.details && (
                        <div className="text-[9px] text-slate-500 truncate mt-0.5">
                          {opt.details}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
