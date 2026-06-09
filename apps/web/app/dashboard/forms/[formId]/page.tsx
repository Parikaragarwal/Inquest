'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { trpc } from '~/trpc/client';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Save, Globe, Lock, ArrowLeft, Trash2, 
  Settings, Type, FileText, Hash, CheckSquare, 
  Calendar, List, CheckCircle, Mail, Phone,
  ArrowUp, ArrowDown, Copy, ExternalLink, Users, ClipboardCopy
} from 'lucide-react';
import { useGetuser } from '~/hooks/api/auth';
import Link from 'next/link';

type FormField = {
  id?: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string | null;
  validation?: any;
  orderIndex: number;
};

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
  const [isPublic, setIsPublic] = useState(false);
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedFieldIndex, setSelectedFieldIndex] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Sync initial data
  useEffect(() => {
    if (form) {
      setTitle(form.title);
      setDescription(form.description || '');
      setIsPublic(form.isOpenForSubmission && !form.secureCode);
      const sortedFields = [...form.fields].sort((a, b) => parseInt(a.orderIndex) - parseInt(b.orderIndex));
      setFields(sortedFields.map((f, i) => ({
        id: f.id,
        label: f.label,
        type: f.type,
        required: f.required,
        placeholder: f.placeholder,
        validation: f.validation,
        orderIndex: i,
      })));
    }
  }, [form]);

  const updateForm = trpc.form.updateForm.useMutation({
    onSuccess: () => {
      toast.success('Changes saved successfully');
      utils.form.getFormById.invalidate({ id: formId });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to save changes');
    }
  });

  const updateSecureCode = trpc.form.updateFormSecureCode.useMutation({
    onSuccess: (data) => {
      if (data.secureCode) {
        toast.success(`Form is now Private. Secure Code: ${data.secureCode}`);
      } else {
        toast.success('Form is now Public.');
      }
      setIsPublic(!data.secureCode);
      utils.form.getFormById.invalidate({ id: formId });
    }
  });

  const deleteForm = trpc.form.deleteForm.useMutation({
    onSuccess: () => {
      toast.success('Enquiry deleted');
      utils.form.getMyForms.invalidate();
      router.push('/dashboard');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to delete');
    }
  });

  const handleSave = () => {
    updateForm.mutate({
      id: formId,
      title,
      description: description || undefined,
      isOpenForSubmission: true,
      fields: fields.map((f, i) => ({
        id: f.id,
        label: f.label,
        type: f.type as any,
        required: f.required,
        placeholder: f.placeholder || undefined,
        validation: f.validation,
        orderIndex: i,
      }))
    });
  };

  const handleTogglePrivacy = () => {
    if (isPublic) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      updateSecureCode.mutate({ id: formId, secureCode: code });
    } else {
      updateSecureCode.mutate({ id: formId, secureCode: null });
    }
  };

  const copySecureCode = () => {
    if (form?.secureCode) {
      navigator.clipboard.writeText(form.secureCode);
      toast.success('Secure code copied!');
    }
  };

  const copyShareLink = () => {
    let url = `${window.location.origin}/forms/${formId}`;
    if (form?.secureCode) {
      url += `?code=${form.secureCode}`;
    }
    navigator.clipboard.writeText(url);
    toast.success('Share link copied!');
  };

  const addField = (type: string) => {
    const newField: FormField = {
      label: 'New Question',
      type,
      required: false,
      orderIndex: fields.length,
      validation: type === 'single_select' || type === 'multi_select' ? { options: ['Option 1', 'Option 2'] } : null
    };
    setFields([...fields, newField]);
    setSelectedFieldIndex(fields.length);
    setShowMobileSidebar(true);
  };

  const updateSelectedField = (updates: Partial<FormField>) => {
    if (selectedFieldIndex === null) return;
    const newFields = [...fields];
    newFields[selectedFieldIndex] = { ...newFields[selectedFieldIndex], ...updates } as FormField;
    setFields(newFields);
  };

  const removeField = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newFields = fields.filter((_, i) => i !== index);
    setFields(newFields);
    if (selectedFieldIndex === index) setSelectedFieldIndex(null);
    else if (selectedFieldIndex !== null && selectedFieldIndex > index) setSelectedFieldIndex(selectedFieldIndex - 1);
  };

  const moveField = (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === fields.length - 1) return;

    const newFields = [...fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex]!, newFields[index]!];
    setFields(newFields);
    if (selectedFieldIndex === index) setSelectedFieldIndex(targetIndex);
    else if (selectedFieldIndex === targetIndex) setSelectedFieldIndex(index);
  };

  if (isLoading || !form) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 rounded-full border-2 border-inquest-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  const selectedField = selectedFieldIndex !== null ? fields[selectedFieldIndex] : null;
  const responseCount = submissionCount?.count ?? 0;

  return (
    <div className="h-full flex flex-col -m-12">
      {/* Header */}
      <header className="bg-inquest-surface border-b border-inquest-rule px-4 sm:px-8 py-4 sm:py-6 shrink-0 sticky top-0 z-10">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <button onClick={() => router.push('/dashboard')} className="mt-1.5 p-2 hover:bg-inquest-depth rounded-full transition-colors text-inquest-ink-soft hover:text-inquest-ink shrink-0">
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-2xl sm:text-3xl font-serif font-bold text-inquest-ink bg-transparent border-0 focus:ring-0 p-0 w-full placeholder-inquest-ink-ghost"
                placeholder="Enquiry Title"
              />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-sm sm:text-base text-inquest-ink-mid mt-1 bg-transparent border-0 focus:ring-0 p-0 w-full placeholder-inquest-ink-ghost"
                placeholder="Add an optional description..."
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap shrink-0">
            {/* Secure Code Display */}
            {form.secureCode && (
              <button
                onClick={copySecureCode}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-inquest-depth border border-inquest-rule text-sm font-mono text-inquest-ink hover:bg-inquest-rule/50 transition-colors"
                title="Click to copy secure code"
              >
                <Lock size={12} />
                <span className="tracking-wider">{form.secureCode}</span>
                <ClipboardCopy size={12} className="text-inquest-ink-soft" />
              </button>
            )}

            {/* Privacy Toggle */}
            <div className="flex items-center bg-inquest-base rounded-full p-1 border border-inquest-rule">
              <button
                onClick={() => { if(!isPublic) handleTogglePrivacy(); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                  isPublic ? 'bg-inquest-surface shadow text-inquest-ink' : 'text-inquest-ink-soft hover:text-inquest-ink'
                }`}
              >
                <Globe size={14} /> Public
              </button>
              <button
                onClick={() => { if(isPublic) handleTogglePrivacy(); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                  !isPublic ? 'bg-inquest-surface shadow text-inquest-ink' : 'text-inquest-ink-soft hover:text-inquest-ink'
                }`}
              >
                <Lock size={14} /> Private
              </button>
            </div>

            {/* Actions */}
            <button onClick={copyShareLink} className="p-2 text-inquest-ink-soft hover:text-inquest-ink hover:bg-inquest-depth rounded-full transition-colors" title="Copy share link">
              <Copy size={18} />
            </button>
            <button onClick={() => window.open(`/forms/${formId}`, '_blank')} className="p-2 text-inquest-ink-soft hover:text-inquest-ink hover:bg-inquest-depth rounded-full transition-colors" title="Preview form">
              <ExternalLink size={18} />
            </button>

            {/* Responses Link */}
            <Link
              href={`/dashboard/forms/${formId}/responses`}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-inquest-rule text-sm font-medium text-inquest-ink-mid hover:bg-inquest-depth/30 transition-colors"
            >
              <Users size={16} />
              <span className="hidden sm:inline">Responses</span>
              {responseCount > 0 && (
                <span className="bg-inquest-accent text-white text-xs px-2 py-0.5 rounded-full font-bold">{responseCount}</span>
              )}
            </Link>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={updateForm.isPending}
              className="flex items-center gap-2 bg-inquest-accent text-white px-4 sm:px-6 py-2.5 rounded-full font-medium hover:bg-inquest-accent-soft transition-colors terracotta-glow disabled:opacity-50 text-sm"
            >
              <Save size={16} />
              <span className="hidden sm:inline">{updateForm.isPending ? 'Saving...' : 'Save'}</span>
            </button>

            {/* Delete */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-inquest-ink-ghost hover:text-inquest-caution hover:bg-red-50 rounded-full transition-colors"
              title="Delete Enquiry"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-inquest-surface rounded-3xl p-8 max-w-sm w-full warm-shadow text-center"
            >
              <div className="w-14 h-14 bg-inquest-caution/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} className="text-inquest-caution" />
              </div>
              <h3 className="text-xl font-serif text-inquest-ink mb-2">Delete this Enquiry?</h3>
              <p className="text-inquest-ink-mid text-sm mb-6">This will permanently remove &ldquo;{form.title}&rdquo; and all its responses. This cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 rounded-full border border-inquest-rule text-inquest-ink font-medium hover:bg-inquest-depth/30 transition-colors"
                >
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
            {/* Mobile: Add Field Button */}
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
                        <span className="text-xs font-bold text-inquest-ink-soft uppercase tracking-wider">
                          Q{idx + 1}
                        </span>
                        {field.required && (
                          <span className="text-xs text-inquest-caution font-medium bg-inquest-caution/10 px-2 py-0.5 rounded-full">
                            Required
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg sm:text-xl font-serif text-inquest-ink break-words">{field.label || 'Untitled Question'}</h3>
                      <p className="text-inquest-ink-soft mt-1 italic text-sm">
                        {FIELD_TYPES.find(t => t.type === field.type)?.label}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={(e) => moveField(idx, 'up', e)} disabled={idx === 0} className="p-1.5 text-inquest-ink-soft hover:text-inquest-ink hover:bg-inquest-depth rounded-full disabled:opacity-30">
                        <ArrowUp size={14} />
                      </button>
                      <button onClick={(e) => moveField(idx, 'down', e)} disabled={idx === fields.length - 1} className="p-1.5 text-inquest-ink-soft hover:text-inquest-ink hover:bg-inquest-depth rounded-full disabled:opacity-30">
                        <ArrowDown size={14} />
                      </button>
                      <button onClick={(e) => removeField(idx, e)} className="p-1.5 text-inquest-ink-soft hover:text-inquest-caution hover:bg-red-50 rounded-full ml-1">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {fields.length === 0 && (
              <div className="text-center py-16 sm:py-20 bg-inquest-surface border border-inquest-rule border-dashed rounded-3xl">
                <p className="text-lg font-serif text-inquest-ink">Your canvas is empty.</p>
                <p className="text-inquest-ink-mid mt-2">Select a field type from the panel to begin.</p>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden md:flex w-80 bg-inquest-surface border-l border-inquest-rule flex-col h-[calc(100vh-89px)] overflow-y-auto">
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/30 z-40"
              onClick={() => setShowMobileSidebar(false)}
            >
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-inquest-surface shadow-xl overflow-y-auto"
              >
                <div className="p-4 border-b border-inquest-rule flex justify-between items-center">
                  <h3 className="font-serif text-lg text-inquest-ink">{selectedField ? 'Configure' : 'Add Field'}</h3>
                  <button onClick={() => setShowMobileSidebar(false)} className="p-2 text-inquest-ink-soft hover:text-inquest-ink">✕</button>
                </div>
                {selectedField ? (
                  <FieldConfigPanel
                    field={selectedField}
                    onUpdate={updateSelectedField}
                    onDone={() => { setSelectedFieldIndex(null); setShowMobileSidebar(false); }}
                  />
                ) : (
                  <FieldAdderPanel onAddField={(type) => { addField(type); }} />
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────

function FieldConfigPanel({ field, onUpdate, onDone }: {
  field: FormField;
  onUpdate: (updates: Partial<FormField>) => void;
  onDone: () => void;
}) {
  return (
    <div className="p-6 space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-lg text-inquest-ink flex items-center gap-2">
          <Settings size={18} /> Configuration
        </h3>
        <button onClick={onDone} className="text-sm text-inquest-accent hover:underline">
          Done
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-inquest-ink-mid mb-1">Question Label</label>
          <input
            type="text"
            value={field.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            className="w-full bg-inquest-base border border-inquest-rule focus:border-inquest-accent rounded-xl px-3 py-2 text-inquest-ink focus:ring-1 focus:ring-inquest-accent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-inquest-ink-mid mb-1">Placeholder</label>
          <input
            type="text"
            value={field.placeholder || ''}
            onChange={(e) => onUpdate({ placeholder: e.target.value })}
            className="w-full bg-inquest-base border border-inquest-rule focus:border-inquest-accent rounded-xl px-3 py-2 text-inquest-ink focus:ring-1 focus:ring-inquest-accent"
          />
        </div>

        <div className="flex items-center justify-between bg-inquest-base p-3 rounded-xl border border-inquest-rule">
          <label className="text-sm font-medium text-inquest-ink-mid">Required</label>
          <input
            type="checkbox"
            checked={field.required}
            onChange={(e) => onUpdate({ required: e.target.checked })}
            className="w-5 h-5 rounded border-inquest-rule text-inquest-accent focus:ring-inquest-accent"
          />
        </div>

        {(field.type === 'single_select' || field.type === 'multi_select') && (
          <div className="pt-4 border-t border-inquest-rule">
            <label className="block text-sm font-medium text-inquest-ink-mid mb-2">Options</label>
            <div className="space-y-2">
              {field.validation?.options?.map((opt: string, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...(field.validation?.options || [])];
                      newOpts[i] = e.target.value;
                      onUpdate({ validation: { ...field.validation, options: newOpts } });
                    }}
                    className="flex-1 bg-inquest-base border border-inquest-rule rounded-lg px-3 py-1.5 text-sm"
                  />
                  <button
                    onClick={() => {
                      const newOpts = field.validation.options.filter((_: any, idx: number) => idx !== i);
                      onUpdate({ validation: { ...field.validation, options: newOpts } });
                    }}
                    className="p-1.5 text-inquest-ink-soft hover:text-inquest-caution"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newOpts = [...(field.validation?.options || []), `Option ${(field.validation?.options?.length || 0) + 1}`];
                  onUpdate({ validation: { ...field.validation, options: newOpts } });
                }}
                className="text-sm text-inquest-accent font-medium mt-2 hover:underline"
              >
                + Add Option
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

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
