import React, { useState } from 'react';
import {
  FileText,
  Calendar,
  Pill,
  Bell,
  MessageSquareHeart,
  BookOpen,
  Volume2,
  VolumeX,
  PhoneCall,
  Camera,
  X,
  Clock,
  Sparkles,
} from 'lucide-react';
import { soundManager } from '../utils/audio';

interface HeaderProps {
  activeTab: 'scan' | 'medicines' | 'schedule' | 'reminders' | 'assistant' | 'glossary';
  setActiveTab: (tab: 'scan' | 'medicines' | 'schedule' | 'reminders' | 'assistant' | 'glossary') => void;
  hasPrescription: boolean;
  medicineCount: number;
  onOpenScanner: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  hasPrescription,
  medicineCount,
  onOpenScanner,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  const toggleSound = () => {
    if (!soundEnabled) {
      soundManager.playChime();
    }
    setSoundEnabled(!soundEnabled);
  };

  const navItems = [
    { id: 'scan', label: 'Scan & Reports', icon: FileText, badge: null },
    { id: 'medicines', label: 'Medicine Info', icon: Pill, badge: hasPrescription ? medicineCount : null },
    { id: 'schedule', label: 'Daily Schedule', icon: Calendar, badge: null },
    { id: 'reminders', label: 'Reminders & Log', icon: Bell, badge: null },
    { id: 'assistant', label: 'AI Assistant', icon: MessageSquareHeart, badge: 'AI' },
    { id: 'glossary', label: 'Rx Glossary', icon: BookOpen, badge: null },
  ] as const;

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-tr from-teal-700 to-teal-500 flex items-center justify-center text-white shadow-md shadow-teal-700/20">
                <Pill className="h-5 w-5 sm:h-6 sm:w-6 rotate-45" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 font-display">
                    MediScan<span className="text-teal-600 font-extrabold">AI</span>
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                    <Sparkles className="w-3 h-3 text-teal-600" /> Clinical OCR
                  </span>
                </div>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Prescription Scanner & Smart Medicine Schedule Assistant
                </p>
              </div>
            </div>

            {/* Quick Actions Right */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={onOpenScanner}
                className="hidden md:inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-xs cursor-pointer"
              >
                <Camera className="h-4 w-4" />
                Scan New Script
              </button>

              <button
                onClick={toggleSound}
                title={soundEnabled ? 'Mute alert sounds' : 'Unmute alert sounds'}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {soundEnabled ? <Volume2 className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600" /> : <VolumeX className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />}
              </button>

              <button
                onClick={() => setShowEmergencyModal(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-semibold rounded-lg text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
              >
                <PhoneCall className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Emergency Help</span>
                <span className="sm:hidden">911</span>
              </button>
            </div>
          </div>

          {/* Navigation Bar */}
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar border-t border-slate-100 py-1.5 -mb-px">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-teal-50 text-teal-700 font-semibold shadow-xs border border-teal-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge !== null && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Emergency Helpline Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600 font-bold">
                <PhoneCall className="h-5 w-5" />
                <h3 className="text-base sm:text-lg text-slate-900">Emergency & Poison Helpline</h3>
              </div>
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 text-sm">Immediate Life Threat / Ambulance</p>
                  <p className="text-xs text-rose-700">Chest pain, breathing distress, severe trauma</p>
                </div>
                <a
                  href="tel:911"
                  className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700"
                >
                  Call 911
                </a>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 text-sm">Poison Control Center (USA)</p>
                  <p className="text-xs text-amber-800">Accidental overdose, wrong medicine intake</p>
                </div>
                <a
                  href="tel:18002221222"
                  className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700"
                >
                  1-800-222-1222
                </a>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-600 leading-relaxed">
                  ⚠️ MediScan AI is an automated digital reader. If you or a loved one is having a medical emergency, do not wait for an app response—call emergency services immediately.
                </p>
              </div>
            </div>

            <div className="mt-5 text-right">
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
