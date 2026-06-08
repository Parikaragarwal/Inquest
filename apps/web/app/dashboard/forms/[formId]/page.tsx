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
  ArrowUp, ArrowDown
} from 'lucide-react';
import { useGetuser } from '~/hooks/api/auth';

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

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedFieldIndex, setSelectedFieldIndex] = useState<number | null>(null);

  // Sync initial data
  useEffect(() => {
    if (form) {
      setTitle(form.title);
      setDescription(form.description || '');
      setIsPublic(form.isOpenForSubmission && !form.secureCode);
      // Map fields, sorting by orderIndex
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
      utils.form.getFormById.invalidate({ id: formId });
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
      // Switching to Private -> Generate a 6-char secure code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      updateSecureCode.mutate({ id: formId, secureCode: code });
    } else {
      // Switching to Public -> Remove secure code
      updateSecureCode.mutate({ id: formId, secureCode: null });
    }
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
    
    // Swap
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

  return (
    <div className="h-full flex flex-col -m-12">
      {/* Header */}
      <header className="bg-inquest-surface border-b border-inquest-rule px-8 py-6 flex items-start justify-between shrink-0 sticky top-0 z-10">
        <div className="flex items-start gap-4 flex-1">
          <button onClick={() => router.push('/dashboard')} className="mt-2 p-2 hover:bg-inquest-depth rounded-full transition-colors text-inquest-ink-soft hover:text-inquest-ink">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 max-w-2xl">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-3xl font-serif font-bold text-inquest-ink bg-transparent border-0 focus:ring-0 p-0 w-full placeholder-inquest-ink-ghost"
              placeholder="Enquiry Title"
            />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-inquest-ink-mid mt-2 bg-transparent border-0 focus:ring-0 p-0 w-full placeholder-inquest-ink-ghost"
              placeholder="Add an optional description or greeting..."
            />
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center bg-inquest-base rounded-full p-1 border border-inquest-rule">
            <button
              onClick={() => { if(!isPublic) handleTogglePrivacy(); }}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                isPublic ? 'bg-inquest-surface shadow text-inquest-ink' : 'text-inquest-ink-soft hover:text-inquest-ink'
              }`}
            >
              <Globe size={14} /> Public
            </button>
            <button
              onClick={() => { if(isPublic) handleTogglePrivacy(); }}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                !isPublic ? 'bg-inquest-surface shadow text-inquest-ink' : 'text-inquest-ink-soft hover:text-inquest-ink'
              }`}
            >
              <Lock size={14} /> Private
            </button>
          </div>
          
          <button
            onClick={handleSave}
            disabled={updateForm.isPending}
            className="flex items-center gap-2 bg-inquest-accent text-white px-6 py-2.5 rounded-full font-medium hover:bg-inquest-accent-soft transition-colors terracotta-glow disabled:opacity-50"
          >
            <Save size={18} />
            {updateForm.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 overflow-y-auto p-12 bg-inquest-base">
          <div className="max-w-3xl mx-auto space-y-4 pb-32">
            <AnimatePresence>
              {fields.map((field, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => setSelectedFieldIndex(idx)}
                  className={`bg-inquest-surface p-6 rounded-3xl cursor-pointer transition-all border ${
                    selectedFieldIndex === idx 
                      ? 'border-inquest-accent warm-shadow scale-[1.01]' 
                      : 'border-inquest-rule/50 hover:border-inquest-rule'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-inquest-ink-soft uppercase tracking-wider">
                          Question {idx + 1}
                        </span>
                        {field.required && (
                          <span className="text-xs text-inquest-caution font-medium bg-inquest-caution/10 px-2 py-0.5 rounded-full">
                            Required
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-serif text-inquest-ink">{field.label || 'Untitled Question'}</h3>
                      <p className="text-inquest-ink-soft mt-2 italic text-sm">
                        {FIELD_TYPES.find(t => t.type === field.type)?.label} • {field.placeholder || 'No placeholder'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button onClick={(e) => moveField(idx, 'up', e)} disabled={idx === 0} className="p-2 text-inquest-ink-soft hover:text-inquest-ink hover:bg-inquest-depth rounded-full disabled:opacity-30">
                        <ArrowUp size={16} />
                      </button>
                      <button onClick={(e) => moveField(idx, 'down', e)} disabled={idx === fields.length - 1} className="p-2 text-inquest-ink-soft hover:text-inquest-ink hover:bg-inquest-depth rounded-full disabled:opacity-30">
                        <ArrowDown size={16} />
                      </button>
                      <button onClick={(e) => removeField(idx, e)} className="p-2 text-inquest-ink-soft hover:text-inquest-caution hover:bg-red-50 rounded-full ml-2">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {fields.length === 0 && (
              <div className="text-center py-20 bg-inquest-surface border border-inquest-rule border-dashed rounded-3xl">
                <p className="text-lg font-serif text-inquest-ink">Your canvas is empty.</p>
                <p className="text-inquest-ink-mid mt-2">Select a field type from the right panel to begin.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Panel */}
        <div className="w-80 bg-inquest-surface border-l border-inquest-rule flex flex-col h-[calc(100vh-89px)] overflow-y-auto">
          {selectedField ? (
            <div className="p-6 space-y-6 animate-fade-in-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg text-inquest-ink flex items-center gap-2">
                  <Settings size={18} /> Field Configuration
                </h3>
                <button onClick={() => setSelectedFieldIndex(null)} className="text-sm text-inquest-accent hover:underline">
                  Done
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-inquest-ink-mid mb-1">Question Label</label>
                  <input
                    type="text"
                    value={selectedField.label}
                    onChange={(e) => updateSelectedField({ label: e.target.value })}
                    className="w-full bg-inquest-base border border-inquest-rule focus:border-inquest-accent rounded-xl px-3 py-2 text-inquest-ink focus:ring-1 focus:ring-inquest-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-inquest-ink-mid mb-1">Placeholder (Optional)</label>
                  <input
                    type="text"
                    value={selectedField.placeholder || ''}
                    onChange={(e) => updateSelectedField({ placeholder: e.target.value })}
                    className="w-full bg-inquest-base border border-inquest-rule focus:border-inquest-accent rounded-xl px-3 py-2 text-inquest-ink focus:ring-1 focus:ring-inquest-accent"
                  />
                </div>

                <div className="flex items-center justify-between bg-inquest-base p-3 rounded-xl border border-inquest-rule">
                  <label className="text-sm font-medium text-inquest-ink-mid">Required Response</label>
                  <input
                    type="checkbox"
                    checked={selectedField.required}
                    onChange={(e) => updateSelectedField({ required: e.target.checked })}
                    className="w-5 h-5 rounded border-inquest-rule text-inquest-accent focus:ring-inquest-accent"
                  />
                </div>

                {/* Options config for Select fields */}
                {(selectedField.type === 'single_select' || selectedField.type === 'multi_select') && (
                  <div className="pt-4 border-t border-inquest-rule">
                    <label className="block text-sm font-medium text-inquest-ink-mid mb-2">Options</label>
                    <div className="space-y-2">
                      {selectedField.validation?.options?.map((opt: string, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...(selectedField.validation?.options || [])];
                              newOpts[i] = e.target.value;
                              updateSelectedField({ validation: { ...selectedField.validation, options: newOpts } });
                            }}
                            className="flex-1 bg-inquest-base border border-inquest-rule rounded-lg px-3 py-1.5 text-sm"
                          />
                          <button
                            onClick={() => {
                              const newOpts = selectedField.validation.options.filter((_: any, idx: number) => idx !== i);
                              updateSelectedField({ validation: { ...selectedField.validation, options: newOpts } });
                            }}
                            className="p-1.5 text-inquest-ink-soft hover:text-inquest-caution"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const newOpts = [...(selectedField.validation?.options || []), `Option ${(selectedField.validation?.options?.length || 0) + 1}`];
                          updateSelectedField({ validation: { ...selectedField.validation, options: newOpts } });
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
          ) : (
            <div className="p-6">
              <h3 className="font-serif text-lg text-inquest-ink mb-4">Add Field</h3>
              <div className="grid grid-cols-2 gap-3">
                {FIELD_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.type}
                      onClick={() => addField(type.type)}
                      className="flex flex-col items-center justify-center gap-2 p-4 bg-inquest-base border border-inquest-rule rounded-2xl hover:border-inquest-accent hover:bg-inquest-depth/30 transition-colors text-inquest-ink group"
                    >
                      <Icon size={20} className="text-inquest-ink-soft group-hover:text-inquest-accent transition-colors" />
                      <span className="text-xs font-medium text-center">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
