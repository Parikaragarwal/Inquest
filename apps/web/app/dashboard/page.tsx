'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '~/trpc/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Globe, Lock, Copy, Eye, FileText, ChevronRight, Users, ClipboardCopy } from 'lucide-react';
import { toast } from 'sonner';

function FormSubmissionCount({ formId }: { formId: string }) {
  const { data } = trpc.submission.getSubmissionCount.useQuery({ formId });
  const count = data?.count ?? 0;
  return (
    <span className="flex items-center gap-1.5 text-xs text-inquest-ink-soft">
      <Users size={12} />
      {count} {count === 1 ? 'response' : 'responses'}
    </span>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  
  const [showCompanion, setShowCompanion] = useState(true);
  const [newTitle, setNewTitle] = useState('');

  const { data: forms, isLoading } = trpc.form.getMyForms.useQuery();

  const createForm = trpc.form.createForm.useMutation({
    onSuccess: (data) => {
      setNewTitle('');
      toast.success('Enquiry created successfully');
      utils.form.getMyForms.invalidate();
      router.push(`/dashboard/forms/${data?.id}`);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create enquiry');
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
    let url = `${window.location.origin}/forms/${formId}`;
    if (secureCode) {
      url += `?code=${secureCode}`;
    }
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  const copySecureCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    toast.success('Secure code copied!');
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
            <div className="bg-inquest-sage/20 border border-inquest-sage/40 rounded-3xl p-5 sm:p-6 relative">
              <button 
                onClick={() => setShowCompanion(false)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 text-inquest-ink-soft hover:text-inquest-ink transition-colors rounded-full hover:bg-inquest-depth/30"
              >
                <X size={16} />
              </button>
              
              <h2 className="text-lg sm:text-xl font-serif text-inquest-ink mb-4 font-semibold">Quick-Start Companion</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { title: "1. Create", desc: "Type a title below to start a new enquiry." },
                  { title: "2. Build", desc: "Add fields in the visual editor." },
                  { title: "3. Secure", desc: "Keep it public or private with a code." },
                  { title: "4. Listen", desc: "Share the link and gather insights." }
                ].map((step, i) => (
                  <div key={i} className="bg-inquest-surface p-3 sm:p-4 rounded-2xl warm-shadow border border-inquest-rule/50">
                    <div className="font-medium text-inquest-ink mb-1 text-sm">{step.title}</div>
                    <div className="text-xs sm:text-sm text-inquest-ink-mid">{step.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline Form Creator */}
      <section>
        <h2 className="text-xs sm:text-sm font-medium text-inquest-ink-soft mb-3 uppercase tracking-widest pl-2">Start New Enquiry</h2>
        <form onSubmit={handleCreate} className="relative flex items-center">
          <input 
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="E.g., What defines a life well lived?"
            disabled={createForm.isPending}
            className="w-full bg-inquest-surface border border-inquest-rule rounded-full py-3.5 sm:py-4 pl-5 sm:pl-6 pr-28 sm:pr-40 text-base sm:text-lg text-inquest-ink placeholder-inquest-ink-ghost focus:outline-none focus:ring-2 focus:ring-inquest-accent focus:border-transparent transition-all warm-shadow"
          />
          <button 
            type="submit"
            disabled={!newTitle.trim() || createForm.isPending}
            className="absolute right-1.5 sm:right-2 top-1.5 sm:top-2 bottom-1.5 sm:bottom-2 px-4 sm:px-6 bg-inquest-accent text-white rounded-full font-medium hover:bg-inquest-accent-soft transition-colors disabled:opacity-50 flex items-center gap-2 terracotta-glow text-sm sm:text-base"
          >
            {createForm.isPending ? '...' : <><Plus size={18} /> <span className="hidden sm:inline">Create</span></>}
          </button>
        </form>
      </section>

      {/* Active Enquiries Feed */}
      <section>
        <div className="flex items-center justify-between mb-4 sm:mb-6 pl-2">
          <h2 className="text-xs sm:text-sm font-medium text-inquest-ink-soft uppercase tracking-widest">Active Enquiries</h2>
          <span className="bg-inquest-surface text-inquest-ink-mid text-xs px-3 py-1 rounded-full border border-inquest-rule font-medium">
            {forms?.length || 0} Total
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-inquest-surface/50 rounded-3xl animate-pulse border border-inquest-rule/30" />
            ))}
          </div>
        ) : forms?.length === 0 ? (
          <div className="text-center py-12 sm:py-16 bg-inquest-surface rounded-3xl border border-inquest-rule border-dashed">
            <FileText className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-inquest-ink-ghost mb-4" />
            <h3 className="text-lg font-serif text-inquest-ink">No enquiries yet</h3>
            <p className="text-inquest-ink-mid mt-1 text-sm">Create your first enquiry using the input above.</p>
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
                  className="bg-inquest-surface rounded-3xl p-5 sm:p-6 flex items-center justify-between group cursor-pointer border border-inquest-rule/50 card-lift"
                >
                  <div className="flex-1 min-w-0 pr-4 sm:pr-6">
                    <div className="flex items-center gap-2 sm:gap-3 mb-1.5 flex-wrap">
                      <h3 className="text-lg sm:text-xl font-serif text-inquest-ink truncate font-semibold">
                        {form.title}
                      </h3>
                      {form.secureCode ? (
                        <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider bg-inquest-depth text-inquest-ink-soft px-2 py-0.5 rounded-full font-bold shrink-0">
                          <Lock size={10} /> Private
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider bg-inquest-sage/30 text-inquest-ink-mid px-2 py-0.5 rounded-full font-bold shrink-0">
                          <Globe size={10} /> Public
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                      <p className="text-sm text-inquest-ink-mid truncate">
                        {form.description || 'No description'}
                      </p>
                      <FormSubmissionCount formId={form.id} />
                    </div>
                  </div>

                  <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                    {/* Copy Secure Code */}
                    {form.secureCode && (
                      <button
                        onClick={(e) => copySecureCode(form.secureCode!, e)}
                        className="p-2 text-inquest-ink-soft hover:text-inquest-ink hover:bg-inquest-depth rounded-full transition-colors"
                        title="Copy Secure Code"
                      >
                        <ClipboardCopy size={16} />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`/forms/${form.id}`, '_blank');
                      }}
                      className="p-2 text-inquest-ink-soft hover:text-inquest-ink hover:bg-inquest-depth rounded-full transition-colors hidden sm:block"
                      title="Preview Form"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={(e) => copyLink(form.id, form.secureCode, e)}
                      className="p-2 text-inquest-ink-soft hover:text-inquest-ink hover:bg-inquest-depth rounded-full transition-colors"
                      title="Copy Link"
                    >
                      <Copy size={16} />
                    </button>
                    <div className="hidden sm:block w-px h-6 bg-inquest-rule mx-1" />
                    <div className="p-2 text-inquest-ink-soft group-hover:text-inquest-accent transition-colors">
                      <ChevronRight size={18} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

    </div>
  );
}