import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, Info, ChevronDown, ChevronUp, Lock } from 'lucide-react';

export const SafetyBanner: React.FC = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-amber-50/90 border-b border-amber-200/80 text-amber-900 text-xs sm:text-sm px-4 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-medium">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-600 text-white">
            <ShieldAlert className="h-3.5 w-3.5" />
          </span>
          <span className="font-semibold text-amber-950">Clinical Safety Guardrail:</span>
          <span className="hidden sm:inline">
            MediScan AI assists in organizing your schedule based strictly on your doctor's written instructions.
          </span>
          <span className="sm:hidden">Assists with schedule organization only.</span>
        </div>

        <div className="flex items-center gap-3 ml-7 md:ml-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-amber-800 hover:text-amber-950 font-medium underline flex items-center gap-1 cursor-pointer"
          >
            {expanded ? 'Hide Safety Principles' : 'View Safety Rules'}
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          <span className="text-amber-300">|</span>
          <span className="flex items-center gap-1 text-amber-700">
            <Lock className="h-3 w-3" /> Private & HIPAA-Conscious
          </span>
        </div>
      </div>

      {expanded && (
        <div className="max-w-7xl mx-auto mt-3 pt-3 border-t border-amber-200/60 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs text-amber-800">
          <div className="flex items-start gap-2 bg-white/70 p-2.5 rounded-md border border-amber-100">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900">Never Changes Dosages</p>
              <p className="text-slate-600">We extract what the doctor prescribed verbatim and never modify dosage or frequency.</p>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-white/70 p-2.5 rounded-md border border-amber-100">
            <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900">No Unverified Assumptions</p>
              <p className="text-slate-600">If a timing or medicine detail is unclear or unreadable, we flag it amber and advise consulting your pharmacist.</p>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-white/70 p-2.5 rounded-md border border-amber-100">
            <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900">Not a Substitute for MD</p>
              <p className="text-slate-600">This assistant is educational. In emergencies or severe reactions, call 911 or visit an emergency room.</p>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-white/70 p-2.5 rounded-md border border-amber-100">
            <Lock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900">Patient Privacy Protected</p>
              <p className="text-slate-600">Reports and compliance logs are processed safely and stored locally in your browser.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
