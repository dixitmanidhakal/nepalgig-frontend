'use client';

import { useState, useRef }    from 'react';
import { useRouter }           from 'next/navigation';
import Link                    from 'next/link';
import { Loader2, ArrowLeft, ArrowRight, CheckCircle2, X, Plus } from 'lucide-react';
import { Button }              from '@/components/ui/button';
import { Input }               from '@/components/ui/input';
import { Card, CardContent }   from '@/components/ui/card';
import { cn }                  from '@/lib/utils';
import { trpc }                from '@/lib/trpc';
import { GIG_CATEGORIES, NEPAL_PROVINCES, MIN_GIG_BUDGET_NPR } from '@/lib/constants';

// ── Types ──────────────────────────────────────────────────
type BudgetType  = 'fixed' | 'hourly';
type LocationType = 'remote' | 'onsite' | 'hybrid';

interface FormState {
  // Step 1 — basics
  title:       string;
  description: string;
  category:    string;
  subcategory: string;
  tags:        string[];
  tagInput:    string;
  // Step 2 — budget & timeline
  budgetType:   BudgetType;
  budgetMin:    string;  // NPR (user types whole rupees)
  budgetMax:    string;
  deadline:     string;
  durationDays: string;
  // Step 3 — location
  locationType: LocationType;
  province:     string;
  district:     string;
}

const INITIAL: FormState = {
  title: '', description: '', category: '', subcategory: '', tags: [], tagInput: '',
  budgetType: 'fixed', budgetMin: '', budgetMax: '', deadline: '', durationDays: '',
  locationType: 'remote', province: '', district: '',
};

const STEPS = ['Basics', 'Budget', 'Location'] as const;

// ── Helpers ────────────────────────────────────────────────
function nprToPaisa(v: string): number { return Math.round(parseFloat(v || '0') * 100); }
function fieldErr(msg: string) {
  return <p className="text-xs text-red-500 mt-1">{msg}</p>;
}

// ── Step indicators ────────────────────────────────────────
function StepBar({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((label, i) => {
        const done    = i < step;
        const current = i === step;
        return (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all',
              done    ? 'bg-indigo-600 text-white'   :
              current ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-400/40' :
                        'bg-gray-100 text-gray-400'
            )}>
              {done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </div>
            <span className={cn(
              'text-xs font-semibold hidden sm:block',
              current ? 'text-indigo-700' : done ? 'text-indigo-500' : 'text-gray-400'
            )}>
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={cn('flex-1 h-0.5 rounded', done ? 'bg-indigo-400' : 'bg-gray-200')} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Tag input ──────────────────────────────────────────────
function TagInput({
  tags, tagInput, setField,
}: {
  tags: string[];
  tagInput: string;
  setField: (k: keyof FormState, v: FormState[keyof FormState]) => void;
}) {
  function addTag() {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (!t || tags.includes(t) || tags.length >= 10) return;
    setField('tags', [...tags, t]);
    setField('tagInput', '');
  }
  function removeTag(t: string) { setField('tags', tags.filter(x => x !== t)); }

  return (
    <div>
      <label className="text-sm font-semibold text-gray-700 block mb-1.5">
        Tags <span className="text-gray-400 font-normal">(optional, max 10)</span>
      </label>
      <div className="flex gap-2">
        <Input
          value={tagInput}
          onChange={e => setField('tagInput', e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); }}}
          placeholder="e.g. react, logo-design"
          className="flex-1"
          maxLength={30}
        />
        <Button type="button" variant="outline" onClick={addTag} disabled={tags.length >= 10} size="default">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {tags.map(t => (
            <span key={t} className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-medium">
              {t}
              <button type="button" onClick={() => removeTag(t)} className="hover:text-indigo-900 transition">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Step 1: Basics ─────────────────────────────────────────
function Step1Basics({ f, setField, errors }: {
  f: FormState;
  setField: (k: keyof FormState, v: FormState[keyof FormState]) => void;
  errors: Record<string, string>;
}) {
  const subcats: Record<string, string[]> = {
    web_dev:    ['Frontend', 'Backend', 'Full Stack', 'WordPress', 'eCommerce'],
    mobile_dev: ['Android', 'iOS', 'React Native', 'Flutter'],
    design:     ['Logo', 'UI/UX', 'Branding', 'Print', 'Illustration'],
    writing:    ['Copywriting', 'Translation', 'Proofreading', 'Technical Writing'],
    marketing:  ['SEO', 'Social Media', 'Email', 'Google Ads', 'Content'],
    video:      ['Editing', 'Animation', 'Motion Graphics', '3D'],
    data:       ['Data Entry', 'Analysis', 'Visualization', 'ML/AI'],
    accounting: ['Bookkeeping', 'Tax', 'Payroll', 'Financial Planning'],
    it_support: ['Networking', 'Servers', 'Cybersecurity', 'Cloud'],
    teaching:   ['School Subjects', 'Languages', 'IT', 'Arts & Music'],
  };

  return (
    <div className="space-y-5">
      {/* Title */}
      <div>
        <label className="text-sm font-semibold text-gray-700 block mb-1.5" htmlFor="title">
          Gig Title <span className="text-red-400">*</span>
        </label>
        <Input
          id="title"
          value={f.title}
          onChange={e => setField('title', e.target.value)}
          placeholder="e.g. Build a responsive e-commerce website"
          maxLength={150}
        />
        <div className="flex items-center justify-between mt-1">
          {errors.title ? fieldErr(errors.title) : <span />}
          <span className="text-xs text-gray-400">{f.title.length}/150</span>
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="text-sm font-semibold text-gray-700 block mb-1.5" htmlFor="category">
          Category <span className="text-red-400">*</span>
        </label>
        <select
          id="category"
          value={f.category}
          onChange={e => { setField('category', e.target.value); setField('subcategory', ''); }}
          className="flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-[16px] md:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Select a category…</option>
          {GIG_CATEGORIES.filter(c => c.id !== 'other').map(c => (
            <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
          ))}
          <option value="other">🗂️ Other</option>
        </select>
        {errors.category && fieldErr(errors.category)}
      </div>

      {/* Subcategory */}
      {f.category && subcats[f.category] && (
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1.5" htmlFor="subcat">
            Subcategory <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <select
            id="subcat"
            value={f.subcategory}
            onChange={e => setField('subcategory', e.target.value)}
            className="flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-[16px] md:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Any</option>
            {subcats[f.category]!.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}

      {/* Description */}
      <div>
        <label className="text-sm font-semibold text-gray-700 block mb-1.5" htmlFor="desc">
          Description <span className="text-red-400">*</span>
        </label>
        <textarea
          id="desc"
          value={f.description}
          onChange={e => setField('description', e.target.value)}
          rows={6}
          maxLength={5000}
          placeholder="Describe what you need in detail. Include requirements, deliverables, and any specific technologies or styles you want."
          className="flex w-full rounded-xl border border-input bg-background px-4 py-3 text-[16px] md:text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
        />
        <div className="flex items-center justify-between mt-1">
          {errors.description ? fieldErr(errors.description) : <span />}
          <span className="text-xs text-gray-400">{f.description.length}/5000</span>
        </div>
      </div>

      {/* Tags */}
      <TagInput tags={f.tags} tagInput={f.tagInput} setField={setField} />
    </div>
  );
}

// ── Step 2: Budget & Timeline ──────────────────────────────
function Step2Budget({ f, setField, errors }: {
  f: FormState;
  setField: (k: keyof FormState, v: FormState[keyof FormState]) => void;
  errors: Record<string, string>;
}) {
  // Minimum date = today
  const today = new Date().toISOString().split('T')[0]!;

  return (
    <div className="space-y-5">
      {/* Budget type toggle */}
      <div>
        <label className="text-sm font-semibold text-gray-700 block mb-2">
          Budget Type <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(['fixed', 'hourly'] as const).map(bt => (
            <button
              key={bt}
              type="button"
              onClick={() => setField('budgetType', bt)}
              className={cn(
                'p-4 rounded-xl border-2 text-left transition-all',
                f.budgetType === bt
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 bg-white hover:border-indigo-200'
              )}
            >
              <div className="text-xl mb-1">{bt === 'fixed' ? '📋' : '⏱'}</div>
              <p className="font-semibold text-sm text-gray-800">
                {bt === 'fixed' ? 'Fixed Price' : 'Hourly Rate'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {bt === 'fixed' ? 'One total payment' : 'Rate per hour'}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Budget range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1.5">
            Min Budget (NPR) <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">₨</span>
            <Input
              type="number"
              value={f.budgetMin}
              onChange={e => setField('budgetMin', e.target.value)}
              placeholder={`${MIN_GIG_BUDGET_NPR}`}
              min={MIN_GIG_BUDGET_NPR}
              className="pl-8"
              inputMode="numeric"
            />
          </div>
          {errors.budgetMin && fieldErr(errors.budgetMin)}
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1.5">
            Max Budget (NPR) <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">₨</span>
            <Input
              type="number"
              value={f.budgetMax}
              onChange={e => setField('budgetMax', e.target.value)}
              placeholder="e.g. 50000"
              className="pl-8"
              inputMode="numeric"
            />
          </div>
          {errors.budgetMax && fieldErr(errors.budgetMax)}
        </div>
      </div>

      {/* Escrow note */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex gap-3 items-start">
        <span className="text-xl shrink-0">🔒</span>
        <div>
          <p className="text-sm font-semibold text-amber-800">Escrow Required</p>
          <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
            Your gig will be visible to freelancers only after you fund the escrow via bank transfer.
            Funds are released to the freelancer only after you approve the completed work.
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1.5">
            Deadline <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <Input
            type="date"
            value={f.deadline}
            onChange={e => setField('deadline', e.target.value)}
            min={today}
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1.5">
            Duration (days) <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <Input
            type="number"
            value={f.durationDays}
            onChange={e => setField('durationDays', e.target.value)}
            placeholder="e.g. 14"
            min={1}
            inputMode="numeric"
          />
        </div>
      </div>
    </div>
  );
}

// ── Step 3: Location ───────────────────────────────────────
function Step3Location({ f, setField, errors }: {
  f: FormState;
  setField: (k: keyof FormState, v: FormState[keyof FormState]) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="space-y-5">
      {/* Location type */}
      <div>
        <label className="text-sm font-semibold text-gray-700 block mb-2">
          Work Location <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          {([
            { id: 'remote', emoji: '🌐', label: 'Remote',  desc: 'Work from anywhere' },
            { id: 'onsite', emoji: '🏢', label: 'On-site', desc: 'Must be in Nepal' },
            { id: 'hybrid', emoji: '🔄', label: 'Hybrid',  desc: 'Mix of both' },
          ] as const).map(l => (
            <button
              key={l.id}
              type="button"
              onClick={() => setField('locationType', l.id)}
              className={cn(
                'p-3.5 rounded-xl border-2 text-center transition-all',
                f.locationType === l.id
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 bg-white hover:border-indigo-200'
              )}
            >
              <div className="text-2xl mb-1">{l.emoji}</div>
              <p className="font-semibold text-xs text-gray-800">{l.label}</p>
              <p className="text-[10px] text-gray-400 mt-0.5 leading-tight hidden sm:block">{l.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Province + District (only if not purely remote) */}
      {f.locationType !== 'remote' && (
        <>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">
              Province <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <select
              value={f.province}
              onChange={e => setField('province', e.target.value)}
              className="flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-[16px] md:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Any province</option>
              {NEPAL_PROVINCES.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">
              District / City <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <Input
              value={f.district}
              onChange={e => setField('district', e.target.value)}
              placeholder="e.g. Kathmandu, Lalitpur, Pokhara"
              maxLength={50}
            />
          </div>
        </>
      )}

      {/* Preview summary card */}
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 space-y-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Gig Preview</p>
        <h3 className="font-bold text-gray-800 leading-snug">
          {f.title || <span className="text-gray-400 italic font-normal">Your gig title</span>}
        </h3>
        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
          {f.category && (
            <span className="bg-white border rounded-lg px-2.5 py-1">
              {GIG_CATEGORIES.find(c => c.id === f.category)?.icon} {GIG_CATEGORIES.find(c => c.id === f.category)?.label}
            </span>
          )}
          {f.budgetMin && f.budgetMax && (
            <span className="bg-white border rounded-lg px-2.5 py-1">
              ₨{Number(f.budgetMin).toLocaleString()} – ₨{Number(f.budgetMax).toLocaleString()}
            </span>
          )}
          <span className="bg-white border rounded-lg px-2.5 py-1 capitalize">
            {f.locationType}
          </span>
          {f.deadline && (
            <span className="bg-white border rounded-lg px-2.5 py-1">
              Due {new Date(f.deadline).toLocaleDateString('en-NP', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
        {f.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {f.tags.map(t => (
              <span key={t} className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">{t}</span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 pt-1">
          <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
            ⏳ Awaiting Escrow
          </span>
          <span className="text-xs text-gray-400">Will be visible after funding</span>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────
export default function CreateGigPage() {
  const [f, setF]         = useState<FormState>(INITIAL);
  const [step, setStep]   = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitErr, setSubmitErr] = useState('');
  const router            = useRouter();
  const topRef            = useRef<HTMLDivElement>(null);

  const createGig = trpc.gigs.create.useMutation({
    onSuccess: (gig) => {
      router.push(`/dashboard/client?created=${gig.id}`);
    },
    onError: (err) => {
      setSubmitErr(err.message ?? 'Failed to post gig. Please try again.');
    },
  });

  function setField<K extends keyof FormState>(k: K, v: FormState[K]) {
    setF(prev => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors(prev => { const n = { ...prev }; delete n[k]; return n; });
  }

  function scrollTop() {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ── Validation per step ──
  function validateStep(s: number): Record<string, string> {
    const e: Record<string, string> = {};

    if (s === 0) {
      if (f.title.trim().length < 10)
        e.title = 'Title must be at least 10 characters';
      if (f.title.trim().length > 150)
        e.title = 'Title must be 150 characters or less';
      if (!f.category)
        e.category = 'Please select a category';
      if (f.description.trim().length < 50)
        e.description = 'Description must be at least 50 characters';
    }

    if (s === 1) {
      const minVal = parseFloat(f.budgetMin || '0');
      const maxVal = parseFloat(f.budgetMax || '0');
      if (!f.budgetMin || minVal < MIN_GIG_BUDGET_NPR)
        e.budgetMin = `Minimum budget is NPR ${MIN_GIG_BUDGET_NPR}`;
      if (!f.budgetMax || maxVal <= 0)
        e.budgetMax = 'Please enter a max budget';
      if (f.budgetMin && f.budgetMax && maxVal < minVal)
        e.budgetMax = 'Max budget must be ≥ min budget';
    }

    return e;
  }

  function handleNext() {
    const e = validateStep(step);
    if (Object.keys(e).length) { setErrors(e); scrollTop(); return; }
    setErrors({});
    setStep(s => s + 1);
    scrollTop();
  }

  function handleBack() {
    setStep(s => s - 1);
    setErrors({});
    scrollTop();
  }

  async function handleSubmit() {
    const e = validateStep(2);  // step 3 has no required fields
    if (Object.keys(e).length) { setErrors(e); return; }
    setSubmitErr('');

    createGig.mutate({
      title:        f.title.trim(),
      description:  f.description.trim(),
      category:     f.category,
      subcategory:  f.subcategory || undefined,
      tags:         f.tags,
      budgetMinNpr: nprToPaisa(f.budgetMin),
      budgetMaxNpr: nprToPaisa(f.budgetMax),
      budgetType:   f.budgetType,
      deadline:     f.deadline || undefined,
      durationDays: f.durationDays ? parseInt(f.durationDays) : undefined,
      locationType: f.locationType,
      province:     f.province ? parseInt(f.province) : undefined,
      district:     f.district || undefined,
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-white border-b px-4 h-14 flex items-center gap-3">
        <Link
          href="/dashboard/client"
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition text-gray-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-lg">🇳🇵</span>
          <span className="font-bold text-indigo-700 text-base">NepalgGig</span>
        </div>
        <span className="text-gray-300 mx-1">›</span>
        <span className="text-sm font-semibold text-gray-700">Post a Gig</span>
      </header>

      {/* ── Content ── */}
      <div ref={topRef} className="max-w-xl mx-auto px-4 py-8">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Post a Gig</h1>
          <p className="text-gray-500 text-sm mt-1">
            Describe your project — freelancers will send you proposals.
          </p>
        </div>

        <StepBar step={step} />

        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-6">

            {/* Step label */}
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-5">
              Step {step + 1} of {STEPS.length} — {STEPS[step]}
            </p>

            {/* Step content */}
            {step === 0 && <Step1Basics    f={f} setField={setField} errors={errors} />}
            {step === 1 && <Step2Budget    f={f} setField={setField} errors={errors} />}
            {step === 2 && <Step3Location  f={f} setField={setField} errors={errors} />}

            {/* Submit error */}
            {submitErr && (
              <div className="mt-5 p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
                ⚠️ {submitErr}
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 mt-8">
              {step > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                  disabled={createGig.isPending}
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
              )}
              {step < STEPS.length - 1 ? (
                <Button
                  type="button"
                  variant="indigo"
                  onClick={handleNext}
                  className="flex-1"
                >
                  Next <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="indigo"
                  onClick={handleSubmit}
                  disabled={createGig.isPending}
                  className="flex-1 shadow-lg shadow-indigo-200"
                >
                  {createGig.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Posting…</>
                  ) : (
                    '🚀 Post Gig as Draft'
                  )}
                </Button>
              )}
            </div>

            {/* Draft note */}
            {step === STEPS.length - 1 && (
              <p className="text-center text-xs text-gray-400 mt-4">
                Saved as draft · becomes visible to freelancers after escrow funding
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
