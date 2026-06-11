'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { trpc } from '~/trpc/client';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Save, Globe, Lock, ArrowLeft, Trash2,
  Settings, Type, FileText, Hash, CheckSquare,
  Calendar, List, CheckCircle, Mail, Phone,
  ArrowUp, ArrowDown, Copy, ExternalLink, Users, ClipboardCopy, AlertCircle
} from 'lucide-react';
import { useGetuser } from '~/hooks/api/auth';
import Link from 'next/link';

// ─── Types ──────────────────────────────────────────────────

type FieldValidation = {
  // text / textarea
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  // number
  min?: number;
  max?: number;
  // date
  minDate?: string;
  maxDate?: string;
  // single_select / multi_select
  options?: string[];
  maxSelections?: number;
  // phone
  countryCode?: string;
};

type FormField = {
  id?: string;
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
  fields: FormField[];
};

// ─── Constants ────────────────────────────────────────────────

const FIELD_TYPES = [
  { type: 'text', label: 'Short Answer', icon: Type },
  { type: 'textarea', label: 'Long Answer', icon: FileText },
  { type: 'number', label: 'Number', icon: Hash },
  { type: 'boolean', label: 'Yes/No', icon: CheckSquare },
  { type: 'date', label: 'Date', icon: Calendar },
  { type: 'single_select', label: 'Single Choice', icon: CheckCircle },
  { type: 'multi_select', label: 'Multiple Choice', icon: List },
  { type: 'email', label: 'Email', icon: Mail },
  { type: 'phone', label: 'Phone', icon: Phone },
];

// Common country dial codes
const COUNTRY_CODES = [
  { label: 'None', value: '' },
  { label: '+1 (US/CA)', value: '+1' },
  { label: '+44 (UK)', value: '+44' },
  { label: '+91 (India)', value: '+91' },
  { label: '+61 (Australia)', value: '+61' },
  { label: '+49 (Germany)', value: '+49' },
  { label: '+33 (France)', value: '+33' },
  { label: '+81 (Japan)', value: '+81' },
  { label: '+86 (China)', value: '+86' },
  { label: '+55 (Brazil)', value: '+55' },
  { label: '+7 (Russia)', value: '+7' },
  { label: '+34 (Spain)', value: '+34' },
  { label: '+39 (Italy)', value: '+39' },
  { label: '+82 (Korea)', value: '+82' },
  { label: '+65 (Singapore)', value: '+65' },
  { label: '+971 (UAE)', value: '+971' },
  { label: '+966 (Saudi)', value: '+966' },
  { label: '+20 (Egypt)', value: '+20' },
  { label: '+27 (S. Africa)', value: '+27' },
  { label: '+52 (Mexico)', value: '+52' },
];

function getDraftKey(formId: string) {
  return `inquest_draft_${formId}`;
}

// ─── Main Page ───────────────────────────────────────────────

export default function FormBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params?.formId as string;
  const { user } = useGetuser();

  const utils = trpc.useUtils();

  const { data: form, isLoading } = trpc.form.getFormById.useQuery(
    { id: formId },
    { enabled: !!formId }
  );

  const { data: submissionCount } = trpc.submission.getSubmissionCount.useQuery(
    { formId },
    { enabled: !!formId }
  );

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedFieldIndex, setSelectedFieldIndex] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  // Track whether we loaded from server yet (to avoid overwriting draft on re-renders)
  const loadedFromServer = useRef(false);

  // Sync server data on first load
  useEffect(() => {
    if (!form || loadedFromServer.current) return;
    loadedFromServer.current = true;

    // Check for a saved draft
    const draftRaw = localStorage.getItem(getDraftKey(formId));
    if (draftRaw) {
      try {
        const draft: DraftState = JSON.parse(draftRaw);
        setTitle(draft.title);
        setDescription(draft.description);
        setFields(draft.fields);
        setHasDraft(true);
        return;
      } catch {
        localStorage.removeItem(getDraftKey(formId));
      }
    }

    // No draft — load from server
    applyServerData(form);
  }, [form, formId]);

  function applyServerData(serverForm: NonNullable<typeof form>) {
    setTitle(serverForm.title);
    setDescription(serverForm.description || '');
    const sorted = [...serverForm.fields].sort(
      (a, b) => parseInt(a.orderIndex) - parseInt(b.orderIndex)
    );
    setFields(
      sorted.map((f, i) => ({
        id: f.id,
        label: f.label,
        type: f.type,
        required: f.required,
        placeholder: f.placeholder,
        validation: f.validation as FieldValidation | null,
        orderIndex: i,
      }))
    );
    setHasDraft(false);
  }

  // Auto-save draft to localStorage whenever state changes
  const saveDraft = useCallback(() => {
    if (!loadedFromServer.current) return;
    const draft: DraftState = { title, description, fields };
    localStorage.setItem(getDraftKey(formId), JSON.stringify(draft));
  }, [title, description, fields, formId]);

  useEffect(() => {
    saveDraft();
  }, [saveDraft]);

  const discardDraft = () => {
    localStorage.removeItem(getDraftKey(formId));
    if (form) applyServerData(form);
    setHasDraft(false);
    toast.success('Draft discarded — reverted to last saved version');
  };

  const clearDraft = () => {
    localStorage.removeItem(getDraftKey(formId));
    setHasDraft(false);
  };

  // ─── TRPC Mutations ─────────────────────────────────────────

  const updateForm = trpc.form.updateForm.useMutation({
    onSuccess: () => {
      clearDraft();
      toast.success('Changes saved');
      utils.form.getFormById.invalidate({ id: formId });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to save');
    }
  });

  const updateSecureCode = trpc.form.updateFormSecureCode.useMutation({
    onSuccess: (data) => {
      if (data.secureCode) {
        toast.success(`Now private — Secure Code: ${data.secureCode}`);
      } else {
        toast.success('Form is now public');
      }
      utils.form.getFormById.invalidate({ id: formId });
    }
  });

  const deleteForm = trpc.form.deleteForm.useMutation({
    onSuccess: () => {
      clearDraft();
      toast.success('Enquiry deleted');
      utils.form.getMyForms.invalidate();
      router.push('/dashboard');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to delete');
    }
  });

  // ─── Helpers ─────────────────────────────────────────────────

  const buildFieldPayload = (f: FormField, i: number) => ({
    id: f.id,
    label: f.label,
    type: f.type as any,
    required: f.required,
    placeholder: f.placeholder || undefined,
    validation: f.validation || undefined,
    orderIndex: i,
  });

  const handleSave = () => {
    updateForm.mutate({
      id: formId,
      title,
      description: description || undefined,
      isOpenForSubmission: true,
      fields: fields.map(buildFieldPayload),
    });
  };

  // Save fields first, THEN toggle privacy so no unsaved data is lost
  const handleTogglePrivacy = () => {
    const currentSecureCode = form?.secureCode;
    // Optimistically save fields first
    updateForm.mutate(
      {
        id: formId,
        title,
        description: description || undefined,
        isOpenForSubmission: true,
        fields: fields.map(buildFieldPayload),
      },
      {
        onSuccess: () => {
          if (currentSecureCode) {
            // Currently private → go public
            updateSecureCode.mutate({ id: formId, secureCode: null });
          } else {
            // Currently public → go private
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            updateSecureCode.mutate({ id: formId, secureCode: code });
          }
        }
      }
    );
  };

  const copySecureCode = () => {
    if (form?.secureCode) {
      navigator.clipboard.writeText(form.secureCode);
      toast.success('Secure code copied!');
    }
  };

  const copyShareLink = () => {
    let url = `${window.location.origin}/forms/${formId}`;
    if (form?.secureCode) url += `?code=${form.secureCode}`;
    navigator.clipboard.writeText(url);
    toast.success('Share link copied!');
  };

  const addField = (type: string) => {
    const defaultValidation: FieldValidation | null =
      type === 'single_select' || type === 'multi_select'
        ? { options: ['Option 1', 'Option 2'] }
        : null;
    const newField: FormField = {
      label: 'New Question',
      type,
      required: false,
      orderIndex: fields.length,
      validation: defaultValidation,
    };
    const newFields = [...fields, newField];
    setFields(newFields);
    setSelectedFieldIndex(newFields.length - 1);
    setShowMobileSidebar(true);
  };

  const updateSelectedField = (updates: Partial<FormField>) => {
    if (selectedFieldIndex === null) return;
    setFields((prev) => {
      const next = [...prev];
      next[selectedFieldIndex] = { ...next[selectedFieldIndex]!, ...updates };
      return next;
    });
  };

  const removeField = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setFields((prev) => prev.filter((_, i) => i !== index));
    if (selectedFieldIndex === index) setSelectedFieldIndex(null);
    else if (selectedFieldIndex !== null && selectedFieldIndex > index)
      setSelectedFieldIndex(selectedFieldIndex - 1);
  };

  const moveField = (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === fields.length - 1) return;
    const newFields = [...fields];
    const target = direction === 'up' ? index - 1 : index + 1;
    [newFields[index], newFields[target]] = [newFields[target]!, newFields[index]!];
    setFields(newFields);
    if (selectedFieldIndex === index) setSelectedFieldIndex(target);
    else if (selectedFieldIndex === target) setSelectedFieldIndex(index);
  };

  // ─── Render ─────────────────────────────────────────────────

  if (isLoading || !form) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 rounded-full border-2 border-inquest-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  const selectedField = selectedFieldIndex !== null ? fields[selectedFieldIndex] : null;
  const responseCount = submissionCount?.count ?? 0;
  const isPrivate = !!form.secureCode;

  return (
    <div className="h-full flex flex-col -m-12">
      {/* Header */}
      <header className="bg-inquest-surface border-b border-inquest-rule px-4 sm:px-8 py-4 sm:py-5 shrink-0 sticky top-0 z-10">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Left: back + title */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-inquest-depth rounded-full transition-colors text-inquest-ink-soft hover:text-inquest-ink shrink-0"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-xl sm:text-2xl font-serif font-bold text-inquest-ink bg-transparent border-0 focus:ring-0 p-0 w-full placeholder-inquest-ink-ghost"
                  placeholder="Enquiry Title"
                />
                <div className="relative group shrink-0">
                  <div className="w-5 h-5 rounded-full border border-inquest-rule flex items-center justify-center text-xs text-inquest-ink-soft cursor-help hover:bg-inquest-depth hover:text-inquest-ink transition-colors">
                    ?
                  </div>
                  <div className="absolute top-full left-0 mt-2 w-64 p-3 bg-inquest-surface border border-inquest-rule rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 text-xs text-inquest-ink-mid">
                    This is your enquiry title. It's the first thing respondents will see. The layout auto-saves your progress locally as a draft.
                  </div>
                </div>
              </div>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-sm text-inquest-ink-mid mt-0.5 bg-transparent border-0 focus:ring-0 p-0 w-full placeholder-inquest-ink-ghost"
                placeholder="Add an optional description..."
              />
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Secure code chip */}
            {form.secureCode && (
              <button
                onClick={copySecureCode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-inquest-depth border border-inquest-rule text-xs font-mono text-inquest-ink hover:bg-inquest-rule/50 transition-colors"
                title="Click to copy secure code"
              >
                <Lock size={11} />
                <span className="tracking-wider">{form.secureCode}</span>
                <ClipboardCopy size={11} className="text-inquest-ink-soft" />
              </button>
            )}

            {/* Privacy toggle */}
            <div className="flex items-center bg-inquest-base rounded-full p-1 border border-inquest-rule">
              <button
                onClick={() => { if (isPrivate) handleTogglePrivacy(); }}
                disabled={updateForm.isPending || updateSecureCode.isPending}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  !isPrivate ? 'bg-inquest-surface shadow text-inquest-ink' : 'text-inquest-ink-soft hover:text-inquest-ink'
                }`}
              >
                <Globe size={13} /> Public
              </button>
              <button
                onClick={() => { if (!isPrivate) handleTogglePrivacy(); }}
                disabled={updateForm.isPending || updateSecureCode.isPending}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isPrivate ? 'bg-inquest-surface shadow text-inquest-ink' : 'text-inquest-ink-soft hover:text-inquest-ink'
                }`}
              >
                <Lock size={13} /> Private
              </button>
            </div>

            <button onClick={copyShareLink} className="p-2 text-inquest-ink-soft hover:text-inquest-ink hover:bg-inquest-depth rounded-full transition-colors" title="Copy share link">
              <Copy size={17} />
            </button>
            <button onClick={() => window.open(`/forms/${formId}`, '_blank')} className="p-2 text-inquest-ink-soft hover:text-inquest-ink hover:bg-inquest-depth rounded-full transition-colors" title="Preview">
              <ExternalLink size={17} />
            </button>

            {/* Responses link */}
            <Link
              href={`/dashboard/forms/${formId}/responses`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-inquest-rule text-xs font-medium text-inquest-ink-mid hover:bg-inquest-depth/30 transition-colors"
            >
              <Users size={15} />
              <span className="hidden sm:inline">Responses</span>
              {responseCount > 0 && (
                <span className="bg-inquest-accent text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{responseCount}</span>
              )}
            </Link>

            <button
              onClick={handleSave}
              disabled={updateForm.isPending}
              className="flex items-center gap-1.5 bg-inquest-accent text-white px-5 py-2.5 rounded-full font-medium hover:bg-inquest-accent-soft transition-colors terracotta-glow disabled:opacity-50 text-sm"
            >
              <Save size={15} />
              <span className="hidden sm:inline">{updateForm.isPending ? 'Saving...' : 'Save Changes'}</span>
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-inquest-ink-ghost hover:text-inquest-caution hover:bg-red-50 rounded-full transition-colors"
              title="Delete"
            >
              <Trash2 size={17} />
            </button>
          </div>
        </div>

        {/* Draft banner */}
        {hasDraft && (
          <div className="mt-3 flex items-center gap-3 px-3 py-2 rounded-2xl bg-inquest-sage/20 border border-inquest-sage/40 text-sm">
            <AlertCircle size={16} className="text-inquest-sage shrink-0" />
            <span className="text-inquest-ink-mid flex-1">You have unsaved changes from a previous session.</span>
            <button onClick={discardDraft} className="text-xs text-inquest-ink-soft underline hover:text-inquest-caution">Discard</button>
            <button onClick={handleSave} className="text-xs text-inquest-accent font-medium hover:underline">Save Changes</button>
          </div>
        )}
      </header>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-inquest-surface rounded-3xl p-8 max-w-sm w-full warm-shadow text-center"
            >
              <div className="w-14 h-14 bg-inquest-caution/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} className="text-inquest-caution" />
              </div>
              <h3 className="text-xl font-serif text-inquest-ink mb-2">Delete this Enquiry?</h3>
              <p className="text-inquest-ink-mid text-sm mb-6">This will permanently remove &ldquo;{form.title}&rdquo; and all its responses.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 rounded-full border border-inquest-rule text-inquest-ink font-medium hover:bg-inquest-depth/30 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={() => deleteForm.mutate({ id: formId })}
                  disabled={deleteForm.isPending}
                  className="flex-1 py-3 rounded-full bg-inquest-caution text-white font-medium hover:opacity-90 transition-colors disabled:opacity-50"
                >
                  {deleteForm.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-12 bg-inquest-base">
          <div className="max-w-3xl mx-auto space-y-4 pb-32">
            <button
              onClick={() => { setSelectedFieldIndex(null); setShowMobileSidebar(true); }}
              className="md:hidden w-full py-3 rounded-2xl border-2 border-dashed border-inquest-rule text-inquest-ink-soft hover:border-inquest-accent hover:text-inquest-accent transition-colors font-medium text-sm"
            >
              + Add Question
            </button>

            <AnimatePresence>
              {fields.map((field, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => { setSelectedFieldIndex(idx); setShowMobileSidebar(true); }}
                  className={`bg-inquest-surface p-5 sm:p-6 rounded-3xl cursor-pointer transition-all border ${
                    selectedFieldIndex === idx
                      ? 'border-inquest-accent warm-shadow scale-[1.01]'
                      : 'border-inquest-rule/50 hover:border-inquest-rule'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-bold text-inquest-ink-soft uppercase tracking-wider">Q{idx + 1}</span>
                        {field.required && (
                          <span className="text-xs text-inquest-caution font-medium bg-inquest-caution/10 px-2 py-0.5 rounded-full">Required</span>
                        )}
                      </div>
                      <h3 className="text-lg font-serif text-inquest-ink break-words">{field.label || 'Untitled'}</h3>
                      <p className="text-inquest-ink-soft mt-0.5 italic text-xs">
                        {FIELD_TYPES.find(t => t.type === field.type)?.label}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={(e) => moveField(idx, 'up', e)} disabled={idx === 0} className="p-1.5 text-inquest-ink-soft hover:text-inquest-ink hover:bg-inquest-depth rounded-full disabled:opacity-30"><ArrowUp size={13} /></button>
                      <button onClick={(e) => moveField(idx, 'down', e)} disabled={idx === fields.length - 1} className="p-1.5 text-inquest-ink-soft hover:text-inquest-ink hover:bg-inquest-depth rounded-full disabled:opacity-30"><ArrowDown size={13} /></button>
                      <button onClick={(e) => removeField(idx, e)} className="p-1.5 text-inquest-ink-soft hover:text-inquest-caution hover:bg-red-50 rounded-full ml-1"><Trash2 size={13} /></button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {fields.length === 0 && (
              <div className="text-center py-16 bg-inquest-surface border border-inquest-rule border-dashed rounded-3xl">
                <p className="text-lg font-serif text-inquest-ink">Your canvas is empty.</p>
                <p className="text-inquest-ink-mid mt-1 text-sm">Select a field type from the panel to begin.</p>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden md:flex w-80 bg-inquest-surface border-l border-inquest-rule flex-col overflow-y-auto">
          {selectedField ? (
            <FieldConfigPanel
              field={selectedField}
              onUpdate={updateSelectedField}
              onDone={() => setSelectedFieldIndex(null)}
            />
          ) : (
            <FieldAdderPanel onAddField={addField} />
          )}
        </div>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {showMobileSidebar && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/30 z-40"
              onClick={() => setShowMobileSidebar(false)}
            >
              <motion.div
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-inquest-surface shadow-xl overflow-y-auto"
              >
                <div className="p-4 border-b border-inquest-rule flex justify-between items-center">
                  <h3 className="font-serif text-lg text-inquest-ink">{selectedField ? 'Configure' : 'Add Field'}</h3>
                  <button onClick={() => setShowMobileSidebar(false)} className="p-2 text-inquest-ink-soft hover:text-inquest-ink">✕</button>
                </div>
                {selectedField ? (
                  <FieldConfigPanel field={selectedField} onUpdate={updateSelectedField} onDone={() => { setSelectedFieldIndex(null); setShowMobileSidebar(false); }} />
                ) : (
                  <FieldAdderPanel onAddField={addField} />
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Field Config Panel ───────────────────────────────────────

function FieldConfigPanel({ field, onUpdate, onDone }: {
  field: FormField;
  onUpdate: (updates: Partial<FormField>) => void;
  onDone: () => void;
}) {
  const v = field.validation || {};

  const setValidation = (patch: Partial<FieldValidation>) => {
    onUpdate({ validation: { ...v, ...patch } });
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg text-inquest-ink flex items-center gap-2">
          <Settings size={17} /> Configuration
        </h3>
        <button onClick={onDone} className="px-3 py-1.5 bg-inquest-depth text-inquest-ink text-xs font-medium rounded-full hover:bg-inquest-rule transition-colors">
          Close Panel
        </button>
      </div>

      {/* Field Type */}
      <div>
        <label className="block text-xs font-semibold text-inquest-ink-soft uppercase tracking-wider mb-1">Field Type</label>
        <select
          value={field.type}
          onChange={(e) => {
            const newType = e.target.value;
            const newValidation = newType === 'single_select' || newType === 'multi_select' 
              ? { options: ['Option 1', 'Option 2'] } 
              : null;
            onUpdate({ type: newType, validation: newValidation });
          }}
          className="w-full bg-inquest-base border border-inquest-rule focus:border-inquest-accent rounded-xl px-3 py-2 text-inquest-ink text-sm"
        >
          {FIELD_TYPES.map(t => (
            <option key={t.type} value={t.type}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Label */}
      <div>
        <label className="block text-xs font-semibold text-inquest-ink-soft uppercase tracking-wider mb-1">Question Label</label>
        <input
          type="text"
          value={field.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          className="w-full bg-inquest-base border border-inquest-rule focus:border-inquest-accent rounded-xl px-3 py-2 text-inquest-ink focus:ring-1 focus:ring-inquest-accent text-sm"
        />
      </div>

      {/* Placeholder */}
      <div>
        <label className="block text-xs font-semibold text-inquest-ink-soft uppercase tracking-wider mb-1">Placeholder</label>
        <input
          type="text"
          value={field.placeholder || ''}
          onChange={(e) => onUpdate({ placeholder: e.target.value })}
          className="w-full bg-inquest-base border border-inquest-rule focus:border-inquest-accent rounded-xl px-3 py-2 text-inquest-ink focus:ring-1 focus:ring-inquest-accent text-sm"
        />
      </div>

      {/* Required */}
      <div className="flex items-center justify-between bg-inquest-base p-3 rounded-xl border border-inquest-rule">
        <label className="text-sm font-medium text-inquest-ink-mid">Required</label>
        <input
          type="checkbox"
          checked={field.required}
          onChange={(e) => onUpdate({ required: e.target.checked })}
          className="w-4 h-4 rounded border-inquest-rule text-inquest-accent focus:ring-inquest-accent"
        />
      </div>

      {/* ── Type-specific validation ── */}
      <div className="pt-3 border-t border-inquest-rule">
        <p className="text-xs font-semibold text-inquest-ink-soft uppercase tracking-wider mb-3">Validation Rules</p>

        {/* TEXT / TEXTAREA */}
        {(field.type === 'text' || field.type === 'textarea') && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-inquest-ink-soft mb-1">Min Length</label>
                <input type="number" min={0} value={v.minLength ?? ''} onChange={(e) => setValidation({ minLength: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full bg-inquest-base border border-inquest-rule rounded-lg px-2 py-1.5 text-sm text-inquest-ink" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs text-inquest-ink-soft mb-1">Max Length</label>
                <input type="number" min={0} value={v.maxLength ?? ''} onChange={(e) => setValidation({ maxLength: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full bg-inquest-base border border-inquest-rule rounded-lg px-2 py-1.5 text-sm text-inquest-ink" placeholder="∞" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-inquest-ink-soft mb-1">Regex Pattern</label>
              <input type="text" value={v.pattern ?? ''} onChange={(e) => setValidation({ pattern: e.target.value || undefined })}
                className="w-full bg-inquest-base border border-inquest-rule rounded-lg px-2 py-1.5 text-sm font-mono text-inquest-ink" placeholder="e.g. ^[A-Z]+" />
            </div>
          </div>
        )}

        {/* NUMBER */}
        {field.type === 'number' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-inquest-ink-soft mb-1">Min Value</label>
              <input type="number" value={v.min ?? ''} onChange={(e) => setValidation({ min: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full bg-inquest-base border border-inquest-rule rounded-lg px-2 py-1.5 text-sm text-inquest-ink" placeholder="None" />
            </div>
            <div>
              <label className="block text-xs text-inquest-ink-soft mb-1">Max Value</label>
              <input type="number" value={v.max ?? ''} onChange={(e) => setValidation({ max: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full bg-inquest-base border border-inquest-rule rounded-lg px-2 py-1.5 text-sm text-inquest-ink" placeholder="None" />
            </div>
          </div>
        )}

        {/* DATE */}
        {field.type === 'date' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-inquest-ink-soft mb-1">Earliest Date</label>
              <input type="date" value={v.minDate ?? ''} onChange={(e) => setValidation({ minDate: e.target.value || undefined })}
                className="w-full bg-inquest-base border border-inquest-rule rounded-lg px-2 py-1.5 text-sm text-inquest-ink" />
            </div>
            <div>
              <label className="block text-xs text-inquest-ink-soft mb-1">Latest Date</label>
              <input type="date" value={v.maxDate ?? ''} onChange={(e) => setValidation({ maxDate: e.target.value || undefined })}
                className="w-full bg-inquest-base border border-inquest-rule rounded-lg px-2 py-1.5 text-sm text-inquest-ink" />
            </div>
          </div>
        )}

        {/* PHONE */}
        {field.type === 'phone' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-inquest-ink-soft mb-1">Country Code</label>
              <select
                value={v.countryCode ?? ''}
                onChange={(e) => setValidation({ countryCode: e.target.value || undefined })}
                className="w-full bg-inquest-base border border-inquest-rule rounded-lg px-2 py-1.5 text-sm text-inquest-ink"
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-inquest-ink-soft mb-1">Min Digits</label>
                <input type="number" min={0} value={v.minLength ?? ''} onChange={(e) => setValidation({ minLength: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full bg-inquest-base border border-inquest-rule rounded-lg px-2 py-1.5 text-sm text-inquest-ink" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs text-inquest-ink-soft mb-1">Max Digits</label>
                <input type="number" min={0} value={v.maxLength ?? ''} onChange={(e) => setValidation({ maxLength: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full bg-inquest-base border border-inquest-rule rounded-lg px-2 py-1.5 text-sm text-inquest-ink" placeholder="∞" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-inquest-ink-soft mb-1">Pattern (optional)</label>
              <input type="text" value={v.pattern ?? ''} onChange={(e) => setValidation({ pattern: e.target.value || undefined })}
                className="w-full bg-inquest-base border border-inquest-rule rounded-lg px-2 py-1.5 text-sm font-mono text-inquest-ink" placeholder="e.g. ^\+?[0-9]+" />
            </div>
          </div>
        )}

        {/* EMAIL — no extra config */}
        {field.type === 'email' && (
          <p className="text-xs text-inquest-ink-ghost italic">Email format is automatically validated.</p>
        )}

        {/* BOOLEAN — no config */}
        {field.type === 'boolean' && (
          <p className="text-xs text-inquest-ink-ghost italic">Yes/No fields have no additional validation.</p>
        )}

        {/* SINGLE SELECT */}
        {field.type === 'single_select' && (
          <div className="space-y-2">
            <label className="block text-xs text-inquest-ink-soft mb-1">Options</label>
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
                  className="flex-1 bg-inquest-base border border-inquest-rule rounded-lg px-2 py-1.5 text-sm"
                />
                <button
                  onClick={() => setValidation({ options: (v.options || []).filter((_: any, j: number) => j !== i) })}
                  className="p-1 text-inquest-ink-soft hover:text-inquest-caution"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            <button
              onClick={() => setValidation({ options: [...(v.options || []), `Option ${(v.options?.length || 0) + 1}`] })}
              className="text-xs text-inquest-accent font-medium hover:underline mt-1"
            >
              + Add Option
            </button>
          </div>
        )}

        {/* MULTI SELECT */}
        {field.type === 'multi_select' && (
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="block text-xs text-inquest-ink-soft mb-1">Options</label>
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
                    className="flex-1 bg-inquest-base border border-inquest-rule rounded-lg px-2 py-1.5 text-sm"
                  />
                  <button
                    onClick={() => setValidation({ options: (v.options || []).filter((_: any, j: number) => j !== i) })}
                    className="p-1 text-inquest-ink-soft hover:text-inquest-caution"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setValidation({ options: [...(v.options || []), `Option ${(v.options?.length || 0) + 1}`] })}
                className="text-xs text-inquest-accent font-medium hover:underline mt-1"
              >
                + Add Option
              </button>
            </div>
            <div>
              <label className="block text-xs text-inquest-ink-soft mb-1">Max Selections (optional)</label>
              <input
                type="number" min={1}
                value={v.maxSelections ?? ''}
                onChange={(e) => setValidation({ maxSelections: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full bg-inquest-base border border-inquest-rule rounded-lg px-2 py-1.5 text-sm"
                placeholder="Unlimited"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Field Adder Panel ───────────────────────────────────────

function FieldAdderPanel({ onAddField }: { onAddField: (type: string) => void }) {
  return (
    <div className="p-6">
      <h3 className="font-serif text-lg text-inquest-ink mb-4">Add Field</h3>
      <div className="grid grid-cols-2 gap-3">
        {FIELD_TYPES.map((type) => {
          const Icon = type.icon;
          return (
            <button
              key={type.type}
              onClick={() => onAddField(type.type)}
              className="flex flex-col items-center justify-center gap-2 p-4 bg-inquest-base border border-inquest-rule rounded-2xl hover:border-inquest-accent hover:bg-inquest-depth/30 transition-colors text-inquest-ink group"
            >
              <Icon size={20} className="text-inquest-ink-soft group-hover:text-inquest-accent transition-colors" />
              <span className="text-xs font-medium text-center">{type.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
