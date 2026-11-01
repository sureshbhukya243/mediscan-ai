import React, { useState } from 'react';
import {
  Pill,
  Clock,
  Utensils,
  Calendar,
  AlertTriangle,
  Info,
  HelpCircle,
  MessageSquare,
  ShieldAlert,
  Search,
  Droplet,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Volume2,
  VolumeX,
  Sparkles,
} from 'lucide-react';
import { MedicineItem, ScanResult } from '../types/medical';
import { speechService } from '../utils/speech';

interface MedicineListProps {
  scanResult: ScanResult | null;
  onAskAiAboutMed: (medicine: MedicineItem) => void;
  onSwitchToScan: () => void;
}

export const MedicineList: React.FC<MedicineListProps> = ({
  scanResult,
  onAskAiAboutMed,
  onSwitchToScan,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedForm, setSelectedForm] = useState<string>('all');
  const [speakingMedId, setSpeakingMedId] = useState<string | null>(null);

  if (!scanResult || scanResult.medicines.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs max-w-xl mx-auto my-8">
        <div className="h-16 w-16 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-4 border border-teal-100">
          <Pill className="h-8 w-8 rotate-45" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">No Prescription Scanned Yet</h3>
        <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
          Scan or upload your doctor's medical report or prescription to see full medication details, indications, and food timings.
        </p>
        <button
          onClick={onSwitchToScan}
          className="mt-6 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition-colors shadow-xs cursor-pointer"
        >
          Scan a Prescription Now
        </button>
      </div>
    );
  }

  const medicines = scanResult.medicines;

  const filteredMedicines = medicines.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.genericName && m.genericName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      m.purpose.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesForm = selectedForm === 'all' || (m.form && m.form.toLowerCase().includes(selectedForm));
    return matchesSearch && matchesForm;
  });

  const handleSpeakMed = (med: MedicineItem) => {
    if (speakingMedId === med.id) {
      speechService.stop();
      setSpeakingMedId(null);
    } else {
      setSpeakingMedId(med.id);
      const text = `${med.name}. Prescribed dosage: ${med.dosage}, frequency: ${med.frequency}. What it's for: ${med.purpose}. Food instructions: ${med.timingRelation.replace('_', ' ')}. ${med.specialInstructions ? `Special instruction: ${med.specialInstructions}` : ''}`;
      speechService.speak(
        text,
        () => setSpeakingMedId(null),
        () => setSpeakingMedId(null)
      );
    }
  };

  // Food Timing styling helper
  const renderFoodBadge = (timing: string) => {
    switch (timing) {
      case 'before_food':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Utensils className="h-3 w-3" /> Before Food
          </span>
        );
      case 'after_food':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Utensils className="h-3 w-3" /> After Food
          </span>
        );
      case 'with_food':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <Utensils className="h-3 w-3" /> With Food
          </span>
        );
      case 'bedtime':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
            <Clock className="h-3 w-3" /> Bedtime
          </span>
        );
      case 'empty_stomach':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Utensils className="h-3 w-3" /> Empty Stomach
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <HelpCircle className="h-3 w-3" /> Timing: As Advised
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Summary */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-display">
              Prescribed Medicines ({medicines.length})
            </h2>
            <span className="text-xs font-bold bg-teal-50 text-teal-700 px-2.5 py-0.5 rounded-full border border-teal-200">
              Verified by Doctor Script
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Carefully reviewed breakdown of medicine indications, dosages, durations, and food consumption rules.
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search medicine or use..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <select
            value={selectedForm}
            onChange={(e) => setSelectedForm(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="all">All Forms</option>
            <option value="tablet">Tablets</option>
            <option value="capsule">Capsules</option>
            <option value="syrup">Syrups</option>
            <option value="drops">Drops</option>
          </select>
        </div>
      </div>

      {/* Clarifications / Unclear items notice if any */}
      {scanResult.clarificationsAndWarnings && scanResult.clarificationsAndWarnings.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs sm:text-sm text-amber-900">
          <div className="flex items-center gap-2 font-bold text-amber-950 mb-1.5">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            Important Doctor Clarifications & Warnings:
          </div>
          <ul className="list-disc list-inside space-y-1 text-amber-800 ml-1">
            {scanResult.clarificationsAndWarnings.map((warning, idx) => (
              <li key={idx} className="leading-relaxed">
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Medicines Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredMedicines.map((med) => {
          const isSpeaking = speakingMedId === med.id;

          return (
            <div
              key={med.id}
              className={`bg-white rounded-3xl p-6 sm:p-7 border transition-all shadow-xs relative flex flex-col justify-between ${
                med.unclearOrAmbiguous
                  ? 'border-amber-300 ring-2 ring-amber-100'
                  : 'border-slate-200/90 hover:border-teal-300'
              }`}
            >
              <div>
                {/* Top Badge Row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                      {med.form || 'Medicine'}
                    </span>
                    {renderFoodBadge(med.timingRelation)}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSpeakMed(med)}
                      className={`p-1.5 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-slate-100 transition-colors cursor-pointer ${
                        isSpeaking ? 'text-teal-600 bg-teal-50 animate-pulse' : ''
                      }`}
                      title={isSpeaking ? 'Stop voice' : 'Listen to medicine instructions'}
                    >
                      {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </button>

                    {med.unclearOrAmbiguous ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                        <AlertTriangle className="h-3 w-3 text-amber-600" />
                        Unclear Detail
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="h-3 w-3" /> Verified Rx
                      </span>
                    )}
                  </div>
                </div>

                {/* Medicine Title & Generic Name */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">{med.name}</h3>
                  {med.genericName && (
                    <p className="text-xs font-medium text-slate-500 mt-0.5">Generic: {med.genericName}</p>
                  )}
                </div>

                {/* Purpose / Why it's used */}
                <div className="mt-4 p-3.5 rounded-2xl bg-teal-50/50 border border-teal-100/80">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 block mb-0.5">
                    What this medicine is used for:
                  </span>
                  <p className="text-xs text-slate-800 leading-relaxed font-medium">{med.purpose}</p>
                </div>

                {/* Grid of Key Attributes */}
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Prescribed Dosage</span>
                    <span className="font-bold text-slate-800 text-sm mt-0.5 block">{med.dosage}</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Daily Frequency</span>
                    <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                      {med.frequency} {med.timesPerDay ? `(${med.timesPerDay}x/day)` : ''}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Duration of Course</span>
                    <span className="font-semibold text-slate-800 mt-0.5 block">{med.duration || 'As directed'}</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Scheduled Times</span>
                    <span className="font-semibold text-teal-700 mt-0.5 block truncate">
                      {med.prescribedTimeSlots && med.prescribedTimeSlots.length > 0
                        ? med.prescribedTimeSlots.join(', ')
                        : 'Custom Daily'}
                    </span>
                  </div>
                </div>

                {/* Special Instructions & Precautions */}
                {(med.specialInstructions || (med.precautions && med.precautions.length > 0)) && (
                  <div className="mt-3.5 space-y-1.5 text-xs text-slate-600">
                    {med.specialInstructions && (
                      <p className="text-[11px] leading-relaxed">
                        <strong className="text-slate-800">Doctor's Note:</strong> {med.specialInstructions}
                      </p>
                    )}
                    {med.precautions && med.precautions.length > 0 && (
                      <div className="text-[11px] text-amber-900 bg-amber-50/60 p-2.5 rounded-xl border border-amber-100">
                        <strong className="text-amber-950">Precaution:</strong> {med.precautions.join(' • ')}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Prescription Adherent</span>
                <button
                  onClick={() => onAskAiAboutMed(med)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors cursor-pointer"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Ask Dr. Aida About This
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
