'use client';

import { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { trpc } from '~/trpc/client';
import { motion, AnimatePresence, Reorder, useDragControls, LayoutGroup } from 'framer-motion';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import {
  Save, Globe, Lock, ArrowLeft, Trash2,
  Settings, Type, FileText, Hash, CheckSquare,
  Calendar, List, CheckCircle, Mail, Phone,
  Copy, ExternalLink, Users, ClipboardCopy, Edit3, GripVertical, Eye,
  Star, Sun, Moon, Sparkles, Check, Palette, Plus, X, ChevronDown, ChevronUp,
  AlertCircle, RotateCcw, QrCode, Link, ChevronLeft, ChevronRight, Asterisk,
  Download, ShieldAlert, Zap
} from 'lucide-react';
import { useGetuser } from '~/hooks/api/auth';
import NextLink from 'next/link';
import { Switch } from '~/components/ui/switch';
import { FormPreview } from '~/components/form-preview';
import backgroundsData from '~/public/backgrounds.json';
import { cn } from '~/lib/utils';

// ─── Types ──────────────────────────────────────────────────

type FieldValidation = {
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

type FormField = {
  id?: string;
  localId: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string | null;
  validation?: FieldValidation | null;
  orderIndex: number;
};

type DraftState = {
  title: string;
  description: string;
  isOpenForSubmission: boolean;
  requiresAuth: boolean;
  secureCode: string | null;
  theme: Record<string, any>;
  fields: FormField[];
};

// ─── Constants ────────────────────────────────────────────────

const FIELD_TYPES = [
  { type: 'text',          label: 'Short Answer',    icon: Type },
  { type: 'textarea',      label: 'Long Answer',     icon: FileText },
  { type: 'number',        label: 'Number',          icon: Hash },
  { type: 'boolean',       label: 'Yes / No',        icon: CheckSquare },
  { type: 'date',          label: 'Date',            icon: Calendar },
  { type: 'single_select', label: 'Single Choice',   icon: CheckCircle },
  { type: 'multi_select',  label: 'Multiple Choice', icon: List },
  { type: 'email',         label: 'Email',           icon: Mail },
  { type: 'phone',         label: 'Phone',           icon: Phone },
  { type: 'rating',        label: 'Rating Stars',    icon: Star },
];

const COUNTRY_CODES = [
  { label: 'None',         value: '' },
  { label: '+1 (US/CA)',   value: '+1' },
  { label: '+44 (UK)',     value: '+44' },
  { label: '+91 (India)',  value: '+91' },
  { label: '+61 (AU)',     value: '+61' },
  { label: '+49 (DE)',     value: '+49' },
  { label: '+33 (FR)',     value: '+33' },
  { label: '+81 (JP)',     value: '+81' },
  { label: '+86 (CN)',     value: '+86' },
  { label: '+55 (BR)',     value: '+55' },
  { label: '+7 (RU)',      value: '+7' },
  { label: '+34 (ES)',     value: '+34' },
  { label: '+39 (IT)',     value: '+39' },
  { label: '+82 (KR)',     value: '+82' },
  { label: '+65 (SG)',     value: '+65' },
  { label: '+971 (UAE)',   value: '+971' },
  { label: '+966 (SA)',    value: '+966' },
  { label: '+20 (EG)',     value: '+20' },
  { label: '+27 (ZA)',     value: '+27' },
  { label: '+52 (MX)',     value: '+52' },
];

const FIELD_COLOR_PRESETS = [
  { label: 'Default',       value: '' },
  { label: 'Pure White',    value: '#FFFFFF' },
  { label: 'Warm Cream',    value: '#FFF8F0' },
  { label: 'Sky Blue',      value: '#EFF6FF' },
  { label: 'Mint Green',    value: '#ECFDF5' },
  { label: 'Soft Rose',     value: '#FFF1F2' },
  { label: 'Lavender',      value: '#F5F3FF' },
  { label: 'Charcoal',      value: '#1F2937' },
  { label: 'Slate Dark',    value: '#0F172A' },
];

function getDraftKey(formId: string) {
  return `inquest_draft_${formId}`;
}

const initializeTheme = (serverTheme: any) => {
  if (serverTheme?.lightMode || serverTheme?.darkMode) {
    return serverTheme;
  }

  if (serverTheme?.backgroundColor || serverTheme?.backgroundImageUrl || serverTheme?.accentColor) {
    const isDark = serverTheme.mode === 'dark';
    return {
      lightMode: {
        backgroundColor: isDark ? '#F4EEE9' : (serverTheme.backgroundColor || '#F4EEE9'),
        accentColor:     isDark ? '#D97436' : (serverTheme.accentColor || '#D97436'),
        backgroundId:    isDark ? 'none'    : (serverTheme.backgroundId || 'none'),
      },
      darkMode: {
        backgroundColor: isDark ? (serverTheme.backgroundColor || '#110D0A') : '#110D0A',
        accentColor:     isDark ? (serverTheme.accentColor || '#E06F28')    : '#E06F28',
        backgroundId:    isDark ? (serverTheme.backgroundId || 'none')      : 'none',
      },
      mode: serverTheme.mode || 'light',
      fieldColor: serverTheme.fieldColor || '',
    };
  }

  return {
    lightMode: { backgroundColor: '#F4EEE9', accentColor: '#D97436', backgroundId: 'none' },
    darkMode:  { backgroundColor: '#110D0A', accentColor: '#E06F28', backgroundId: 'none' },
    mode: 'light',
    fieldColor: '',
  };
};

// ─── Page flip variants ───────────────────────────────────────
const pageFlipVariants = {
  enter: (direction: 1 | -1) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
    rotateY: direction > 0 ? 14 : -14,
    scale: 0.97,
    filter: 'sepia(0.25)',
  }),
  center: { x: 0, opacity: 1, rotateY: 0, scale: 1, filter: 'sepia(0)' },
  exit: (direction: 1 | -1) => ({
    x: direction > 0 ? '-100%' : '100%',
    opacity: 0,
    rotateY: direction > 0 ? -14 : 14,
    scale: 0.97,
    filter: 'sepia(0.25)',
  }),
};

// ─── DiarySpine — unified bottom step navigation with Prev/Next ─

const DiarySpine = memo(function DiarySpine({
  currentStep,
  onNavigate,
}: {
  currentStep: 1 | 2 | 3;
  onNavigate: (step: 1 | 2 | 3) => void;
}) {
  const steps = [
    { step: 1 as const, label: 'Build',   emoji: '✏️' },
    { step: 2 as const, label: 'Theme',   emoji: '🎨' },
    { step: 3 as const, label: 'Publish', emoji: '🚀' },
  ];

  return (
    <div
      className="flex items-center justify-between px-4 shrink-0"
      style={{ paddingBottom: 0 }}
      role="tablist"
      aria-label="Form builder steps"
    >
      {/* Previous button */}
      <button
        onClick={() => currentStep > 1 && onNavigate((currentStep - 1) as 1 | 2 | 3)}
        disabled={currentStep === 1}
        className={cn(
          'flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
          currentStep === 1
            ? 'text-inquest-ink-ghost cursor-not-allowed opacity-40'
            : 'text-inquest-ink-soft hover:text-inquest-ink hover:bg-inquest-depth/50 border border-inquest-rule/40'
        )}
      >
        <ChevronLeft size={14} />
        <span className="hidden sm:inline">Previous</span>
      </button>

      {/* Step tabs */}
      <div className="flex items-end justify-center gap-1.5">
        {steps.map(({ step, label, emoji }) => {
          const isActive = currentStep === step;
          const isDone = step < currentStep;
          return (
            <motion.button
              key={step}
              role="tab"
              aria-selected={isActive}
              aria-controls={`step-panel-${step}`}
              onClick={() => onNavigate(step)}
              initial={false}
              animate={{
                y: isActive ? -6 : 0,
                scale: isActive ? 1.04 : 1,
              }}
              transition={{ type: 'spring', stiffness: 340, damping: 26 }}
              className={cn(
                'relative flex items-center gap-2 px-5 py-2.5 cursor-pointer',
                'text-xs font-extrabold tracking-widest uppercase',
                'border-t border-l border-r transition-colors rounded-t-xl select-none',
                isActive
                  ? 'bg-inquest-accent text-white border-inquest-accent shadow-lg'
                  : isDone
                    ? 'bg-inquest-depth text-inquest-ink-soft border-inquest-rule hover:bg-inquest-surface hover:text-inquest-ink'
                    : 'bg-inquest-surface/80 text-inquest-ink-soft border-inquest-rule/50 hover:bg-inquest-surface hover:text-inquest-ink'
              )}
              style={{ minWidth: 100 }}
            >
              {isDone && (
                <Check size={11} className="shrink-0 text-inquest-accent" />
              )}
              <span>{step < currentStep ? '' : `0${step}·`}{label}</span>
              {isActive && (
                <motion.div
                  layoutId="spine-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full"
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Next button */}
      <button
        onClick={() => currentStep < 3 && onNavigate((currentStep + 1) as 1 | 2 | 3)}
        disabled={currentStep === 3}
        className={cn(
          'flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
          currentStep === 3
            ? 'text-inquest-ink-ghost cursor-not-allowed opacity-40'
            : 'text-inquest-accent hover:bg-inquest-accent/10 border border-inquest-accent/30'
        )}
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight size={14} />
      </button>
    </div>
  );
});

// ─── FieldTypeGrid ─────────────────────────────────────────────

const FieldTypeGrid = memo(function FieldTypeGrid({
  currentType,
  onSelect,
}: {
  currentType: string;
  onSelect: (type: string) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-1.5">
      {FIELD_TYPES.map(({ type, label, icon: Icon }) => {
        const isActive = currentType === type;
        return (
          <button
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            title={label}
            className={cn(
              'field-type-pill flex flex-col items-center justify-center gap-1 p-2 rounded-xl border text-center cursor-pointer',
              isActive
                ? 'active border-inquest-accent bg-inquest-accent/10 text-inquest-accent'
                : 'border-inquest-rule/50 bg-inquest-base/40 text-inquest-ink-soft hover:border-inquest-accent/50 hover:text-inquest-ink'
            )}
          >
            <Icon size={15} />
            <span className="text-[9px] font-bold leading-tight">{label}</span>
          </button>
        );
      })}
    </div>
  );
});

// ─── InlineFieldConfig ─────────────────────────────────────────

const InlineFieldConfig = memo(function InlineFieldConfig({
  field,
  onUpdate,
  onClose,
}: {
  field: FormField;
  onUpdate: (updates: Partial<FormField>) => void;
  onClose: () => void;
}) {
  const v = field.validation || {};

  const setValidation = (patch: Partial<FieldValidation>) => {
    onUpdate({ validation: { ...v, ...patch } });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className="mt-4 pt-4 border-t border-inquest-rule/40 space-y-4"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Label */}
      <div>
        <label className="block text-[10px] font-bold text-inquest-ink-soft uppercase tracking-wider mb-1.5">Question Label</label>
        <input
          type="text"
          value={field.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          className="neo-input w-full rounded-xl px-3 py-2 text-inquest-ink text-sm"
          placeholder="What is your question?"
        />
      </div>

      {/* Placeholder */}
      <div>
        <label className="block text-[10px] font-bold text-inquest-ink-soft uppercase tracking-wider mb-1.5">Placeholder / Hint</label>
        <input
          type="text"
          value={field.placeholder || ''}
          onChange={(e) => onUpdate({ placeholder: e.target.value })}
          className="neo-input w-full rounded-xl px-3 py-2 text-inquest-ink text-sm"
          placeholder="Guide the respondent…"
        />
      </div>

      {/* Field type */}
      <div>
        <label className="block text-[10px] font-bold text-inquest-ink-soft uppercase tracking-wider mb-2">Field Type</label>
        <FieldTypeGrid
          currentType={field.type}
          onSelect={(newType) => {
            const newVal =
              newType === 'single_select' || newType === 'multi_select'
                ? { options: ['Option 1', 'Option 2'] }
                : newType === 'rating'
                  ? { min: 1, max: 5 }
                  : null;
            onUpdate({ type: newType, validation: newVal });
          }}
        />
      </div>

      {/* Required toggle */}
      <div className="flex items-center justify-between bg-inquest-base p-3 rounded-xl border border-inquest-rule">
        <div>
          <span className="text-xs font-bold text-inquest-ink-mid uppercase tracking-wider block">Required</span>
          <span className="text-[10px] text-inquest-ink-ghost">Respondent must answer this</span>
        </div>
        <Switch
          checked={field.required}
          onCheckedChange={(val) => onUpdate({ required: val })}
          className="data-[state=checked]:bg-inquest-accent"
        />
      </div>

      {/* Validation — type-specific */}
      <div className="space-y-3">
        <span className="text-[10px] font-bold text-inquest-ink-ghost uppercase tracking-wider">Validation Constraints</span>

        {(field.type === 'text' || field.type === 'textarea') && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] font-bold text-inquest-ink-soft uppercase mb-1">Min Chars</label>
                <input type="number" min={0} value={v.minLength ?? ''} onChange={(e) => setValidation({ minLength: e.target.value ? Number(e.target.value) : undefined })}
                  className="neo-input w-full rounded-lg px-2 py-1.5 text-xs text-inquest-ink" placeholder="None" />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-inquest-ink-soft uppercase mb-1">Max Chars</label>
                <input type="number" min={0} value={v.maxLength ?? ''} onChange={(e) => setValidation({ maxLength: e.target.value ? Number(e.target.value) : undefined })}
                  className="neo-input w-full rounded-lg px-2 py-1.5 text-xs text-inquest-ink" placeholder="None" />
              </div>
            </div>
            <div>
              <label className="block text-[9px] font-bold text-inquest-ink-soft uppercase mb-1">Regex Pattern</label>
              <input type="text" value={v.pattern ?? ''} onChange={(e) => setValidation({ pattern: e.target.value || undefined })}
                className="neo-input w-full rounded-lg px-2 py-1.5 text-xs font-mono text-inquest-ink" placeholder="e.g. ^[A-Z]+" />
            </div>
          </div>
        )}

        {field.type === 'number' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] font-bold text-inquest-ink-soft uppercase mb-1">Min Value</label>
              <input type="number" value={v.min ?? ''} onChange={(e) => setValidation({ min: e.target.value ? Number(e.target.value) : undefined })}
                className="neo-input w-full rounded-lg px-2 py-1.5 text-xs text-inquest-ink" placeholder="None" />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-inquest-ink-soft uppercase mb-1">Max Value</label>
              <input type="number" value={v.max ?? ''} onChange={(e) => setValidation({ max: e.target.value ? Number(e.target.value) : undefined })}
                className="neo-input w-full rounded-lg px-2 py-1.5 text-xs text-inquest-ink" placeholder="None" />
            </div>
          </div>
        )}

        {field.type === 'date' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] font-bold text-inquest-ink-soft uppercase mb-1">Earliest</label>
              <input type="date" value={v.minDate ?? ''} onChange={(e) => setValidation({ minDate: e.target.value || undefined })}
                className="neo-input w-full rounded-lg px-2 py-1 text-xs text-inquest-ink" />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-inquest-ink-soft uppercase mb-1">Latest</label>
              <input type="date" value={v.maxDate ?? ''} onChange={(e) => setValidation({ maxDate: e.target.value || undefined })}
                className="neo-input w-full rounded-lg px-2 py-1 text-xs text-inquest-ink" />
            </div>
          </div>
        )}

        {field.type === 'phone' && (
          <div className="space-y-2">
            <div>
              <label className="block text-[9px] font-bold text-inquest-ink-soft uppercase mb-1">Dial Prefix</label>
              <select value={v.countryCode ?? ''} onChange={(e) => setValidation({ countryCode: e.target.value || undefined })}
                className="neo-input w-full rounded-lg px-2 py-1.5 text-xs text-inquest-ink">
                {COUNTRY_CODES.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] font-bold text-inquest-ink-soft uppercase mb-1">Min Digits</label>
                <input type="number" min={0} value={v.minLength ?? ''} onChange={(e) => setValidation({ minLength: e.target.value ? Number(e.target.value) : undefined })}
                  className="neo-input w-full rounded-lg px-2 py-1.5 text-xs text-inquest-ink" />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-inquest-ink-soft uppercase mb-1">Max Digits</label>
                <input type="number" min={0} value={v.maxLength ?? ''} onChange={(e) => setValidation({ maxLength: e.target.value ? Number(e.target.value) : undefined })}
                  className="neo-input w-full rounded-lg px-2 py-1.5 text-xs text-inquest-ink" />
              </div>
            </div>
          </div>
        )}

        {field.type === 'rating' && (
          <div>
            <label className="block text-[9px] font-bold text-inquest-ink-soft uppercase mb-1">Max Stars</label>
            <input type="number" min={1} max={10} value={v.max ?? 5} onChange={(e) => setValidation({ max: e.target.value ? Number(e.target.value) : 5 })}
              className="neo-input w-full rounded-lg px-2.5 py-1.5 text-xs text-inquest-ink font-bold" />
          </div>
        )}

        {(field.type === 'single_select' || field.type === 'multi_select') && (
          <div className="space-y-2">
            <label className="block text-[9px] font-bold text-inquest-ink-soft uppercase">Choice Options</label>
            {(v.options || []).map((opt: string, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const opts = [...(v.options || [])];
                    opts[i] = e.target.value;
                    setValidation({ options: opts });
                  }}
                  className="neo-input flex-1 rounded-lg px-2 py-1 text-xs text-inquest-ink"
                />
                <button onClick={() => setValidation({ options: (v.options || []).filter((_: any, j: number) => j !== i) })}
                  className="p-1 text-inquest-ink-soft hover:text-inquest-caution transition-colors">
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
            {field.type === 'multi_select' && (
              <div>
                <label className="block text-[9px] font-bold text-inquest-ink-soft uppercase mb-1">Max Selections</label>
                <input type="number" min={1} value={v.maxSelections ?? ''} onChange={(e) => setValidation({ maxSelections: e.target.value ? Number(e.target.value) : undefined })}
                  className="neo-input w-full rounded-lg px-2 py-1.5 text-xs text-inquest-ink" placeholder="Unlimited" />
              </div>
            )}
            <button
              onClick={() => setValidation({ options: [...(v.options || []), `Option ${(v.options?.length || 0) + 1}`] })}
              className="text-xs text-inquest-accent font-bold hover:underline flex items-center gap-1 mt-1"
            >
              <Plus size={11} /> Add Option
            </button>
          </div>
        )}
      </div>

      {/* Close button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-4 py-2 bg-inquest-depth hover:bg-inquest-rule text-inquest-ink text-xs font-bold rounded-xl transition-colors cursor-pointer border border-inquest-rule/30"
        >
          <Check size={12} /> Done
        </button>
      </div>
    </motion.div>
  );
});

// ─── FieldCard ─────────────────────────────────────────────────

const FieldCard = memo(function FieldCard({
  field,
  idx,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onRemove,
}: {
  field: FormField;
  idx: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (updates: Partial<FormField>) => void;
  onRemove: (idx: number, e: React.MouseEvent) => void;
}) {
  const dragControls = useDragControls();
  const fieldTypeMeta = FIELD_TYPES.find((t) => t.type === field.type);
  const FieldIcon = fieldTypeMeta?.icon ?? Type;

  return (
    <Reorder.Item
      value={field}
      dragListener={false}
      dragControls={dragControls}
      layout="position"
      layoutId={field.localId}
      whileDrag={{
        scale: 1.01,
        boxShadow: '0 16px 32px -6px rgba(0, 0, 0, 0.15)',
        opacity: 0.98,
        zIndex: 50,
      }}
      transition={{ layout: { duration: 0.22, ease: 'easeInOut' } }}
      className={cn(
        'bg-inquest-surface rounded-[1.75rem] border transition-all select-none',
        'group relative overflow-hidden',
        isExpanded
          ? 'border-inquest-accent warm-shadow dark:field-selected'
          : 'border-inquest-rule/60 field-card-lift hover:border-inquest-rule'
      )}
    >
      {/* Accent left stripe */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-[1.75rem] transition-all duration-300"
        style={{
          background: isExpanded
            ? 'var(--color-inquest-accent)'
            : 'transparent',
        }}
      />

      {/* Giant watermark question number */}
      <div
        className="absolute right-4 top-2 text-6xl font-serif font-black text-inquest-accent/8 dark:text-inquest-accent/12 pointer-events-none select-none leading-none"
        aria-hidden="true"
      >
        Q{idx + 1}
      </div>

      {/* Card header — always visible */}
      <div className="flex items-start gap-0 p-5 sm:p-6">
        {/* Drag Handle */}
        <div
          onPointerDown={(e) => {
            e.preventDefault();
            dragControls.start(e);
          }}
          style={{ touchAction: 'none', userSelect: 'none' }}
          title="Drag to reorder"
          aria-label="Drag to reorder field"
          className="flex-shrink-0 w-8 flex flex-col items-center justify-center gap-1 pt-1 cursor-grab active:cursor-grabbing text-inquest-ink-ghost hover:text-inquest-ink-soft transition-colors mr-2"
        >
          <GripVertical size={18} />
        </div>

        {/* Field content */}
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={onToggleExpand}
          aria-expanded={isExpanded}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onToggleExpand()}
        >
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-inquest-ink-ghost uppercase tracking-wider">
              Q{idx + 1}
            </span>
            <span className="flex items-center gap-1 text-[9px] font-bold text-inquest-ink-soft bg-inquest-depth px-2 py-0.5 rounded-full">
              <FieldIcon size={9} />
              {fieldTypeMeta?.label}
            </span>
            {field.required && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-[9px] font-bold text-inquest-caution bg-inquest-caution/10 px-2 py-0.5 rounded-full"
              >
                Required
              </motion.span>
            )}
          </div>
          <h3 className="text-lg font-serif font-bold text-inquest-ink break-words leading-tight pr-8">
            {field.label || 'Untitled Question'}
          </h3>
          {field.placeholder && !isExpanded && (
            <p className="text-xs text-inquest-ink-ghost mt-0.5 italic truncate">
              {field.placeholder}
            </p>
          )}
        </div>

        {/* Right controls — including quick required toggle */}
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {/* Quick required toggle — visible on collapsed cards */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdate({ required: !field.required });
            }}
            aria-label={field.required ? 'Mark as optional' : 'Mark as required'}
            title={field.required ? 'Click to make optional' : 'Click to make required'}
            className={cn(
              'p-2 rounded-xl transition-colors cursor-pointer',
              field.required
                ? 'text-inquest-caution bg-inquest-caution/10 hover:bg-inquest-caution/20'
                : 'text-inquest-ink-ghost hover:text-inquest-ink-soft hover:bg-inquest-depth/50'
            )}
          >
            <Asterisk size={14} />
          </button>
          <button
            onClick={onToggleExpand}
            aria-label={isExpanded ? 'Close field config' : 'Edit field config'}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border',
              isExpanded
                ? 'bg-inquest-accent text-white border-inquest-accent shadow-xs'
                : 'bg-stone-200/80 dark:bg-inquest-depth text-stone-800 dark:text-inquest-ink border-stone-300 dark:border-inquest-rule/60 hover:bg-inquest-accent/15 hover:text-inquest-accent hover:border-inquest-accent/40'
            )}
          >
            <Edit3 size={12} />
            <span>{isExpanded ? 'Done' : 'Edit Field'}</span>
          </button>
          <button
            onClick={(e) => onRemove(idx, e)}
            aria-label="Remove field"
            className="p-2 text-inquest-ink-soft hover:text-inquest-caution hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-colors cursor-pointer"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Inline config — accordion expand */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="config"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ height: { duration: 0.25, ease: 'easeInOut' }, opacity: { duration: 0.15 } }}
            className="overflow-hidden px-5 sm:px-6 pb-5 sm:pb-6"
          >
            <InlineFieldConfig
              field={field}
              onUpdate={onUpdate}
              onClose={onToggleExpand}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </Reorder.Item>
  );
});

// ─── AddFieldStrip ─────────────────────────────────────────────

const AddFieldStrip = memo(function AddFieldStrip({
  onAdd,
  isOpen,
  onToggle,
}: {
  onAdd: (type: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative pt-2">
      {/* The main action button card */}
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-label="Add a new question"
        className={cn(
          'w-full flex items-center justify-center gap-3 py-4 rounded-[1.75rem] border-2 transition-all cursor-pointer shadow-sm group duration-200',
          isOpen
            ? 'border-inquest-accent bg-inquest-accent text-white hover:bg-inquest-accent-soft shadow-md'
            : 'border-inquest-accent/40 bg-inquest-surface text-inquest-accent hover:border-inquest-accent hover:bg-inquest-accent-pale/35 hover:shadow-md'
        )}
      >
        <div className={cn('transition-transform duration-300', isOpen ? 'rotate-[135deg]' : 'group-hover:rotate-90')}>
          <Plus size={18} strokeWidth={2.5} />
        </div>
        <span className="text-xs font-black uppercase tracking-widest">
          {isOpen ? 'Close Question Panel' : 'Add a New Question Field'}
        </span>
        <div className={cn('transition-transform duration-300', isOpen ? 'rotate-[135deg]' : 'group-hover:rotate-90')}>
          <Plus size={18} strokeWidth={2.5} />
        </div>
      </button>

      {/* Field type grid — slides down */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="mt-3 bg-inquest-surface border border-inquest-rule rounded-[2rem] p-5 sm:p-6 shadow-xl relative z-10 warm-shadow"
          >
            <p className="text-[10px] font-extrabold text-inquest-ink-soft uppercase tracking-wider mb-4 text-center sm:text-left">
              Select Field Type to Insert
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {FIELD_TYPES.map(({ type, label, icon: Icon }) => (
                <motion.button
                  key={type}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    onAdd(type);
                    onToggle();
                  }}
                  className="flex flex-col items-center justify-center gap-2.5 p-4 bg-inquest-base border border-inquest-rule rounded-2xl hover:border-inquest-accent hover:bg-inquest-accent/5 hover:text-inquest-accent transition-all cursor-pointer shadow-xs hover:shadow-sm group/btn"
                >
                  <Icon size={20} className="text-inquest-accent group-hover/btn:scale-110 transition-transform" />
                  <span className="text-[10px] font-extrabold text-inquest-ink text-center leading-tight">{label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ─── ThemeControlPanel ───────────────────────────────────────

const ThemeControlPanel = memo(function ThemeControlPanel({
  theme,
  setTheme,
  previewMode,
  setPreviewMode,
}: {
  theme: Record<string, any>;
  setTheme: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  previewMode: 'light' | 'dark';
  setPreviewMode: (m: 'light' | 'dark') => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const LIGHT_THEMES = [
    { name: 'Warm Parchment',   bg: '#F5EFEB', accent: '#D97436', bgId: 'none' },
    { name: 'Linen Cream',      bg: '#FEFAF3', accent: '#B56B20', bgId: 'none' },
    { name: 'Dusty Rose Diary', bg: '#FDF0EF', accent: '#C45E5E', bgId: 'none' },
    { name: 'Sage Notebook',    bg: '#F3F5F0', accent: '#5E7A5E', bgId: 'none' },
  ];

  const DARK_THEMES = [
    { name: 'Midnight Studio', bg: '#0B0705', accent: '#E06F28', bgId: 'none' },
    { name: 'Deep Ocean',      bg: '#070B12', accent: '#2980B9', bgId: 'none' },
    { name: 'Ink Well',        bg: '#0D0D0D', accent: '#D4AF37', bgId: 'none' },
    { name: 'Charcoal Draft',  bg: '#131313', accent: '#8B7355', bgId: 'none' },
  ];

  const currentModeConfig = previewMode === 'dark' ? theme.darkMode : theme.lightMode;
  const currentBgId      = currentModeConfig?.backgroundId || 'none';
  const currentAccent    = currentModeConfig?.accentColor   || (previewMode === 'dark' ? '#E06F28' : '#D97436');
  const currentBgColor   = currentModeConfig?.backgroundColor || (previewMode === 'dark' ? '#0B0705' : '#F5EFEB');
  const currentFieldColor = currentModeConfig?.fieldColor || theme.fieldColor || '';

  const updateModeTheme = (patch: Partial<{ backgroundColor: string; accentColor: string; backgroundId: string }>) => {
    const key = previewMode === 'dark' ? 'darkMode' : 'lightMode';
    setTheme((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  const updateFieldColor = (color: string) => {
    const key = previewMode === 'dark' ? 'darkMode' : 'lightMode';
    setTheme((prev) => ({
      ...prev,
      fieldColor: color,
      [key]: { ...prev[key], fieldColor: color }
    }));
  };

  // Filter backgrounds by mode
  const filteredBgs = backgroundsData.backgrounds.filter((bg) =>
    previewMode === 'dark'
      ? true  // dark mode shows all (including darkOnly)
      : !(bg as any).darkOnly  // light mode hides darkOnly backgrounds
  );

  return (
    <motion.div
      className="shrink-0 border-t border-inquest-rule/50 bg-inquest-surface/98 backdrop-blur-md"
      style={{ position: 'relative', zIndex: 20 }}
      initial={false}
      animate={{ height: isExpanded ? 'auto' : 64 }}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
    >
      {/* Collapsed bar — always visible */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-inquest-rule/30">
        {/* Mode toggle — ONLY changes previewMode, NOT document.documentElement */}
        <div className="flex items-center gap-1 bg-inquest-base border border-inquest-rule rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => {
              setPreviewMode('light');
              setTheme((prev) => {
                const targetColor = prev.lightMode?.fieldColor || prev.fieldColor || '';
                let nextColor = targetColor;
                if (targetColor) {
                  const hex = targetColor.replace('#', '');
                  const r = parseInt(hex.substring(0, 2), 16);
                  const g = parseInt(hex.substring(2, 4), 16);
                  const b = parseInt(hex.substring(4, 6), 16);
                  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                  if (luminance <= 0.45) {
                    nextColor = '#FAF5F2'; // default light field bg
                  }
                } else {
                  nextColor = '#FAF5F2';
                }
                return {
                  ...prev,
                  mode: 'light',
                  fieldColor: nextColor,
                  lightMode: { ...prev.lightMode, fieldColor: nextColor }
                };
              });
            }}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer', previewMode === 'light' ? 'bg-inquest-surface text-inquest-accent shadow-sm' : 'text-inquest-ink-soft hover:text-inquest-ink')}
          >
            <Sun size={11} /> Light
          </button>
          <button
            type="button"
            onClick={() => {
              setPreviewMode('dark');
              setTheme((prev) => {
                const targetColor = prev.darkMode?.fieldColor || prev.fieldColor || '';
                let nextColor = targetColor;
                if (targetColor) {
                  const hex = targetColor.replace('#', '');
                  const r = parseInt(hex.substring(0, 2), 16);
                  const g = parseInt(hex.substring(2, 4), 16);
                  const b = parseInt(hex.substring(4, 6), 16);
                  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                  if (luminance > 0.45) {
                    nextColor = '#0F0A08'; // default dark field bg
                  }
                } else {
                  nextColor = '#0F0A08';
                }
                return {
                  ...prev,
                  mode: 'dark',
                  fieldColor: nextColor,
                  darkMode: { ...prev.darkMode, fieldColor: nextColor }
                };
              });
            }}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer', previewMode === 'dark' ? 'bg-inquest-surface text-inquest-accent shadow-sm' : 'text-inquest-ink-soft hover:text-inquest-ink')}
          >
            <Moon size={11} /> Dark
          </button>
        </div>

        {/* Active preset name */}
        <span className="text-xs text-inquest-ink-soft font-medium hidden sm:block">
          <Palette size={11} className="inline mr-1.5 text-inquest-accent" />
          Customize Theme
        </span>

        {/* Expand / collapse */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? 'Collapse theme panel' : 'Expand theme panel'}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-inquest-depth hover:bg-inquest-rule rounded-lg text-xs font-bold text-inquest-ink-mid transition-colors cursor-pointer border border-inquest-rule/30"
        >
          {isExpanded ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="px-5 py-4 space-y-4 overflow-y-auto"
            style={{ maxHeight: 'calc(100vh - 280px)' }}
          >
            {/* Preset swatches */}
            <div>
              <span className="text-[10px] font-bold text-inquest-ink-soft uppercase tracking-wider block mb-2">
                {previewMode === 'light' ? '☀️ Light' : '🌙 Dark'} Presets
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(previewMode === 'dark' ? DARK_THEMES : LIGHT_THEMES).map((preset) => {
                  const isActive = currentBgColor === preset.bg && currentAccent === preset.accent;
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => updateModeTheme({ backgroundColor: preset.bg, accentColor: preset.accent, backgroundId: preset.bgId })}
                      className={cn(
                        'preset-card rounded-xl border p-3 flex flex-col items-start gap-2 cursor-pointer text-left',
                        isActive
                          ? 'selected border-inquest-accent ring-1 ring-inquest-accent shadow-md'
                          : 'border-inquest-rule hover:border-inquest-ink-soft'
                      )}
                      style={{ backgroundColor: preset.bg }}
                    >
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-full border-2 border-white/30" style={{ backgroundColor: preset.accent }} />
                        {isActive && <Check size={10} className="text-inquest-accent" style={{ filter: 'drop-shadow(0 0 4px currentColor)' }} />}
                      </div>
                      <span
                        className="text-[9px] font-bold leading-tight"
                        style={{ color: previewMode === 'dark' ? '#F2EBE5' : '#3A2312' }}
                      >
                        {preset.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Background textures */}
            <div>
              <span className="text-[10px] font-bold text-inquest-ink-soft uppercase tracking-wider block mb-2">Background Texture</span>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {filteredBgs.map((bg) => (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() => updateModeTheme({ backgroundId: bg.id })}
                    title={bg.label}
                    className={cn(
                      'bg-tile shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer',
                      currentBgId === bg.id
                        ? 'active border-inquest-accent ring-1 ring-inquest-accent'
                        : 'border-inquest-rule/60 hover:border-inquest-rule'
                    )}
                    style={{ width: 64, height: 48 }}
                  >
                    {bg.thumbnail ? (
                      <img src={bg.thumbnail} className="w-full h-full object-cover" alt={bg.label} loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-inquest-depth flex items-center justify-center">
                        <span className="text-[7px] font-bold text-inquest-ink-ghost">None</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Color pickers */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between bg-inquest-base px-3 py-2.5 rounded-xl border border-inquest-rule">
                <div>
                  <span className="text-[10px] font-bold text-inquest-ink-mid block">Accent</span>
                  <span className="text-[8px] text-inquest-ink-ghost">Buttons & highlights</span>
                </div>
                <input
                  type="color"
                  value={currentAccent}
                  onChange={(e) => updateModeTheme({ accentColor: e.target.value })}
                  className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent p-0"
                  title="Accent color"
                />
              </div>
              <div className="flex items-center justify-between bg-inquest-base px-3 py-2.5 rounded-xl border border-inquest-rule">
                <div>
                  <span className="text-[10px] font-bold text-inquest-ink-mid block">Base</span>
                  <span className="text-[8px] text-inquest-ink-ghost">Background color</span>
                </div>
                <input
                  type="color"
                  value={currentBgColor}
                  onChange={(e) => {
                    const color = e.target.value;
                    const cleaned = color.replace('#', '');
                    const r = parseInt(cleaned.substring(0, 2), 16);
                    const g = parseInt(cleaned.substring(2, 4), 16);
                    const b = parseInt(cleaned.substring(4, 6), 16);
                    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                    
                    if (previewMode === 'light') {
                      if (luminance < 0.5) {
                        toast.warning("Background must be light in Light Mode. Auto-adjusting.");
                        updateModeTheme({ backgroundColor: '#FAF5F2' });
                        return;
                      }
                    } else {
                      if (luminance > 0.4) {
                        toast.warning("Background must be dark in Dark Mode. Auto-adjusting.");
                        updateModeTheme({ backgroundColor: '#0F0A08' });
                        return;
                      }
                    }
                    updateModeTheme({ backgroundColor: color });
                  }}
                  className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent p-0"
                  title="Base background color"
                />
              </div>
            </div>

            {/* ── Field Card Color ─────────────────────────── */}
            <div>
              <span className="text-[10px] font-bold text-inquest-ink-soft uppercase tracking-wider block mb-2">
                🎨 Form Field Color
              </span>
              <div className="flex gap-2 flex-wrap">
                {(() => {
                  const filtered = FIELD_COLOR_PRESETS.filter(preset => {
                    if (!preset.value) return true;
                    const cleaned = preset.value.replace('#', '');
                    const r = parseInt(cleaned.substring(0, 2), 16);
                    const g = parseInt(cleaned.substring(2, 4), 16);
                    const b = parseInt(cleaned.substring(4, 6), 16);
                    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                    return previewMode === 'light' ? luminance > 0.5 : luminance <= 0.5;
                  });
                  return filtered.map((preset) => {
                    const isActive = currentFieldColor === preset.value;
                    const isDark = preset.value && parseInt(preset.value.slice(1, 3), 16) < 80;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => updateFieldColor(preset.value)}
                        title={preset.label}
                        className={cn(
                          'w-9 h-9 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-center',
                          isActive
                            ? 'border-inquest-accent ring-1 ring-inquest-accent scale-110'
                            : 'border-inquest-rule/60 hover:border-inquest-rule hover:scale-105'
                        )}
                        style={{ backgroundColor: preset.value || 'var(--color-inquest-surface)' }}
                      >
                        {isActive && <Check size={12} className={isDark ? 'text-white' : 'text-inquest-accent'} />}
                      </button>
                    );
                  });
                })()}
                {/* Custom color picker */}
                <div className="relative w-9 h-9">
                  <input
                    type="color"
                    value={currentFieldColor || '#FFFFFF'}
                    onChange={(e) => {
                      const color = e.target.value;
                      const cleaned = color.replace('#', '');
                      const r = parseInt(cleaned.substring(0, 2), 16);
                      const g = parseInt(cleaned.substring(2, 4), 16);
                      const b = parseInt(cleaned.substring(4, 6), 16);
                      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                      if (previewMode === 'light' && luminance < 0.5) {
                        toast.warning("Fields must be light in Light Mode. Auto-adjusting.");
                        updateFieldColor('#FFFFFF');
                        return;
                      }
                      if (previewMode === 'dark' && luminance > 0.45) {
                        toast.warning("Fields must be dark in Dark Mode. Auto-adjusting.");
                        updateFieldColor('#1E1511');
                        return;
                      }
                      updateFieldColor(color);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    title="Custom field color"
                  />
                  <div className={cn(
                    'w-9 h-9 rounded-xl border-2 flex items-center justify-center pointer-events-none',
                    'border-inquest-rule/60 bg-gradient-to-br from-red-200 via-green-200 to-blue-200'
                  )}>
                    <Palette size={12} className="text-inquest-ink-mid" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

// ─── Main Page ────────────────────────────────────────────────

export default function FormBuilderPage() {
  const params   = useParams();
  const router   = useRouter();
  const formId   = params?.formId as string;
  const { user } = useGetuser();
  const utils    = trpc.useUtils();

  const { data: form, isLoading } = trpc.form.getFormById.useQuery(
    { id: formId },
    { enabled: !!formId }
  );

  const { data: submissionCount } = trpc.submission.getSubmissionCount.useQuery(
    { formId },
    { enabled: !!formId }
  );

  // Wizard state
  const [currentStep, setCurrentStep]   = useState<1 | 2 | 3>(1);
  const [stepDirection, setStepDirection] = useState<1 | -1>(1);

  // Form data
  const [title, setTitle]                           = useState('');
  const [description, setDescription]               = useState('');
  const [isOpenForSubmission, setIsOpenForSubmission] = useState(true);
  const [requiresAuth, setRequiresAuth]             = useState(true);
  const [secureCode, setSecureCode]                 = useState<string | null>(null);
  const [theme, setTheme]                           = useState<Record<string, any>>({});
  const [fields, setFields]                         = useState<FormField[]>([]);

  // Builder UI state
  const [expandedFieldIdx, setExpandedFieldIdx] = useState<number | null>(null);
  const [showAddStrip, setShowAddStrip]         = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [hasDraft, setHasDraft]                 = useState(false);
  const [includeCodeInLink, setIncludeCodeInLink] = useState(false);
  const [includeCodeInQR, setIncludeCodeInQR]     = useState(true);
  const [previewMode, setPreviewMode]           = useState<'light' | 'dark'>('light');

  // Computed link and QR URLs based on user security toggles
  const linkUrl = useMemo(() => {
    let url = typeof window !== 'undefined' ? `${window.location.origin}/forms/${formId}` : `/forms/${formId}`;
    if (secureCode && includeCodeInLink) url += `?code=${secureCode}`;
    return url;
  }, [formId, secureCode, includeCodeInLink]);

  const qrUrl = useMemo(() => {
    let url = typeof window !== 'undefined' ? `${window.location.origin}/forms/${formId}` : `/forms/${formId}`;
    if (secureCode && includeCodeInQR) url += `?code=${secureCode}`;
    return url;
  }, [formId, secureCode, includeCodeInQR]);

  const loadedFromServer = useRef(false);

  useEffect(() => {
    if (!form || loadedFromServer.current) return;
    loadedFromServer.current = true;

    const draftRaw = localStorage.getItem(getDraftKey(formId));
    if (draftRaw) {
      try {
        const draft: DraftState = JSON.parse(draftRaw);
        setTitle(draft.title);
        setDescription(draft.description);
        setIsOpenForSubmission(draft.isOpenForSubmission !== undefined ? draft.isOpenForSubmission : true);
        setRequiresAuth(draft.requiresAuth !== undefined ? draft.requiresAuth : true);
        setSecureCode(draft.secureCode !== undefined ? draft.secureCode : null);
        setTheme(initializeTheme(draft.theme));
        setFields(draft.fields);
        setHasDraft(true);
        return;
      } catch {
        localStorage.removeItem(getDraftKey(formId));
      }
    }
    applyServerData(form);
  }, [form, formId]);

  function applyServerData(serverForm: NonNullable<typeof form>) {
    setTitle(serverForm.title);
    setDescription(serverForm.description || '');
    setIsOpenForSubmission(serverForm.isOpenForSubmission);
    setRequiresAuth(serverForm.requiresAuth);
    setSecureCode(serverForm.secureCode);
    setTheme(initializeTheme(serverForm.theme));
    const sorted = [...serverForm.fields].sort((a, b) => Number(a.orderIndex) - Number(b.orderIndex));
    setFields(sorted.map((f) => ({
      id: f.id,
      localId: f.id,
      label: f.label,
      type: f.type,
      required: f.required,
      placeholder: f.placeholder,
      validation: f.validation as FieldValidation | null,
      orderIndex: Number(f.orderIndex),
    })));
    setHasDraft(false);
  }

  const saveDraft = useCallback(() => {
    if (!loadedFromServer.current) return;
    const draft: DraftState = { title, description, isOpenForSubmission, requiresAuth, secureCode, theme, fields };
    localStorage.setItem(getDraftKey(formId), JSON.stringify(draft));
  }, [title, description, isOpenForSubmission, requiresAuth, secureCode, theme, fields, formId]);

  useEffect(() => { saveDraft(); }, [saveDraft]);

  useEffect(() => {
    if (!form || !loadedFromServer.current) return;
    const isModified =
      title !== form.title ||
      description !== (form.description || '') ||
      isOpenForSubmission !== form.isOpenForSubmission ||
      requiresAuth !== form.requiresAuth ||
      secureCode !== form.secureCode ||
      JSON.stringify(theme) !== JSON.stringify(initializeTheme(form.theme)) ||
      fields.length !== form.fields.length ||
      fields.some((f) => {
        const sf = form.fields.find((s) => s.id === f.id);
        if (!sf) return true;
        return (
          f.label !== sf.label ||
          f.type !== sf.type ||
          f.required !== sf.required ||
          f.placeholder !== (sf.placeholder || null) ||
          JSON.stringify(f.validation || null) !== JSON.stringify(sf.validation || null)
        );
      });
    setHasDraft(isModified);
  }, [title, description, isOpenForSubmission, requiresAuth, secureCode, theme, fields, form]);

  const discardDraft = () => {
    localStorage.removeItem(getDraftKey(formId));
    if (form) applyServerData(form);
    setHasDraft(false);
    toast.success('Draft discarded — reverted to saved version');
  };

  const clearDraft = () => {
    localStorage.removeItem(getDraftKey(formId));
    setHasDraft(false);
  };

  // ─── Mutations ──────────────────────────────────────────────

  const updateForm = trpc.form.updateForm.useMutation({
    onSuccess: (data) => {
      clearDraft();
      toast.success('Changes saved ✓');
      if (data) {
        setTitle(data.title);
        setDescription(data.description || '');
        setIsOpenForSubmission(data.isOpenForSubmission);
        setRequiresAuth(data.requiresAuth);
        setSecureCode(data.secureCode);
        setTheme(initializeTheme(data.theme));
        const sorted = [...data.fields].sort((a, b) => Number(a.orderIndex) - Number(b.orderIndex));
        setFields(sorted.map((f) => ({
          id: f.id,
          localId: f.id,
          label: f.label,
          type: f.type,
          required: f.required,
          placeholder: f.placeholder,
          validation: f.validation as FieldValidation | null,
          orderIndex: Number(f.orderIndex),
        })));
      }
      utils.form.getFormById.invalidate({ id: formId });
    },
    onError: (err) => { toast.error(err.message || 'Failed to save'); },
  });

  const deleteForm = trpc.form.deleteForm.useMutation({
    onSuccess: () => {
      clearDraft();
      toast.success('Enquiry deleted');
      utils.form.getMyForms.invalidate();
      router.push('/dashboard');
    },
    onError: (err) => { toast.error(err.message || 'Failed to delete'); },
  });

  const handleSave = () => {
    updateForm.mutate({
      id: formId,
      title: title.trim() || 'Untitled Enquiry',
      description: description || undefined,
      isOpenForSubmission,
      requiresAuth,
      secureCode,
      theme,
      fields: fields.map((f, i) => ({
        id: f.id,
        label: f.label.trim() || 'Untitled Question',
        type: f.type as any,
        required: f.required,
        placeholder: f.placeholder || undefined,
        validation: f.validation || undefined,
        orderIndex: i * 10,
      })),
    });
  };

  const handleTogglePrivacy = () => {
    if (secureCode) {
      setSecureCode(null);
    } else {
      setSecureCode(Math.random().toString(36).substring(2, 8).toUpperCase());
    }
  };

  const copySecureCode = () => {
    if (secureCode) {
      navigator.clipboard.writeText(secureCode);
      toast.success('Secure code copied!');
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(linkUrl);
    if (secureCode && !includeCodeInLink) {
      toast.success('Clean form link copied! (Passcode excluded for security)');
    } else if (secureCode && includeCodeInLink) {
      toast.warning('Share link copied with embedded secure code!');
    } else {
      toast.success('Share link copied!');
    }
  };

  const addField = (type: string) => {
    const defaultValidation: FieldValidation | null =
      type === 'single_select' || type === 'multi_select'
        ? { options: ['Option 1', 'Option 2'] }
        : type === 'rating'
          ? { min: 1, max: 5 }
          : null;

    const newField: FormField = {
      localId: crypto.randomUUID(),
      // Empty label — shows placeholder 'Untitled Question' instead of pre-filled text
      label: '',
      type,
      required: false,
      orderIndex: fields.length > 0 ? Number(fields[fields.length - 1]!.orderIndex) + 10 : 0,
      validation: defaultValidation,
    };

    setFields((prev) => [...prev, newField]);
    setExpandedFieldIdx(fields.length); // auto-expand new field
  };

  const updateField = (idx: number, updates: Partial<FormField>) => {
    setFields((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx]!, ...updates };
      return next;
    });
  };

  const removeField = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setFields((prev) => prev.filter((_, i) => i !== index));
    if (expandedFieldIdx === index) setExpandedFieldIdx(null);
    else if (expandedFieldIdx !== null && expandedFieldIdx > index)
      setExpandedFieldIdx(expandedFieldIdx - 1);
  };

  const navigateStep = (target: 1 | 2 | 3) => {
    setStepDirection(target > currentStep ? 1 : -1);
    setCurrentStep(target);
    setExpandedFieldIdx(null);
  };

  const downloadQR = () => {
    const svg = document.getElementById('builder-qr-code');
    if (svg) {
      const svgString = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const trigger = document.createElement('a');
      trigger.href = url;
      trigger.download = `${title.toLowerCase().replace(/\s+/g, '-')}-qr.svg`;
      document.body.appendChild(trigger);
      trigger.click();
      document.body.removeChild(trigger);
      URL.revokeObjectURL(url);
      toast.success('QR Code downloaded!');
    }
  };

  if (isLoading || !form) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-inquest-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div className={`h-[calc(100vh-56px)] md:h-screen flex flex-col -mx-6 -my-6 sm:-mx-8 sm:-my-8 md:-mx-12 md:-my-12 pt-16 md:pt-0 overflow-hidden bg-transparent border-2 rounded-none transition-all duration-500 ${
      hasDraft ? 'unsaved-glow border-inquest-accent/40' : 'border-transparent'
    }`}>

      {/* ── Header bar ─────────────────────────────────────── */}
      <header className="bg-inquest-surface/95 backdrop-blur-sm border-b border-inquest-rule p-4 sm:p-5 shrink-0 z-10 sticky top-0 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 hover:bg-inquest-depth rounded-full transition-colors text-inquest-ink-soft hover:text-inquest-ink shrink-0 cursor-pointer"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-serif font-bold text-inquest-ink truncate leading-tight">
              {title || 'Untitled Enquiry'}
            </h1>
            <p className="text-[10px] text-inquest-ink-ghost font-medium">
              {currentStep === 1 ? '✏️ Building Fields' : currentStep === 2 ? '🎨 Designing Theme' : '🚀 Publishing'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <NextLink
            href={`/dashboard/forms/${formId}/responses`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-inquest-depth hover:bg-inquest-surface border border-inquest-rule text-xs font-bold text-inquest-ink transition-colors"
          >
            <Users size={12} className="text-inquest-accent" />
            <span className="hidden sm:inline">Responses</span>
            {submissionCount?.count !== undefined && submissionCount.count > 0 && (
              <span className="bg-inquest-accent text-white text-[9px] px-1.5 py-0.5 rounded-full font-extrabold">
                {submissionCount.count}
              </span>
            )}
          </NextLink>

          {hasDraft ? (
            <button
              onClick={handleSave}
              disabled={updateForm.isPending}
              className="flex items-center gap-2 bg-inquest-accent text-white px-5 py-2 rounded-xl font-extrabold hover:bg-inquest-accent-soft transition-all terracotta-glow text-sm cursor-pointer shadow-md ring-2 ring-inquest-accent/30 ring-offset-1"
            >
              <Save size={14} />
              <span>{updateForm.isPending ? 'Saving…' : 'Save Changes'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-inquest-depth/50 text-inquest-ink-soft text-[10px] font-bold select-none border border-inquest-rule/30">
              <Check size={11} className="text-inquest-accent" />
              <span>Saved</span>
            </div>
          )}
        </div>
      </header>

      {/* ── Unsaved changes banner ──────────────────────────── */}
      <AnimatePresence>
        {hasDraft && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="shrink-0 overflow-hidden"
          >
            <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-2.5 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800/50">
              <div className="flex items-center gap-2">
                <span className="text-amber-600 dark:text-amber-400 text-sm">⚠</span>
                <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                  You have unsaved changes — URL and QR code are hidden until saved.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={discardDraft}
                  className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  Discard
                </button>
                <button
                  onClick={handleSave}
                  disabled={updateForm.isPending}
                  className="text-xs font-extrabold bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {updateForm.isPending ? 'Saving…' : 'Save Now'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main content + DiarySpine ──────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ perspective: '1200px' }}>

        {/* Step content */}
        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence initial={false} custom={stepDirection} mode="wait">
            <motion.div
              key={currentStep}
              id={`step-panel-${currentStep}`}
              role="tabpanel"
              custom={stepDirection}
              variants={pageFlipVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 220, damping: 25, duration: 0.38 }}
              style={{ perspective: '1200px' }}
              className="absolute inset-0 flex flex-col overflow-hidden"
            >

              {/* ════════════ STEP 1: Build Canvas ════════════ */}
              {currentStep === 1 && (
                <div className="flex-1 overflow-y-auto p-6 sm:p-10 pb-12">
                  <div className="max-w-full space-y-3">

                    {/* Empty state — shown when 0 fields exist */}
                    {fields.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-12 px-6 bg-inquest-surface/90 border-2 border-inquest-rule/60 border-dashed rounded-[2.5rem] space-y-6 warm-shadow"
                      >
                        <div className="w-14 h-14 bg-inquest-accent/10 rounded-full flex items-center justify-center mx-auto text-inquest-accent">
                          <Plus size={24} />
                        </div>
                        <div>
                          <h3 className="text-2xl font-serif text-inquest-ink font-bold mb-1">Your enquiry is empty.</h3>
                          <p className="text-inquest-ink-mid text-sm max-w-sm mx-auto leading-relaxed">
                            Click any question type below to create your first field.
                          </p>
                        </div>

                        {/* Quick field type selector pills */}
                        <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto pt-1">
                          {FIELD_TYPES.map(({ type, label, icon: Icon }) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => addField(type)}
                              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-stone-200/80 dark:bg-inquest-depth text-stone-900 dark:text-inquest-ink font-bold text-xs border border-stone-300 dark:border-inquest-rule/60 hover:bg-inquest-accent hover:text-white hover:border-inquest-accent transition-all cursor-pointer shadow-xs"
                            >
                              <Icon size={14} />
                              <span>{label}</span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Field list */}
                    <LayoutGroup>
                      <Reorder.Group
                        axis="y"
                        values={fields}
                        onReorder={setFields}
                        className="space-y-3"
                      >
                        <AnimatePresence initial={false}>
                          {fields.map((field, idx) => (
                            <motion.div
                              key={field.localId}
                              initial={{ opacity: 0, y: 16, scale: 0.97 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -10, scale: 0.96 }}
                              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                              layout
                            >
                              <FieldCard
                                field={field}
                                idx={idx}
                                isExpanded={expandedFieldIdx === idx}
                                onToggleExpand={() => setExpandedFieldIdx(expandedFieldIdx === idx ? null : idx)}
                                onUpdate={(updates) => updateField(idx, updates)}
                                onRemove={removeField}
                              />
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </Reorder.Group>
                    </LayoutGroup>

                    {/* Add field strip */}
                    {(fields.length > 0 || showAddStrip) && (
                      <AddFieldStrip
                        onAdd={addField}
                        isOpen={showAddStrip}
                        onToggle={() => setShowAddStrip(!showAddStrip)}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* ════════════ STEP 2: Theme ════════════════════ */}
              {currentStep === 2 && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Form preview fills available space */}
                  <div className="flex-1 overflow-y-auto relative">
                    <div className="absolute top-3 right-4 z-10">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-inquest-surface/90 backdrop-blur-sm rounded-full text-xs font-bold text-inquest-ink-soft border border-inquest-rule/50 shadow-sm">
                        <Eye size={11} className="text-inquest-accent" />
                        Live Preview
                      </div>
                    </div>
                    <FormPreview
                      fields={fields}
                      title={title}
                      description={description}
                      theme={theme}
                      mode={previewMode}
                      interactive={false}
                    />
                  </div>

                  {/* Theme panel — fixed to bottom of this step */}
                  <ThemeControlPanel
                    theme={theme}
                    setTheme={setTheme}
                    previewMode={previewMode}
                    setPreviewMode={setPreviewMode}
                  />
                </div>
              )}

              {/* ════════════ STEP 3: Publish ══════════════════ */}
              {currentStep === 3 && (
                <div className="flex-1 overflow-y-auto p-6 sm:p-10 pb-12 bg-transparent">
                  <div className="max-w-3xl mx-auto space-y-6">

                    {/* Enquiry Identity */}
                    <div className="bg-inquest-surface border border-inquest-rule rounded-[2rem] p-6 sm:p-8 space-y-5 warm-shadow">
                      <h3 className="font-serif text-xl font-bold text-inquest-ink border-b border-inquest-rule/40 pb-3 flex items-center gap-2">
                        <Edit3 size={18} className="text-inquest-accent" />
                        Enquiry Identity
                      </h3>
                      <div>
                        <label className="block text-xs font-bold text-inquest-ink-soft uppercase tracking-wider mb-1.5">Title</label>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Event registration, survey, etc."
                          className="w-full bg-transparent border-0 border-b-2 border-inquest-rule focus:border-inquest-accent pb-1 text-lg font-serif font-bold text-inquest-ink focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-inquest-ink-soft uppercase tracking-wider mb-1.5">Description / Instructions</label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Tell your respondents what this is about…"
                          className="w-full bg-transparent border-0 border-b-2 border-inquest-rule/60 focus:border-inquest-accent text-sm text-inquest-ink h-24 resize-none leading-relaxed focus:outline-none transition-colors"
                        />
                      </div>
                      {/* Mini stats */}
                      <div className="flex gap-6 pt-2">
                        <div className="text-center">
                          <span className="text-2xl font-serif font-black text-inquest-ink">{fields.length}</span>
                          <span className="text-[10px] text-inquest-ink-ghost block">Questions</span>
                        </div>
                        <div className="text-center">
                          <span className="text-2xl font-serif font-black text-inquest-ink">{submissionCount?.count ?? 0}</span>
                          <span className="text-[10px] text-inquest-ink-ghost block">Responses</span>
                        </div>
                        <div className="text-center">
                          <span className="text-2xl font-serif font-black text-inquest-accent">{secureCode ? '🔒' : '🌐'}</span>
                          <span className="text-[10px] text-inquest-ink-ghost block">{secureCode ? 'Private' : 'Public'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Access Gates */}
                    <div className="bg-inquest-surface border border-inquest-rule rounded-[2rem] p-6 sm:p-8 space-y-4 warm-shadow">
                      <h3 className="font-serif text-xl font-bold text-inquest-ink border-b border-inquest-rule/40 pb-3 flex items-center gap-2">
                        <Settings size={18} className="text-inquest-accent" />
                        Access Gates
                      </h3>

                      {/* Accepting Responses */}
                      <div className="flex items-center justify-between bg-inquest-base p-4 rounded-2xl border border-inquest-rule hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200">
                        <div>
                          <span className="text-xs font-bold text-inquest-ink uppercase tracking-wider flex items-center gap-1.5">
                            <Globe size={13} className={isOpenForSubmission ? 'text-inquest-accent' : 'text-inquest-ink-ghost'} />
                            Accepting Responses
                          </span>
                          <span className="text-[10px] text-inquest-ink-soft mt-0.5 block">Toggle public submissions open or closed</span>
                          {isOpenForSubmission ? (
                            <span className="inline-flex items-center gap-1.5 text-[9px] font-extrabold text-green-800 bg-green-100/70 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 py-0.5 rounded-full mt-1.5 select-none border border-green-300/50 dark:border-emerald-800/40">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-600 dark:bg-emerald-500 dark:animate-ping" />
                              Accepting Submissions
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[9px] font-extrabold text-inquest-ink-ghost bg-inquest-depth/50 px-2 py-0.5 rounded-full mt-1.5 select-none">
                              Submissions Closed
                            </span>
                          )}
                        </div>
                        <Switch checked={isOpenForSubmission} onCheckedChange={setIsOpenForSubmission} className="data-[state=checked]:bg-inquest-accent" />
                      </div>

                      {/* Require Login */}
                      <div className="flex items-center justify-between bg-inquest-base p-4 rounded-2xl border border-inquest-rule hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200">
                        <div>
                          <span className="text-xs font-bold text-inquest-ink uppercase tracking-wider flex items-center gap-1.5">
                            <Users size={13} className={requiresAuth ? 'text-inquest-accent' : 'text-inquest-ink-ghost'} />
                            Require User Login
                          </span>
                          <span className="text-[10px] text-inquest-ink-soft mt-0.5 block">Force respondents to sign in first</span>
                          {requiresAuth ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-inquest-accent bg-inquest-accent-pale px-2.5 py-0.5 rounded-full mt-1.5 select-none">
                              Logged-in Users Only
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-inquest-ink-ghost bg-inquest-depth/50 px-2.5 py-0.5 rounded-full mt-1.5 select-none">
                              Open Access
                            </span>
                          )}
                        </div>
                        <Switch checked={requiresAuth} onCheckedChange={setRequiresAuth} className="data-[state=checked]:bg-inquest-accent" />
                      </div>

                      {/* Secure Code */}
                      <div className="bg-inquest-base p-4 rounded-2xl border border-inquest-rule space-y-3 hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-inquest-ink uppercase tracking-wider flex items-center gap-1.5">
                              <Lock size={13} className={secureCode ? 'text-inquest-accent' : 'text-inquest-ink-ghost'} />
                              Secure Code Gate
                            </span>
                            <span className="text-[10px] text-inquest-ink-soft mt-0.5 block">Lock form behind a private passcode</span>
                            {secureCode ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 px-2.5 py-0.5 rounded-full mt-1.5 select-none">
                                Passcode Protected
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-inquest-ink-ghost bg-inquest-depth/50 px-2.5 py-0.5 rounded-full mt-1.5 select-none">
                                No Passcode Required
                              </span>
                            )}
                          </div>
                          <Switch checked={!!secureCode} onCheckedChange={handleTogglePrivacy} className="data-[state=checked]:bg-inquest-accent" />
                        </div>
                        <AnimatePresence>
                          {secureCode && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="flex items-center gap-2 pt-1">
                                <div className="flex-1 bg-inquest-surface border border-inquest-rule rounded-xl px-4 py-2 font-mono text-base tracking-[0.4em] text-inquest-ink text-center select-all font-bold">
                                  {secureCode}
                                </div>
                                <button type="button" onClick={copySecureCode} title="Copy code"
                                  className="p-2.5 bg-inquest-depth hover:bg-inquest-rule rounded-xl transition-colors cursor-pointer">
                                  <ClipboardCopy size={14} className="text-inquest-ink-soft" />
                                </button>
                                <button type="button" onClick={handleTogglePrivacy} title="Regenerate"
                                  className="p-2.5 bg-inquest-depth hover:bg-inquest-rule rounded-xl transition-colors cursor-pointer">
                                  <RotateCcw size={14} className="text-inquest-ink-soft" />
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Share & QR Controls — only shown when form is saved */}
                    {hasDraft ? (
                      /* Save-first card — shown instead of URL/QR when there are unsaved changes */
                      <div className="bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-700/50 border-dashed rounded-[2rem] p-6 sm:p-8 space-y-4 text-center">
                        <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto">
                          <Save size={24} className="text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <h3 className="font-serif text-xl font-bold text-amber-900 dark:text-amber-200 mb-1">Save your changes first</h3>
                          <p className="text-sm text-amber-700 dark:text-amber-400 max-w-sm mx-auto leading-relaxed">
                            Your shareable link and QR code will appear here once you save. This keeps your share links accurate.
                          </p>
                        </div>
                        <div className="flex gap-3 justify-center">
                          <button
                            onClick={discardDraft}
                            className="px-5 py-2.5 rounded-full border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 font-medium text-sm hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors cursor-pointer"
                          >
                            Discard Changes
                          </button>
                          <button
                            onClick={handleSave}
                            disabled={updateForm.isPending}
                            className="px-6 py-2.5 rounded-full bg-inquest-accent text-white font-bold text-sm hover:bg-inquest-accent-soft transition-colors terracotta-glow cursor-pointer disabled:opacity-50 flex items-center gap-2"
                          >
                            <Save size={14} />
                            {updateForm.isPending ? 'Saving…' : 'Save & Show Share Link'}
                          </button>
                        </div>
                      </div>
                    ) : (
                    <div className="bg-inquest-surface border border-inquest-rule rounded-[2rem] p-6 sm:p-8 space-y-6 warm-shadow">
                      <div className="flex items-center justify-between border-b border-inquest-rule/40 pb-4">
                        <h3 className="font-serif text-xl font-bold text-inquest-ink flex items-center gap-2">
                          <Link size={18} className="text-inquest-accent" />
                          Share & Access Controls
                        </h3>
                        {secureCode ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-inquest-accent/10 text-inquest-accent border border-inquest-accent/20">
                            <Lock size={12} /> Protected with Code
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-inquest-sage/15 text-inquest-ink border border-inquest-sage/30">
                            <Globe size={12} /> Public Form
                          </span>
                        )}
                      </div>

                      {/* URL display bar */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-inquest-ink-soft uppercase tracking-wider pl-1">
                          Shareable Direct Link
                        </label>
                        <div className="bg-inquest-base p-3 rounded-xl border border-inquest-rule flex items-center gap-2">
                          <input type="text" readOnly value={linkUrl}
                            className="flex-1 bg-transparent text-xs font-mono text-inquest-ink select-all focus:outline-none truncate" />
                          <button
                            onClick={copyShareLink}
                            className="shrink-0 px-3.5 py-2 bg-inquest-accent text-white rounded-lg text-xs font-bold hover:bg-inquest-accent-soft transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <Copy size={13} /> Copy Link
                          </button>
                        </div>
                      </div>

                      {/* Security embedding options */}
                      {secureCode && (
                        <div className="bg-inquest-depth/30 border border-inquest-rule/50 rounded-2xl p-4 sm:p-5 space-y-4">
                          <h4 className="text-xs font-bold text-inquest-ink uppercase tracking-wider flex items-center gap-1.5">
                            <ShieldAlert size={14} className="text-inquest-accent" />
                            Passcode Embedding Settings
                          </h4>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Toggle 1: Direct Link */}
                            <div className="bg-inquest-surface p-4 rounded-xl border border-inquest-rule/40 space-y-3">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold text-inquest-ink">Include Code in Direct Link</span>
                                <Switch
                                  checked={includeCodeInLink}
                                  onCheckedChange={setIncludeCodeInLink}
                                />
                              </div>
                              {includeCodeInLink ? (
                                <div className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg leading-relaxed flex items-start gap-2">
                                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                  <span><strong>⚠️ Security Warning:</strong> Anyone clicking this direct link will bypass passcode entry.</span>
                                </div>
                              ) : (
                                <div className="text-[11px] text-inquest-ink-soft bg-inquest-base/60 border border-inquest-rule/30 p-2.5 rounded-lg leading-relaxed flex items-start gap-2">
                                  <Lock size={14} className="shrink-0 mt-0.5 text-inquest-accent" />
                                  <span><strong>🔒 Secure Mode:</strong> Link does not contain passcode. Recipient must type code manually.</span>
                                </div>
                              )}
                            </div>

                            {/* Toggle 2: QR Code */}
                            <div className="bg-inquest-surface p-4 rounded-xl border border-inquest-rule/40 space-y-3">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold text-inquest-ink">Include Code in QR Code</span>
                                <Switch
                                  checked={includeCodeInQR}
                                  onCheckedChange={setIncludeCodeInQR}
                                />
                              </div>
                              {includeCodeInQR ? (
                                <div className="text-[11px] text-teal-800 dark:text-emerald-300 bg-teal-50 dark:bg-emerald-500/10 border border-teal-200/50 dark:border-emerald-500/20 p-2.5 rounded-lg leading-relaxed flex items-start gap-2">
                                  <Zap size={14} className="shrink-0 mt-0.5" />
                                  <span><strong>⚡ QR Scan Action:</strong> Scanning this QR code automatically logs the user in and bypasses the passcode prompt.</span>
                                </div>
                              ) : (
                                <div className="text-[11px] text-inquest-ink-soft bg-inquest-base/60 border border-inquest-rule/30 p-2.5 rounded-lg leading-relaxed flex items-start gap-2">
                                  <QrCode size={14} className="shrink-0 mt-0.5 text-inquest-accent" />
                                  <span><strong>📋 QR Scan Action:</strong> Scanning this QR code opens the form and requires typing the passcode manually.</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Action buttons + QR side by side */}
                      <div className="flex flex-col sm:flex-row gap-5 pt-2">
                        {/* Action buttons */}
                        <div className="flex-1 grid grid-cols-2 gap-3 content-start">
                          <button
                            id="copy-link-btn"
                            onClick={copyShareLink}
                            className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-inquest-accent text-white font-bold text-sm hover:bg-inquest-accent-soft transition-colors terracotta-glow cursor-pointer"
                          >
                            <Copy size={14} /> Copy Link
                          </button>
                          <button
                            id="preview-btn"
                            onClick={() => window.open(linkUrl, '_blank')}
                            className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-inquest-depth hover:bg-inquest-rule text-inquest-ink font-bold text-sm transition-colors cursor-pointer border border-inquest-rule"
                          >
                            <ExternalLink size={14} /> Preview
                          </button>
                          {secureCode && (
                            <button
                              id="copy-code-btn"
                              onClick={copySecureCode}
                              className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-inquest-sage/15 hover:bg-inquest-sage/25 text-inquest-ink font-bold text-sm transition-colors cursor-pointer border border-inquest-sage/25 col-span-2 sm:col-span-1"
                            >
                              <ClipboardCopy size={14} /> Copy Code
                            </button>
                          )}
                        </div>

                        {/* QR Code */}
                        {qrUrl && (
                          <div className="flex flex-col items-center gap-3 sm:border-l sm:border-inquest-rule/40 sm:pl-5">
                            <div className="bg-white p-4 rounded-2xl border border-inquest-rule/40 shadow-inner">
                              <QRCodeSVG id="builder-qr-code" value={qrUrl} size={140} fgColor="#3A2312" bgColor="#ffffff" level="H" />
                            </div>
                            <button onClick={downloadQR} className="text-xs text-inquest-accent font-bold hover:underline cursor-pointer flex items-center gap-1">
                              <Download size={12} /> Download QR SVG
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    )}

                    {/* Publish CTA */}
                    <div className="space-y-3">
                      <button
                        onClick={handleSave}
                        disabled={updateForm.isPending}
                        className="w-full py-4 rounded-full bg-inquest-accent text-white font-bold hover:bg-inquest-accent-soft transition-colors terracotta-glow shadow-md flex items-center justify-center gap-2 cursor-pointer text-base"
                      >
                        <Save size={16} />
                        {updateForm.isPending ? 'Saving…' : 'Save & Publish Enquiry'}
                      </button>

                      {hasDraft && (
                        <button
                          onClick={discardDraft}
                          className="w-full py-3 rounded-full bg-inquest-surface text-inquest-ink border border-inquest-rule hover:bg-inquest-depth/40 transition-colors font-medium text-sm cursor-pointer"
                        >
                          Discard Local Draft
                        </button>
                      )}

                      <div className="text-center pt-4">
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="text-xs font-bold text-inquest-ink-ghost hover:text-inquest-caution hover:underline transition-colors cursor-pointer"
                        >
                          ⚠ Delete this Enquiry
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* DiarySpine — unified step navigation at bottom with Prev/Next */}
        <div className="shrink-0 bg-inquest-surface/90 backdrop-blur-sm border-t border-inquest-rule py-2">
          <DiarySpine currentStep={currentStep} onNavigate={navigateStep} />
        </div>
      </div>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-inquest-surface rounded-[2.5rem] p-8 max-w-sm w-full warm-shadow text-center border border-inquest-rule/45"
            >
              <div className="w-14 h-14 bg-inquest-caution/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} className="text-inquest-caution" />
              </div>
              <h3 className="text-xl font-serif text-inquest-ink mb-2 font-bold">Delete this Enquiry?</h3>
              <p className="text-inquest-ink-mid text-sm mb-6">This will permanently delete the form, all fields, and response records. Irreversible.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 rounded-full border border-inquest-rule text-inquest-ink font-medium hover:bg-inquest-depth/30 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteForm.mutate({ id: formId })}
                  disabled={deleteForm.isPending}
                  className="flex-1 py-3 rounded-full bg-inquest-caution text-white font-medium hover:opacity-90 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {deleteForm.isPending ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
