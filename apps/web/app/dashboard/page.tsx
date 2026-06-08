'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '~/trpc/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Globe, Lock, Copy, Eye, FileText, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

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
      isOpenForSubmission: false, // Default to false until published
    });
  };

  const copyLink = (formId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/forms/${formId}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  return (
    <div className="space-y-12 pb-24">
      
      {/* Quick-Start Companion */}
      <AnimatePresence>
        {showCompanion && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-inquest-sage/20 border border-inquest-sage/40 rounded-3xl p-6 relative">
              <button 
                onClick={() => setShowCompanion(false)}
                className="absolute top-4 right-4 p-2 text-inquest-ink-soft hover:text-inquest-ink transition-colors rounded-full hover:bg-inquest-depth/30"
              >
                <X size={16} />
              </button>
              
              <h2 className="text-xl font-serif text-inquest-ink mb-4 font-semibold">Quick-Start Companion</h2>
              <div className="grid md:grid-cols-4 gap-4">
                {[
                  { title: "1. Create", desc: "Type a thought-provoking title below to start a new enquiry." },
                  { title: "2. Build", desc: "Add text fields, scales, or choices in the visual editor." },
                  { title: "3. Secure", desc: "Keep it public, or make it private with a secure code." },
                  { title: "4. Listen", desc: "Share the link and gather insights from your audience." }
                ].map((step, i) => (
                  <div key={i} className="bg-inquest-surface p-4 rounded-2xl warm-shadow border border-inquest-rule/50">
                    <div className="font-medium text-inquest-ink mb-1">{step.title}</div>
                    <div className="text-sm text-inquest-ink-mid">{step.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline Form Creator */}
      <section>
        <h2 className="text-sm font-medium text-inquest-ink-soft mb-3 uppercase tracking-widest pl-2">Start New Enquiry</h2>
        <form onSubmit={handleCreate} className="relative flex items-center">
          <input 
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="E.g., What defines a life well lived?"
            disabled={createForm.isPending}
            className="w-full bg-inquest-surface border border-inquest-rule rounded-full py-4 pl-6 pr-40 text-lg text-inquest-ink placeholder-inquest-ink-ghost focus:outline-none focus:ring-2 focus:ring-inquest-accent focus:border-transparent transition-all warm-shadow"
          />
          <button 
            type="submit"
            disabled={!newTitle.trim() || createForm.isPending}
            className="absolute right-2 top-2 bottom-2 px-6 bg-inquest-accent text-white rounded-full font-medium hover:bg-inquest-accent-soft transition-colors disabled:opacity-50 disabled:hover:bg-inquest-accent flex items-center gap-2 terracotta-glow"
          >
            {createForm.isPending ? 'Creating...' : <><Plus size={18} /> Create</>}
          </button>
        </form>
      </section>

      {/* Active Enquiries Feed */}
      <section>
        <div className="flex items-center justify-between mb-6 pl-2">
          <h2 className="text-sm font-medium text-inquest-ink-soft uppercase tracking-widest">Active Enquiries</h2>
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
          <div className="text-center py-16 bg-inquest-surface rounded-3xl border border-inquest-rule border-dashed">
            <FileText className="mx-auto h-12 w-12 text-inquest-ink-ghost mb-4" />
            <h3 className="text-lg font-serif text-inquest-ink">No enquiries yet</h3>
            <p className="text-inquest-ink-mid mt-1">Create your first enquiry using the input above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {forms?.map((form, idx) => (
                <motion.div
                  key={form.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => router.push(`/dashboard/forms/${form.id}`)}
                  className="bg-inquest-surface rounded-3xl p-6 flex items-center justify-between group cursor-pointer border border-inquest-rule/50 card-lift"
                >
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-serif text-inquest-ink truncate font-semibold">
                        {form.title}
                      </h3>
                      {form.secureCode ? (
                        <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider bg-inquest-depth text-inquest-ink-soft px-2 py-0.5 rounded-full font-bold">
                          <Lock size={10} /> Private
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider bg-inquest-sage/30 text-inquest-ink-mid px-2 py-0.5 rounded-full font-bold">
                          <Globe size={10} /> Public
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-inquest-ink-mid truncate">
                      {form.description || 'No description provided'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`/forms/${form.id}`, '_blank');
                      }}
                      className="p-2 text-inquest-ink-soft hover:text-inquest-ink hover:bg-inquest-depth rounded-full transition-colors tooltip-trigger"
                      title="Preview Form"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={(e) => copyLink(form.id, e)}
                      className="p-2 text-inquest-ink-soft hover:text-inquest-ink hover:bg-inquest-depth rounded-full transition-colors"
                      title="Copy Link"
                    >
                      <Copy size={18} />
                    </button>
                    <div className="w-px h-8 bg-inquest-rule mx-2" />
                    <div className="p-2 text-inquest-ink-soft group-hover:text-inquest-accent transition-colors">
                      <ChevronRight size={20} />
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