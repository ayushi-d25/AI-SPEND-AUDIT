'use client';

import * as React from 'react';
import {
  Sparkles,
  TrendingDown,
  Layers,
  ShieldCheck,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  Calendar,
  Share2,
  Trash2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SAAS_PRICING } from '@/lib/auditEngine';

export default function SharedAuditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [audit, setAudit] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [aiSummary, setAiSummary] = React.useState<string>('');

  React.useEffect(() => {
    params.then((p) => {
      setId(p.id);
    });
  }, [params]);

  React.useEffect(() => {
    if (!id) return;

    const fetchAudit = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch anonymous audit details
        const response = await fetch(`/api/audit/${id}`);
        if (!response.ok) {
          throw new Error('This shared audit report does not exist or has expired.');
        }
        
        const data = await response.json();
        setAudit(data);

        // Fetch AI Summary based on math results
        const summaryResponse = await fetch('/api/summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          setAiSummary(summaryData.summary);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'An error occurred while fetching the audit.');
      } finally {
        setLoading(false);
      }
    };

    fetchAudit();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] text-[#F9FAFB] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-secondary text-sm">Retrieving Shared Advisory Report...</p>
        </div>
      </div>
    );
  }

  if (error || !audit) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] text-[#F9FAFB] flex items-center justify-center font-sans px-4">
        <Card className="max-w-md w-full border-error/30 bg-surface p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-error mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white">Report Not Found</h2>
          <p className="text-sm text-text-secondary mt-2">
            {error || 'The requested audit record is missing or deleted.'}
          </p>
          <Button
            variant="primary"
            className="mt-6 w-full h-11"
            onClick={() => (window.location.href = '/')}
          >
            Create New Audit
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-[#F9FAFB] font-sans pb-16">
      {/* Background flares */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[140px] pointer-events-none -z-10"></div>

      {/* Navigation Header */}
      <header className="border-b border-[#374151] bg-[#111827]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-primary to-secondary p-2 rounded-lg text-text-primary shadow-md">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-[#F9FAFB] to-[#9CA3AF] bg-clip-text text-transparent">
                Credex
              </span>
              <span className="text-primary text-xs font-semibold ml-1.5 uppercase tracking-wider">
                Shared Report
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-9"
            onClick={() => (window.location.href = '/')}
          >
            Create New Audit
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-8 animate-fadeIn">
        {/* Title */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border/50 pb-6">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-white to-text-secondary bg-clip-text text-transparent">
              AI Spend Audit Advisory
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Anonymous shareable report for team alignment. Created on {new Date(audit.createdAt).toLocaleDateString()}.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/25">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            Public Access Safe
          </span>
        </div>

        {/* Glowing Hero Section (Totals Card) */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-[#111827]/90 via-[#1F2937]/50 to-[#0A0F1E] p-6 sm:p-8 shadow-xl">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-secondary/10 rounded-full blur-[80px] pointer-events-none -z-10"></div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-success/15 text-success border border-success/20">
                <ShieldCheck className="w-4 h-4" /> Financial Integrity Verified
              </span>

              {audit.isOptimal ? (
                <div className="space-y-2">
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-white">This stack is fully optimal</h2>
                  <p className="text-text-secondary max-w-md">
                    No redundant licenses or forced waste were found in this configuration. The current licenses match the developer seats.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight text-white">
                    Identified waste of{' '}
                    <span className="bg-gradient-to-r from-success to-primary bg-clip-text text-transparent font-black">
                      ${audit.totalMonthlySavings.toLocaleString()}
                    </span>{' '}
                    per month.
                  </h2>
                  <p className="text-text-secondary max-w-md">
                    Actioning the seat count optimization and removing redundancy can save substantial capital without affecting productivity.
                  </p>
                </div>
              )}
            </div>

            {/* Savings stats */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
              <div className="bg-[#111827]/80 rounded-xl p-4 border border-border text-center shadow-sm">
                <p className="text-[10px] uppercase font-bold text-text-secondary tracking-wider flex items-center justify-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-success" /> Monthly Savings
                </p>
                <p className="text-3xl font-black text-success mt-2">
                  ${audit.totalMonthlySavings.toLocaleString()}
                </p>
              </div>
              <div className="bg-[#111827]/80 rounded-xl p-4 border border-border text-center shadow-sm">
                <p className="text-[10px] uppercase font-bold text-text-secondary tracking-wider flex items-center justify-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-primary" /> Annual Savings
                </p>
                <p className="text-3xl font-black text-primary mt-2">
                  ${audit.totalAnnualSavings.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          {!audit.isOptimal && (
            <div className="mt-8 border-t border-border/50 pt-6">
              <div className="flex items-center justify-between text-xs text-text-secondary font-medium mb-2">
                <span>
                  Optimized Stack Cost:{' '}
                  <strong className="text-white">
                    $
                    {(
                      audit.totalMonthlySpend - audit.totalMonthlySavings
                    ).toLocaleString()}
                    /mo
                  </strong>
                </span>
                <span>
                  Current Cost:{' '}
                  <strong className="text-text-secondary">
                    ${audit.totalMonthlySpend.toLocaleString()}/mo
                  </strong>
                </span>
              </div>
              <div className="w-full bg-[#111827] h-3 rounded-full overflow-hidden border border-border flex">
                <div
                  className="bg-gradient-to-r from-primary to-success h-full rounded-full"
                  style={{
                    width: `${Math.max(
                      10,
                      ((audit.totalMonthlySpend - audit.totalMonthlySavings) /
                        audit.totalMonthlySpend) *
                        100
                    )}%`,
                  }}
                ></div>
                <div className="bg-error/30 h-full flex-1 animate-pulse"></div>
              </div>
            </div>
          )}
        </div>

        {/* CTA Consulting Banner (If savings > 500) */}
        {!audit.isOptimal && audit.totalMonthlySavings >= 500 && (
          <div className="bg-gradient-to-r from-secondary/30 via-primary/30 to-success/15 border-2 border-secondary/30 rounded-2xl p-6 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-1/4 w-[180px] h-[180px] bg-secondary/20 rounded-full blur-2xl pointer-events-none"></div>
            <div className="space-y-2 text-center md:text-left relative z-10 max-w-xl">
              <span className="px-2 py-0.5 rounded bg-secondary text-white text-[10px] font-bold uppercase tracking-wider">
                Volume Credit Available
              </span>
              <h3 className="text-xl font-bold text-white">
                Apply for 20% Credex Discounted Infrastructure Credits
              </h3>
              <p className="text-xs text-text-secondary">
                This organization qualify for flat bulk-tier credits. Book a 15-minute consultation to implement these optimizations automatically.
              </p>
            </div>
            <a
              href="https://calendly.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-secondary px-6 text-sm font-semibold text-white hover:bg-secondary/90 shadow-md shadow-secondary/20 transition-all shrink-0 active:scale-95 z-10 animate-bounce"
            >
              Book Credex Consultation
            </a>
          </div>
        )}

        {/* Audit Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-6">
            {/* AI Summary */}
            {aiSummary && (
              <Card className="border-border bg-surface shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-text-primary">
                    <Sparkles className="w-4 h-4 text-secondary" /> Executive Summary
                  </CardTitle>
                  <CardDescription>Advisory assessment of the analyzed AI subscription profiles.</CardDescription>
                </CardHeader>
                <CardContent className="prose prose-invert prose-sm max-w-none text-text-secondary leading-relaxed">
                  {aiSummary.split('\n\n').map((para, i) => (
                    <p key={i} className="mb-4 text-sm font-medium last:mb-0">
                      {para}
                    </p>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Breakdown detail */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-text-primary flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" /> Stack Breakdown
              </h3>

              <div className="space-y-4">
                {audit.tools.map((tool: any, idx: number) => {
                  const staticPrice = SAAS_PRICING[tool.name]?.[tool.tier] ?? 0;
                  const hasSavings = tool.monthlySavings > 0;

                  return (
                    <Card
                      key={idx}
                      className="border-border bg-surface overflow-hidden shadow-sm"
                    >
                      <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40">
                        <div>
                          <div className="flex items-center gap-2.5">
                            <h4 className="font-bold text-base text-text-primary">
                              {tool.name}
                            </h4>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[#1F2937] text-text-secondary border border-border">
                              {tool.tier}
                            </span>

                            {tool.isRedundant && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-error/15 text-error border border-error/25">
                                Redundant
                              </span>
                            )}
                            {hasSavings && !tool.isRedundant && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-success/15 text-success border border-success/25">
                                Action Needed
                              </span>
                            )}
                            {!hasSavings && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-primary/15 text-primary border border-primary/25">
                                Optimal
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-text-secondary mt-1">
                            {tool.seats} developer seat(s) billing
                            {staticPrice > 0 ? ` @ $${staticPrice}/mo each` : ''}.
                          </p>
                        </div>

                        {/* Cost badges */}
                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-left sm:text-right">
                            <p className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">
                              Reported Cost
                            </p>
                            <p className="text-lg font-bold text-text-secondary">
                              ${tool.currentMonthlySpend.toLocaleString()}/mo
                            </p>
                          </div>
                          {hasSavings && (
                            <div className="text-left sm:text-right">
                              <p className="text-[10px] uppercase font-bold text-success tracking-wider">
                                Optimized Cost
                              </p>
                              <p className="text-lg font-extrabold text-success">
                                ${tool.optimizedMonthlySpend.toLocaleString()}/mo
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Warnings and messages */}
                      {(tool.wasteReason || tool.recommendation) && (
                        <div className="bg-[#111827]/40 p-4 space-y-2 border-t border-border/20 text-xs">
                          {tool.wasteReason && (
                            <div className="flex items-start gap-2 text-text-secondary">
                              <AlertTriangle className="w-4 h-4 text-error shrink-0 mt-0.5" />
                              <p>
                                <strong className="text-[#EF4444] font-semibold">
                                  Optimization Gap:
                                </strong>{' '}
                                {tool.wasteReason}
                              </p>
                            </div>
                          )}
                          {tool.recommendation && (
                            <div className="flex items-start gap-2 text-text-secondary">
                              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                              <p>
                                <strong className="text-primary font-semibold">
                                  Action Required:
                                </strong>{' '}
                                {tool.recommendation}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Advisory Checklist */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-border bg-surface shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" /> Optimization Guide
                </CardTitle>
                <CardDescription>
                  List of corrections required to capture savings.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {audit.savingsDetails.map((detail: string, idx: number) => {
                    const isRedundant = detail.includes('[License Redundancy]');
                    const isSeat = detail.includes('[Seat Optimization]');
                    const isBulk = detail.includes('[Credex Credits]');

                    return (
                      <div
                        key={idx}
                        className="p-4 flex gap-3 text-xs leading-relaxed font-medium"
                      >
                        <span className="mt-0.5 shrink-0">
                          {isRedundant && <Trash2 className="w-4 h-4 text-error" />}
                          {isSeat && <TrendingDown className="w-4 h-4 text-success" />}
                          {isBulk && <Sparkles className="w-4 h-4 text-secondary" />}
                          {!isRedundant && !isSeat && !isBulk && (
                            <Info className="w-4 h-4 text-primary" />
                          )}
                        </span>
                        <p className="text-text-secondary">
                          <strong className="text-text-primary">
                            {isRedundant && 'Redundancy Alert: '}
                            {isSeat && 'Seat Correction: '}
                            {isBulk && 'Credits Available: '}
                          </strong>
                          {detail.replace(/\[.*?\]\s*/, '')}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
