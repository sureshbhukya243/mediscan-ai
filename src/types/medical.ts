export interface DoctorInfo {
  name?: string;
  hospitalOrClinic?: string;
  specialty?: string;
  date?: string;
  registrationNumber?: string;
}

export interface PatientInfo {
  name?: string;
  age?: string;
  gender?: string;
  diagnosisOrVitals?: string;
}

export type TimingRelation =
  | 'before_food'
  | 'after_food'
  | 'with_food'
  | 'empty_stomach'
  | 'bedtime'
  | 'unspecified';

export interface MedicineItem {
  id: string;
  name: string;
  genericName?: string;
  form?: 'tablet' | 'capsule' | 'syrup' | 'drops' | 'injection' | 'inhaler' | 'ointment' | string;
  dosage: string;
  frequency: string;
  timesPerDay?: number;
  timingRelation: TimingRelation;
  duration?: string;
  purpose: string;
  prescribedTimeSlots?: string[];
  specialInstructions?: string;
  unclearOrAmbiguous?: boolean;
  unclearNotes?: string;
  precautions?: string[];
}

export interface ScheduleItem {
  id?: string;
  time: string; // e.g. "08:00 AM"
  timePeriod?: 'morning' | 'afternoon' | 'evening' | 'night' | string;
  medicineName: string;
  dosage: string;
  instructions: string;
  foodRelation?: TimingRelation | string;
  specialNote?: string;
  taken?: boolean;
  takenAt?: string;
}

export interface ScanResult {
  id: string;
  scannedAt: string;
  imagePreview?: string;
  fileName?: string;
  doctor?: DoctorInfo;
  patient?: PatientInfo;
  rawExtractedText: string;
  medicines: MedicineItem[];
  schedule: ScheduleItem[];
  clarificationsAndWarnings: string[];
  overallClinicalSummary: string;
}

export interface UserRoutine {
  wakeTime: string;
  breakfastTime: string;
  lunchTime: string;
  dinnerTime: string;
  bedTime: string;
}

export interface DoseLogEntry {
  id: string;
  prescriptionId: string;
  medicineName: string;
  scheduledTime: string;
  date: string; // YYYY-MM-DD
  status: 'taken' | 'skipped' | 'snoozed';
  loggedAt: string;
  note?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}
