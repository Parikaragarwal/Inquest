'use client';

import { useParams, useRouter } from 'next/navigation';
import { trpc } from '~/trpc/client';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Users, BarChart3, ChevronDown, ChevronUp, MessageSquare, Network } from 'lucide-react';
import { useState, useMemo } from 'react';
import Link from 'next/link';

export default function FormResponsesPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params?.formId as string;

  const { data: form, isLoading: isFormLoading } = trpc.form.getFormById.useQuery(
    { id: formId },
    { enabled: !!formId }
  );

  const { data: responses, isLoading: isResponsesLoading } = trpc.submission.getFormResponses.useQuery(
    { formId },
    { enabled: !!formId }
  );

  const { data: analytics, isLoading: isAnalyticsLoading } = trpc.submission.getBasicSubmissionAnalytics.useQuery(
    { formId },
    { enabled: !!formId }
  );

  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);
  const [crossTabX, setCrossTabX] = useState<string>('');
  const [crossTabY, setCrossTabY] = useState<string>('');

  const crossTabMatrix = useMemo(() => {
    if (!crossTabX || !crossTabY || !responses) return null;
    const matrix: Record<string, Record<string, number>> = {};
    const xValues = new Set<string>();
    const yValues = new Set<string>();

    responses.forEach(sub => {
      let xAns = sub.answers.find(a => a.formFieldId === crossTabX)?.answer || '(Empty)';
      let yAns = sub.answers.find(a => a.formFieldId === crossTabY)?.answer || '(Empty)';

      // If answer is a stringified JSON array, use the first element or stringify nicely
      try {
        const px = JSON.parse(xAns);
        if (Array.isArray(px)) xAns = px.join(', ') || '(Empty)';
      } catch { }
      try {
        const py = JSON.parse(yAns);
        if (Array.isArray(py)) yAns = py.join(', ') || '(Empty)';
      } catch { }

      xValues.add(xAns);
      yValues.add(yAns);

      let row = matrix[xAns];
      if (!row) {
        row = {};
        matrix[xAns] = row;
      }
      row[yAns] = (row[yAns] || 0) + 1;
    });

    return {
      matrix,
      xValues: Array.from(xValues).sort(),
      yValues: Array.from(yValues).sort(),
    };
  }, [crossTabX, crossTabY, responses]);

  const isLoading = isFormLoading || isResponsesLoading || isAnalyticsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-inquest-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="text-center py-20">
        <p className="text-lg text-inquest-ink-mid">Form not found.</p>
      </div>
    );
  }

  const submissionCount = analytics?.submissionCount ?? 0;

  return (
    <div className="space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <button onClick={() => router.push(`/dashboard/forms/${formId}`)} className="p-2 hover:bg-inquest-depth rounded-full transition-colors text-inquest-ink-soft hover:text-inquest-ink self-start">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-serif text-inquest-ink truncate">{form.title}</h1>
          <p className="text-inquest-ink-soft mt-1">Responses & Analytics</p>
        </div>
        <Link
          href={`/dashboard/forms/${formId}`}
          className="px-5 py-2.5 rounded-full border border-inquest-rule text-inquest-ink-mid hover:bg-inquest-depth/30 transition-colors font-medium text-sm self-start sm:self-center"
        >
          ← Back to Builder
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-inquest-surface p-6 rounded-3xl border border-inquest-rule/50 warm-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-inquest-accent/10 flex items-center justify-center">
              <Users size={20} className="text-inquest-accent" />
            </div>
            <span className="text-sm font-medium text-inquest-ink-soft uppercase tracking-wider">Responses</span>
          </div>
          <p className="text-4xl font-serif text-inquest-ink font-bold">{submissionCount}</p>
        </div>
        <div className="bg-inquest-surface p-6 rounded-3xl border border-inquest-rule/50 warm-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-inquest-sage/20 flex items-center justify-center">
              <BarChart3 size={20} className="text-inquest-sage" />
            </div>
            <span className="text-sm font-medium text-inquest-ink-soft uppercase tracking-wider">Questions</span>
          </div>
          <p className="text-4xl font-serif text-inquest-ink font-bold">{form.fields.length}</p>
        </div>
        <div className="bg-inquest-surface p-6 rounded-3xl border border-inquest-rule/50 warm-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-inquest-accent-pale flex items-center justify-center">
              <MessageSquare size={20} className="text-inquest-accent" />
            </div>
            <span className="text-sm font-medium text-inquest-ink-soft uppercase tracking-wider">Completion</span>
          </div>
          <p className="text-4xl font-serif text-inquest-ink font-bold">
            {submissionCount > 0 ? '100%' : '—'}
          </p>
        </div>
      </div>

      {/* Field Analytics */}
      {analytics && analytics.fieldAnalytics.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-inquest-ink-soft mb-4 uppercase tracking-widest pl-2">Answer Distribution</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analytics.fieldAnalytics.map((field) => {
              const entries = Object.entries(field.valueCounts).sort((a, b) => b[1] - a[1]);
              const maxCount = entries.length > 0 ? entries[0]![1] : 0;

              return (
                <div key={field.fieldId} className="bg-inquest-surface p-6 rounded-3xl border border-inquest-rule/50">
                  <h3 className="font-serif text-lg text-inquest-ink mb-1">{field.label}</h3>
                  <p className="text-xs text-inquest-ink-ghost mb-4 uppercase tracking-wider">{field.type} • {field.answerCount} answers</p>

                  {entries.length === 0 ? (
                    <p className="text-sm text-inquest-ink-ghost italic">No answers yet</p>
                  ) : field.type === 'boolean' || field.type === 'single_select' || field.type === 'multi_select' ? (
                    <div className="space-y-2">
                      {entries.map(([value, count]) => (
                        <div key={value}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-inquest-ink-mid truncate mr-2">{value}</span>
                            <span className="text-inquest-ink-soft font-medium shrink-0">{count}</span>
                          </div>
                          <div className="h-2 bg-inquest-depth rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(count / maxCount) * 100}%` }}
                              transition={{ duration: 0.6, ease: "easeOut" }}
                              className="h-full bg-inquest-accent rounded-full"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {entries.slice(0, 5).map(([value, count]) => (
                        <div key={value} className="flex items-start gap-2 text-sm">
                          <span className="text-inquest-ink-mid flex-1 break-words">&ldquo;{value}&rdquo;</span>
                          {count > 1 && <span className="text-inquest-ink-ghost text-xs shrink-0">×{count}</span>}
                        </div>
                      ))}
                      {entries.length > 5 && (
                        <p className="text-xs text-inquest-ink-ghost">+ {entries.length - 5} more unique answers</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Cross Tabulation */}
      {form.fields.length > 1 && responses && responses.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4 pl-2">
            <Network size={18} className="text-inquest-accent" />
            <h2 className="text-sm font-medium text-inquest-ink-soft uppercase tracking-widest">Cross-Tabulation Analysis</h2>
          </div>
          <div className="bg-inquest-surface p-6 rounded-3xl border border-inquest-rule/50 overflow-hidden">
            <p className="text-inquest-ink-mid text-sm mb-6">Select two questions to compare their answers against each other.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div>
                <label className="block text-xs font-semibold text-inquest-ink-soft uppercase tracking-wider mb-2">Question 1 (Rows)</label>
                <select
                  value={crossTabX}
                  onChange={(e) => setCrossTabX(e.target.value)}
                  className="w-full bg-inquest-base border border-inquest-rule rounded-xl px-4 py-3 text-inquest-ink text-sm focus:border-inquest-accent focus:ring-1 focus:ring-inquest-accent"
                >
                  <option value="">Select a question...</option>
                  {form.fields.map(f => (
                    <option key={f.id} value={f.id}>{f.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-inquest-ink-soft uppercase tracking-wider mb-2">Question 2 (Columns)</label>
                <select
                  value={crossTabY}
                  onChange={(e) => setCrossTabY(e.target.value)}
                  className="w-full bg-inquest-base border border-inquest-rule rounded-xl px-4 py-3 text-inquest-ink text-sm focus:border-inquest-accent focus:ring-1 focus:ring-inquest-accent"
                >
                  <option value="">Select a question...</option>
                  {form.fields.map(f => (
                    <option key={f.id} value={f.id}>{f.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {crossTabMatrix ? (
              <div className="overflow-x-auto rounded-2xl border border-inquest-rule/50">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-inquest-base border-b border-inquest-rule/50">
                    <tr>
                      <th className="p-4 font-medium text-inquest-ink-mid bg-inquest-base border-r border-inquest-rule/50 sticky left-0 z-10 shadow-[1px_0_0_0_var(--inquest-rule)]">Q1 \ Q2</th>
                      {crossTabMatrix.yValues.map(y => (
                        <th key={y} className="p-4 font-medium text-inquest-ink-mid text-center">{y}</th>
                      ))}
                      <th className="p-4 font-bold text-inquest-ink bg-inquest-depth/30 text-center">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-inquest-rule/50">
                    {crossTabMatrix.xValues.map(x => {
                      let rowTotal = 0;
                      return (
                        <tr key={x} className="hover:bg-inquest-depth/20 transition-colors">
                          <td className="p-4 text-inquest-ink font-medium bg-inquest-surface border-r border-inquest-rule/50 sticky left-0 z-10 shadow-[1px_0_0_0_var(--inquest-rule)]">
                            {x}
                          </td>
                          {crossTabMatrix.yValues.map(y => {
                            const val = crossTabMatrix.matrix[x]?.[y] || 0;
                            rowTotal += val;
                            return (
                              <td key={y} className="p-4 text-inquest-ink-soft text-center bg-inquest-base/30">
                                {val > 0 ? (
                                  <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full bg-inquest-accent/10 text-inquest-accent font-semibold">
                                    {val}
                                  </span>
                                ) : (
                                  <span className="text-inquest-ink-ghost">—</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="p-4 font-bold text-inquest-ink bg-inquest-depth/30 text-center">{rowTotal}</td>
                        </tr>
                      );
                    })}
                    <tr className="bg-inquest-depth/30 border-t-2 border-inquest-rule">
                      <td className="p-4 font-bold text-inquest-ink bg-inquest-depth sticky left-0 z-10 shadow-[1px_0_0_0_var(--inquest-rule)]">Total</td>
                      {crossTabMatrix.yValues.map(y => {
                        let colTotal = 0;
                        crossTabMatrix.xValues.forEach(x => {
                          colTotal += crossTabMatrix.matrix[x]?.[y] || 0;
                        });
                        return (
                          <td key={y} className="p-4 font-bold text-inquest-ink text-center">{colTotal}</td>
                        );
                      })}
                      <td className="p-4 font-bold text-inquest-accent text-center">{responses.length}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 bg-inquest-base rounded-2xl border border-inquest-rule border-dashed">
                <p className="text-inquest-ink-ghost italic text-sm">Select two questions above to see how they correlate.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Individual Responses */}
      <section>
        <h2 className="text-sm font-medium text-inquest-ink-soft mb-4 uppercase tracking-widest pl-2">Individual Submissions</h2>

        {!responses || responses.length === 0 ? (
          <div className="text-center py-16 bg-inquest-surface rounded-3xl border border-inquest-rule border-dashed">
            <Users className="mx-auto h-12 w-12 text-inquest-ink-ghost mb-4" />
            <h3 className="text-lg font-serif text-inquest-ink">No responses yet</h3>
            <p className="text-inquest-ink-mid mt-1">Share your form link to start collecting insights.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {responses.map((submission, idx) => {
                const isExpanded = expandedSubmission === submission.submitterId;
                return (
                  <motion.div
                    key={submission.submitterId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="bg-inquest-surface rounded-3xl border border-inquest-rule/50 overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedSubmission(isExpanded ? null : submission.submitterId)}
                      className="w-full flex items-center justify-between p-6 text-left hover:bg-inquest-depth/20 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-inquest-accent/10 flex items-center justify-center text-inquest-accent font-serif font-bold text-lg">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-medium text-inquest-ink">Respondent #{idx + 1}</p>
                          <p className="text-xs text-inquest-ink-ghost">{submission.answers.length} answers</p>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp size={20} className="text-inquest-ink-soft" /> : <ChevronDown size={20} className="text-inquest-ink-soft" />}
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-6 space-y-4 border-t border-inquest-rule/30 pt-4">
                            {submission.answers.map((answer) => (
                              <div key={answer.id}>
                                <p className="text-xs font-medium text-inquest-ink-soft uppercase tracking-wider mb-1">{answer.label}</p>
                                <p className="text-inquest-ink bg-inquest-base rounded-xl p-3 text-sm">{answer.answer}</p>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  );
}
