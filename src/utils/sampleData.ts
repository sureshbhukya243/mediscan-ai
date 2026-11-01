import { ScanResult } from '../types/medical';

// Helper to generate a realistic SVG prescription slip data URL
function createSamplePrescriptionImage(doctor: string, clinic: string, patient: string, rxText: string[]): string {
  const linesSvg = rxText
    .map(
      (line, i) =>
        `<text x="40" y="${220 + i * 36}" font-family="Courier, monospace" font-size="16" fill="#1e293b" font-weight="600">${line}</text>`
    )
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="600" viewBox="0 0 700 600" style="background:#fffcf5;">
    <!-- Clinic Header -->
    <rect width="100%" height="110" fill="#0f766e" />
    <text x="40" y="42" font-family="'Plus Jakarta Sans', sans-serif" font-size="22" font-weight="bold" fill="#ffffff">${clinic}</text>
    <text x="40" y="70" font-family="'Plus Jakarta Sans', sans-serif" font-size="14" fill="#ccfbf1">Attending: ${doctor} | Reg No: MED-994821</text>
    <text x="40" y="92" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" fill="#99f6e4">Contact: (555) 019-2834 | Open 24/7 Emergency</text>

    <!-- Patient Subheader -->
    <rect x="25" y="125" width="650" height="50" rx="8" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1" />
    <text x="40" y="156" font-family="'Plus Jakarta Sans', sans-serif" font-size="14" fill="#334155" font-weight="bold">Patient: ${patient}</text>
    <text x="520" y="156" font-family="'Plus Jakarta Sans', sans-serif" font-size="13" fill="#64748b">Date: ${new Date().toLocaleDateString()}</text>

    <!-- Rx Symbol -->
    <text x="35" y="210" font-family="Georgia, serif" font-size="32" font-weight="bold" font-style="italic" fill="#0f766e">℞</text>

    <!-- Prescription Lines -->
    ${linesSvg}

    <!-- Watermark / Footer -->
    <line x1="40" y1="520" x2="660" y2="520" stroke="#e2e8f0" stroke-width="1" />
    <text x="40" y="550" font-family="'Plus Jakarta Sans', sans-serif" font-size="11" fill="#94a3b8">Note: Take medicines strictly as directed. Keep out of reach of children. Store below 25°C.</text>
    <path d="M 500 500 Q 530 460 560 500 T 620 490" fill="none" stroke="#0f766e" stroke-width="2" opacity="0.6"/>
    <text x="520" y="525" font-family="cursive" font-size="16" fill="#0f766e">Dr. Signature</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const SAMPLE_PRESCRIPTIONS: {
  title: string;
  category: string;
  description: string;
  imageData: string;
  mockResult: ScanResult;
}[] = [
  {
    title: 'Acute Bronchitis & Chest Congestion',
    category: 'Pulmonology / General Medicine',
    description: 'Dr. Sarah Jenkins - Antibiotics, Antihistamine, Cough Syrup, & Antipyretic',
    imageData: createSamplePrescriptionImage(
      'Dr. Sarah Jenkins, MD (Pulmonology)',
      'METRO CHEST & HEALTH CLINIC',
      'James Miller, 42 Y / Male - Dx: Acute Bronchitis',
      [
        '1. Tab. Augmentin 625mg (Amoxicillin + Clavulanic Acid)',
        '   1 tab twice daily (1-0-1) - After meals - x 5 days',
        '2. Tab. Levocetirizine 5mg',
        '   1 tab at bedtime (0-0-1) - x 7 days',
        '3. Syp. Ascoril-D (Dextromethorphan + Phenylephrine)',
        '   10ml three times daily (1-1-1) - After food - x 5 days',
        '4. Tab. Paracetamol 650mg',
        '   1 tab SOS (only if body temp > 100°F) - After food',
      ]
    ),
    mockResult: {
      id: 'sample-rx-1',
      scannedAt: new Date().toISOString(),
      fileName: 'Sample_Prescription_Bronchitis.pdf',
      doctor: {
        name: 'Dr. Sarah Jenkins, MD',
        hospitalOrClinic: 'Metro Chest & Health Clinic',
        specialty: 'Pulmonology & General Medicine',
        date: 'Today',
        registrationNumber: 'MED-994821',
      },
      patient: {
        name: 'James Miller',
        age: '42',
        gender: 'Male',
        diagnosisOrVitals: 'Acute Bronchitis, persistent cough, low-grade fever',
      },
      rawExtractedText: `METRO CHEST & HEALTH CLINIC\nAttending: Dr. Sarah Jenkins, MD | Reg No: MED-994821\nPatient: James Miller (42Y / M)\nRx:\n1. Tab Augmentin 625mg - 1 tab twice daily (1-0-1) after meals x 5 days\n2. Tab Levocetirizine 5mg - 1 tab at bedtime (0-0-1) x 7 days\n3. Syp Ascoril-D - 10ml three times daily (1-1-1) after food x 5 days\n4. Tab Paracetamol 650mg - 1 tab SOS if fever > 100°F`,
      medicines: [
        {
          id: 'med-1',
          name: 'Augmentin 625mg',
          genericName: 'Amoxicillin (500mg) + Clavulanic Acid (125mg)',
          form: 'tablet',
          dosage: '625 mg (1 tablet)',
          frequency: 'Twice daily (1-0-1)',
          timesPerDay: 2,
          timingRelation: 'after_food',
          duration: '5 days (complete the full course)',
          purpose: 'Broad-spectrum antibiotic to eliminate bacterial respiratory infection in the bronchial airways.',
          prescribedTimeSlots: ['08:30 AM', '08:30 PM'],
          specialInstructions: 'Swallow whole with plenty of water. Do not stop early even if feeling better.',
          unclearOrAmbiguous: false,
          precautions: ['Take with or immediately after a meal to reduce stomach upset', 'Do not skip doses'],
        },
        {
          id: 'med-2',
          name: 'Levocetirizine 5mg',
          genericName: 'Levocetirizine Dihydrochloride',
          form: 'tablet',
          dosage: '5 mg (1 tablet)',
          frequency: 'Once daily at bedtime (0-0-1)',
          timesPerDay: 1,
          timingRelation: 'bedtime',
          duration: '7 days',
          purpose: 'Antihistamine that relieves allergic nasal congestion, sneezing, throat tickling, and runny nose.',
          prescribedTimeSlots: ['10:00 PM'],
          specialInstructions: 'Take 30 minutes before going to sleep.',
          unclearOrAmbiguous: false,
          precautions: ['May cause mild drowsiness; avoid driving or operating heavy machinery after taking'],
        },
        {
          id: 'med-3',
          name: 'Ascoril-D Cough Syrup',
          genericName: 'Dextromethorphan HBr + Phenylephrine HCl + Chlorpheniramine',
          form: 'syrup',
          dosage: '10 ml (2 medicine spoons)',
          frequency: 'Three times daily (1-1-1)',
          timesPerDay: 3,
          timingRelation: 'after_food',
          duration: '5 days',
          purpose: 'Cough suppressant and decongestant to calm dry hacking cough and ease breathing.',
          prescribedTimeSlots: ['09:00 AM', '02:00 PM', '09:00 PM'],
          specialInstructions: 'Shake bottle well before use. Use measured measuring cup.',
          unclearOrAmbiguous: false,
          precautions: ['Avoid drinking large amounts of water immediately after syrup to allow throat coating action'],
        },
        {
          id: 'med-4',
          name: 'Paracetamol 650mg',
          genericName: 'Acetaminophen / Paracetamol',
          form: 'tablet',
          dosage: '650 mg (1 tablet)',
          frequency: 'SOS (As needed when body temp > 100°F)',
          timesPerDay: 0,
          timingRelation: 'after_food',
          duration: 'As needed (max 3 times/day)',
          purpose: 'Antipyretic and analgesic for fever reduction and relieving body aches and headache.',
          prescribedTimeSlots: ['As needed'],
          specialInstructions: 'Maintain at least 6 hours gap between two tablets. Do not exceed 3 tablets in 24 hours.',
          unclearOrAmbiguous: false,
          precautions: ['Do not consume alongside other paracetamol-containing cough/cold remedies'],
        },
      ],
      schedule: [
        {
          time: '08:30 AM',
          timePeriod: 'morning',
          medicineName: 'Augmentin 625mg',
          dosage: '1 tablet (625mg)',
          instructions: 'As prescribed, after breakfast with water',
          foodRelation: 'after_food',
          specialNote: 'First antibiotic dose of the day',
        },
        {
          time: '09:00 AM',
          timePeriod: 'morning',
          medicineName: 'Ascoril-D Cough Syrup',
          dosage: '10 ml',
          instructions: 'As prescribed, 10ml after morning meal',
          foodRelation: 'after_food',
          specialNote: 'Shake bottle well',
        },
        {
          time: '02:00 PM',
          timePeriod: 'afternoon',
          medicineName: 'Ascoril-D Cough Syrup',
          dosage: '10 ml',
          instructions: 'As prescribed, 10ml after lunch',
          foodRelation: 'after_food',
          specialNote: 'Mid-day cough relief',
        },
        {
          time: '08:30 PM',
          timePeriod: 'evening',
          medicineName: 'Augmentin 625mg',
          dosage: '1 tablet (625mg)',
          instructions: 'As prescribed, after dinner with water',
          foodRelation: 'after_food',
          specialNote: 'Second antibiotic dose (maintain ~12 hr interval)',
        },
        {
          time: '09:00 PM',
          timePeriod: 'evening',
          medicineName: 'Ascoril-D Cough Syrup',
          dosage: '10 ml',
          instructions: 'As prescribed, 10ml after dinner',
          foodRelation: 'after_food',
          specialNote: 'Night cough relief',
        },
        {
          time: '10:00 PM',
          timePeriod: 'night',
          medicineName: 'Levocetirizine 5mg',
          dosage: '1 tablet (5mg)',
          instructions: 'As prescribed, at bedtime with water',
          foodRelation: 'bedtime',
          specialNote: 'Prevents nighttime coughing and congestion',
        },
      ],
      clarificationsAndWarnings: [
        'Complete the 5-day course of Augmentin antibiotic completely; do not stop early even if cough disappears.',
        'Paracetamol is prescribed SOS (as-needed) only for fever > 100°F; do not take on a fixed hourly schedule if no fever.',
        'Drink at least 2 to 3 liters of warm liquids daily to loosen respiratory mucus.',
      ],
      overallClinicalSummary:
        'Prescription for acute bronchial inflammation with chest congestion. Regimen consists of an antibiotic (Augmentin) twice daily, a cough suppressant 3 times daily, a nighttime antihistamine for easy sleep, and SOS fever reducer.',
    },
  },
  {
    title: 'Hypertension & Type 2 Diabetes Management',
    category: 'Cardiology / Endocrinology',
    description: 'Dr. Ramesh Gupta - Telmisartan, Metformin SR, Atorvastatin',
    imageData: createSamplePrescriptionImage(
      'Dr. Ramesh Gupta, MD, DM (Cardio)',
      'HEART & METABOLIC CARE CENTER',
      'Eleanor Vance, 56 Y / Female - Dx: T2DM + Essential HTN',
      [
        '1. Tab. Telmisartan 40mg',
        '   1 tab daily in the morning (1-0-0) - Before breakfast - Ongoing',
        '2. Tab. Metformin 500mg SR',
        '   1 tab twice daily (1-0-1) - With meals (breakfast & dinner) - Ongoing',
        '3. Tab. Atorvastatin 20mg',
        '   1 tab once daily at bedtime (0-0-1) - After dinner - Ongoing',
        '4. Note: Blood Pressure target < 130/80 mmHg. Monitor fasting glucose.',
      ]
    ),
    mockResult: {
      id: 'sample-rx-2',
      scannedAt: new Date().toISOString(),
      fileName: 'Sample_Prescription_CardioMetabolic.pdf',
      doctor: {
        name: 'Dr. Ramesh Gupta, MD, DM',
        hospitalOrClinic: 'Heart & Metabolic Care Center',
        specialty: 'Cardiology & Metabolic Medicine',
        date: 'Today',
        registrationNumber: 'CARD-40281',
      },
      patient: {
        name: 'Eleanor Vance',
        age: '56',
        gender: 'Female',
        diagnosisOrVitals: 'Essential Hypertension (BP: 148/92 mmHg), Type 2 Diabetes (HbA1c: 7.4%)',
      },
      rawExtractedText: `HEART & METABOLIC CARE CENTER\nAttending: Dr. Ramesh Gupta, MD, DM | Reg No: CARD-40281\nPatient: Eleanor Vance (56Y / F)\nRx:\n1. Tab Telmisartan 40mg - 1-0-0 before breakfast daily\n2. Tab Metformin 500mg SR - 1-0-1 with meals (breakfast & dinner)\n3. Tab Atorvastatin 20mg - 0-0-1 at bedtime\nNote: Maintain low sodium diet. Check BP weekly.`,
      medicines: [
        {
          id: 'med-201',
          name: 'Telmisartan 40mg',
          genericName: 'Telmisartan',
          form: 'tablet',
          dosage: '40 mg (1 tablet)',
          frequency: 'Once daily (1-0-0)',
          timesPerDay: 1,
          timingRelation: 'before_food',
          duration: 'Ongoing maintenance',
          purpose: 'Angiotensin II Receptor Blocker (ARB) to relax arterial blood vessels and lower high blood pressure.',
          prescribedTimeSlots: ['07:30 AM'],
          specialInstructions: 'Take at the same time every morning before breakfast.',
          unclearOrAmbiguous: false,
          precautions: ['Do not stop abruptly without consulting doctor', 'Monitor blood pressure regularly'],
        },
        {
          id: 'med-202',
          name: 'Metformin 500mg SR',
          genericName: 'Metformin Hydrochloride (Sustained Release)',
          form: 'tablet',
          dosage: '500 mg (1 tablet)',
          frequency: 'Twice daily (1-0-1)',
          timesPerDay: 2,
          timingRelation: 'with_food',
          duration: 'Ongoing maintenance',
          purpose: 'Biguanide antidiabetic that improves insulin sensitivity and controls blood glucose levels.',
          prescribedTimeSlots: ['08:00 AM', '08:00 PM'],
          specialInstructions: 'Swallow whole with food. Do not chew or crush sustained release tablets.',
          unclearOrAmbiguous: false,
          precautions: ['Taking with food prevents gastrointestinal discomfort and nausea'],
        },
        {
          id: 'med-203',
          name: 'Atorvastatin 20mg',
          genericName: 'Atorvastatin Calcium',
          form: 'tablet',
          dosage: '20 mg (1 tablet)',
          frequency: 'Once daily at bedtime (0-0-1)',
          timesPerDay: 1,
          timingRelation: 'bedtime',
          duration: 'Ongoing maintenance',
          purpose: 'Statin to reduce LDL (bad cholesterol) and protect against cardiovascular events.',
          prescribedTimeSlots: ['10:00 PM'],
          specialInstructions: 'Take at night before sleeping when the liver synthesizes the most cholesterol.',
          unclearOrAmbiguous: false,
          precautions: ['Avoid grapefruit and grapefruit juice while on atorvastatin', 'Report any unexplained muscle pain'],
        },
      ],
      schedule: [
        {
          time: '07:30 AM',
          timePeriod: 'morning',
          medicineName: 'Telmisartan 40mg',
          dosage: '1 tablet (40mg)',
          instructions: 'As prescribed, 30 minutes before breakfast',
          foodRelation: 'before_food',
          specialNote: 'Blood pressure control',
        },
        {
          time: '08:00 AM',
          timePeriod: 'morning',
          medicineName: 'Metformin 500mg SR',
          dosage: '1 tablet (500mg)',
          instructions: 'As prescribed, with breakfast meal',
          foodRelation: 'with_food',
          specialNote: 'Morning glucose control (swallow whole)',
        },
        {
          time: '08:00 PM',
          timePeriod: 'evening',
          medicineName: 'Metformin 500mg SR',
          dosage: '1 tablet (500mg)',
          instructions: 'As prescribed, with dinner meal',
          foodRelation: 'with_food',
          specialNote: 'Evening glucose control',
        },
        {
          time: '10:00 PM',
          timePeriod: 'night',
          medicineName: 'Atorvastatin 20mg',
          dosage: '1 tablet (20mg)',
          instructions: 'As prescribed, at bedtime',
          foodRelation: 'bedtime',
          specialNote: 'Cholesterol management',
        },
      ],
      clarificationsAndWarnings: [
        'Do not skip or stop blood pressure or cholesterol medicines on days when you feel healthy.',
        'Always take Metformin WITH food to prevent stomach cramps.',
        'Notify your physician if you experience unusual fatigue, dark urine, or severe muscle aches.',
      ],
      overallClinicalSummary:
        'Chronic maintenance therapy for cardiovascular and metabolic management. Controls high blood pressure with morning Telmisartan, regulates blood sugar with morning and evening Metformin SR, and manages lipids with bedtime Atorvastatin.',
    },
  },
  {
    title: 'Acid Reflux (GERD) & Gastric Ulcer Therapy',
    category: 'Gastroenterology',
    description: 'Dr. Elena Rostova - Pantoprazole, Domperidone, Mucaine Gel',
    imageData: createSamplePrescriptionImage(
      'Dr. Elena Rostova, MD (Gastro)',
      'DIGESTIVE HEALTH ASSOCIATES',
      'Robert Chen, 35 Y / Male - Dx: GERD with Esophagitis',
      [
        '1. Cap. Pantoprazole 40mg + Domperidone 30mg SR',
        '   1 capsule once daily in morning (1-0-0) - Empty stomach 45m before breakfast - x 14 days',
        '2. Syp. Mucaine Gel (Oxetacaine + Al(OH)3 + Mg(OH)2)',
        '   10ml as needed 1 hour after meals and before bedtime - x 10 days',
        '3. Probiotic Spore Capsule',
        '   1 capsule after lunch (0-1-0) - x 14 days',
        '4. Note: Avoid spicy foods, caffeine, lying down within 2 hours of dinner.',
      ]
    ),
    mockResult: {
      id: 'sample-rx-3',
      scannedAt: new Date().toISOString(),
      fileName: 'Sample_Prescription_GERD.pdf',
      doctor: {
        name: 'Dr. Elena Rostova, MD',
        hospitalOrClinic: 'Digestive Health Associates',
        specialty: 'Gastroenterology',
        date: 'Today',
        registrationNumber: 'GASTRO-8271',
      },
      patient: {
        name: 'Robert Chen',
        age: '35',
        gender: 'Male',
        diagnosisOrVitals: 'Gastroesophageal Reflux Disease (GERD), heartburn, gastric hyperacidity',
      },
      rawExtractedText: `DIGESTIVE HEALTH ASSOCIATES\nDr. Elena Rostova, MD | Reg No: GASTRO-8271\nPatient: Robert Chen (35Y / M)\nRx:\n1. Cap Pantoprazole 40mg + Domperidone 30mg SR - 1-0-0 empty stomach 45 mins before breakfast x 14 days\n2. Syp Mucaine Gel - 10ml 1 hour after meals and bedtime x 10 days\n3. Probiotic Spore Capsule - 0-1-0 after lunch x 14 days`,
      medicines: [
        {
          id: 'med-301',
          name: 'Pantoprazole 40mg + Domperidone 30mg SR',
          genericName: 'Pantoprazole Sodium + Domperidone SR',
          form: 'capsule',
          dosage: '1 capsule (40mg/30mg)',
          frequency: 'Once daily in the morning (1-0-0)',
          timesPerDay: 1,
          timingRelation: 'empty_stomach',
          duration: '14 days',
          purpose: 'Proton Pump Inhibitor (PPI) combined with a prokinetic to suppress stomach acid and prevent reflux backflow.',
          prescribedTimeSlots: ['07:15 AM'],
          specialInstructions: 'Must be taken on an empty stomach with a glass of water, at least 45 minutes before breakfast.',
          unclearOrAmbiguous: false,
          precautions: ['Do not open or chew the sustained release capsule'],
        },
        {
          id: 'med-302',
          name: 'Mucaine Gel Antacid',
          genericName: 'Oxetacaine + Aluminium Hydroxide + Magnesium Hydroxide',
          form: 'syrup',
          dosage: '10 ml',
          frequency: 'After meals and bedtime (SOS/regular)',
          timesPerDay: 2,
          timingRelation: 'after_food',
          duration: '10 days',
          purpose: 'Mucosal coating agent and local anesthetic to quickly soothe burning sensations in esophagus and stomach.',
          prescribedTimeSlots: ['02:00 PM', '10:00 PM'],
          specialInstructions: 'Take 1 hour after meals. Do not drink water immediately afterward to let the gel coat the lining.',
          unclearOrAmbiguous: false,
          precautions: ['Shake bottle well before pouring'],
        },
        {
          id: 'med-303',
          name: 'Probiotic Spore Capsule',
          genericName: 'Bacillus Clausii / Lactic Acid Bacillus',
          form: 'capsule',
          dosage: '1 capsule',
          frequency: 'Once daily after lunch (0-1-0)',
          timesPerDay: 1,
          timingRelation: 'after_food',
          duration: '14 days',
          purpose: 'Restores healthy intestinal microflora and aids optimal gut digestion.',
          prescribedTimeSlots: ['01:45 PM'],
          specialInstructions: 'Take after your afternoon meal.',
          unclearOrAmbiguous: false,
          precautions: ['Store in a cool dry place'],
        },
      ],
      schedule: [
        {
          time: '07:15 AM',
          timePeriod: 'morning',
          medicineName: 'Pantoprazole 40mg + Domperidone 30mg SR',
          dosage: '1 capsule',
          instructions: 'As prescribed, on an empty stomach 45 mins before breakfast',
          foodRelation: 'empty_stomach',
          specialNote: 'Critical for all-day acid suppression',
        },
        {
          time: '01:45 PM',
          timePeriod: 'afternoon',
          medicineName: 'Probiotic Spore Capsule',
          dosage: '1 capsule',
          instructions: 'As prescribed, after lunch with water',
          foodRelation: 'after_food',
          specialNote: 'Gut flora restoration',
        },
        {
          time: '02:00 PM',
          timePeriod: 'afternoon',
          medicineName: 'Mucaine Gel Antacid',
          dosage: '10 ml',
          instructions: 'As prescribed, 1 hour after lunch',
          foodRelation: 'after_food',
          specialNote: 'Do not drink water right after',
        },
        {
          time: '10:00 PM',
          timePeriod: 'night',
          medicineName: 'Mucaine Gel Antacid',
          dosage: '10 ml',
          instructions: 'As prescribed, at bedtime before sleep',
          foodRelation: 'bedtime',
          specialNote: 'Prevents nocturnal acid reflux',
        },
      ],
      clarificationsAndWarnings: [
        'Pantoprazole must be taken on an empty stomach before morning food; taking it after eating significantly lowers its effectiveness.',
        'Do not lie down flat within 2 hours after having dinner.',
      ],
      overallClinicalSummary:
        'Targeted treatment protocol for GERD and reflux esophagitis. Combines morning empty-stomach acid suppression with a topical mucosal soothing gel and afternoon digestive probiotics.',
    },
  },
];
