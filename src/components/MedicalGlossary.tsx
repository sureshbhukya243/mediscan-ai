import React, { useState } from 'react';
import { BookOpen, Search, Sparkles, HelpCircle, ArrowRight, ExternalLink } from 'lucide-react';

interface GlossaryTerm {
  term: string;
  latinOrigin?: string;
  meaning: string;
  example: string;
  category: 'Timing' | 'Frequency' | 'Route' | 'Clinical';
}

const COMMON_TERMS: GlossaryTerm[] = [
  {
    term: 'b.i.d. / BD (1-0-1)',
    latinOrigin: 'Bis in die',
    meaning: 'Twice a day (usually morning and evening, roughly 12 hours apart)',
    example: 'Augmentin 625mg b.i.d. -> Take 1 tablet in the morning and 1 tablet at night.',
    category: 'Frequency',
  },
  {
    term: 't.i.d. / TDS (1-1-1)',
    latinOrigin: 'Ter in die',
    meaning: 'Three times a day (morning, afternoon, and evening, roughly 8 hours apart)',
    example: 'Cough Syrup 10ml t.i.d. -> Take 10ml with each major meal.',
    category: 'Frequency',
  },
  {
    term: 'q.i.d. / QDS (1-1-1-1)',
    latinOrigin: 'Quater in die',
    meaning: 'Four times a day (roughly every 6 hours)',
    example: 'Eye drops 1 drop q.i.d.',
    category: 'Frequency',
  },
  {
    term: 'o.d. / QD (1-0-0)',
    latinOrigin: 'Omni in die',
    meaning: 'Once daily (at the same time each day)',
    example: 'Telmisartan 40mg o.d. -> Take 1 tablet once a day in the morning.',
    category: 'Frequency',
  },
  {
    term: 'p.c.',
    latinOrigin: 'Post cibum',
    meaning: 'After meals (with or shortly after eating food)',
    example: 'Metformin 500mg p.c. -> Take after your meal to prevent gastric irritation.',
    category: 'Timing',
  },
  {
    term: 'a.c.',
    latinOrigin: 'Ante cibum',
    meaning: 'Before meals (on an empty stomach, usually 30-45 minutes before eating)',
    example: 'Pantoprazole 40mg a.c. -> Take 30 mins before breakfast.',
    category: 'Timing',
  },
  {
    term: 'h.s.',
    latinOrigin: 'Hora somni',
    meaning: 'At bedtime (right before going to sleep)',
    example: 'Atorvastatin 20mg h.s. -> Take at bedtime.',
    category: 'Timing',
  },
  {
    term: 'p.r.n. / SOS',
    latinOrigin: 'Pro re nata / Si opus sit',
    meaning: 'As needed (take only when specific symptoms like pain or fever occur)',
    example: 'Paracetamol 650mg SOS -> Take only if fever exceeds 100°F.',
    category: 'Timing',
  },
  {
    term: 'PO',
    latinOrigin: 'Per os',
    meaning: 'By mouth / Oral administration (swallowed whole with water)',
    example: 'Amoxicillin 500mg PO -> Take orally.',
    category: 'Route',
  },
  {
    term: 'SL',
    latinOrigin: 'Sublingua',
    meaning: 'Sublingual (dissolved under the tongue without swallowing)',
    example: 'Nitroglycerin SL -> Place tablet under the tongue.',
    category: 'Route',
  },
  {
    term: 'SR / ER / CR',
    meaning: 'Sustained Release / Extended Release / Controlled Release (slowly releases drug into bloodstream)',
    example: 'Do not chew or crush SR tablets, as this destroys the slow-release matrix.',
    category: 'Clinical',
  },
  {
    term: 'Rx',
    latinOrigin: 'Recipe (Take thou)',
    meaning: 'Prescription symbol used by doctors to denote prescribed medications',
    example: 'Rx: Tab Augmentin 625mg',
    category: 'Clinical',
  },
  {
    term: 'Dx / Hx / Sx',
    meaning: 'Dx = Diagnosis, Hx = Medical History, Sx = Symptoms',
    example: 'Dx: Acute Bronchitis, Hx: Seasonal Allergies',
    category: 'Clinical',
  },
  {
    term: 'HbA1c',
    meaning: 'Glycated Hemoglobin test measuring average blood glucose over the past 2-3 months',
    example: 'Target for most adults with diabetes is typically below 7.0%.',
    category: 'Clinical',
  },
];

export const MedicalGlossary: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [aiLookupTerm, setAiLookupTerm] = useState('');
  const [aiResult, setAiResult] = useState<{ term: string; explanation: string } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const filtered = COMMON_TERMS.filter((item) => {
    const matchesSearch =
      item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.meaning.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.latinOrigin && item.latinOrigin.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleAiLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiLookupTerm.trim() || isAiLoading) return;

    setIsAiLoading(true);
    setAiResult(null);

    try {
      const response = await fetch('/api/explain-term', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term: aiLookupTerm }),
      });
      const data = await response.json();
      if (data.success) {
        setAiResult({ term: data.term, explanation: data.explanation });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-display">
              Prescription Symbols & Medical Jargon Glossary
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Demystify doctor shorthand like <strong className="text-slate-800">b.i.d., p.c., a.c., and SOS</strong> into simple, everyday patient terminology.
          </p>
        </div>

        {/* Filter Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {['All', 'Timing', 'Frequency', 'Route', 'Clinical'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                selectedCategory === cat
                  ? 'bg-teal-700 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* AI Term Lookup Bar */}
      <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl p-5 border border-teal-200/80 shadow-xs">
        <div className="max-w-2xl">
          <div className="flex items-center gap-1.5 text-xs font-bold text-teal-800 uppercase tracking-wider mb-1">
            <Sparkles className="h-3.5 w-3.5 text-teal-600" />
            Instant AI Term Decrypter
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900">
            Encountered a confusing medical word on your report?
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Type any doctor acronym, lab marker (e.g. Creatinine, Bilirubin, SGPT), or medical condition to get a layperson breakdown.
          </p>

          <form onSubmit={handleAiLookup} className="mt-3 flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g., 'p.c.', 'Creatinine Clearance', 'q.8.h.', 'sublingual'..."
              value={aiLookupTerm}
              onChange={(e) => setAiLookupTerm(e.target.value)}
              className="flex-1 px-3.5 py-2 bg-white border border-teal-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
            <button
              type="submit"
              disabled={!aiLookupTerm.trim() || isAiLoading}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              {isAiLoading ? 'Explaining...' : 'Explain Term'}
            </button>
          </form>

          {aiResult && (
            <div className="mt-4 p-4 rounded-xl bg-white border border-teal-200 text-xs sm:text-sm shadow-xs animate-in fade-in">
              <span className="font-bold text-teal-900 block mb-1">Decrypted: {aiResult.term}</span>
              <p className="text-slate-700 leading-relaxed">{aiResult.explanation}</p>
            </div>
          )}
        </div>
      </div>

      {/* Search Input for Standard Glossary */}
      <div className="relative">
        <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Filter glossary by term, Latin origin, or meaning..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        />
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:border-teal-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-base font-extrabold text-slate-900 font-mono">{item.term}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  {item.category}
                </span>
              </div>

              {item.latinOrigin && (
                <p className="text-[11px] italic text-teal-700 font-medium mb-1.5">
                  Origin: {item.latinOrigin}
                </p>
              )}

              <p className="text-xs text-slate-800 font-medium leading-relaxed">{item.meaning}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
              <span className="font-bold text-slate-700">Example:</span> {item.example}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
