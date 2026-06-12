'use client';

import { useParams, useRouter } from 'next/navigation';
import { trpc } from '~/trpc/client';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Users, BarChart3, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const CHART_COLORS = ['#f43f5e', '#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#14b8a6', '#6366f1'];

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

      {/* Field Analytics powered by Recharts */}
      {analytics && analytics.fieldAnalytics.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-inquest-ink-soft mb-4 uppercase tracking-widest pl-2">Data Insights</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {analytics.fieldAnalytics.map((field) => {
              const entries = Object.entries(field.valueCounts).sort((a, b) => b[1] - a[1]);
              const chartData = entries.map(([name, value]) => ({ name, value }));

              return (
                <div key={field.fieldId} className="bg-inquest-surface p-6 rounded-3xl border border-inquest-rule/50 warm-shadow">
                  <div className="mb-6">
                    <h3 className="font-serif text-xl text-inquest-ink mb-1">{field.label}</h3>
                    <p className="text-xs text-inquest-ink-ghost uppercase tracking-wider">{field.type.replace('_', ' ')} • {field.answerCount} answers</p>
                  </div>
                  
                  {entries.length === 0 ? (
                    <div className="h-40 flex items-center justify-center border border-dashed border-inquest-rule rounded-2xl">
                      <p className="text-sm text-inquest-ink-ghost italic">No answers yet</p>
                    </div>
                  ) : field.type === 'boolean' || field.type === 'single_select' ? (
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      <div className="w-full sm:w-1/2 h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={chartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={75}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip 
                              formatter={(value: number) => [`${value} responses`, 'Count']}
                              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="w-full sm:w-1/2 space-y-3 max-h-48 overflow-y-auto pr-2">
                        {chartData.map((entry, index) => (
                          <div key={entry.name} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                              <span className="text-inquest-ink-mid truncate" title={entry.name}>{entry.name}</span>
                            </div>
                            <span className="text-inquest-ink font-semibold ml-2">{entry.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : field.type === 'multi_select' || field.type === 'number' ? (
                    <div className="h-64 w-full pt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                          <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 12, fill: '#888' }} 
                            axisLine={false} 
                            tickLine={false} 
                            tickFormatter={(value) => value.length > 10 ? `${value.substring(0, 10)}...` : value}
                          />
                          <YAxis 
                            tick={{ fontSize: 12, fill: '#888' }} 
                            axisLine={false} 
                            tickLine={false} 
                            allowDecimals={false} 
                          />
                          <RechartsTooltip 
                            cursor={{ fill: 'rgba(0,0,0,0.03)' }} 
                            formatter={(value: number) => [`${value} responses`, 'Count']}
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                          />
                          <Bar dataKey="value" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={50}>
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                      {entries.slice(0, 10).map(([value, count]) => (
                        <div key={value} className="bg-inquest-base p-4 rounded-2xl flex items-start justify-between gap-4 border border-inquest-rule/30">
                          <span className="text-inquest-ink text-sm break-words leading-relaxed">&ldquo;{value}&rdquo;</span>
                          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-inquest-depth text-inquest-ink-soft text-xs font-semibold shrink-0">
                            ×{count}
                          </span>
                        </div>
                      ))}
                      {entries.length > 10 && (
                        <div className="text-center pt-2">
                          <span className="text-xs font-medium text-inquest-ink-ghost bg-inquest-base px-3 py-1 rounded-full border border-inquest-rule/30">
                            + {entries.length - 10} more unique answers
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
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
