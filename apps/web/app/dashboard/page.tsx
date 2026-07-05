'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '~/trpc/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, X, Globe, Lock, Copy, Eye, FileText, ChevronRight, Users, 
  ClipboardCopy, Edit3, Trash2, MoreVertical, Sparkles 
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '~/components/ui/dropdown-menu';

function FormSubmissionCount({ formId }: { formId: string }) {
  const { data } = trpc.submission.getSubmissionCount.useQuery({ formId });
  const count = data?.count ?? 0;
  return (
    <span className="flex items-center gap-1.5 text-xs text-inquest-ink-soft font-medium">
      <Users size={12} className="text-inquest-accent" />
      {count} {count === 1 ? 'response' : 'responses'}
    </span>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  
  const [showCompanion, setShowCompanion] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [formToDelete, setFormToDelete] = useState<{ id: string; title: string } | null>(null);

  const { data: forms, isLoading } = trpc.form.getMyForms.useQuery();

  const createForm = trpc.form.createForm.useMutation({
    onSuccess: (data) => {
      setNewTitle('');
      toast.success('Form created successfully');
      utils.form.getMyForms.invalidate();
      router.push(`/dashboard/forms/${data?.id}`);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create form');
    }
  });

  const deleteForm = trpc.form.deleteForm.useMutation({
    onSuccess: () => {
      toast.success('Form deleted successfully');
      utils.form.getMyForms.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete form');
    }
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    createForm.mutate({
      title: newTitle.trim(),
      fields: [{
        label: 'Untitled Question',
        type: 'text',
        required: false,
        orderIndex: 0
      }],
      isOpenForSubmission: false,
    });
  };

  const copyLink = (formId: string, secureCode: string | null, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/forms/${formId}`;
    navigator.clipboard.writeText(url);
    if (secureCode) {
      toast.success('Clean form link copied! (Passcode excluded for security)');
    } else {
      toast.success('Link copied to clipboard!');
    }
  };

  const copySecureCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    toast.success('Secure code copied!');
  };

  const handleDeleteClick = (formId: string, formTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFormToDelete({ id: formId, title: formTitle });
  };

  return (
    <div className="space-y-8 sm:space-y-12 pb-24">
      
      {/* Quick-Start Companion */}
      <AnimatePresence>
        {showCompanion && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-inquest-sage/10 border border-inquest-rule rounded-[2rem] p-5 sm:p-6 relative page-lines" style={{ '--line-height': '2rem' } as React.CSSProperties}>
              <button 
                onClick={() => setShowCompanion(false)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 text-inquest-ink-soft hover:text-inquest-ink transition-colors rounded-full hover:bg-inquest-depth/30 cursor-pointer"
                title="Dismiss Quick Guide"
              >
                <X size={16} />
              </button>
              
              <h2 className="text-lg sm:text-xl font-serif text-inquest-ink mb-4 font-bold">Quick-Start Companion</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { title: "1. Create", desc: "Type a title below to start a new form." },
                  { title: "2. Build", desc: "Add fields in the visual editor." },
                  { title: "3. Secure", desc: "Keep it public or private with a code." },
                  { title: "4. Listen", desc: "Share the link and gather insights." }
                ].map((step, i) => (
                  <div key={i} className="bg-inquest-surface p-3 sm:p-4 rounded-2xl warm-shadow border border-inquest-rule/50">
                    <div className="font-bold text-inquest-ink mb-1 text-xs uppercase tracking-wider">{step.title}</div>
                    <div className="text-xs text-inquest-ink-mid leading-relaxed">{step.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline Form Creator */}
      <section>
        <div className="flex items-center justify-between pl-2 pr-1 mb-3">
          <h2 className="text-xs sm:text-sm font-bold text-inquest-ink-soft uppercase tracking-widest">Create New Form</h2>
          {!showCompanion && (
            <button
              onClick={() => setShowCompanion(true)}
              className="text-xs font-semibold text-inquest-accent hover:underline flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Sparkles size={13} /> Show Quick Guide
            </button>
          )}
        </div>
        <form onSubmit={handleCreate} className="relative flex items-center">
          <input 
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="E.g., Customer Feedback Survey"
            disabled={createForm.isPending}
            className="w-full bg-inquest-surface border border-inquest-rule rounded-full py-3.5 sm:py-4 pl-5 sm:pl-6 pr-28 sm:pr-40 text-base sm:text-lg text-inquest-ink placeholder-inquest-ink-ghost focus:outline-none focus:ring-2 focus:ring-inquest-accent focus:border-transparent transition-all warm-shadow"
          />
          <button 
            type="submit"
            disabled={!newTitle.trim() || createForm.isPending}
            className="absolute right-1.5 sm:right-2 top-1.5 sm:top-2 bottom-1.5 sm:bottom-2 px-4 sm:px-6 bg-inquest-accent text-white rounded-full font-bold hover:bg-inquest-accent-soft transition-colors disabled:opacity-50 flex items-center gap-2 terracotta-glow text-sm sm:text-base cursor-pointer"
          >
            {createForm.isPending ? '...' : <><Plus size={18} /> <span>Create</span></>}
          </button>
        </form>
      </section>

      {/* Active Enquiries Feed */}
      <section>
        <div className="flex items-center justify-between mb-4 sm:mb-6 pl-2">
          <h2 className="text-xs sm:text-sm font-bold text-inquest-ink-soft uppercase tracking-widest">Active Forms</h2>
          <span className="bg-inquest-surface text-inquest-ink-mid text-xs px-3 py-1 rounded-full border border-inquest-rule font-bold">
            {forms?.length || 0} Total
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-inquest-surface/50 rounded-3xl animate-pulse border border-inquest-rule/30" />
            ))}
          </div>
        ) : forms?.length === 0 ? (
          <div className="text-center py-16 px-6 bg-inquest-surface rounded-[2.5rem] border border-inquest-rule warm-shadow relative overflow-hidden page-lines" style={{ '--line-height': '2rem' } as React.CSSProperties}>
            <div className="absolute top-0 left-0 w-full h-1 bg-inquest-accent" />
            <FileText className="mx-auto h-12 w-12 text-inquest-ink-ghost mb-4 animate-bounce" />
            <h3 className="text-2xl font-serif text-inquest-ink font-bold">Your journal is blank.</h3>
            <p className="text-inquest-ink-mid mt-1 text-sm max-w-sm mx-auto leading-relaxed">
              Every great enquiry starts with a single question. Use the field above to create your first page.
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            <AnimatePresence>
              {forms?.map((form, idx) => (
                <motion.div
                  key={form.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => router.push(`/dashboard/forms/${form.id}`)}
                  className="bg-inquest-surface rounded-3xl p-5 sm:p-6 flex flex-col gap-4 group cursor-pointer border border-inquest-rule/50 card-lift"
                >
                  {/* Top info row */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 sm:gap-3 mb-1.5 flex-wrap">
                        <h3 className="text-lg sm:text-xl font-serif text-inquest-ink truncate font-bold">
                          {form.title}
                        </h3>
                        {form.secureCode ? (
                          <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider bg-inquest-depth text-inquest-ink-soft px-2.5 py-0.5 rounded-full font-bold shrink-0">
                            <Lock size={10} /> Private
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider bg-inquest-accent/10 text-inquest-accent px-2.5 py-0.5 rounded-full font-bold shrink-0">
                            <Globe size={10} /> Public
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-inquest-ink-soft line-clamp-2">
                        {form.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <FormSubmissionCount formId={form.id} />
                      <div className="p-1 text-inquest-ink-soft group-hover:text-inquest-accent transition-colors">
                        <ChevronRight size={18} />
                      </div>
                    </div>
                  </div>

                  {/* Horizontal rule */}
                  <div className="h-px bg-inquest-rule/35" />

                  {/* Bottom action row */}
                  <div className="flex items-center justify-between">
                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-2 flex-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/forms/${form.id}`);
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-inquest-depth/50 hover:bg-inquest-depth text-xs font-bold text-inquest-ink rounded-xl transition-colors cursor-pointer border border-inquest-rule/30"
                      >
                        <Edit3 size={12} />
                        <span>Edit</span>
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`/forms/${form.id}`, '_blank');
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-inquest-depth/50 hover:bg-inquest-depth text-xs font-bold text-inquest-ink rounded-xl transition-colors cursor-pointer border border-inquest-rule/30"
                      >
                        <Eye size={12} />
                        <span>Preview</span>
                      </button>

                      <button
                        onClick={(e) => copyLink(form.id, form.secureCode, e)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-inquest-accent/10 hover:bg-inquest-accent/20 text-xs font-bold text-inquest-accent rounded-xl transition-colors cursor-pointer border border-inquest-accent/20"
                      >
                        <Copy size={12} />
                        <span>Copy Link</span>
                      </button>

                      {form.secureCode && (
                        <button
                          onClick={(e) => copySecureCode(form.secureCode!, e)}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-inquest-sage/15 hover:bg-inquest-sage/25 text-xs font-bold text-inquest-ink-mid rounded-xl transition-colors cursor-pointer border border-inquest-sage/25"
                        >
                          <ClipboardCopy size={12} />
                          <span>Copy Code</span>
                        </button>
                      )}
                    </div>

                    {/* Desktop Delete button */}
                    <div className="hidden md:block">
                      <button
                        onClick={(e) => handleDeleteClick(form.id, form.title, e)}
                        className="text-xs text-inquest-ink-ghost hover:text-inquest-caution font-bold hover:underline transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>

                    {/* Mobile Action Dropdown */}
                    <div className="flex md:hidden w-full items-center justify-between">
                      <span className="text-[11px] text-inquest-ink-ghost font-bold font-mono">
                        Created {form.createdAt ? new Date(form.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'N/A'}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 text-inquest-ink-soft hover:text-inquest-ink hover:bg-inquest-depth rounded-xl transition-colors cursor-pointer border border-inquest-rule"
                          >
                            <MoreVertical size={16} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 bg-inquest-surface border-inquest-rule rounded-xl">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/forms/${form.id}`); }} className="font-medium">
                            <Edit3 size={14} className="mr-2 text-inquest-ink-soft" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(`/forms/${form.id}`, '_blank'); }} className="font-medium">
                            <Eye size={14} className="mr-2 text-inquest-ink-soft" /> Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => copyLink(form.id, form.secureCode, e)} className="font-medium">
                            <Copy size={14} className="mr-2 text-inquest-ink-soft" /> Copy Link
                          </DropdownMenuItem>
                          {form.secureCode && (
                            <DropdownMenuItem onClick={(e) => copySecureCode(form.secureCode!, e)} className="font-medium">
                              <ClipboardCopy size={14} className="mr-2 text-inquest-ink-soft" /> Copy Code
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator className="bg-inquest-rule/35" />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={(e) => handleDeleteClick(form.id, form.title, e)}
                            className="text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950/20 font-semibold"
                          >
                            <Trash2 size={14} className="mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {formToDelete && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
            onClick={() => setFormToDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-inquest-surface rounded-3xl p-8 max-w-sm w-full warm-shadow text-center border border-inquest-rule/45"
            >
              <div className="w-14 h-14 bg-inquest-caution/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} className="text-inquest-caution" />
              </div>
              <h3 className="text-xl font-serif text-inquest-ink mb-2 font-bold">Delete this Enquiry?</h3>
              <p className="text-inquest-ink-mid text-sm mb-6">This will permanently remove &ldquo;{formToDelete.title}&rdquo; and all its responses.</p>
              <div className="flex gap-3">
                <button onClick={() => setFormToDelete(null)} className="flex-1 py-3 rounded-full border border-inquest-rule text-inquest-ink font-medium hover:bg-inquest-depth/30 transition-colors cursor-pointer">
                  Cancel
                </button>
                <button
                  onClick={() => {
                    deleteForm.mutate({ id: formToDelete.id });
                    setFormToDelete(null);
                  }}
                  disabled={deleteForm.isPending}
                  className="flex-1 py-3 rounded-full bg-inquest-caution text-white font-medium hover:opacity-90 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {deleteForm.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}