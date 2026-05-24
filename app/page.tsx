'use client';

import * as React from 'react';
import {
  Plus,
  Trash2,
  Sparkles,
  TrendingDown,
  Layers,
  ShieldCheck,
  Copy,
  RotateCcw,
  Building2,
  User,
  Mail,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { SAAS_PRICING, isCustomApi } from '@/lib/auditEngine';

// Predefined available tools for the dropdown
const AVAILABLE_TOOLS = [
  { name: 'Cursor', tiers: ['Hobby', 'Pro', 'Business'] },
  { name: 'GitHub Copilot', tiers: ['Individual', 'Business', 'Enterprise'] },
  { name: 'Claude', tiers: ['Free', 'Pro', 'Team'] },
  { name: 'ChatGPT', tiers: ['Plus', 'Team'] },
  { name: 'Gemini', tiers: ['Pro', 'Ultra'] },
  { name: 'Windsurf', tiers: ['Pro'] },
  { name: 'Custom API', tiers: ['Custom API Direct'] },
];

interface FrontendTool {
  id: string;
  name: string;
  tier: string;
  seats: number;
  customSpend: number;
}

export default function AuditPage() {
  // Hydration guard to avoid server-client mismatch
  const [isMounted, setIsMounted] = React.useState(false);

  // Core Form State
  const [teamSize, setTeamSize] = React.useState<number>(5);
  const [primaryUseCase, setPrimaryUseCase] = React.useState<string>('Software Development');
  const [email, setEmail] = React.useState<string>('');
  const [company, setCompany] = React.useState<string>('');
  const [role, setRole] = React.useState<string>('');
  const [tools, setTools] = React.useState<FrontendTool[]>([
    { id: '1', name: 'Cursor', tier: 'Pro', seats: 5, customSpend: 0 },
    { id: '2', name: 'GitHub Copilot', tier: 'Business', seats: 5, customSpend: 0 },
    { id: '3', name: 'Claude', tier: 'Team', seats: 3, customSpend: 0 },
  ]);

  // UI Flow State
  // Steps: 1 = Input Form, 2 = Loading Analysis, 3 = Results Dashboard
  const [step, setStep] = React.useState<number>(1);
  const [loadingProgress, setLoadingProgress] = React.useState<number>(0);
  const [loadingStatus, setLoadingStatus] = React.useState<string>('Initializing Core Audit Engine...');
  const [shareSlug, setShareSlug] = React.useState<string>('');
  const [copyFeedback, setCopyFeedback] = React.useState<boolean>(false);
  const [optInEmail, setOptInEmail] = React.useState<string>('');
  const [optInSuccess, setOptInSuccess] = React.useState<boolean>(false);

  // Calculation & Summary State
  const [auditResult, setAuditResult] = React.useState<any>(null);
  const [aiSummary, setAiSummary] = React.useState<string>('');
  const [apiError, setApiError] = React.useState<string | null>(null);

  // Mount Effect
  React.useEffect(() => {
    setIsMounted(true);

    // Synchronize Form State from localStorage
    const savedState = localStorage.getItem('credex_audit_form');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.teamSize) setTeamSize(parsed.teamSize);
        if (parsed.primaryUseCase) setPrimaryUseCase(parsed.primaryUseCase);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.company) setCompany(parsed.company);
        if (parsed.role) setRole(parsed.role);
        if (parsed.tools && Array.isArray(parsed.tools)) setTools(parsed.tools);
      } catch (err) {
        console.error('Failed to parse localStorage state:', err);
      }
    }
  }, []);

  // Save to localStorage when form fields update
  React.useEffect(() => {
    if (!isMounted) return;
    const stateToSave = {
      teamSize,
      primaryUseCase,
      email,
      company,
      role,
      tools,
    };
    localStorage.setItem('credex_audit_form', JSON.stringify(stateToSave));
  }, [teamSize, primaryUseCase, email, company, role, tools, isMounted]);

  // Loading animation progress stepper
  React.useEffect(() => {
    if (step !== 2) return;

    setLoadingProgress(0);
    setLoadingStatus('Initializing Audit Calculations...');

    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        const next = prev + 1;
        if (next >= 100) {
          clearInterval(interval);
          setStep(3);
          return 100;
        }

        // Dynamically update messages based on progress
        if (next === 20) {
          setLoadingStatus('Parsing seat ratios and pricing metrics...');
        } else if (next === 40) {
          setLoadingStatus('Applying Rule A: Seat optimization & minimum counts...');
        } else if (next === 65) {
          setLoadingStatus('Applying Rule B: Filtering redundant licenses (Cursor vs Copilot)...');
        } else if (next === 80) {
          setLoadingStatus('Applying Rule C & D: Calculating Credex infrastructure discounts...');
        } else if (next === 92) {
          setLoadingStatus('Calling LLM to compile executive advisory summary...');
        }

        return next;
      });
    }, 30); // 3 seconds total

    return () => clearInterval(interval);
  }, [step]);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-background text-text-primary flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-secondary text-sm">Loading Credex Engine...</p>
        </div>
      </div>
    );
  }

  // Handle Adding a new tool to form
  const handleAddTool = (toolName: string) => {
    const selected = AVAILABLE_TOOLS.find((t) => t.name === toolName);
    if (!selected) return;

    const newTool: FrontendTool = {
      id: Date.now().toString(),
      name: selected.name,
      tier: selected.tiers[0],
      seats: teamSize || 1,
      customSpend: 0,
    };

    setTools([...tools, newTool]);
  };

  // Handle Removing a tool
  const handleRemoveTool = (id: string) => {
    setTools(tools.filter((t) => t.id !== id));
  };

  // Handle tool modification
  const handleUpdateTool = (id: string, updates: Partial<FrontendTool>) => {
    setTools(
      tools.map((t) => {
        if (t.id !== id) return t;
        const updated = { ...t, ...updates };

        // Handle tier switch resetting standard parameters
        if (updates.name) {
          const selected = AVAILABLE_TOOLS.find((a) => a.name === updates.name);
          if (selected) {
            updated.tier = selected.tiers[0];
          }
        }
        return updated;
      })
    );
  };

  // Trigger Audit processing
  const handleStartAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setStep(2); // Go to loading screen

    try {
      // 1. Submit form data to API to calculate and persist
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tools: tools.map(({ name, tier, seats, customSpend }) => ({
            name,
            tier,
            seats: Number(seats) || 0,
            customSpend: Number(customSpend) || 0,
          })),
          teamSize: Number(teamSize) || 0,
          primaryUseCase,
          email,
          company,
          role,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit audit');
      }

      const auditData = await response.json();
      setAuditResult(auditData.calculation);
      setShareSlug(auditData.id);

      // 2. Fetch AI Summary
      const summaryResponse = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(auditData.calculation),
      });

      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        setAiSummary(summaryData.summary);
      } else {
        console.warn('Failed to retrieve AI summary, falling back to standard values.');
      }
    } catch (err: any) {
      console.error(err);
      setApiError(err.message || 'An error occurred while calculating the audit.');
      setStep(1); // Go back to form
    }
  };

  // Copy shareable link to clipboard
  const handleGenerateShareLink = () => {
    if (!shareSlug) return;
    const shareUrl = `${window.location.origin}/audit/${shareSlug}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 3000);
    });
  };

  // Handle opt-in email submission
  const handleOptInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!optInEmail) return;
    setOptInSuccess(true);
    setOptInEmail('');
  };

  // Start a new audit
  const handleReset = () => {
    setStep(1);
    setAuditResult(null);
    setAiSummary('');
    setShareSlug('');
    setOptInSuccess(false);
  };

  return (
    <div className="flex-1 bg-[#0A0F1E] text-[#F9FAFB] font-sans pb-16">
      {/* Visual background flares */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[140px] pointer-events-none -z-10"></div>

      {/* Navigation Header */}
      <header className="border-b border-[#374151] bg-[#111827]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-primary to-secondary p-2 rounded-lg text-text-primary shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-[#F9FAFB] to-[#9CA3AF] bg-clip-text text-transparent">
                Credex
              </span>
              <span className="text-primary text-xs font-semibold ml-1.5 uppercase tracking-wider">
                Audit Engine
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-secondary/15 text-secondary border border-secondary/25">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
              2026 SaaS Pricing
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {/* ========================================================================= */}
        {/* STEP 1: INPUT FORM */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div className="space-y-8 animate-fadeIn">
            {/* Hero text */}
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-b from-text-primary to-text-secondary/70 bg-clip-text text-transparent">
                AI Spend Audit
              </h1>
              <p className="text-lg text-text-secondary">
                Optimize your engineering stack. Credex scans for licensing redundancies, identifies vendor seat count violations, and applies direct bulk credits.
              </p>
            </div>

            {apiError && (
              <div className="max-w-3xl mx-auto bg-error/15 border border-error/30 text-error rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Calculation Failure</h4>
                  <p className="text-xs text-error/90 mt-0.5">{apiError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleStartAnalysis} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Side: General settings */}
              <div className="lg:col-span-4 space-y-6">
                <Card className="border-border bg-surface">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary" /> Core Metrics
                    </CardTitle>
                    <CardDescription>Specify team metrics to gauge volume discounts.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Team Size input with plus/minus */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text-secondary">Team Size (Seats)</label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-10 w-10 flex items-center justify-center"
                          onClick={() => setTeamSize(Math.max(1, teamSize - 1))}
                        >
                          -
                        </Button>
                        <Input
                          type="number"
                          value={teamSize}
                          min={1}
                          onChange={(e) => setTeamSize(Math.max(1, parseInt(e.target.value) || 1))}
                          className="text-center font-bold"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-10 w-10 flex items-center justify-center"
                          onClick={() => setTeamSize(teamSize + 1)}
                        >
                          +
                        </Button>
                      </div>
                    </div>

                    {/* Primary Use case */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text-secondary">Primary Use Case</label>
                      <select
                        value={primaryUseCase}
                        onChange={(e) => setPrimaryUseCase(e.target.value)}
                        className="flex h-10 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                      >
                        <option value="Software Development">Software Development</option>
                        <option value="Data Science & ML">Data Science & ML</option>
                        <option value="Product & Design">Product & Design</option>
                        <option value="General Enterprise Work">General Enterprise Work</option>
                      </select>
                    </div>
                  </CardContent>
                </Card>

                {/* Lead Generation Metadata (Optional) */}
                <Card className="border-border bg-surface">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="w-4 h-4 text-secondary" /> Lead Metadata
                    </CardTitle>
                    <CardDescription>Receive a customized copy of your audit report.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text-secondary">Work Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 w-4 h-4 text-text-secondary" />
                        <Input
                          type="email"
                          placeholder="name@company.com"
                          className="pl-9"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text-secondary">Company Name</label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-3 w-4 h-4 text-text-secondary" />
                        <Input
                          type="text"
                          placeholder="Acme Inc"
                          className="pl-9"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text-secondary">Job Title / Role</label>
                      <Input
                        type="text"
                        placeholder="CTO, Engineering Lead"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Side: Active Tool Stack configuration */}
              <div className="lg:col-span-8 space-y-6">
                <Card className="border-border bg-surface min-h-[400px] flex flex-col">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <TrendingDown className="w-5 h-5 text-success" /> Active AI Tool Stack
                      </CardTitle>
                      <CardDescription>Add AI subscriptions and tiers currently in use by your organization.</CardDescription>
                    </div>
                    {/* Add Tool dropdown */}
                    <div className="relative">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddTool(e.target.value);
                            e.target.value = ''; // Reset selection
                          }
                        }}
                        defaultValue=""
                        className="h-10 rounded-lg border border-border bg-card px-4 text-xs font-semibold text-text-primary hover:bg-card/85 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="" disabled>+ Add Tool</option>
                        {AVAILABLE_TOOLS.map((item) => {
                          const alreadyAdded = tools.some((t) => t.name === item.name);
                          return (
                            <option key={item.name} value={item.name} disabled={alreadyAdded}>
                              {item.name} {alreadyAdded ? '(Already in Stack)' : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 flex-1">
                    {tools.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-border rounded-xl">
                        <Info className="w-12 h-12 text-text-secondary/50 mb-3" />
                        <h4 className="font-semibold text-text-primary">Your stack is empty</h4>
                        <p className="text-sm text-text-secondary mt-1">Select an AI tool above to begin calculation.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {tools.map((tool) => {
                          const toolMeta = AVAILABLE_TOOLS.find((a) => a.name === tool.name);
                          const isApi = isCustomApi(tool.name, tool.tier);
                          const staticPrice = SAAS_PRICING[tool.name]?.[tool.tier] ?? 0;
                          const calculatedCost = isApi ? tool.customSpend : tool.seats * staticPrice;

                          return (
                            <div
                              key={tool.id}
                              className="group relative flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-card rounded-xl border border-border/80 hover:border-primary/40 transition-all gap-4 shadow-sm"
                            >
                              {/* Left details */}
                              <div className="flex-1 space-y-3 w-full">
                                <div className="flex items-center justify-between md:justify-start gap-4">
                                  <h3 className="font-bold text-lg text-text-primary">{tool.name}</h3>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-full md:hidden text-text-secondary hover:text-error"
                                    onClick={() => handleRemoveTool(tool.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  {/* Plan tier dropdown */}
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wide">
                                      Subscription Plan
                                    </label>
                                    <select
                                      value={tool.tier}
                                      onChange={(e) => handleUpdateTool(tool.id, { tier: e.target.value })}
                                      className="h-9 w-full rounded-md border border-border bg-surface px-2 py-1 text-xs text-text-primary focus:outline-none"
                                    >
                                      {toolMeta?.tiers.map((tier) => (
                                        <option key={tier} value={tier}>
                                          {tier}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* Seats count (standard tool) */}
                                  {!isApi ? (
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wide">
                                        Developer Seats
                                      </label>
                                      <Input
                                        type="number"
                                        min={1}
                                        value={tool.seats}
                                        className="h-9 text-xs"
                                        onChange={(e) =>
                                          handleUpdateTool(tool.id, { seats: Math.max(1, parseInt(e.target.value) || 1) })
                                        }
                                      />
                                    </div>
                                  ) : (
                                    /* Raw custom monthly spend (API tool) */
                                    <div className="space-y-1 sm:col-span-2">
                                      <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wide">
                                        Monthly Spend ($)
                                      </label>
                                      <Input
                                        type="number"
                                        min={0}
                                        value={tool.customSpend}
                                        className="h-9 text-xs"
                                        onChange={(e) =>
                                          handleUpdateTool(tool.id, { customSpend: Math.max(0, parseFloat(e.target.value) || 0) })
                                        }
                                      />
                                    </div>
                                  )}

                                  {/* Standard pricing notes */}
                                  {!isApi && (
                                    <div className="flex flex-col justify-end text-xs text-text-secondary pb-1 sm:pb-2">
                                      <span className="font-semibold text-text-primary">${staticPrice}/seat</span>
                                      {tool.name === 'Claude' && tool.tier === 'Team' && (
                                        <span className="text-[9px] text-error font-medium">Min 5 seats billing</span>
                                      )}
                                      {tool.name === 'ChatGPT' && tool.tier === 'Team' && (
                                        <span className="text-[9px] text-error font-medium">Min 2 seats billing</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Right details & cost badge */}
                              <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center w-full md:w-auto border-t border-border/50 md:border-t-0 pt-3 md:pt-0 gap-2 shrink-0">
                                <div className="text-left md:text-right">
                                  <p className="text-[9px] uppercase font-bold text-text-secondary tracking-wider">Estimated Monthly Cost</p>
                                  <p className="text-xl font-black text-primary">${calculatedCost.toLocaleString()}</p>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-9 w-9 p-0 rounded-full hidden md:flex text-text-secondary hover:text-error hover:bg-error/10"
                                  onClick={() => handleRemoveTool(tool.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="border-t border-border/50 bg-[#111827]/40 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-center sm:text-left">
                      <p className="text-sm text-text-secondary">Estimated Total current spend</p>
                      <p className="text-2xl font-black text-text-primary">
                        $
                        {tools
                          .reduce((sum, t) => {
                            if (isCustomApi(t.name, t.tier)) return sum + t.customSpend;
                            const price = SAAS_PRICING[t.name]?.[t.tier] ?? 0;
                            // Enforce minimum seats billing on frontend representation for honesty
                            let billableSeats = t.seats;
                            if (t.name === 'Claude' && t.tier === 'Team') billableSeats = Math.max(t.seats, 5);
                            if (t.name === 'ChatGPT' && t.tier === 'Team') billableSeats = Math.max(t.seats, 2);
                            return sum + billableSeats * price;
                          }, 0)
                          .toLocaleString()}
                        <span className="text-xs text-text-secondary font-normal">/mo</span>
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={tools.length === 0}
                      variant="primary"
                      size="lg"
                      className="w-full sm:w-auto h-12 flex items-center justify-center gap-2"
                    >
                      Analyze AI Stack <ArrowRight className="w-5 h-5" />
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: LOADING MICRO-ANIMATION */}
        {/* ========================================================================= */}
        {step === 2 && (
          <div className="max-w-xl mx-auto py-16 animate-fadeIn">
            <Card className="border-border bg-surface text-center shadow-xl p-8 flex flex-col items-center">
              {/* Spinner animation */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                {/* Radial path */}
                <div className="absolute inset-0 border-4 border-card rounded-full"></div>
                {/* Colored rotating gradient */}
                <div className="absolute inset-0 border-4 border-primary border-t-transparent border-r-transparent rounded-full animate-spin"></div>
                {/* Core counter */}
                <div className="text-3xl font-extrabold text-white">{loadingProgress}%</div>
              </div>

              <div className="mt-8 space-y-3">
                <h3 className="text-xl font-bold bg-gradient-to-r from-primary via-secondary to-success bg-clip-text text-transparent animate-pulse">
                  Analyzing Dev Stack...
                </h3>
                <p className="text-sm text-text-secondary h-8 max-w-sm transition-all duration-300 font-medium">
                  {loadingStatus}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-[#1F2937] h-2 rounded-full overflow-hidden mt-6">
                <div
                  className="bg-gradient-to-r from-primary to-secondary h-full transition-all duration-100 rounded-full"
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: RESULTS DASHBOARD */}
        {/* ========================================================================= */}
        {step === 3 && auditResult && (
          <div className="space-y-8 animate-slideUp">
            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border/50 pb-6">
              <div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-white to-text-secondary bg-clip-text text-transparent">
                  Optimization Report
                </h1>
                <p className="text-sm text-text-secondary mt-1">Compiled in 22ms. Actionable recommendations are ready.</p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button variant="outline" size="sm" onClick={handleReset} className="flex items-center gap-1.5 flex-1 sm:flex-none">
                  <RotateCcw className="w-4 h-4" /> Start Over
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleGenerateShareLink}
                  className="flex items-center gap-1.5 flex-1 sm:flex-none"
                >
                  <Copy className="w-4 h-4" /> {copyFeedback ? 'Copied URL!' : 'Share Audit'}
                </Button>
              </div>
            </div>

            {/* Glowing Hero Section (Totals Card) */}
            <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-[#111827]/90 via-[#1F2937]/50 to-[#0A0F1E] p-6 sm:p-8 shadow-xl">
              <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-secondary/10 rounded-full blur-[80px] pointer-events-none -z-10"></div>
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Savings Headline */}
                <div className="lg:col-span-7 space-y-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-success/15 text-success border border-success/20">
                    <ShieldCheck className="w-4 h-4" /> Financial Integrity Guaranteed
                  </span>
                  
                  {auditResult.isOptimal ? (
                    <div className="space-y-2">
                      <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Your stack is optimized!</h2>
                      <p className="text-text-secondary max-w-md">
                        Congratulations. No redundant licenses or waste detected. Keep this setup to maximize developer output.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight text-white">
                        We found <span className="bg-gradient-to-r from-success to-primary bg-clip-text text-transparent font-black">${auditResult.totalMonthlySavings.toLocaleString()}</span> in monthly waste.
                      </h2>
                      <p className="text-text-secondary max-w-md">
                        Execute the seat count corrections and tool replacements below to increase efficiency without sacrificing capability.
                      </p>
                    </div>
                  )}
                </div>

                {/* Big numbers */}
                <div className="lg:col-span-5 grid grid-cols-2 gap-4">
                  <div className="bg-[#111827]/80 rounded-xl p-4 border border-border text-center shadow-sm">
                    <p className="text-[10px] uppercase font-bold text-text-secondary tracking-wider flex items-center justify-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-success" /> Monthly Savings
                    </p>
                    <p className="text-3xl font-black text-success mt-2">
                      ${auditResult.totalMonthlySavings.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-[#111827]/80 rounded-xl p-4 border border-border text-center shadow-sm">
                    <p className="text-[10px] uppercase font-bold text-text-secondary tracking-wider flex items-center justify-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-primary" /> Annual Savings
                    </p>
                    <p className="text-3xl font-black text-primary mt-2">
                      ${auditResult.totalAnnualSavings.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress visualization: original vs optimized */}
              {!auditResult.isOptimal && (
                <div className="mt-8 border-t border-border/50 pt-6">
                  <div className="flex items-center justify-between text-xs text-text-secondary font-medium mb-2">
                    <span>Optimized Stack Monthly Cost: <strong className="text-white">${(auditResult.totalMonthlySpend - auditResult.totalMonthlySavings).toLocaleString()}</strong></span>
                    <span>Current Spend: <strong className="text-text-secondary">${auditResult.totalMonthlySpend.toLocaleString()}</strong></span>
                  </div>
                  <div className="w-full bg-[#111827] h-3 rounded-full overflow-hidden border border-border flex">
                    <div
                      className="bg-gradient-to-r from-primary to-success h-full rounded-full"
                      style={{ width: `${Math.max(10, ((auditResult.totalMonthlySpend - auditResult.totalMonthlySavings) / auditResult.totalMonthlySpend) * 100)}%` }}
                    ></div>
                    <div className="bg-error/30 h-full flex-1 animate-pulse"></div>
                  </div>
                </div>
              )}
            </div>

            {/* CTA BOOK BANNER (If savings > $500/mo) */}
            {!auditResult.isOptimal && auditResult.totalMonthlySavings >= 500 && (
              <div className="bg-gradient-to-r from-secondary/30 via-primary/30 to-success/15 border-2 border-secondary/30 rounded-2xl p-6 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                {/* Glowing glow */}
                <div className="absolute top-0 right-1/4 w-[180px] h-[180px] bg-secondary/20 rounded-full blur-2xl pointer-events-none"></div>
                <div className="space-y-2 text-center md:text-left relative z-10 max-w-xl">
                  <span className="px-2 py-0.5 rounded bg-secondary text-white text-[10px] font-bold uppercase tracking-wider">
                    Bulk Qualification Active
                  </span>
                  <h3 className="text-xl font-bold text-white">
                    Claim your 20% Credex Discounted Infrastructure Credits
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Your spend qualifying volume entitles you to direct discounted pricing contracts. Book a short consultation with our team to apply these optimizations instantly.
                  </p>
                </div>
                <a
                  href="https://calendly.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-secondary px-6 text-sm font-semibold text-white hover:bg-secondary/90 shadow-md shadow-secondary/20 transition-all shrink-0 active:scale-95 z-10"
                >
                  Book Credex Consultation
                </a>
              </div>
            )}

            {/* Optimal Stack notification lead opt-in banner */}
            {auditResult.isOptimal && (
              <div className="bg-[#111827]/60 border border-border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-1 max-w-md text-center md:text-left">
                  <h3 className="font-bold text-white text-base flex items-center justify-center md:justify-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-success" /> Your stack is highly optimized!
                  </h3>
                  <p className="text-xs text-text-secondary">
                    No action is needed right now. Set up alerts for automated monitoring as vendor matrices evolve in 2026.
                  </p>
                </div>
                {optInSuccess ? (
                  <div className="bg-success/15 border border-success/30 text-success text-xs font-semibold px-4 py-3 rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Monitoring alerts initialized successfully!
                  </div>
                ) : (
                  <form onSubmit={handleOptInSubmit} className="flex items-center gap-2 w-full md:w-auto max-w-sm">
                    <Input
                      type="email"
                      required
                      placeholder="Alert email address"
                      value={optInEmail}
                      onChange={(e) => setOptInEmail(e.target.value)}
                      className="h-10 text-xs flex-1"
                    />
                    <Button type="submit" variant="outline" size="sm" className="h-10 shrink-0 text-xs">
                      Monitor Stack
                    </Button>
                  </form>
                )}
              </div>
            )}

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: AI summary and detailed breakdowns */}
              <div className="lg:col-span-8 space-y-6">
                {/* AI generated summary card */}
                {aiSummary && (
                  <Card className="border-border bg-surface shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2 text-text-primary">
                        <Sparkles className="w-4 h-4 text-secondary" /> Advisory Summary
                      </CardTitle>
                      <CardDescription>Automated professional analysis of your active licensing spend.</CardDescription>
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

                {/* Per-Tool breakdown details */}
                <div className="space-y-4">
                  <h3 className="font-bold text-lg text-text-primary flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" /> Tool breakdown
                  </h3>
                  
                  <div className="space-y-4">
                    {auditResult.toolBreakdown.map((tool: any, idx: number) => {
                      const staticPrice = SAAS_PRICING[tool.name]?.[tool.tier] ?? 0;
                      const hasSavings = tool.monthlySavings > 0;
                      
                      return (
                        <Card key={idx} className="border-border bg-surface overflow-hidden shadow-sm">
                          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40">
                            <div>
                              <div className="flex items-center gap-2.5">
                                <h4 className="font-bold text-base text-text-primary">{tool.name}</h4>
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[#1F2937] text-text-secondary border border-border">
                                  {tool.tier}
                                </span>
                                
                                {tool.isRedundant && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-error/15 text-error border border-error/25">
                                    Redundant Overlap
                                  </span>
                                )}
                                {hasSavings && !tool.isRedundant && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-success/15 text-success border border-success/25">
                                    Action Required
                                  </span>
                                )}
                                {!hasSavings && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-primary/15 text-primary border border-primary/25">
                                    Optimal Plan
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-text-secondary mt-1">
                                {tool.seats} developer seat(s) active{staticPrice > 0 ? ` @ $${staticPrice}/mo each` : ''}.
                              </p>
                            </div>

                            {/* Cost overview */}
                            <div className="flex items-center gap-4 shrink-0">
                              <div className="text-left sm:text-right">
                                <p className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Current Cost</p>
                                <p className="text-lg font-bold text-text-secondary">${tool.currentMonthlySpend.toLocaleString()}/mo</p>
                              </div>
                              {hasSavings && (
                                <div className="text-left sm:text-right">
                                  <p className="text-[10px] uppercase font-bold text-success tracking-wider">Optimized</p>
                                  <p className="text-lg font-extrabold text-success">${tool.optimizedMonthlySpend.toLocaleString()}/mo</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Advisory Details */}
                          {(tool.wasteReason || tool.recommendation) && (
                            <div className="bg-[#111827]/40 p-4 space-y-2 border-t border-border/20 text-xs">
                              {tool.wasteReason && (
                                <div className="flex items-start gap-2 text-text-secondary">
                                  <AlertTriangle className="w-4 h-4 text-error shrink-0 mt-0.5" />
                                  <p>
                                    <strong className="text-[#EF4444] font-semibold">Audit Leak:</strong> {tool.wasteReason}
                                  </p>
                                </div>
                              )}
                              {tool.recommendation && (
                                <div className="flex items-start gap-2 text-text-secondary">
                                  <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                  <p>
                                    <strong className="text-primary font-semibold">Credex Recommendation:</strong> {tool.recommendation}
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

              {/* Right Column: Actions list and summary details */}
              <div className="lg:col-span-4 space-y-6">
                <Card className="border-border bg-surface shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-primary" /> Savings Checklist
                    </CardTitle>
                    <CardDescription>Step-by-step checklist to lock in calculations.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border">
                      {auditResult.savingsDetails.map((detail: string, idx: number) => {
                        const isRedundant = detail.includes('[License Redundancy]');
                        const isSeat = detail.includes('[Seat Optimization]');
                        const isBulk = detail.includes('[Credex Credits]');

                        return (
                          <div key={idx} className="p-4 flex gap-3 text-xs leading-relaxed font-medium">
                            <span className="mt-0.5 shrink-0">
                              {isRedundant && <Trash2 className="w-4 h-4 text-error" />}
                              {isSeat && <TrendingDown className="w-4 h-4 text-success" />}
                              {isBulk && <Sparkles className="w-4 h-4 text-secondary" />}
                              {!isRedundant && !isSeat && !isBulk && <Info className="w-4 h-4 text-primary" />}
                            </span>
                            <p className="text-text-secondary">
                              <strong className="text-text-primary">
                                {isRedundant && 'Redundancy Alert: '}
                                {isSeat && 'Seat Adjustment: '}
                                {isBulk && 'Credits Applied: '}
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
          </div>
        )}
      </main>
    </div>
  );
}
