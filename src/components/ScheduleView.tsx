import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Printer,
  Download,
  CheckCircle,
  Circle,
  Settings,
  Utensils,
  Sun,
  Sunset,
  Moon,
  Sparkles,
  Share2,
  Volume2,
  Zap,
} from 'lucide-react';
import { ScheduleItem, ScanResult, UserRoutine } from '../types/medical';
import { soundManager } from '../utils/audio';
import { speechService } from '../utils/speech';

interface ScheduleViewProps {
  scanResult: ScanResult | null;
  userRoutine: UserRoutine;
  setUserRoutine: React.Dispatch<React.SetStateAction<UserRoutine>>;
  completedDoses: Record<string, boolean>;
  onToggleDose: (item: ScheduleItem) => void;
  onSwitchToScan: () => void;
  onAskAiAboutMed?: (medicineName: string) => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  scanResult,
  userRoutine,
  setUserRoutine,
  completedDoses,
  onToggleDose,
  onSwitchToScan,
  onAskAiAboutMed,
}) => {
  const [filterPeriod, setFilterPeriod] = useState<string>('all');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [speakingTime, setSpeakingTime] = useState<string | null>(null);

  if (!scanResult || scanResult.schedule.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs max-w-xl mx-auto my-8">
        <div className="h-16 w-16 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-4 border border-teal-100">
          <Calendar className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">No Medicine Schedule Generated</h3>
        <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
          Scan your doctor's prescription to automatically generate a chronological medicine timetable.
        </p>
        <button
          onClick={onSwitchToScan}
          className="mt-6 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition-colors shadow-xs cursor-pointer"
        >
          Scan Prescription
        </button>
      </div>
    );
  }

  const schedule = scanResult.schedule;

  // Filter schedule by period
  const filteredSchedule = schedule.filter((item) => {
    if (filterPeriod === 'all') return true;
    return (item.timePeriod || '').toLowerCase() === filterPeriod.toLowerCase();
  });

  // Calculate adherence progress for today
  const totalCount = schedule.length;
  const takenCount = schedule.filter((item) => {
    const key = `${item.time}-${item.medicineName}`;
    return !!completedDoses[key];
  }).length;
  const percentage = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;

  // Find next upcoming untaken dose
  const nextUntakenDose = schedule.find((item) => {
    const key = `${item.time}-${item.medicineName}`;
    return !completedDoses[key];
  });

  const handleSpeakItem = (item: ScheduleItem) => {
    const key = `${item.time}-${item.medicineName}`;
    if (speakingTime === key) {
      speechService.stop();
      setSpeakingTime(null);
    } else {
      setSpeakingTime(key);
      const textToSpeak = `At ${item.time}, take ${item.medicineName}, dosage ${item.dosage}. Doctor instructions: ${item.instructions}.`;
      speechService.speak(
        textToSpeak,
        () => setSpeakingTime(null),
        () => setSpeakingTime(null)
      );
    }
  };

  // Generate .ics calendar download
  const handleExportICS = () => {
    let icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//MediScan AI//Medicine Schedule//EN\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n`;

    const now = new Date();
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;

    schedule.forEach((item, idx) => {
      const match = item.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
      let hour = 8;
      let minute = 0;
      if (match) {
        hour = parseInt(match[1], 10);
        minute = parseInt(match[2], 10);
        if (match[3].toUpperCase() === 'PM' && hour < 12) hour += 12;
        if (match[3].toUpperCase() === 'AM' && hour === 12) hour = 0;
      }

      const start = `${dateStr}T${pad(hour)}${pad(minute)}00`;
      const end = `${dateStr}T${pad(hour)}${pad(minute + 15)}00`;

      icsContent += `BEGIN:VEVENT\nUID:mediscan-${idx}-${Date.now()}@mediscan.ai\nDTSTAMP:${dateStr}T000000Z\nDTSTART:${start}\nDTEND:${end}\nSUMMARY:💊 Take ${item.medicineName} (${item.dosage})\nDESCRIPTION:${item.instructions}. Food relation: ${item.foodRelation || 'as prescribed'}.\nSTATUS:CONFIRMED\nBEGIN:VALARM\nTRIGGER:-PT5M\nACTION:DISPLAY\nDESCRIPTION:Medicine Reminder: ${item.medicineName}\nEND:VALARM\nEND:VEVENT\n`;
    });

    icsContent += `END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Medicine_Schedule_${scanResult.patient?.name || 'Prescription'}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Schedule Header & Action Toolbar */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-display">
              Doctor's Prescribed Medicine Schedule
            </h2>
            <span className="text-xs font-bold bg-teal-50 text-teal-700 px-2.5 py-0.5 rounded-full border border-teal-200">
              Strictly Prescribed
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Chronological daily routine generated directly from the doctor's prescription.
          </p>
        </div>

        {/* Export & Settings Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            <Settings className="h-3.5 w-3.5 text-slate-500" />
            Routine Times
          </button>

          <button
            onClick={handleExportICS}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            title="Download .ics for Google or Apple Calendar"
          >
            <Download className="h-3.5 w-3.5 text-teal-600" />
            Export to Calendar (.ics)
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            Print Schedule
          </button>
        </div>
      </div>

      {/* Hero Focus Banner: Next Upcoming Dose */}
      {nextUntakenDose && (
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 rounded-3xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
          <div className="relative z-10 flex items-start gap-4">
            <div className="h-14 w-14 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex flex-col items-center justify-center shrink-0">
              <Clock className="h-6 w-6 text-teal-300" />
              <span className="text-[10px] font-bold text-teal-200 mt-0.5">NEXT</span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold bg-teal-500 text-slate-950 px-2 py-0.5 rounded-full">
                  Up Next at {nextUntakenDose.time}
                </span>
                <span className="text-xs text-teal-200 font-medium">
                  {nextUntakenDose.foodRelation?.replace('_', ' ') || 'As prescribed'}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mt-1">
                {nextUntakenDose.medicineName}{' '}
                <span className="text-sm font-semibold text-teal-300">({nextUntakenDose.dosage})</span>
              </h3>
              <p className="text-xs text-teal-100 mt-0.5">{nextUntakenDose.instructions}</p>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-3 self-end md:self-center">
            <button
              onClick={() => handleSpeakItem(nextUntakenDose)}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Read aloud"
            >
              <Volume2 className="h-5 w-5 text-teal-300" />
            </button>

            <button
              onClick={() => {
                onToggleDose(nextUntakenDose);
                soundManager.playSuccess();
              }}
              className="px-5 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-extrabold flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <CheckCircle className="h-4 w-4 text-slate-950" />
              <span>Mark Taken Now</span>
            </button>
          </div>
        </div>
      )}

      {/* Today's Adherence Metric Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center font-bold text-teal-700 text-base">
            {percentage}%
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900">Today's Daily Adherence</h4>
            <p className="text-xs text-slate-500">
              {takenCount} of {totalCount} doses completed today
            </p>
          </div>
        </div>

        <div className="w-full sm:w-64">
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-600 rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-[11px] text-right text-slate-500 mt-1 font-medium">
            {takenCount === totalCount && totalCount > 0
              ? '🎉 All doses complete for today!'
              : `${totalCount - takenCount} doses remaining`}
          </p>
        </div>
      </div>

      {/* Period Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Day' },
          { id: 'morning', label: 'Morning (Breakfast)' },
          { id: 'afternoon', label: 'Afternoon (Lunch)' },
          { id: 'evening', label: 'Evening (Dinner)' },
          { id: 'night', label: 'Night (Bedtime)' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterPeriod(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              filterPeriod === tab.id
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chronological Prescribed Schedule Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4 w-12 text-center">Status</th>
                <th className="py-3 px-4 w-32">Time</th>
                <th className="py-3 px-4 w-52">Medicine & Dose</th>
                <th className="py-3 px-4">Doctor's Instructions & Food Timing</th>
                <th className="py-3 px-4 w-36 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {filteredSchedule.map((item, index) => {
                const key = `${item.time}-${item.medicineName}`;
                const isTaken = !!completedDoses[key];
                const isSpeakingThis = speakingTime === key;

                return (
                  <tr
                    key={index}
                    className={`transition-colors ${
                      isTaken ? 'bg-emerald-50/40 text-slate-600' : 'hover:bg-slate-50/80 text-slate-900'
                    }`}
                  >
                    {/* Status Checkbox */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => {
                          onToggleDose(item);
                          if (!isTaken) soundManager.playSuccess();
                        }}
                        className="cursor-pointer"
                        title={isTaken ? 'Mark as not taken' : 'Mark as taken'}
                      >
                        {isTaken ? (
                          <CheckCircle className="h-5 w-5 text-emerald-600 inline" />
                        ) : (
                          <Circle className="h-5 w-5 text-slate-300 hover:text-teal-600 inline" />
                        )}
                      </button>
                    </td>

                    {/* Time */}
                    <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-teal-600" />
                        <span className={isTaken ? 'line-through text-slate-400' : 'text-slate-900 font-extrabold'}>
                          {item.time}
                        </span>
                      </div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block ml-5">
                        {item.timePeriod || 'Day'}
                      </span>
                    </td>

                    {/* Medicine */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">
                        <span className={isTaken ? 'line-through text-slate-400' : 'text-slate-900'}>
                          {item.medicineName}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-teal-700">{item.dosage}</div>
                    </td>

                    {/* Instructions */}
                    <td className="py-3.5 px-4">
                      <p className={`leading-relaxed ${isTaken ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                        {item.instructions}
                      </p>
                      {item.specialNote && (
                        <p className="text-[11px] text-amber-800 bg-amber-50/80 px-2 py-0.5 rounded-md inline-block mt-1">
                          💡 {item.specialNote}
                        </p>
                      )}
                    </td>

                    {/* Action button & Read Aloud */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleSpeakItem(item)}
                          className={`p-1.5 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-slate-100 transition-colors cursor-pointer ${
                            isSpeakingThis ? 'text-teal-600 bg-teal-50 animate-pulse' : ''
                          }`}
                          title="Read instruction aloud"
                        >
                          <Volume2 className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => {
                            onToggleDose(item);
                            if (!isTaken) soundManager.playSuccess();
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isTaken
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white border border-teal-200'
                          }`}
                        >
                          {isTaken ? 'Taken ✓' : 'Mark Taken'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Routine Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900">Customize Daily Meal Timings</h3>
            <p className="text-xs text-slate-500 mt-1">
              Adjust your personal waking and meal habits. We synchronize your before/after food medicine timings accordingly.
            </p>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-800">Breakfast Time</span>
                <input
                  type="time"
                  value={userRoutine.breakfastTime}
                  onChange={(e) => setUserRoutine({ ...userRoutine, breakfastTime: e.target.value })}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-800">Lunch Time</span>
                <input
                  type="time"
                  value={userRoutine.lunchTime}
                  onChange={(e) => setUserRoutine({ ...userRoutine, lunchTime: e.target.value })}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-800">Dinner Time</span>
                <input
                  type="time"
                  value={userRoutine.dinnerTime}
                  onChange={(e) => setUserRoutine({ ...userRoutine, dinnerTime: e.target.value })}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-800">Bedtime</span>
                <input
                  type="time"
                  value={userRoutine.bedTime}
                  onChange={(e) => setUserRoutine({ ...userRoutine, bedTime: e.target.value })}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 cursor-pointer"
              >
                Save & Update Timetable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
