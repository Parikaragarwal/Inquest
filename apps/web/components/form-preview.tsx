'use client';

import { useState, useEffect } from 'react';
import { Star, AlertCircle, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import backgroundsData from '~/public/backgrounds.json';

// Types matches builder state
export type FieldValidation = {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
  minDate?: string;
  maxDate?: string;
  options?: string[];
  maxSelections?: number;
  countryCode?: string;
};

export type FormField = {
  id?: string;
  localId: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string | null;
  validation?: FieldValidation | null;
  orderIndex: number;
};

interface FormPreviewProps {
  fields: FormField[];
  title: string;
  description: string;
  theme: Record<string, any>;
  mode: 'light' | 'dark';
  interactive?: boolean;
  onModeToggle?: () => void;
  
  // State from parent (only needed if interactive=true)
  answers?: Record<string, string>;
  onAnswerChange?: (fieldId: string, value: string) => void;
  multiSelectAnswers?: Record<string, string[]>;
  onMultiSelectChange?: (fieldId: string, value: string[]) => void;
  phoneCountryCodes?: Record<string, string>;
  onPhoneCountryCodeChange?: (fieldId: string, value: string) => void;
  
  onSubmit?: (e: React.FormEvent) => void;
  submitButtonText?: string;
  isSubmitting?: boolean;
}

const COUNTRY_CODES = [
  { label: 'None', value: '' },
  { label: '+1 (US/CA)', value: '+1' },
  { label: '+44 (UK)', value: '+44' },
  { label: '+91 (India)', value: '+91' },
  { label: '+61 (AU)', value: '+61' },
  { label: '+49 (DE)', value: '+49' },
  { label: '+33 (FR)', value: '+33' },
  { label: '+81 (JP)', value: '+81' },
  { label: '+86 (CN)', value: '+86' },
  { label: '+55 (BR)', value: '+55' },
  { label: '+7 (RU)', value: '+7' },
  { label: '+34 (ES)', value: '+34' },
  { label: '+39 (IT)', value: '+39' },
  { label: '+82 (KR)', value: '+82' },
  { label: '+65 (SG)', value: '+65' },
  { label: '+971 (UAE)', value: '+971' },
  { label: '+966 (SA)', value: '+966' },
  { label: '+20 (EG)', value: '+20' },
  { label: '+27 (ZA)', value: '+27' },
  { label: '+52 (MX)', value: '+52' },
];

export function FormPreview({
  fields,
  title,
  description,
  theme,
  mode,
  interactive = false,
  onModeToggle,
  answers = {},
  onAnswerChange,
  multiSelectAnswers = {},
  onMultiSelectChange,
  phoneCountryCodes = {},
  onPhoneCountryCodeChange,
  onSubmit,
  submitButtonText = 'Submit Response',
  isSubmitting = false,
}: FormPreviewProps) {
  // Local rating states for hover and click simulation in builder
  const [localAnswers, setLocalAnswers] = useState<Record<string, string>>({});
  const [localMultiSelect, setLocalMultiSelect] = useState<Record<string, string[]>>({});
  const [localPhoneCountry, setLocalPhoneCountry] = useState<Record<string, string>>({});
  const [hoveredRating, setHoveredRating] = useState<Record<string, number>>({});

  // Resolve theme styles
  let resolvedBg = '';
  let resolvedBgColor = '';
  let resolvedAccent = '';
  let resolvedFieldColor = '';

  const isNewSchema = theme && (theme.lightMode || theme.darkMode);
  
  if (isNewSchema) {
    const config = mode === 'dark' ? theme.darkMode : theme.lightMode;
    resolvedBgColor = config?.backgroundColor || (mode === 'dark' ? '#0B0705' : '#F5EFEB');
    resolvedAccent = config?.accentColor || (mode === 'dark' ? '#E06F28' : '#D97436');
    resolvedFieldColor = config?.fieldColor || theme.fieldColor || '';
    const bgId = config?.backgroundId;
    if (bgId && bgId !== 'none') {
      const found = backgroundsData.backgrounds.find((bg) => bg.id === bgId);
      if (found?.url) resolvedBg = found.url;
    }
  } else if (theme) {
    resolvedBgColor = theme.backgroundColor || (mode === 'dark' ? '#0B0705' : '#F5EFEB');
    resolvedAccent = theme.accentColor || (mode === 'dark' ? '#E06F28' : '#D97436');
    resolvedFieldColor = theme.fieldColor || '';
    if (theme.backgroundId && theme.backgroundId !== 'none') {
      const found = backgroundsData.backgrounds.find((bg) => bg.id === theme.backgroundId);
      if (found?.url) resolvedBg = found.url;
    } else if (theme.backgroundImageUrl) {
      resolvedBg = theme.backgroundImageUrl;
    }
  }

  // Strict visual constraints based on preview theme mode
  if (mode === 'dark') {
    // 1. Force the base background color to be dark
    if (resolvedBgColor) {
      const hex = resolvedBgColor.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      if (luminance > 0.45) {
        resolvedBgColor = '#0B0705';
      }
    } else {
      resolvedBgColor = '#0B0705';
    }

    // 2. Force the field background color to be dark
    if (resolvedFieldColor) {
      const hex = resolvedFieldColor.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      if (luminance > 0.45) {
        resolvedFieldColor = '#0F0A08';
      }
    } else {
      resolvedFieldColor = '#0F0A08';
    }
  } else {
    // Light mode:
    // 1. Force base background color to be light
    if (resolvedBgColor) {
      const hex = resolvedBgColor.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      if (luminance <= 0.45) {
        resolvedBgColor = '#F5EFEB';
      }
    } else {
      resolvedBgColor = '#F5EFEB';
    }

    // 2. Force field background color to be light
    if (resolvedFieldColor) {
      const hex = resolvedFieldColor.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      if (luminance <= 0.45) {
        resolvedFieldColor = '#FAF5F2';
      }
    } else {
      resolvedFieldColor = '#FAF5F2';
    }
  }

  // Compute text color (Strict light color in dark mode, dark color in light mode)
  const fieldTextColor = mode === 'dark' ? '#F2EBE5' : (resolvedFieldColor ? (() => {
    try {
      const hex = resolvedFieldColor.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance > 0.5 ? '#3A2312' : '#F2EBE5';
    } catch { return '#3A2312'; }
  })() : '#3A2312');

  // Inject local style variables overrides to block global site dark/light mode classes
  const localThemeOverrides: React.CSSProperties = mode === 'dark' ? {
    '--color-inquest-base': resolvedBgColor,
    '--color-inquest-surface': resolvedFieldColor,
    '--color-inquest-depth': '#150F0C',
    '--color-inquest-rule': 'rgba(255, 255, 255, 0.22)', // Clearly visible input borders in dark mode
    '--color-inquest-ink': '#F2EBE5',
    '--color-inquest-ink-mid': '#D9CFC6',
    '--color-inquest-ink-soft': '#A39387',
    '--color-inquest-ink-ghost': '#5C4D44',
    '--color-inquest-accent': resolvedAccent,
    '--color-inquest-accent-soft': '#F98740',
    '--color-inquest-accent-pale': '#1E120A',
    '--color-inquest-sage': '#F2B024',
    '--color-inquest-caution': '#EF5350',
    colorScheme: 'dark',
  } as React.CSSProperties : {
    '--color-inquest-base': resolvedBgColor,
    '--color-inquest-surface': resolvedFieldColor,
    '--color-inquest-depth': '#ECE2DB',
    '--color-inquest-rule': '#DFD0C4', // Clearly visible in light mode
    '--color-inquest-ink': '#3A2312',
    '--color-inquest-ink-mid': '#5B402B',
    '--color-inquest-ink-soft': '#856953',
    '--color-inquest-ink-ghost': '#BCAE9F',
    '--color-inquest-accent': resolvedAccent,
    '--color-inquest-accent-soft': '#DC6B27',
    '--color-inquest-accent-pale': '#FDF4ED',
    '--color-inquest-sage': '#D29416',
    '--color-inquest-caution': '#C62828',
    colorScheme: 'light',
  } as React.CSSProperties;

  const containerStyle: React.CSSProperties = {
    backgroundColor: resolvedBgColor,
    ...(resolvedBg ? {
      backgroundImage: `url(${resolvedBg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
    } : {}),
    ...localThemeOverrides,
  };

  const getFieldCardBg = (colorHex: string, themeMode: 'light' | 'dark') => {
    if (!colorHex) return themeMode === 'dark' ? 'rgba(15, 10, 8, 0.85)' : 'rgba(250, 245, 242, 0.85)';
    if (colorHex.startsWith('#') && colorHex.length === 7) {
      const r = parseInt(colorHex.substring(1, 3), 16);
      const g = parseInt(colorHex.substring(3, 5), 16);
      const b = parseInt(colorHex.substring(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, 0.85)`; // 85% opacity
    }
    return colorHex;
  };

  const fieldCardStyle: React.CSSProperties = {
    backgroundColor: getFieldCardBg(resolvedFieldColor, mode),
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    color: fieldTextColor,
    borderColor: fieldTextColor === '#F2EBE5' ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.08)',
    borderWidth: '1px',
  };

  const getVal = (fid: string) => (interactive ? answers[fid] : localAnswers[fid]) || '';
  
  const setVal = (fid: string, value: string) => {
    if (interactive && onAnswerChange) {
      onAnswerChange(fid, value);
    } else {
      setLocalAnswers((prev) => ({ ...prev, [fid]: value }));
    }
  };

  const getMultiVal = (fid: string) => (interactive ? multiSelectAnswers[fid] : localMultiSelect[fid]) || [];
  
  const toggleMultiVal = (fid: string, opt: string) => {
    const current = getMultiVal(fid);
    const next = current.includes(opt) ? current.filter((v) => v !== opt) : [...current, opt];
    if (interactive && onMultiSelectChange) {
      onMultiSelectChange(fid, next);
    } else {
      setLocalMultiSelect((prev) => ({ ...prev, [fid]: next }));
    }
  };

  const getPhoneCountry = (fid: string, defaultCc: string) => 
    (interactive ? phoneCountryCodes[fid] : localPhoneCountry[fid]) || defaultCc || '';

  const setPhoneCountry = (fid: string, value: string) => {
    if (interactive && onPhoneCountryCodeChange) {
      onPhoneCountryCodeChange(fid, value);
    } else {
      setLocalPhoneCountry((prev) => ({ ...prev, [fid]: value }));
    }
  };

  return (
    <div
      style={containerStyle}
      className={`min-h-screen py-12 px-4 sm:px-6 transition-all duration-300 relative ${
        resolvedBg ? 'form-page-overlay' : ''
      }`}
    >
      {/* Floating Theme Toggle */}
      {interactive && onModeToggle && (
        <div className="absolute top-6 right-6 z-30">
          <button
            type="button"
            onClick={onModeToggle}
            title={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-inquest-surface/90 hover:bg-inquest-surface border border-inquest-rule/60 text-inquest-accent shadow-sm hover:shadow-md transition-all cursor-pointer backdrop-blur-xs"
          >
            {mode === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      )}

      <div className="max-w-full relative z-10">
        <header
          style={fieldCardStyle}
          className={`mb-12 text-center p-6 sm:p-8 rounded-3xl border border-inquest-rule/45 shadow-sm ${
            resolvedFieldColor ? '' : 'bg-inquest-surface/85 backdrop-blur-md'
          }`}
        >
          <h1 className="text-3xl sm:text-4xl font-serif text-inquest-ink mb-3 tracking-tight font-bold">
            {title || 'Untitled Enquiry'}
          </h1>
          {description && (
            <p className="text-base sm:text-lg text-inquest-ink-mid max-w-xl mx-auto leading-relaxed">
              {description}
            </p>
          )}
        </header>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (interactive && onSubmit) onSubmit(e);
          }}
          className="space-y-6 sm:space-y-8"
        >
          {fields.map((field, index) => {
            const fid = field.id || field.localId;
            return (
              <motion.div
                key={fid}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.05, 0.4) }}
                className={`${resolvedFieldColor ? '' : 'bg-inquest-surface'} p-6 sm:p-8 rounded-[2rem] warm-shadow border border-inquest-rule/55 relative overflow-hidden`}
                style={fieldCardStyle}
              >
                <div className="absolute top-0 right-0 w-2 h-full" style={{ backgroundColor: resolvedAccent }} />
                
                <label className="block mb-5">
                  <span className="text-lg sm:text-xl font-serif text-inquest-ink block font-bold leading-tight mb-1">
                    {field.label || 'Untitled Question'}
                    {field.required && <span className="text-inquest-caution ml-1.5 font-sans">*</span>}
                  </span>
                </label>

                {/* SHORT TEXT */}
                {field.type === 'text' && (
                  <div>
                    <input
                      type="text"
                      disabled={!interactive}
                      required={field.required}
                      value={getVal(fid)}
                      onChange={(e) => setVal(fid, e.target.value)}
                      placeholder={field.placeholder || ''}
                      className="w-full bg-inquest-base border border-inquest-rule focus:border-inquest-accent focus:ring-2 focus:ring-inquest-accent/20 rounded-xl px-4 py-2.5 text-base text-inquest-ink placeholder:text-inquest-ink-soft/60 transition"
                      style={{ focusRingColor: resolvedAccent } as React.CSSProperties}
                    />
                    <ValidationHints validation={field.validation} type="text" />
                  </div>
                )}

                {/* LONG TEXT */}
                {field.type === 'textarea' && (
                  <div>
                    <textarea
                      disabled={!interactive}
                      required={field.required}
                      value={getVal(fid)}
                      onChange={(e) => setVal(fid, e.target.value)}
                      placeholder={field.placeholder || ''}
                      className="w-full bg-inquest-base border border-inquest-rule focus:border-inquest-accent focus:ring-2 focus:ring-inquest-accent/20 rounded-2xl px-4 py-3 min-h-[120px] resize-none text-base text-inquest-ink placeholder:text-inquest-ink-soft/60 transition"
                    />
                    <ValidationHints validation={field.validation} type="text" />
                  </div>
                )}

                {/* NUMBER */}
                {field.type === 'number' && (
                  <div>
                    <input
                      type="number"
                      disabled={!interactive}
                      required={field.required}
                      value={getVal(fid)}
                      onChange={(e) => setVal(fid, e.target.value)}
                      placeholder={field.placeholder || ''}
                      className="w-full bg-inquest-base border border-inquest-rule focus:border-inquest-accent focus:ring-2 focus:ring-inquest-accent/20 rounded-xl px-4 py-2.5 text-base text-inquest-ink placeholder:text-inquest-ink-soft/60 transition"
                    />
                    <ValidationHints validation={field.validation} type="number" />
                  </div>
                )}

                {/* EMAIL */}
                {field.type === 'email' && (
                  <input
                    type="email"
                    disabled={!interactive}
                    required={field.required}
                    value={getVal(fid)}
                    onChange={(e) => setVal(fid, e.target.value)}
                    placeholder={field.placeholder || ''}
                    className="w-full bg-inquest-base border border-inquest-rule focus:border-inquest-accent focus:ring-2 focus:ring-inquest-accent/20 rounded-xl px-4 py-2.5 text-base text-inquest-ink placeholder:text-inquest-ink-soft/60 transition"
                  />
                )}

                {/* PHONE */}
                {field.type === 'phone' && (
                  <div>
                    <div className="flex gap-2">
                      <select
                        disabled={!interactive}
                        value={getPhoneCountry(fid, field.validation?.countryCode || '')}
                        onChange={(e) => setPhoneCountry(fid, e.target.value)}
                        className="bg-inquest-base border border-inquest-rule rounded-xl px-2.5 py-2.5 text-inquest-ink text-sm shrink-0 focus:border-inquest-accent focus:outline-none"
                      >
                        {COUNTRY_CODES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        disabled={!interactive}
                        required={field.required}
                        value={getVal(fid)}
                        onChange={(e) => setVal(fid, e.target.value)}
                        placeholder={field.placeholder || 'Phone number'}
                        className="flex-1 bg-inquest-base border border-inquest-rule focus:border-inquest-accent focus:ring-2 focus:ring-inquest-accent/20 rounded-xl px-4 py-2.5 text-base text-inquest-ink placeholder:text-inquest-ink-soft/60 transition"
                      />
                    </div>
                    <ValidationHints validation={field.validation} type="phone" />
                  </div>
                )}

                {/* DATE */}
                {field.type === 'date' && (
                  <div>
                    <input
                      type="date"
                      disabled={!interactive}
                      required={field.required}
                      value={getVal(fid)}
                      onChange={(e) => setVal(fid, e.target.value)}
                      placeholder={field.placeholder || ''}
                      className="w-full bg-inquest-base border border-inquest-rule focus:border-inquest-accent focus:ring-2 focus:ring-inquest-accent/20 rounded-xl px-4 py-2.5 text-base text-inquest-ink placeholder:text-inquest-ink-soft/60 transition"
                    />
                  </div>
                )}

                {/* BOOLEAN */}
                {field.type === 'boolean' && (
                  <div className="grid grid-cols-2 gap-4">
                    {['true', 'false'].map((val) => {
                      const isSelected = getVal(fid) === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          disabled={!interactive}
                          onClick={() => setVal(fid, val)}
                          className={`py-3.5 rounded-2xl text-base font-bold transition-all border ${
                            isSelected
                              ? val === 'true'
                                ? 'bg-inquest-accent text-white border-transparent shadow-md'
                                : 'bg-inquest-ink text-white border-transparent shadow-md'
                              : 'bg-inquest-base border-inquest-rule text-inquest-ink hover:border-inquest-accent'
                          }`}
                          style={{
                            backgroundColor: isSelected && val === 'true' ? resolvedAccent : undefined,
                          }}
                        >
                          {val === 'true' ? 'Yes' : 'No'}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* RATING */}
                {field.type === 'rating' && (
                  <div>
                    <div className="flex items-center gap-1 mt-1">
                      {Array.from({ length: field.validation?.max ?? 5 }).map((_, i) => {
                        const starValue = i + 1;
                        const currentAnswer = Number(getVal(fid) || '0');
                        const isActive = starValue <= (hoveredRating[fid] || currentAnswer);
                        return (
                          <button
                            key={i}
                            type="button"
                            disabled={!interactive}
                            onClick={() => setVal(fid, starValue.toString())}
                            onMouseEnter={() => setHoveredRating((prev) => ({ ...prev, [fid]: starValue }))}
                            onMouseLeave={() => setHoveredRating((prev) => {
                              const copy = { ...prev };
                              delete copy[fid];
                              return copy;
                            })}
                            className="p-1 hover:scale-110 transition-transform cursor-pointer focus:outline-none disabled:cursor-default"
                          >
                            <Star
                              size={32}
                              className={`transition-all duration-150 ${
                                isActive
                                  ? 'fill-amber-400 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)] scale-105'
                                  : 'text-inquest-ink-ghost hover:text-inquest-ink-soft'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* SINGLE SELECT */}
                {field.type === 'single_select' && (
                  <div className="space-y-2.5">
                    {field.validation?.options?.map((opt: string) => {
                      const isChecked = getVal(fid) === opt;
                      return (
                        <label
                          key={opt}
                          className={`flex items-center p-3.5 rounded-2xl border transition-colors ${
                            interactive ? 'cursor-pointer' : ''
                          } ${
                            isChecked
                              ? 'bg-inquest-accent-pale border-inquest-accent'
                              : 'bg-inquest-base border-inquest-rule hover:border-inquest-accent'
                          }`}
                          style={{
                            borderColor: isChecked ? resolvedAccent : undefined,
                            backgroundColor: isChecked ? `${resolvedAccent}12` : undefined,
                          }}
                        >
                          <input
                            type="radio"
                            disabled={!interactive}
                            name={fid}
                            value={opt}
                            checked={isChecked}
                            onChange={(e) => setVal(fid, e.target.value)}
                            className="w-4 h-4 text-inquest-accent focus:ring-inquest-accent border-inquest-rule bg-inquest-base"
                            style={{ color: resolvedAccent } as React.CSSProperties}
                          />
                          <span className="ml-3 text-base text-inquest-ink font-medium leading-tight">
                            {opt}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* MULTI SELECT */}
                {field.type === 'multi_select' && (
                  <div className="space-y-2.5">
                    {field.validation?.options?.map((opt: string) => {
                      const selected = getMultiVal(fid);
                      const isChecked = selected.includes(opt);
                      const maxSel = field.validation?.maxSelections;
                      const isDisabled = !interactive || (!isChecked && maxSel !== undefined && selected.length >= maxSel);
                      return (
                        <label
                          key={opt}
                          className={`flex items-center p-3.5 rounded-2xl border transition-colors ${
                            interactive && !isDisabled ? 'cursor-pointer' : ''
                          } ${
                            isChecked
                              ? 'bg-inquest-accent-pale border-inquest-accent'
                              : isDisabled
                                ? 'bg-inquest-base border-inquest-rule opacity-50 cursor-not-allowed'
                                : 'bg-inquest-base border-inquest-rule hover:border-inquest-accent'
                          }`}
                          style={{
                            borderColor: isChecked ? resolvedAccent : undefined,
                            backgroundColor: isChecked ? `${resolvedAccent}12` : undefined,
                          }}
                        >
                          <input
                            type="checkbox"
                            disabled={isDisabled}
                            value={opt}
                            checked={isChecked}
                            onChange={() => toggleMultiVal(fid, opt)}
                            className="w-4 h-4 rounded text-inquest-accent focus:ring-inquest-accent border-inquest-rule bg-inquest-base"
                            style={{ color: resolvedAccent } as React.CSSProperties}
                          />
                          <span className="ml-3 text-base text-inquest-ink font-medium leading-tight">
                            {opt}
                          </span>
                        </label>
                      );
                    })}
                    {field.validation?.maxSelections && (
                      <p className="text-xs text-inquest-ink-soft mt-1">
                        Select up to {field.validation.maxSelections} options
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}

          {interactive && (
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-full text-white text-lg font-bold transition-all shadow-md flex items-center justify-center cursor-pointer"
                style={{
                  backgroundColor: resolvedAccent,
                  boxShadow: `0 4px 14px 0 rgba(${parseInt(resolvedAccent.slice(1, 3), 16)}, ${parseInt(resolvedAccent.slice(3, 5), 16)}, ${parseInt(resolvedAccent.slice(5, 7), 16)}, 0.4)`,
                }}
              >
                {isSubmitting ? 'Submitting...' : submitButtonText}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

// ─── Inline validation hints component ───────────────────────

function ValidationHints({ validation, type }: { validation: any; type: string }) {
  if (!validation) return null;
  const hints: string[] = [];
  if (type === 'text' || type === 'phone') {
    if (validation.minLength != null) hints.push(`Min ${validation.minLength} chars`);
    if (validation.maxLength != null) hints.push(`Max ${validation.maxLength} chars`);
    if (validation.pattern) hints.push(`Pattern: ${validation.pattern}`);
  }
  if (type === 'number') {
    if (validation.min != null) hints.push(`Min: ${validation.min}`);
    if (validation.max != null) hints.push(`Max: ${validation.max}`);
  }
  if (hints.length === 0) return null;
  return (
    <p className="mt-2 text-xs text-inquest-ink-ghost font-medium flex items-center gap-1">
      <AlertCircle size={10} />
      {hints.join(' · ')}
    </p>
  );
}
