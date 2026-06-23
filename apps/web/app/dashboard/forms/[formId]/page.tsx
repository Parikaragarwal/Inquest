'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { trpc } from '~/trpc/client';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import {
  Save, Globe, Lock, ArrowLeft, Trash2,
  Settings, Type, FileText, Hash, CheckSquare,
  Calendar, List, CheckCircle, Mail, Phone,
  ArrowUp, ArrowDown, Copy, ExternalLink, Users, ClipboardCopy, AlertCircle, Edit3, GripVertical, Eye, EyeOff,
  Star, Sun, Moon, Sparkles, Check, Palette, HelpCircle
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
  { type: 'text', label: 'Short Answer', icon: Type },
  { type: 'textarea', label: 'Long Answer', icon: FileText },
  { type: 'number', label: 'Number', icon: Hash },
  { type: 'boolean', label: 'Yes/No', icon: CheckSquare },
  { type: 'date', label: 'Date', icon: Calendar },
  { type: 'single_select', label: 'Single Choice', icon: CheckCircle },
  { type: 'multi_select', label: 'Multiple Choice', icon: List },
  { type: 'email', label: 'Email', icon: Mail },
  { type: 'phone', label: 'Phone', icon: Phone },
  { type: 'rating', label: 'Rating Stars', icon: Star },
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
  const [isOpenForSubmission, setIsOpenForSubmission] = useState(true);
  const [requiresAuth, setRequiresAuth] = useState(true);
  const [secureCode, setSecureCode] = useState<string | null>(null);
  const [theme, setTheme] = useState<Record<string, any>>({});
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedFieldIndex, setSelectedFieldIndex] = useState<number | null>(null);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [activeSidebarTab, setActiveSidebarTab] = useState<'question' | 'settings'>('settings');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (theme?.mode === 'dark') {
      document.documentElement.classList.add('dark');
      setDarkMode(true);
    } else if (theme?.mode === 'light') {
      document.documentElement.classList.remove('dark');
      setDarkMode(false);
    }
  }, [theme?.mode]);

  const toggleDarkMode = () => {
    const isDark = !darkMode;
    setDarkMode(isDark);
    setTheme((prev: any) => ({ ...prev, mode: isDark ? 'dark' : 'light' }));
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let url = `${window.location.origin}/forms/${formId}`;
      if (secureCode) url += `?code=${secureCode}`;
      setShareUrl(url);
    }
  }, [formId, secureCode]);

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
        setIsOpenForSubmission(draft.isOpenForSubmission !== undefined ? draft.isOpenForSubmission : true);
        setRequiresAuth(draft.requiresAuth !== undefined ? draft.requiresAuth : true);
        setSecureCode(draft.secureCode !== undefined ? draft.secureCode : null);
        setTheme(draft.theme !== undefined ? draft.theme : {});
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
    setIsOpenForSubmission(serverForm.isOpenForSubmission);
    setRequiresAuth(serverForm.requiresAuth);
    setSecureCode(serverForm.secureCode);
    setTheme((serverForm.theme as Record<string, any>) || {});
    const sorted = [...serverForm.fields].sort(
      (a, b) => Number(a.orderIndex) - Number(b.orderIndex)
    );
    setFields(
      sorted.map((f, i) => ({
        id: f.id,
        localId: f.id,
        label: f.label,
        type: f.type,
        required: f.required,
        placeholder: f.placeholder,
        validation: f.validation as FieldValidation | null,
        orderIndex: Number(f.orderIndex),
      }))
    );
    setHasDraft(false);
  }

  // Auto-save draft to localStorage whenever state changes
  const saveDraft = useCallback(() => {
    if (!loadedFromServer.current) return;
    const draft: DraftState = { title, description, isOpenForSubmission, requiresAuth, secureCode, theme, fields };
    localStorage.setItem(getDraftKey(formId), JSON.stringify(draft));
  }, [title, description, isOpenForSubmission, requiresAuth, secureCode, theme, fields, formId]);

  useEffect(() => {
    saveDraft();
  }, [saveDraft]);

  // Dynamically compute hasDraft by comparing state with form from server
  useEffect(() => {
    if (!form || !loadedFromServer.current) return;

    const isModified =
      title !== form.title ||
      description !== (form.description || "") ||
      isOpenForSubmission !== form.isOpenForSubmission ||
      requiresAuth !== form.requiresAuth ||
      secureCode !== form.secureCode ||
      JSON.stringify(theme) !== JSON.stringify(form.theme || {}) ||
      fields.length !== form.fields.length ||
      fields.some((f) => {
        const sf = form.fields.find((s) => s.id === f.id);
        if (!sf) return true; // new field added
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
    toast.success('Draft discarded — reverted to last saved version');
  };

  const clearDraft = () => {
    localStorage.removeItem(getDraftKey(formId));
    setHasDraft(false);
  };

  // ─── TRPC Mutations ─────────────────────────────────────────

  const updateForm = trpc.form.updateForm.useMutation({
    onSuccess: (data) => {
      clearDraft();
      toast.success('Changes saved');
      if (data) {
        setTitle(data.title);
        setDescription(data.description || '');
        setIsOpenForSubmission(data.isOpenForSubmission);
        setRequiresAuth(data.requiresAuth);
        setSecureCode(data.secureCode);
        setTheme((data.theme as Record<string, any>) || {});
        const sorted = [...data.fields].sort(
          (a, b) => Number(a.orderIndex) - Number(b.orderIndex)
        );
        setFields(
          sorted.map((f) => ({
            id: f.id,
            localId: f.id,
            label: f.label,
            type: f.type,
            required: f.required,
            placeholder: f.placeholder,
            validation: f.validation as FieldValidation | null,
            orderIndex: Number(f.orderIndex),
          }))
        );
      }
      setShowSettingsModal(false);
      utils.form.getFormById.invalidate({ id: formId });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to save');
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
    orderIndex: i * 10,
  });

  const handleSave = () => {
    updateForm.mutate({
      id: formId,
      title,
      description: description || undefined,
      isOpenForSubmission: isOpenForSubmission,
      requiresAuth: requiresAuth,
      secureCode: secureCode,
      theme: theme,
      fields: fields.map(buildFieldPayload),
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
    let url = `${window.location.origin}/forms/${formId}`;
    if (form?.secureCode) url += `?code=${form.secureCode}`;
    navigator.clipboard.writeText(url);
    toast.success('Share link copied!');
  };

  const addField = (type: string, afterIndex?: number) => {
    const defaultValidation: FieldValidation | null =
      type === 'single_select' || type === 'multi_select'
        ? { options: ['Option 1', 'Option 2'] }
        : null;

    let newOrderIndex: number;
    if (afterIndex === undefined || fields.length === 0) {
      newOrderIndex = fields.length > 0 ? Number(fields[fields.length - 1]!.orderIndex) + 1 : 0;
    } else {
      const current = Number(fields[afterIndex]!.orderIndex);
      const next = afterIndex + 1 < fields.length ? Number(fields[afterIndex + 1]!.orderIndex) : current + 1;
      newOrderIndex = (current + next) / 2;
    }

    const newField: FormField = {
      localId: crypto.randomUUID(),
      label: 'New Question',
      type,
      required: false,
      orderIndex: newOrderIndex,
      validation: defaultValidation,
    };
    const newFields = [...fields];
    if (afterIndex === undefined) newFields.push(newField);
    else newFields.splice(afterIndex + 1, 0, newField);

    setFields(newFields);
    setSelectedFieldIndex(afterIndex === undefined ? newFields.length - 1 : afterIndex + 1);
    setActiveSidebarTab('question');
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

  const handleReorder = (newFields: FormField[]) => {
    setFields(newFields);
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
  const isPrivate = !!secureCode;

  const canvasStyle: React.CSSProperties = {};
  if (theme?.backgroundColor) {
    canvasStyle.backgroundColor = theme.backgroundColor;
  }
  if (theme?.backgroundImageUrl) {
    canvasStyle.backgroundImage = `url(${theme.backgroundImageUrl})`;
    canvasStyle.backgroundSize = 'cover';
    canvasStyle.backgroundPosition = 'center';
  }

  return (
    <div className="h-[calc(100vh-60px)] md:h-[calc(100vh-96px)] flex flex-col -mx-6 -my-6 sm:-mx-8 sm:-my-8 md:-mx-12 md:-my-12 pt-16 md:pt-0 overflow-hidden bg-inquest-base">
      {/* Header */}
      <header className="bg-inquest-surface border-b border-inquest-rule p-4 sm:p-6 shrink-0 z-10 sticky top-0">
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
              <div 
                onClick={() => setShowDescriptionModal(true)}
                className="mt-1 cursor-pointer group flex items-start gap-2"
              >
                <p className={`text-sm ${description ? 'text-inquest-ink-mid' : 'text-inquest-ink-ghost italic'} line-clamp-2 flex-1`}>
                  {description || 'Add an optional description...'}
                </p>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-inquest-depth rounded-md text-inquest-ink-soft mt-0.5">
                  <Edit3 size={12} />
                </div>
              </div>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 text-inquest-ink-soft hover:text-inquest-ink rounded-full transition-colors border border-inquest-rule/30 cursor-pointer"
              title="Toggle theme mode"
            >
              {darkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Responses Button */}
            <Link
              href={`/dashboard/forms/${formId}/responses`}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-inquest-depth hover:bg-inquest-surface border border-inquest-rule text-sm font-medium text-inquest-ink transition-colors mr-2"
            >
              <Users size={14} className="text-inquest-accent" />
              <span>Responses</span>
              {submissionCount?.count !== undefined && submissionCount.count > 0 && (
                <span className="bg-inquest-accent text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1">
                  {submissionCount.count}
                </span>
              )}
            </Link>

            <button
              onClick={copyShareLink}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-inquest-accent/10 hover:bg-inquest-accent/20 border border-inquest-accent/30 text-xs font-bold text-inquest-accent transition mr-2 cursor-pointer shadow-sm"
              title="Copy share link"
            >
              <Copy size={13} />
              <span>Copy Link</span>
            </button>
            {hasDraft ? (
              <button
                onClick={() => setShowSettingsModal(true)}
                className="flex items-center gap-1.5 bg-inquest-accent text-white px-5 py-2 rounded-full font-medium hover:bg-inquest-accent-soft transition-colors terracotta-glow text-sm ml-1 cursor-pointer animate-pulse"
              >
                <Save size={15} />
                <span>Save Changes</span>
              </button>
            ) : (
              <div className="flex items-center gap-1 px-4 py-2 rounded-full bg-inquest-depth/50 text-inquest-ink-soft text-xs font-semibold select-none border border-inquest-rule/30">
                <Check size={13} className="text-inquest-accent animate-bounce" />
                <span>Saved to Cloud</span>
              </div>
            )}
          </div>
        </div>
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

      {/* Description Modal */}
      <AnimatePresence>
        {showDescriptionModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
            onClick={() => setShowDescriptionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-inquest-surface rounded-3xl p-6 md:p-8 max-w-2xl w-full warm-shadow"
            >
              <h3 className="text-xl font-serif text-inquest-ink mb-2">Edit Description</h3>
              <p className="text-inquest-ink-mid text-sm mb-4">Add context or instructions for your respondents.</p>
              
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-inquest-base border border-inquest-rule focus:border-inquest-accent rounded-xl px-4 py-3 text-inquest-ink min-h-[150px] resize-y"
                placeholder="Enter description..."
                autoFocus
              />
              
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setShowDescriptionModal(false)} 
                  className="flex-1 py-3 rounded-full bg-inquest-accent text-white font-medium hover:bg-inquest-accent-soft transition-colors terracotta-glow"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save & Publish Confirmation Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setShowSettingsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-inquest-surface rounded-3xl p-6 md:p-8 max-w-md w-full warm-shadow relative border border-inquest-rule/40"
            >
              <button onClick={() => setShowSettingsModal(false)} className="absolute top-6 right-6 text-inquest-ink-ghost hover:text-inquest-ink text-lg font-bold transition">✕</button>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-inquest-accent/10 rounded-full flex items-center justify-center">
                  <Globe size={20} className="text-inquest-accent" />
                </div>
                <h3 className="text-2xl font-serif text-inquest-ink">Publish & Share</h3>
              </div>

              <p className="text-sm text-inquest-ink-mid leading-relaxed mb-6">
                Review your changes and settings. Once confirmed, they will be live instantly.
              </p>

              <div className="space-y-4">
                {/* Settings Modification Inputs inside Modal */}
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  <div>
                    <label className="block text-xs font-semibold text-inquest-ink-soft uppercase tracking-wider mb-1">Enquiry Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-inquest-base border border-inquest-rule focus:border-inquest-accent rounded-xl px-3 py-2 text-sm text-inquest-ink focus:ring-1 focus:ring-inquest-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-inquest-ink-soft uppercase tracking-wider mb-1">Description (optional)</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-inquest-base border border-inquest-rule focus:border-inquest-accent rounded-xl px-3 py-2 text-sm text-inquest-ink h-16 resize-none focus:ring-1 focus:ring-inquest-accent"
                    />
                  </div>

                  {/* Submission Toggle */}
                  <div className="flex items-center justify-between bg-inquest-base p-3 rounded-xl border border-inquest-rule">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-inquest-ink">Accepting Responses</span>
                      <span className="text-[10px] text-inquest-ink-soft">Allow public submissions</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isOpenForSubmission}
                      onChange={(e) => setIsOpenForSubmission(e.target.checked)}
                      className="w-4 h-4 rounded border-inquest-rule text-inquest-accent focus:ring-inquest-accent cursor-pointer"
                    />
                  </div>

                  {/* Requires Auth Toggle */}
                  <div className="flex items-center justify-between bg-inquest-base p-3 rounded-xl border border-inquest-rule">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-inquest-ink">Require User Login</span>
                      <span className="text-[10px] text-inquest-ink-soft">Respondents must authenticate</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={requiresAuth}
                      onChange={(e) => setRequiresAuth(e.target.checked)}
                      className="w-4 h-4 rounded border-inquest-rule text-inquest-accent focus:ring-inquest-accent cursor-pointer"
                    />
                  </div>

                  {/* Passcode Gate Toggle */}
                  <div className="bg-inquest-base p-3 rounded-xl border border-inquest-rule space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-inquest-ink">Require Secure Code</span>
                        <span className="text-[10px] text-inquest-ink-soft">Protect form with a passcode</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isPrivate}
                        onChange={handleTogglePrivacy}
                        className="w-4 h-4 rounded border-inquest-rule text-inquest-accent focus:ring-inquest-accent cursor-pointer"
                      />
                    </div>
                    {isPrivate && secureCode && (
                      <div className="pt-1.5 flex items-center gap-2">
                        <div className="flex-1 bg-inquest-surface border border-inquest-rule rounded-lg px-3 py-1.5 font-mono text-sm tracking-wider text-inquest-ink text-center select-all">
                          {secureCode}
                        </div>
                        <button
                          type="button"
                          onClick={copySecureCode}
                          className="p-2 bg-inquest-depth hover:bg-inquest-rule text-inquest-ink-soft hover:text-inquest-ink rounded-lg transition-colors cursor-pointer"
                          title="Copy code"
                        >
                          <ClipboardCopy size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={handleTogglePrivacy}
                          className="p-1.5 bg-inquest-depth hover:bg-inquest-rule text-[10px] font-semibold text-inquest-ink-mid rounded-lg transition-colors cursor-pointer"
                        >
                          Regen
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Highly Prominent Shareable Link */}
                <div className="bg-inquest-base p-4 rounded-2xl border border-inquest-rule space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-inquest-ink-soft uppercase tracking-wider">Shareable Form Link</span>
                    {isPrivate && <span className="text-[10px] text-inquest-caution bg-inquest-caution/10 px-2 py-0.5 rounded-full font-medium">Private Gate Active</span>}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareUrl}
                      className="flex-1 bg-inquest-surface border border-inquest-rule rounded-xl px-3 py-2 text-xs font-mono text-inquest-ink select-all focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={copyShareLink}
                      className="px-4 py-2 bg-inquest-accent hover:bg-inquest-accent-soft text-white text-xs font-bold rounded-xl transition cursor-pointer shrink-0"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>

                {/* QR Code sharing */}
                {shareUrl && (
                  <div className="bg-inquest-base p-4 rounded-2xl border border-inquest-rule flex flex-col items-center justify-center gap-3 text-center">
                    <div className="w-full text-left">
                      <span className="text-xs font-bold text-inquest-ink-soft uppercase tracking-wider block">QR Code</span>
                      <span className="text-[10px] text-inquest-ink-mid">Scan to access this enquiry immediately.</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-inquest-rule/40 inline-flex flex-col items-center gap-2">
                      <QRCodeSVG id="modal-qr-code" value={shareUrl} size={110} fgColor="#3E2723" bgColor="#ffffff" level="H" />
                      <button
                        type="button"
                        onClick={() => {
                          const svg = document.getElementById('modal-qr-code');
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
                            toast.success('QR Code SVG downloaded!');
                          }
                        }}
                        className="text-[10px] text-inquest-accent font-semibold hover:underline cursor-pointer"
                      >
                        Download SVG
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="flex gap-3 pt-4 border-t border-inquest-rule mt-6">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="flex-1 py-2.5 rounded-full border border-inquest-rule text-inquest-ink font-medium hover:bg-inquest-depth/30 transition text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={updateForm.isPending}
                  className="flex-1 py-2.5 rounded-full bg-inquest-accent text-white font-bold hover:bg-inquest-accent-soft transition-colors terracotta-glow disabled:opacity-50 cursor-pointer"
                >
                  {updateForm.isPending ? 'Publishing...' : 'Confirm & Save'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Canvas */}
        <div
          style={canvasStyle}
          className={`flex-1 overflow-y-auto p-6 sm:p-12 pb-32 transition-all duration-300 ${
            !theme?.backgroundColor && !theme?.backgroundImageUrl ? 'bg-inquest-base' : ''
          }`}
        >
          <div className="max-w-3xl mx-auto space-y-4">
            <Reorder.Group axis="y" values={fields} onReorder={handleReorder} className="space-y-4">
              <AnimatePresence>
                {fields.map((field, idx) => (
                  <Reorder.Item
                    key={field.localId}
                    value={field}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => { setSelectedFieldIndex(idx); setActiveSidebarTab('question'); setShowMobileSidebar(true); }}
                    className={`bg-inquest-surface p-5 sm:p-6 rounded-3xl cursor-pointer transition-all border group ${
                      selectedFieldIndex === idx
                        ? 'border-inquest-accent warm-shadow scale-[1.01]'
                        : 'border-inquest-rule/50 hover:border-inquest-rule'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="mt-1 cursor-grab active:cursor-grabbing text-inquest-ink-ghost hover:text-inquest-ink-soft transition-colors shrink-0">
                          <GripVertical size={20} />
                        </div>
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
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={(e) => removeField(idx, e)} className="p-2 text-inquest-ink-soft hover:text-inquest-caution hover:bg-red-50 rounded-full ml-1"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  </Reorder.Item>
                ))}
              </AnimatePresence>
            </Reorder.Group>

            {fields.length === 0 && (
              <div className="text-center py-16 bg-inquest-surface border border-inquest-rule border-dashed rounded-3xl">
                <p className="text-lg font-serif text-inquest-ink">Your canvas is empty.</p>
                <p className="text-inquest-ink-mid mt-1 text-sm">Click the button below to add your first question.</p>
              </div>
            )}

            <div className="pt-4 grid grid-cols-2 gap-3">
              {FIELD_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.type}
                    onClick={() => addField(type.type)}
                    className="flex items-center gap-3 p-4 bg-inquest-surface border border-inquest-rule rounded-2xl hover:border-inquest-accent hover:bg-inquest-depth/30 transition-all text-inquest-ink cursor-pointer"
                  >
                    <Icon size={18} className="text-inquest-ink-soft" />
                    <span className="text-sm font-medium">{type.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Bottom Save changes trigger */}
            {hasDraft && (
              <div className="pt-8 flex justify-center">
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="flex items-center justify-center gap-2 bg-inquest-accent text-white px-8 py-3.5 rounded-full font-semibold hover:bg-inquest-accent-soft transition-all terracotta-glow cursor-pointer text-base shadow-md w-full max-w-xs"
                >
                  <Save size={18} />
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden md:flex w-80 bg-inquest-surface border-l border-inquest-rule flex-col overflow-y-auto z-10 shrink-0">
          {/* Tabs header */}
          <div className="flex border-b border-inquest-rule bg-inquest-base/30 shrink-0">
            <button
              onClick={() => setActiveSidebarTab('question')}
              className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider text-center border-b-2 transition cursor-pointer ${
                activeSidebarTab === 'question'
                  ? 'border-inquest-accent text-inquest-accent font-bold'
                  : 'border-transparent text-inquest-ink-soft hover:text-inquest-ink'
              }`}
            >
              Question Config
            </button>
            <button
              onClick={() => setActiveSidebarTab('settings')}
              className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider text-center border-b-2 transition cursor-pointer ${
                activeSidebarTab === 'settings'
                  ? 'border-inquest-accent text-inquest-accent font-bold'
                  : 'border-transparent text-inquest-ink-soft hover:text-inquest-ink'
              }`}
            >
              Styles & Setup
            </button>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            {activeSidebarTab === 'question' ? (
              selectedField ? (
                <FieldConfigPanel
                  field={selectedField}
                  onUpdate={updateSelectedField}
                  onDone={() => { setSelectedFieldIndex(null); setActiveSidebarTab('settings'); }}
                  hasDraft={hasDraft}
                  onSave={() => setShowSettingsModal(true)}
                  isSaving={updateForm.isPending}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-inquest-ink-ghost">
                  <Settings size={32} className="mb-3 opacity-20" />
                  <p className="text-sm font-medium">No question selected</p>
                  <p className="text-xs mt-1">Select a question to configure its settings</p>
                </div>
              )
            ) : (
              <FormSettingsSidebarPanel
                title={title} setTitle={setTitle}
                description={description} setDescription={setDescription}
                isOpenForSubmission={isOpenForSubmission} setIsOpenForSubmission={setIsOpenForSubmission}
                requiresAuth={requiresAuth} setRequiresAuth={setRequiresAuth}
                secureCode={secureCode} setSecureCode={setSecureCode}
                theme={theme} setTheme={setTheme}
                copySecureCode={copySecureCode}
                isPrivate={isPrivate}
                handleTogglePrivacy={handleTogglePrivacy}
                deleteConfirmInput={deleteConfirmInput} setDeleteConfirmInput={setDeleteConfirmInput}
                onDelete={() => deleteForm.mutate({ id: formId })}
                isDeleting={deleteForm.isPending}
                hasDraft={hasDraft}
                onSave={() => setShowSettingsModal(true)}
                isSaving={updateForm.isPending}
                shareUrl={shareUrl}
                copyShareLink={copyShareLink}
              />
            )}
          </div>
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
                className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-inquest-surface shadow-xl flex flex-col"
              >
                {/* Tabs header */}
                <div className="flex border-b border-inquest-rule bg-inquest-base/30 shrink-0">
                  <button
                    onClick={() => setActiveSidebarTab('question')}
                    className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider text-center border-b-2 transition cursor-pointer ${
                      activeSidebarTab === 'question'
                        ? 'border-inquest-accent text-inquest-accent font-bold'
                        : 'border-transparent text-inquest-ink-soft hover:text-inquest-ink'
                    }`}
                  >
                    Question
                  </button>
                  <button
                    onClick={() => setActiveSidebarTab('settings')}
                    className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider text-center border-b-2 transition cursor-pointer ${
                      activeSidebarTab === 'settings'
                        ? 'border-inquest-accent text-inquest-accent font-bold'
                        : 'border-transparent text-inquest-ink-soft hover:text-inquest-ink'
                    }`}
                  >
                    Settings
                  </button>
                  <button onClick={() => setShowMobileSidebar(false)} className="px-3 text-inquest-ink-soft hover:text-inquest-ink border-l border-inquest-rule">✕</button>
                </div>

                <div className="flex-1 flex flex-col min-h-0">
                  {activeSidebarTab === 'question' ? (
                    selectedField ? (
                      <FieldConfigPanel
                        field={selectedField}
                        onUpdate={updateSelectedField}
                        onDone={() => { setSelectedFieldIndex(null); setShowMobileSidebar(false); }}
                        hasDraft={hasDraft}
                        onSave={() => setShowSettingsModal(true)}
                        isSaving={updateForm.isPending}
                      />
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-inquest-ink-ghost h-full mt-20">
                        <Settings size={32} className="mb-3 opacity-20" />
                        <p className="text-sm font-medium">No question selected</p>
                      </div>
                    )
                  ) : (
                    <FormSettingsSidebarPanel
                      title={title} setTitle={setTitle}
                      description={description} setDescription={setDescription}
                      isOpenForSubmission={isOpenForSubmission} setIsOpenForSubmission={setIsOpenForSubmission}
                      requiresAuth={requiresAuth} setRequiresAuth={setRequiresAuth}
                      secureCode={secureCode} setSecureCode={setSecureCode}
                      theme={theme} setTheme={setTheme}
                      copySecureCode={copySecureCode}
                      isPrivate={isPrivate}
                      handleTogglePrivacy={handleTogglePrivacy}
                      deleteConfirmInput={deleteConfirmInput} setDeleteConfirmInput={setDeleteConfirmInput}
                      onDelete={() => deleteForm.mutate({ id: formId })}
                      isDeleting={deleteForm.isPending}
                      hasDraft={hasDraft}
                      onSave={() => setShowSettingsModal(true)}
                      isSaving={updateForm.isPending}
                      shareUrl={shareUrl}
                      copyShareLink={copyShareLink}
                    />
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Field Config Panel ───────────────────────────────────────

function FieldConfigPanel({ field, onUpdate, onDone, hasDraft, onSave, isSaving }: {
  field: FormField;
  onUpdate: (updates: Partial<FormField>) => void;
  onDone: () => void;
  hasDraft?: boolean;
  onSave?: () => void;
  isSaving?: boolean;
}) {
  const v = field.validation || {};

  const setValidation = (patch: Partial<FieldValidation>) => {
    onUpdate({ validation: { ...v, ...patch } });
  };

  return (
    <div className="p-6 space-y-5 flex flex-col h-full overflow-hidden bg-inquest-surface">
      <div className="flex-1 overflow-y-auto space-y-5 pr-1 pb-4">
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
              : newType === 'rating'
                ? { min: 1, max: 5 }
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

        {/* RATING */}
        {field.type === 'rating' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-inquest-ink-soft mb-1 font-bold">Max Rating Stars</label>
              <input
                type="number" min={1} max={10}
                value={v.max ?? 5}
                onChange={(e) => setValidation({ max: e.target.value ? Number(e.target.value) : 5 })}
                className="w-full bg-inquest-base border border-inquest-rule rounded-lg px-2 py-1.5 text-sm text-inquest-ink"
              />
              <p className="text-[10px] text-inquest-ink-ghost mt-1">Choose between 1 and 10 stars (default: 5).</p>
            </div>
          </div>
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

      {hasDraft && onSave && (
        <div className="pt-4 border-t border-inquest-rule shrink-0">
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="w-full py-3 rounded-full bg-inquest-accent text-white font-bold transition flex items-center justify-center gap-2 terracotta-glow cursor-pointer text-xs animate-pulse"
          >
            <Save size={14} /> Save Changes
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Preset Themes ──────────────────────────────────────────

const PRESET_THEMES = [
  {
    name: 'Warm Parchment',
    description: 'Cream light style',
    backgroundColor: '#F5EFEB',
    mode: 'light',
    accentColor: '#D97436',
  },
  {
    name: 'Midnight Studio',
    description: 'Pitch black & orange glow',
    backgroundColor: '#0B0705',
    mode: 'dark',
    accentColor: '#E06F28',
  },
  {
    name: 'Aesthetic Sunset',
    description: 'Dreamy peach vibe',
    backgroundColor: '#FDE8E0',
    mode: 'light',
    accentColor: '#E0533C',
  }
];

interface FormSettingsSidebarPanelProps {
  title: string;
  setTitle: (t: string) => void;
  description: string;
  setDescription: (d: string) => void;
  isOpenForSubmission: boolean;
  setIsOpenForSubmission: (o: boolean) => void;
  requiresAuth: boolean;
  setRequiresAuth: (a: boolean) => void;
  secureCode: string | null;
  setSecureCode: (c: string | null) => void;
  theme: Record<string, any>;
  setTheme: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  copySecureCode: () => void;
  isPrivate: boolean;
  handleTogglePrivacy: () => void;
  deleteConfirmInput: string;
  setDeleteConfirmInput: (val: string) => void;
  onDelete: () => void;
  isDeleting: boolean;
  hasDraft?: boolean;
  onSave: () => void;
  isSaving?: boolean;
  shareUrl: string;
  copyShareLink: () => void;
}

function FormSettingsSidebarPanel({
  title, setTitle,
  description, setDescription,
  isOpenForSubmission, setIsOpenForSubmission,
  requiresAuth, setRequiresAuth,
  secureCode, setSecureCode,
  theme, setTheme,
  copySecureCode,
  isPrivate,
  handleTogglePrivacy,
  deleteConfirmInput, setDeleteConfirmInput,
  onDelete,
  isDeleting,
  hasDraft,
  onSave,
  isSaving,
  shareUrl,
  copyShareLink,
}: FormSettingsSidebarPanelProps) {
  const currentTheme = theme || {};

  return (
    <div className="p-6 space-y-6 flex flex-col h-full overflow-hidden bg-inquest-surface">
      <div className="flex-1 overflow-y-auto space-y-6 pr-1 pb-4">
        
        {/* Large Highly Obvious Copy Link Section */}
        <div className="bg-inquest-base border border-inquest-rule rounded-2xl p-4 space-y-3 warm-shadow">
          <div className="flex items-center gap-2 text-inquest-ink">
            <Globe size={18} className="text-inquest-accent" />
            <h4 className="text-sm font-serif font-bold">Enquiry Access & Sharing</h4>
          </div>
          <p className="text-xs text-inquest-ink-mid">
            Distribute this link to collect responses. Anyone with the link (and secure code, if active) can fill out the form.
          </p>
          <div className="space-y-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="w-full bg-inquest-surface border border-inquest-rule rounded-xl px-3 py-2 text-xs font-mono text-inquest-ink select-all focus:outline-none"
            />
            <button
              type="button"
              onClick={copyShareLink}
              className="w-full py-3 bg-inquest-accent hover:bg-inquest-accent-soft text-white text-sm font-bold rounded-full transition-all terracotta-glow cursor-pointer flex items-center justify-center gap-2"
            >
              <Copy size={16} />
              Copy Shareable Link
            </button>
          </div>
        </div>

        {/* Info Setup */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-inquest-ink-soft uppercase tracking-wider">Enquiry Details</h4>
          <div>
            <label className="block text-xs text-inquest-ink-mid mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-inquest-base border border-inquest-rule focus:border-inquest-accent rounded-xl px-3 py-2 text-inquest-ink text-sm"
              placeholder="e.g. Customer Survey"
            />
          </div>
          <div>
            <label className="block text-xs text-inquest-ink-mid mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-inquest-base border border-inquest-rule focus:border-inquest-accent rounded-xl px-3 py-2 text-inquest-ink text-sm h-20 resize-none"
              placeholder="Provide context or instructions..."
            />
          </div>
        </div>

        {/* Privacy & Validation */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-inquest-ink-soft uppercase tracking-wider">Security & Submissions</h4>
          
          <div className="flex items-center justify-between bg-inquest-base p-3 rounded-xl border border-inquest-rule">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-inquest-ink-mid">Accepting Responses</span>
              <span className="text-[10px] text-inquest-ink-soft">Allow public submissions</span>
            </div>
            <input
              type="checkbox"
              checked={isOpenForSubmission}
              onChange={(e) => setIsOpenForSubmission(e.target.checked)}
              className="w-4 h-4 rounded border-inquest-rule text-inquest-accent focus:ring-inquest-accent cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between bg-inquest-base p-3 rounded-xl border border-inquest-rule">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-inquest-ink-mid">Require Login</span>
              <span className="text-[10px] text-inquest-ink-soft">Respondents must authenticate</span>
            </div>
            <input
              type="checkbox"
              checked={requiresAuth}
              onChange={(e) => setRequiresAuth(e.target.checked)}
              className="w-4 h-4 rounded border-inquest-rule text-inquest-accent focus:ring-inquest-accent cursor-pointer"
            />
          </div>

          {/* Secure Gate (Privacy) */}
          <div className="bg-inquest-base p-3 rounded-xl border border-inquest-rule space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-inquest-ink-mid">Require Secure Code</span>
                <span className="text-[10px] text-inquest-ink-soft">Protect form with a passcode</span>
              </div>
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={handleTogglePrivacy}
                className="w-4 h-4 rounded border-inquest-rule text-inquest-accent focus:ring-inquest-accent cursor-pointer"
              />
            </div>
            {isPrivate && secureCode && (
              <div className="pt-2 flex items-center gap-2">
                <div className="flex-1 bg-inquest-surface border border-inquest-rule rounded-lg px-3 py-1.5 font-mono text-sm tracking-wider text-inquest-ink text-center select-all">
                  {secureCode}
                </div>
                <button
                  type="button"
                  onClick={copySecureCode}
                  className="p-2 bg-inquest-depth hover:bg-inquest-rule text-inquest-ink-soft hover:text-inquest-ink rounded-lg transition-colors cursor-pointer"
                  title="Copy code"
                >
                  <ClipboardCopy size={14} />
                </button>
                <button
                  type="button"
                  onClick={handleTogglePrivacy}
                  className="p-1.5 bg-inquest-depth hover:bg-inquest-rule text-xs font-semibold text-inquest-ink-mid rounded-lg transition-colors cursor-pointer"
                >
                  Regen
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Theme Designer */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Palette size={16} className="text-inquest-accent" />
            <h4 className="text-xs font-semibold text-inquest-ink-soft uppercase tracking-wider">Theme Designer</h4>
          </div>

          {/* Real-time Miniature Form Preview */}
          <div className="border border-inquest-rule rounded-2xl p-4 relative overflow-hidden"
            style={{
              backgroundColor: currentTheme.backgroundColor || '#F5EFEB',
              backgroundImage: currentTheme.backgroundImageUrl ? `url(${currentTheme.backgroundImageUrl})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              minHeight: '120px'
            }}
          >
            {/* Visual preview card */}
            <div className={`p-3 rounded-xl border border-white/20 backdrop-blur-sm shadow-sm ${currentTheme.mode === 'dark' ? 'bg-black/60 text-white' : 'bg-white/80 text-gray-900'}`}>
              <div className="h-2 w-12 rounded-full mb-2" style={{ backgroundColor: currentTheme.accentColor || '#E06F28' }} />
              <div className="text-[10px] font-bold truncate">{title || 'Untitled Enquiry'}</div>
              <div className="text-[8px] opacity-60 truncate mt-0.5">{description || 'No description provided'}</div>
              <div className="mt-3 flex justify-between items-center">
                <div className="h-4 w-12 rounded-lg bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 w-10 rounded-full text-[8px] font-bold text-white flex items-center justify-center animate-pulse" style={{ backgroundColor: currentTheme.accentColor || '#E06F28' }}>
                  Submit
                </div>
              </div>
            </div>
            <div className="absolute bottom-2 right-2 text-[9px] font-mono bg-black/65 text-white/95 px-2 py-0.5 rounded-full select-none">
              {currentTheme.mode === 'dark' ? 'Void Dark' : 'Cream Light'}
            </div>
          </div>

          {/* Preset Grid */}
          <div className="grid grid-cols-3 gap-2">
            {PRESET_THEMES.map((preset) => {
              const isActive = currentTheme.backgroundColor === preset.backgroundColor && currentTheme.mode === preset.mode;
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setTheme({
                    backgroundColor: preset.backgroundColor,
                    mode: preset.mode as 'light' | 'dark',
                    accentColor: preset.accentColor,
                    backgroundImageUrl: ''
                  })}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center cursor-pointer ${
                    isActive
                      ? 'border-inquest-accent bg-inquest-depth/50 scale-[1.03] ring-1 ring-inquest-accent'
                      : 'border-inquest-rule bg-inquest-surface hover:border-inquest-ink-soft hover:bg-inquest-base/20'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full border border-inquest-rule flex items-center justify-center"
                    style={{ backgroundColor: preset.backgroundColor }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: preset.accentColor }} />
                  </div>
                  <span className="text-[9px] font-bold mt-1 text-inquest-ink leading-tight truncate w-full">{preset.name}</span>
                </button>
              );
            })}
          </div>

          {/* Custom Theme Inputs */}
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs text-inquest-ink-mid mb-1">Custom Background Color (Hex)</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={currentTheme.backgroundColor?.startsWith('#') && currentTheme.backgroundColor?.length === 7 ? currentTheme.backgroundColor : '#F5EFEB'}
                  onChange={(e) => setTheme((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                  className="w-10 h-9 rounded-xl border border-inquest-rule bg-inquest-base p-1 cursor-pointer"
                />
                <input
                  type="text"
                  value={currentTheme.backgroundColor || ''}
                  onChange={(e) => setTheme((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                  className="flex-1 bg-inquest-base border border-inquest-rule rounded-xl px-3 py-1.5 text-xs text-inquest-ink font-mono"
                  placeholder="#F5EFEB"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-inquest-ink-mid mb-1">Custom Background Image URL</label>
              <input
                type="text"
                value={currentTheme.backgroundImageUrl || ''}
                onChange={(e) => setTheme((prev) => ({ ...prev, backgroundImageUrl: e.target.value }))}
                className="w-full bg-inquest-base border border-inquest-rule rounded-xl px-3 py-2 text-xs text-inquest-ink"
                placeholder="https://images.unsplash.com/... or google image address"
              />
              
              {/* Image URL copy instructions */}
              <div className="mt-2 bg-inquest-depth/40 rounded-xl p-3 border border-inquest-rule text-[10px] text-inquest-ink-soft leading-relaxed space-y-1">
                <div className="font-semibold text-inquest-ink flex items-center gap-1">
                  <HelpCircle size={10} /> Google Image Search Guide:
                </div>
                <div>1. Search Google Images for a background theme.</div>
                <div>2. Right-click target image, click <span className="font-bold text-inquest-accent">"Copy Image Address"</span>.</div>
                <div>3. Paste link directly in the URL input field above.</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-inquest-ink-mid">Theme Accent Color</span>
              <input
                type="color"
                value={currentTheme.accentColor || '#E06F28'}
                onChange={(e) => setTheme((prev) => ({ ...prev, accentColor: e.target.value }))}
                className="w-10 h-8 rounded-xl border border-inquest-rule bg-inquest-base p-1 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-inquest-ink-mid">Mode (Contrast Casing)</span>
              <div className="flex bg-inquest-base border border-inquest-rule rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setTheme((prev) => ({ ...prev, mode: 'light' }))}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                    currentTheme.mode === 'light' || !currentTheme.mode
                      ? 'bg-inquest-surface text-inquest-accent shadow-sm border border-inquest-rule/40'
                      : 'text-inquest-ink-soft hover:text-inquest-ink'
                  }`}
                >
                  <Sun size={10} /> Light
                </button>
                <button
                  type="button"
                  onClick={() => setTheme((prev) => ({ ...prev, mode: 'dark' }))}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                    currentTheme.mode === 'dark'
                      ? 'bg-inquest-surface text-inquest-accent shadow-sm border border-inquest-rule/40'
                      : 'text-inquest-ink-soft hover:text-inquest-ink'
                  }`}
                >
                  <Moon size={10} /> Dark
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="border border-red-200/50 dark:border-red-950/40 bg-red-50/10 rounded-2xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider flex items-center gap-1.5">
            <AlertCircle size={14} /> Danger Zone
          </h4>
          <p className="text-[10px] text-inquest-ink-soft leading-normal">
            Deleting this enquiry will permanently remove all questions, configuration, and responses collected. This action is irreversible.
          </p>
          <div className="space-y-2">
            <input
              type="text"
              value={deleteConfirmInput}
              onChange={(e) => setDeleteConfirmInput(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="w-full bg-white dark:bg-inquest-base border border-red-200 dark:border-red-950 focus:border-red-500 rounded-xl px-3 py-2 text-xs font-semibold text-inquest-ink placeholder-red-300 focus:outline-none"
            />
            <button
              type="button"
              onClick={onDelete}
              disabled={deleteConfirmInput !== 'DELETE' || isDeleting}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-inquest-depth disabled:text-inquest-ink-ghost text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Trash2 size={12} />
              {isDeleting ? 'Deleting...' : 'Delete Enquiry Permanently'}
            </button>
          </div>
        </div>

      </div>

      {/* Conditionally Render Save Changes Button at the bottom of the sidebar */}
      {hasDraft && onSave && (
        <div className="pt-4 border-t border-inquest-rule shrink-0 animate-bounce">
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="w-full py-3.5 rounded-full bg-inquest-accent hover:bg-inquest-accent-soft text-white font-bold transition flex items-center justify-center gap-2 terracotta-glow cursor-pointer text-sm shadow-md"
          >
            <Save size={16} /> Save Changes
          </button>
        </div>
      )}
    </div>
  );
}

