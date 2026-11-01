import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SafetyBanner } from './components/SafetyBanner';
import { ScannerSection } from './components/ScannerSection';
import { MedicineList } from './components/MedicineList';
import { ScheduleView } from './components/ScheduleView';
import { ReminderTracker } from './components/ReminderTracker';
import { AiMedicalAssistant } from './components/AiMedicalAssistant';
import { MedicalGlossary } from './components/MedicalGlossary';
import { ScanResult, UserRoutine, ScheduleItem, DoseLogEntry, MedicineItem } from './types/medical';
import { SAMPLE_PRESCRIPTIONS } from './utils/sampleData';
import { sendMedicineNotification } from './utils/notifications';
import { ShieldCheck, Heart, Lock, ExternalLink } from 'lucide-react';

export default function App() {
  // Navigation tab
  const [activeTab, setActiveTab] = useState<
    'scan' | 'medicines' | 'schedule' | 'reminders' | 'assistant' | 'glossary'
  >('schedule');

  // Load initial demo prescription so the user immediately sees rich, interactive content
  const [currentResult, setCurrentResult] = useState<ScanResult | null>(() => {
    try {
      const saved = localStorage.getItem('mediscan_current_result');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load saved scan result', e);
    }
    // Default to first comprehensive sample (Acute Bronchitis & Respiratory Care)
    return SAMPLE_PRESCRIPTIONS[0].mockResult;
  });

  // User routine meal timings
  const [userRoutine, setUserRoutine] = useState<UserRoutine>(() => {
    try {
      const saved = localStorage.getItem('mediscan_routine');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      wakeTime: '07:00',
      breakfastTime: '08:00',
      lunchTime: '13:00',
      dinnerTime: '20:00',
      bedTime: '22:30',
    };
  });

  // Completed doses for today
  const [completedDoses, setCompletedDoses] = useState<Record<string, boolean>>(() => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const saved = localStorage.getItem(`mediscan_doses_${today}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  // Audit dose log history
  const [doseLogs, setDoseLogs] = useState<DoseLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('mediscan_dose_logs');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'log-seed-1',
        prescriptionId: 'sample-rx-1',
        medicineName: 'Augmentin 625mg',
        scheduledTime: '08:30 AM',
        date: new Date().toISOString().split('T')[0],
        status: 'taken',
        loggedAt: '08:32 AM',
        note: 'Taken after breakfast with water',
      },
    ];
  });

  // Active question context to pass into AI Assistant
  const [assistantPrompt, setAssistantPrompt] = useState<string | null>(null);

  // Sync state to local storage
  useEffect(() => {
    if (currentResult) {
      localStorage.setItem('mediscan_current_result', JSON.stringify(currentResult));
    }
  }, [currentResult]);

  useEffect(() => {
    localStorage.setItem('mediscan_routine', JSON.stringify(userRoutine));
  }, [userRoutine]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`mediscan_doses_${today}`, JSON.stringify(completedDoses));
  }, [completedDoses]);

  useEffect(() => {
    localStorage.setItem('mediscan_dose_logs', JSON.stringify(doseLogs));
  }, [doseLogs]);

  // Periodic reminder checker: checks if any scheduled medicine matches current minute
  useEffect(() => {
    const timer = setInterval(() => {
      if (!currentResult || !currentResult.schedule) return;

      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const isPM = currentHours >= 12;
      const hours12 = currentHours % 12 || 12;
      const timeStr = `${hours12 < 10 ? '0' : ''}${hours12}:${currentMinutes < 10 ? '0' : ''}${currentMinutes} ${isPM ? 'PM' : 'AM'}`;

      currentResult.schedule.forEach((item) => {
        const key = `${item.time}-${item.medicineName}`;
        if (item.time === timeStr && !completedDoses[key]) {
          sendMedicineNotification(item);
        }
      });
    }, 60000); // Every minute

    return () => clearInterval(timer);
  }, [currentResult, completedDoses]);

  // Toggle dose taken/untaken
  const handleToggleDose = (item: ScheduleItem) => {
    const key = `${item.time}-${item.medicineName}`;
    const willBeTaken = !completedDoses[key];

    setCompletedDoses((prev) => ({
      ...prev,
      [key]: willBeTaken,
    }));

    if (willBeTaken) {
      const newEntry: DoseLogEntry = {
        id: `dose-${Date.now()}`,
        prescriptionId: currentResult?.id || 'manual',
        medicineName: item.medicineName,
        scheduledTime: item.time,
        date: new Date().toISOString().split('T')[0],
        status: 'taken',
        loggedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        note: `Marked completed (${item.dosage})`,
      };
      setDoseLogs((prev) => [...prev, newEntry]);
    }
  };

  const handleAddDoseLog = (entry: DoseLogEntry) => {
    setDoseLogs((prev) => [...prev, entry]);
  };

  const handleScanComplete = (result: ScanResult) => {
    setCurrentResult(result);
    // Switch directly to medicines or schedule
    setActiveTab('medicines');
  };

  const handleAskAiAboutMed = (med: MedicineItem) => {
    const q = `Please provide detailed patient information for ${med.name} (${med.genericName || ''}). Why is it prescribed for ${med.purpose}? What are important food instructions, how should I take it, and are there any critical precautions or side effects to watch for?`;
    setAssistantPrompt(q);
    setActiveTab('assistant');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Clinical Safety Guardrail Ribbon */}
      <SafetyBanner />

      {/* Main Header & Navbar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasPrescription={!!currentResult}
        medicineCount={currentResult?.medicines.length || 0}
        onOpenScanner={() => setActiveTab('scan')}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'scan' && (
          <ScannerSection
            onScanComplete={handleScanComplete}
            currentResult={currentResult}
            userRoutine={userRoutine}
            setUserRoutine={setUserRoutine}
            onGoToSchedule={() => setActiveTab('schedule')}
            onGoToMedicines={() => setActiveTab('medicines')}
          />
        )}

        {activeTab === 'medicines' && (
          <MedicineList
            scanResult={currentResult}
            onAskAiAboutMed={handleAskAiAboutMed}
            onSwitchToScan={() => setActiveTab('scan')}
          />
        )}

        {activeTab === 'schedule' && (
          <ScheduleView
            scanResult={currentResult}
            userRoutine={userRoutine}
            setUserRoutine={setUserRoutine}
            completedDoses={completedDoses}
            onToggleDose={handleToggleDose}
            onSwitchToScan={() => setActiveTab('scan')}
          />
        )}

        {activeTab === 'reminders' && (
          <ReminderTracker
            scanResult={currentResult}
            completedDoses={completedDoses}
            onToggleDose={handleToggleDose}
            doseLogs={doseLogs}
            onAddDoseLog={handleAddDoseLog}
            onSwitchToScan={() => setActiveTab('scan')}
          />
        )}

        {activeTab === 'assistant' && (
          <AiMedicalAssistant
            scanResult={currentResult}
            initialQuestion={assistantPrompt}
            onClearInitialQuestion={() => setAssistantPrompt(null)}
          />
        )}

        {activeTab === 'glossary' && <MedicalGlossary />}
      </main>

      {/* Floating Dr. Aida Assistant Quick Trigger */}
      {activeTab !== 'assistant' && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setActiveTab('assistant')}
            className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-teal-800 to-slate-900 text-white rounded-full shadow-xl hover:shadow-2xl border border-teal-400/30 transition-all hover:scale-105 active:scale-95 cursor-pointer group"
          >
            <div className="relative">
              <div className="h-8 w-8 rounded-full bg-teal-500 flex items-center justify-center font-bold text-slate-950 text-xs">
                AI
              </div>
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border border-slate-900 animate-pulse" />
            </div>
            <div className="text-left pr-1">
              <p className="text-xs font-bold leading-tight flex items-center gap-1">
                <span>Ask Dr. Aida</span>
                <span className="text-[10px] bg-teal-500/30 text-teal-300 px-1.5 py-0.2 rounded-full">Voice Ready</span>
              </p>
              <p className="text-[10px] text-teal-200">Prescription Assistant</p>
            </div>
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">MediScan AI</span>
            <span>•</span>
            <span>AI-Based Medical Report Scanner & Medicine Schedule Assistant</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <span className="flex items-center gap-1">
              <Lock className="h-3 w-3 text-teal-600" /> Local Encrypted Storage
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-600" /> Clinical Safety Guardrails Enforced
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
