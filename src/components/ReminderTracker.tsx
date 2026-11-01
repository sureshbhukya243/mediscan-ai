import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Volume2,
  Calendar,
  AlertCircle,
  ShieldCheck,
  Award,
  Zap,
} from 'lucide-react';
import { ScheduleItem, ScanResult, DoseLogEntry } from '../types/medical';
import { requestNotificationPermission, sendMedicineNotification } from '../utils/notifications';
import { soundManager } from '../utils/audio';

interface ReminderTrackerProps {
  scanResult: ScanResult | null;
  completedDoses: Record<string, boolean>;
  onToggleDose: (item: ScheduleItem) => void;
  doseLogs: DoseLogEntry[];
  onAddDoseLog: (entry: DoseLogEntry) => void;
  onSwitchToScan: () => void;
}

export const ReminderTracker: React.FC<ReminderTrackerProps> = ({
  scanResult,
  completedDoses,
  onToggleDose,
  doseLogs,
  onAddDoseLog,
  onSwitchToScan,
}) => {
  const [permissionStatus, setPermissionStatus] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const [activeRemindersEnabled, setActiveRemindersEnabled] = useState(true);
  const [snoozedItems, setSnoozedItems] = useState<Record<string, number>>({});

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setPermissionStatus(res);
    if (res === 'granted') {
      soundManager.playSuccess();
    }
  };

  const handleTestNotification = () => {
    soundManager.playChime();
    if (scanResult && scanResult.schedule.length > 0) {
      sendMedicineNotification(scanResult.schedule[0]);
    } else {
      sendMedicineNotification({
        time: 'Now',
        medicineName: 'Augmentin 625mg',
        dosage: '1 tablet',
        instructions: 'Test reminder: Take after food with water',
      });
    }
  };

  const handleSnooze = (item: ScheduleItem) => {
    const key = `${item.time}-${item.medicineName}`;
    const snoozeUntil = Date.now() + 15 * 60 * 1000; // 15 mins
    setSnoozedItems((prev) => ({ ...prev, [key]: snoozeUntil }));
    soundManager.playChime();

    onAddDoseLog({
      id: `log-${Date.now()}`,
      prescriptionId: scanResult?.id || 'current',
      medicineName: item.medicineName,
      scheduledTime: item.time,
      date: new Date().toISOString().split('T')[0],
      status: 'snoozed',
      loggedAt: new Date().toLocaleTimeString(),
      note: 'Snoozed for 15 minutes',
    });
  };

  const handleMarkTaken = (item: ScheduleItem) => {
    const key = `${item.time}-${item.medicineName}`;
    onToggleDose(item);
    soundManager.playSuccess();

    onAddDoseLog({
      id: `log-${Date.now()}`,
      prescriptionId: scanResult?.id || 'current',
      medicineName: item.medicineName,
      scheduledTime: item.time,
      date: new Date().toISOString().split('T')[0],
      status: 'taken',
      loggedAt: new Date().toLocaleTimeString(),
    });
  };

  const handleMarkSkipped = (item: ScheduleItem) => {
    onAddDoseLog({
      id: `log-${Date.now()}`,
      prescriptionId: scanResult?.id || 'current',
      medicineName: item.medicineName,
      scheduledTime: item.time,
      date: new Date().toISOString().split('T')[0],
      status: 'skipped',
      loggedAt: new Date().toLocaleTimeString(),
      note: 'Marked skipped by user',
    });
  };

  if (!scanResult || scanResult.schedule.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs max-w-xl mx-auto my-8">
        <div className="h-16 w-16 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-4 border border-teal-100">
          <Bell className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">No Reminders Configured</h3>
        <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
          Scan your doctor's prescription to configure automated reminders and tracking alerts for your medications.
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
  const takenCount = schedule.filter((i) => completedDoses[`${i.time}-${i.medicineName}`]).length;
  const adherenceRate = schedule.length > 0 ? Math.round((takenCount / schedule.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Notification Control Box */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-display">
              Medicine Reminders & Dose Log
            </h2>
            <span className="text-xs font-bold bg-teal-50 text-teal-700 px-2.5 py-0.5 rounded-full border border-teal-200">
              Active Monitoring
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Browser alarms and auditory chimes notify you when it's time to take your prescribed doses.
          </p>
        </div>

        {/* Notification Status / Test Button */}
        <div className="flex flex-wrap items-center gap-2">
          {permissionStatus !== 'granted' ? (
            <button
              onClick={handleRequestPermission}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition-colors shadow-xs cursor-pointer"
            >
              <BellRing className="h-3.5 w-3.5" />
              Enable Browser Alerts
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Notifications Active
            </span>
          )}

          <button
            onClick={handleTestNotification}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
          >
            <Volume2 className="h-3.5 w-3.5 text-teal-600" />
            Test Chime & Alert
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-lg border border-teal-100">
            {adherenceRate}%
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Adherence</p>
            <p className="text-sm font-bold text-slate-900 mt-0.5">
              {takenCount} of {schedule.length} Doses Taken
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-lg border border-amber-100">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Scheduled Today</p>
            <p className="text-sm font-bold text-slate-900 mt-0.5">{schedule.length} Timed Doses</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-lg border border-indigo-100">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Logged In History</p>
            <p className="text-sm font-bold text-slate-900 mt-0.5">{doseLogs.length} Completed Records</p>
          </div>
        </div>
      </div>

      {/* Active Daily Alarms List */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-teal-600" />
            <h3 className="text-base font-bold text-slate-900">Today's Active Medication Timers</h3>
          </div>
          <span className="text-xs text-slate-500">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
        </div>

        <div className="space-y-3">
          {schedule.map((item, index) => {
            const key = `${item.time}-${item.medicineName}`;
            const isTaken = !!completedDoses[key];
            const isSnoozed = !!snoozedItems[key] && snoozedItems[key] > Date.now();

            return (
              <div
                key={index}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isTaken
                    ? 'bg-slate-50/60 border-slate-200 text-slate-500'
                    : isSnoozed
                    ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                    : 'bg-white border-slate-200 hover:border-teal-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      isTaken
                        ? 'bg-emerald-100 text-emerald-800'
                        : isSnoozed
                        ? 'bg-amber-200 text-amber-900 animate-pulse'
                        : 'bg-teal-50 text-teal-800 border border-teal-200'
                    }`}
                  >
                    {item.time.split(' ')[0]}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500">{item.time}</span>
                      {isSnoozed && (
                        <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded">
                          Snoozed (15m)
                        </span>
                      )}
                      {isTaken && (
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                          Taken Today
                        </span>
                      )}
                    </div>

                    <h4 className={`text-sm font-bold mt-0.5 ${isTaken ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                      {item.medicineName} <span className="text-xs font-semibold text-teal-700">({item.dosage})</span>
                    </h4>

                    <p className="text-xs text-slate-600 mt-0.5">{item.instructions}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {!isTaken && (
                    <>
                      <button
                        onClick={() => handleSnooze(item)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
                        title="Remind me again in 15 minutes"
                      >
                        Snooze 15m
                      </button>

                      <button
                        onClick={() => handleMarkSkipped(item)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-700 text-slate-500 text-xs font-semibold cursor-pointer"
                        title="Skip dose"
                      >
                        Skip
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => handleMarkTaken(item)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isTaken
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-teal-600 text-white hover:bg-teal-700 shadow-xs'
                    }`}
                  >
                    {isTaken ? 'Completed ✓' : 'Mark Taken'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Historical Dose Log */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-teal-600" />
            <h3 className="text-base font-bold text-slate-900">Medication History & Compliance Audit Log</h3>
          </div>
          <span className="text-xs text-slate-400">{doseLogs.length} Total records</span>
        </div>

        {doseLogs.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">
            No medication events logged yet today. Doses marked as taken, snoozed, or skipped will be recorded here with timestamps.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Medicine</th>
                  <th className="py-2 px-3">Scheduled Time</th>
                  <th className="py-2 px-3">Logged At</th>
                  <th className="py-2 px-3">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {doseLogs.slice(-10).reverse().map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3">
                      {log.status === 'taken' && (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="h-3 w-3" /> Taken
                        </span>
                      )}
                      {log.status === 'snoozed' && (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                          <RotateCcw className="h-3 w-3" /> Snoozed
                        </span>
                      )}
                      {log.status === 'skipped' && (
                        <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                          <XCircle className="h-3 w-3" /> Skipped
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-800">{log.medicineName}</td>
                    <td className="py-2.5 px-3 text-slate-600">{log.scheduledTime}</td>
                    <td className="py-2.5 px-3 text-slate-500">{log.loggedAt}</td>
                    <td className="py-2.5 px-3 text-slate-500">{log.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
