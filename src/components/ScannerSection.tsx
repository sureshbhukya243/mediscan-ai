import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Camera,
  FileCheck,
  RefreshCw,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  FileText,
  User,
  Building,
  Calendar,
  Layers,
  ArrowRight,
  Maximize2,
  X,
  Clock,
  Eye,
} from 'lucide-react';
import { ScanResult, UserRoutine } from '../types/medical';
import { SAMPLE_PRESCRIPTIONS } from '../utils/sampleData';
import { soundManager } from '../utils/audio';

interface ScannerSectionProps {
  onScanComplete: (result: ScanResult) => void;
  currentResult: ScanResult | null;
  userRoutine: UserRoutine;
  setUserRoutine: React.Dispatch<React.SetStateAction<UserRoutine>>;
  onGoToSchedule: () => void;
  onGoToMedicines: () => void;
}

export const ScannerSection: React.FC<ScannerSectionProps> = ({
  onScanComplete,
  currentResult,
  userRoutine,
  setUserRoutine,
  onGoToSchedule,
  onGoToMedicines,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentResult?.imagePreview || null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  // Start Camera
  const startCamera = async () => {
    try {
      setErrorMessage(null);
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      setCameraStream(stream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Camera access failed:', err);
      setErrorMessage('Could not access camera. Please check camera permissions or upload an image file instead.');
      setIsCameraActive(false);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  // Capture Photo from Camera
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    stopCamera();
    setPreviewUrl(dataUrl);
    processScan(dataUrl, 'image/jpeg', 'Camera_Prescription_Scan.jpg');
  };

  // Handle File Input Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleFile(file);
  };

  const handleFile = (file: File) => {
    setSelectedFile(file);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setPreviewUrl(dataUrl);
      processScan(dataUrl, file.type || 'image/jpeg', file.name);
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read selected file.');
    };
    reader.readAsDataURL(file);
  };

  // Drag and Drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Load a Pre-configured Sample Prescription
  const handleLoadSample = (sample: typeof SAMPLE_PRESCRIPTIONS[0]) => {
    setPreviewUrl(sample.imageData);
    setSelectedFile(null);
    setErrorMessage(null);
    setIsScanning(true);
    setScanStep('Loading clinic prescription sample...');

    // Simulate high-fidelity scan flow for instant preview or direct API scan
    setTimeout(() => {
      setScanStep('Running OCR & parsing doctor instructions...');
    }, 400);

    setTimeout(() => {
      setScanStep('Generating chronological medicine schedule...');
    }, 800);

    setTimeout(() => {
      setIsScanning(false);
      soundManager.playSuccess();
      onScanComplete(sample.mockResult);
    }, 1200);
  };

  // Process Prescription via Backend API with Gemini 3.8 Flash
  const processScan = async (base64Data: string, mimeType: string, fileName: string) => {
    setIsScanning(true);
    setErrorMessage(null);
    setScanStep('Uploading document to clinical OCR engine...');

    try {
      const stepTimer1 = setTimeout(() => {
        setScanStep('Extracting doctor handwriting, dosage, and medicine names...');
      }, 1000);

      const stepTimer2 = setTimeout(() => {
        setScanStep('Analyzing food-timing relations & constructing daily schedule...');
      }, 2500);

      const response = await fetch('/api/scan-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: mimeType.includes('pdf') ? 'application/pdf' : 'image/jpeg',
          preferences: userRoutine,
        }),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Server failed to process the prescription');
      }

      const scanResult: ScanResult = {
        id: `rx-${Date.now()}`,
        scannedAt: new Date().toISOString(),
        imagePreview: base64Data,
        fileName: fileName,
        doctor: json.data.doctor,
        patient: json.data.patient,
        rawExtractedText: json.data.rawExtractedText,
        medicines: json.data.medicines.map((m: any, idx: number) => ({
          ...m,
          id: m.id || `med-${Date.now()}-${idx}`,
        })),
        schedule: json.data.schedule,
        clarificationsAndWarnings: json.data.clarificationsAndWarnings || [],
        overallClinicalSummary: json.data.overallClinicalSummary || '',
      };

      soundManager.playSuccess();
      onScanComplete(scanResult);
    } catch (err: any) {
      console.error('Scan error:', err);
      setErrorMessage(
        err.message || 'Error occurred while scanning. If using a custom photo, try a well-lit image or one of our samples.'
      );
    } finally {
      setIsScanning(false);
      setScanStep('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-teal-50 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200 mb-3">
            <Sparkles className="h-3.5 w-3.5 text-teal-600" />
            AI-Powered Prescription & Report Scanner
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
            Scan Your Medical Prescription
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
            Upload a doctor's prescription, discharge summary, or pharmacy bill in{' '}
            <strong className="text-slate-800">PDF, JPG, or PNG</strong>, or use your camera. Our clinical AI extracts
            medication details, food timing instructions, and generates an exact daily schedule.
          </p>

          {/* User Routine Adjuster inline */}
          <div className="mt-5 p-3.5 bg-slate-50 rounded-xl border border-slate-200/90 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <Clock className="h-4 w-4 text-teal-600 shrink-0" />
              <span>
                <strong>Your Daily Schedule Reference:</strong> Breakfast at{' '}
                <span className="font-semibold text-teal-700">{userRoutine.breakfastTime}</span>, Lunch at{' '}
                <span className="font-semibold text-teal-700">{userRoutine.lunchTime}</span>, Dinner at{' '}
                <span className="font-semibold text-teal-700">{userRoutine.dinnerTime}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={userRoutine.breakfastTime}
                onChange={(e) => setUserRoutine({ ...userRoutine, breakfastTime: e.target.value })}
                className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs"
                title="Breakfast time"
              />
              <span className="text-slate-400">/</span>
              <input
                type="time"
                value={userRoutine.dinnerTime}
                onChange={(e) => setUserRoutine({ ...userRoutine, dinnerTime: e.target.value })}
                className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs"
                title="Dinner time"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 animate-in fade-in">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Document Analysis Notice</p>
            <p className="mt-0.5 text-rose-700 text-xs sm:text-sm">{errorMessage}</p>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-800 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Camera Live Viewfinder Modal */}
      {isCameraActive && (
        <div className="fixed inset-0 z-50 bg-black/85 flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
            {/* Viewfinder Header */}
            <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-10 flex items-center justify-between text-white">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Camera className="h-4 w-4 text-teal-400" />
                Align Prescription inside Frame
              </div>
              <button
                onClick={stopCamera}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Video Feed */}
            <div className="relative aspect-[4/3] bg-slate-900 flex items-center justify-center overflow-hidden">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

              {/* Prescription Alignment Frame */}
              <div className="absolute inset-8 sm:inset-12 border-2 border-dashed border-teal-400/80 rounded-xl pointer-events-none flex flex-col justify-between p-3">
                <div className="flex justify-between">
                  <div className="w-6 h-6 border-t-4 border-l-4 border-teal-400" />
                  <div className="w-6 h-6 border-t-4 border-r-4 border-teal-400" />
                </div>
                <p className="text-center text-xs font-medium text-white/90 bg-black/60 py-1 px-3 rounded-full mx-auto backdrop-blur-xs">
                  Hold document flat & well-lit
                </p>
                <div className="flex justify-between">
                  <div className="w-6 h-6 border-b-4 border-l-4 border-teal-400" />
                  <div className="w-6 h-6 border-b-4 border-r-4 border-teal-400" />
                </div>
              </div>
            </div>

            {/* Viewfinder Controls */}
            <div className="p-4 bg-slate-950 flex items-center justify-around">
              <button
                onClick={() => setCameraFacing(cameraFacing === 'environment' ? 'user' : 'environment')}
                className="text-xs text-slate-300 hover:text-white flex flex-col items-center gap-1"
              >
                <RefreshCw className="h-5 w-5" />
                Flip Lens
              </button>

              <button
                onClick={capturePhoto}
                className="h-16 w-16 rounded-full bg-teal-500 hover:bg-teal-400 p-1 border-4 border-white flex items-center justify-center text-white shadow-lg transition-transform active:scale-95 cursor-pointer"
                title="Capture Document"
              >
                <Camera className="h-7 w-7" />
              </button>

              <button onClick={stopCamera} className="text-xs text-slate-300 hover:text-white flex flex-col items-center gap-1">
                <X className="h-5 w-5" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Upload / Camera / Sample Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload & Camera Box */}
        <div className="lg:col-span-7 space-y-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all bg-white relative overflow-hidden ${
              isScanning ? 'border-teal-500 bg-teal-50/20' : 'border-slate-300 hover:border-teal-400'
            }`}
          >
            {/* Scanning Laser Animation */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none z-20">
                <div className="w-full h-1 bg-gradient-to-r from-transparent via-teal-500 to-transparent shadow-[0_0_15px_#0d9488] animate-bounce" />
                <div className="absolute inset-0 bg-teal-500/10 backdrop-blur-[1px] flex flex-col items-center justify-center p-6 text-center">
                  <div className="h-14 w-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-lg animate-pulse mb-3">
                    <Sparkles className="h-7 w-7" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">AI Medical OCR in Progress</h4>
                  <p className="text-xs sm:text-sm text-teal-800 font-medium mt-1">{scanStep}</p>
                  <div className="mt-4 w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-600 rounded-full animate-pulse w-3/4" />
                  </div>
                </div>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png,image/jpeg,image/jpg,application/pdf"
              className="hidden"
            />

            <div className="max-w-md mx-auto space-y-4">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 shadow-xs">
                <Upload className="h-8 w-8" />
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Drop your prescription here, or browse
                </h3>
                <p className="text-xs text-slate-500 mt-1">Supports PDF, JPG, and PNG files up to 25MB</p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isScanning}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 text-white font-semibold text-xs sm:text-sm hover:bg-teal-700 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <FileText className="h-4 w-4" />
                  Select File from Device
                </button>

                <button
                  type="button"
                  onClick={startCamera}
                  disabled={isScanning}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-800 font-semibold text-xs sm:text-sm hover:bg-slate-200 transition-colors border border-slate-200 cursor-pointer disabled:opacity-50"
                >
                  <Camera className="h-4 w-4 text-teal-600" />
                  Use Camera Scanner
                </button>
              </div>

              <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-center gap-4">
                <span>✓ Handwritten or Printed</span>
                <span>•</span>
                <span>✓ Hospital Discharge Slips</span>
                <span>•</span>
                <span>✓ Multi-Drug Scripts</span>
              </div>
            </div>
          </div>

          {/* Quick Pre-loaded Samples Selector */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">No prescription handy? Test with 1-Click Samples</h3>
              </div>
              <span className="text-[11px] font-medium text-slate-500">Instant Demo</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SAMPLE_PRESCRIPTIONS.map((sample, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleLoadSample(sample)}
                  disabled={isScanning}
                  className="text-left p-3 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/30 transition-all group cursor-pointer disabled:opacity-50"
                >
                  <div className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">{sample.category}</div>
                  <div className="font-bold text-xs text-slate-900 mt-1 line-clamp-1 group-hover:text-teal-900">
                    {sample.title}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">{sample.description}</div>
                  <div className="mt-2.5 flex items-center text-[11px] font-semibold text-teal-600 group-hover:translate-x-0.5 transition-transform">
                    <span>Load Prescription</span>
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Scanned Document Preview & OCR Summary */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Eye className="h-4 w-4 text-teal-600" />
                  Prescription Document Preview
                </h3>
                {currentResult && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="h-3 w-3" /> Scanned Successfully
                  </span>
                )}
              </div>

              {/* Preview Box */}
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden relative min-h-[220px] max-h-[320px] flex items-center justify-center">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Prescription preview"
                    className="w-full h-full object-contain max-h-[310px] p-2"
                  />
                ) : (
                  <div className="text-center p-6 text-slate-400">
                    <FileText className="h-12 w-12 mx-auto stroke-1 text-slate-300 mb-2" />
                    <p className="text-xs font-medium">No document uploaded yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Uploaded images or captured camera scans will render here
                    </p>
                  </div>
                )}
              </div>

              {/* Extracted Details Snippet */}
              {currentResult && (
                <div className="mt-4 space-y-3">
                  {/* Doctor & Patient info */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                        <Building className="h-3 w-3 text-teal-600" /> Attending Doctor
                      </div>
                      <p className="font-bold text-slate-900 mt-0.5 truncate">
                        {currentResult.doctor?.name || 'Doctor Identified'}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {currentResult.doctor?.specialty || currentResult.doctor?.hospitalOrClinic || 'General Medicine'}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                        <User className="h-3 w-3 text-teal-600" /> Patient Record
                      </div>
                      <p className="font-bold text-slate-900 mt-0.5 truncate">
                        {currentResult.patient?.name || 'Patient'}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {currentResult.patient?.age ? `${currentResult.patient.age}Y` : ''}{' '}
                        {currentResult.patient?.gender || ''}
                      </p>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="p-3 rounded-xl bg-teal-50/60 border border-teal-100 text-xs">
                    <p className="font-bold text-teal-950">Clinical Regimen Summary</p>
                    <p className="text-teal-800 text-[11px] mt-1 leading-relaxed">
                      {currentResult.overallClinicalSummary ||
                        `Identified ${currentResult.medicines.length} medications and ${currentResult.schedule.length} daily time slots.`}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions if result exists */}
            {currentResult && (
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  onClick={onGoToMedicines}
                  className="flex-1 py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold text-center transition-colors cursor-pointer"
                >
                  View {currentResult.medicines.length} Medicines
                </button>
                <button
                  onClick={onGoToSchedule}
                  className="flex-1 py-2 px-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <span>Daily Schedule</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
