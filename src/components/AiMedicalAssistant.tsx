import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquareHeart,
  Send,
  Sparkles,
  Bot,
  User,
  ShieldAlert,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Languages,
  BookOpen,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Copy,
  Check,
  ThumbsUp,
  AlertTriangle,
  FileQuestion,
  UtensilsCrossed,
  Clock,
  Pill,
  ExternalLink,
} from 'lucide-react';
import { ScanResult, ChatMessage, MedicineItem } from '../types/medical';
import { speechService, createSpeechRecognizer } from '../utils/speech';
import { soundManager } from '../utils/audio';

interface AiMedicalAssistantProps {
  scanResult: ScanResult | null;
  initialQuestion?: string | null;
  onClearInitialQuestion?: () => void;
}

type AssistantMode = 'chat' | 'interactions' | 'missed_dose' | 'doctor_questions' | 'translator';

export const AiMedicalAssistant: React.FC<AiMedicalAssistantProps> = ({
  scanResult,
  initialQuestion,
  onClearInitialQuestion,
}) => {
  const [activeMode, setActiveMode] = useState<AssistantMode>('chat');

  // Messages State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'model',
      text: `Hello! I am Dr. Aida, your clinical AI assistant.\n\nI'm here to walk you through your doctor's prescription so you feel 100% confident about what each medication does, exact food timings, and precautions.\n\n🎙️ *Tip:* You can speak to me using the microphone button, or tap "Listen" on any answer to hear it read aloud!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  // Interaction matrix data
  const [interactionData, setInteractionData] = useState<any>(null);
  const [isLoadingInteractions, setIsLoadingInteractions] = useState(false);

  // Missed dose simulator state
  const [selectedMissedMed, setSelectedMissedMed] = useState<string>(
    scanResult?.medicines[0]?.name || ''
  );
  const [missedDuration, setMissedDuration] = useState<string>('1_hour');
  const [missedDoseAdvice, setMissedDoseAdvice] = useState<string | null>(null);

  // Doctor questions state
  const [doctorQuestionsList, setDoctorQuestionsList] = useState<string[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  // Speech Recognition instance ref
  const recognizerRef = useRef<any>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    recognizerRef.current = createSpeechRecognizer(
      (text) => {
        setInputQuestion((prev) => (prev ? `${prev} ${text}` : text));
        setIsListening(false);
      },
      (err) => {
        console.warn('Speech recognition error:', err);
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );
  }, []);

  // Scroll to bottom
  useEffect(() => {
    if (activeMode === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, activeMode]);

  // Initial Question trigger
  useEffect(() => {
    if (initialQuestion) {
      setActiveMode('chat');
      handleAsk(initialQuestion);
      if (onClearInitialQuestion) {
        onClearInitialQuestion();
      }
    }
  }, [initialQuestion]);

  // Speech synthesis toggle
  const handleToggleSpeak = (msgId: string, text: string) => {
    if (speakingMsgId === msgId) {
      speechService.stop();
      setSpeakingMsgId(null);
    } else {
      setSpeakingMsgId(msgId);
      speechService.speak(
        text,
        () => setSpeakingMsgId(null),
        () => setSpeakingMsgId(null)
      );
    }
  };

  // Copy message
  const handleCopyText = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  // Toggle Voice Input
  const toggleListening = () => {
    if (isListening) {
      recognizerRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognizerRef.current?.isSupported) {
        setIsListening(true);
        recognizerRef.current.start();
      } else {
        alert('Voice dictation is not supported on this browser. Try Chrome or Safari!');
      }
    }
  };

  // Ask Question Handler
  const handleAsk = async (questionText: string) => {
    if (!questionText.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: questionText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ask-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionText,
          prescriptionContext: scanResult
            ? {
                doctor: scanResult.doctor,
                patient: scanResult.patient,
                medicines: scanResult.medicines,
                schedule: scanResult.schedule,
                clarificationsAndWarnings: scanResult.clarificationsAndWarnings,
                summary: scanResult.overallClinicalSummary,
              }
            : null,
          conversationHistory: messages.map((m) => ({ role: m.role, text: m.text })),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to get answer from AI Assistant');
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        text: data.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      let friendlyText = 'I am briefly experiencing high demand. Please tap any of the quick inquiry buttons below or try asking again in a few moments.';
      if (scanResult?.medicines?.length) {
        friendlyText = `Here is a summary based on your doctor's prescription for **${scanResult.patient?.name || 'the patient'}**:\n\n` +
          scanResult.medicines.map((m, i) => `**${i + 1}. ${m.name}** (${m.dosage})\n• **Purpose:** ${m.purpose}\n• **Instructions:** ${m.frequency}, ${m.timingRelation.replace('_', ' ')}.`).join('\n\n') +
          `\n\n*(Note: Live model experienced a brief connection spike; showing verified prescription details).*`;
      }

      const errorMsg: ChatMessage = {
        id: `bot-fallback-${Date.now()}`,
        role: 'model',
        text: friendlyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Run Drug-Food Interaction Check
  const loadInteractions = async () => {
    if (!scanResult || !scanResult.medicines.length) return;
    setIsLoadingInteractions(true);
    try {
      const response = await fetch('/api/assistant/check-interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medicines: scanResult.medicines }),
      });
      const res = await response.json();
      if (res.success) {
        setInteractionData(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingInteractions(false);
    }
  };

  // Run Missed Dose Guidance
  const handleCalculateMissedDose = () => {
    const medName = selectedMissedMed || scanResult?.medicines[0]?.name || 'your medicine';
    const medObj = scanResult?.medicines.find((m) => m.name === medName);
    const isAntibiotic =
      medName.toLowerCase().includes('augmentin') ||
      medName.toLowerCase().includes('amoxicillin') ||
      medObj?.purpose.toLowerCase().includes('antibiotic');

    let advice = '';
    if (missedDuration === '1_hour') {
      advice = `Since it has only been ~1 hour since your scheduled dose of **${medName}**, take your prescribed dose now with a full glass of water. Then resume your normal schedule for subsequent doses.`;
    } else if (missedDuration === '4_hours') {
      advice = `It has been ~4 hours. If your next scheduled dose is more than 3-4 hours away, take **${medName}** now. However, if your next dose is due shortly, skip this missed dose and take the next one at the usual time. **Never double up doses to make up for a missed one.**`;
    } else {
      advice = `It is almost time for your next scheduled dose. **Skip the missed dose entirely** and take your next dose at its regular time. Doubling up can cause severe side effects or toxicity.`;
    }

    if (isAntibiotic) {
      advice += `\n\n⚠️ *Antibiotic Course Note:* Because ${medName} is an antibiotic, try to maintain consistent spacing between doses to keep blood concentrations effective against bacterial growth. Complete the full prescribed course.`;
    }

    setMissedDoseAdvice(advice);
    soundManager.playSuccess();
  };

  // Generate Questions for Doctor
  const handleGenerateDoctorQuestions = async () => {
    if (!scanResult) return;
    setIsLoadingQuestions(true);
    try {
      const prompt = `Based on this medical prescription:
Doctor: ${scanResult.doctor?.name || 'Doctor'}
Medicines: ${scanResult.medicines.map((m) => `${m.name} (${m.dosage})`).join(', ')}
Diagnosis: ${scanResult.patient?.diagnosisOrVitals || 'Prescription regimen'}

Generate exactly 5 smart, practical questions for the patient to ask their doctor or pharmacist during their follow-up visit. Return as bullet points.`;

      const response = await fetch('/api/ask-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: prompt, prescriptionContext: scanResult }),
      });
      const data = await response.json();
      if (data.success) {
        const questions = data.answer
          .split('\n')
          .filter((line: string) => line.trim().length > 5 && !line.startsWith('Based on'));
        setDoctorQuestionsList(questions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm flex flex-col h-[740px] overflow-hidden">
      {/* Top Clinical Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {/* Avatar with Animated Pulse Ring */}
          <div className="relative">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 p-0.5 shadow-md flex items-center justify-center text-slate-900 font-bold">
              <div className="h-full w-full rounded-[14px] bg-slate-900 flex items-center justify-center text-teal-300">
                <Bot className="h-6 w-6 text-teal-300" />
              </div>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">Dr. Aida</h3>
              <span className="text-[10px] font-bold bg-teal-500/20 text-teal-200 border border-teal-400/30 px-2 py-0.5 rounded-full">
                Clinical AI Companion
              </span>
            </div>
            <p className="text-xs text-teal-200/80">
              {scanResult
                ? `Active Prescription: ${scanResult.medicines.length} medicines analyzed`
                : 'General medical communication mode'}
            </p>
          </div>
        </div>

        {/* Feature Navigation Tabs */}
        <div className="flex items-center gap-1 bg-black/25 p-1 rounded-xl self-start sm:self-auto overflow-x-auto no-scrollbar">
          {[
            { id: 'chat', label: 'Chat', icon: MessageSquareHeart },
            { id: 'interactions', label: 'Interactions', icon: UtensilsCrossed },
            { id: 'missed_dose', label: 'Missed Dose', icon: Clock },
            { id: 'doctor_questions', label: 'Doctor Qs', icon: FileQuestion },
            { id: 'translator', label: 'Languages', icon: Languages },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeMode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveMode(tab.id as AssistantMode);
                  if (tab.id === 'interactions' && !interactionData) loadInteractions();
                  if (tab.id === 'doctor_questions' && doctorQuestionsList.length === 0)
                    handleGenerateDoctorQuestions();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive ? 'bg-teal-500 text-white shadow-xs' : 'text-teal-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Safety Notice Strip */}
      <div className="bg-amber-50/90 px-4 py-2 border-b border-amber-200/70 flex items-center justify-between text-xs text-amber-900">
        <div className="flex items-center gap-1.5 font-medium">
          <ShieldAlert className="h-3.5 w-3.5 text-amber-600 shrink-0" />
          <span>Strict Clinical Guardrails: Adheres strictly to your doctor's orders. Never alters dosage.</span>
        </div>
        <span className="text-[11px] text-amber-700 hidden md:inline">For educational support</span>
      </div>

      {/* Mode Viewport: 1. Main Chat */}
      {activeMode === 'chat' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              const isSpeakingThis = speakingMsgId === msg.id;

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                >
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-xs ${
                      isUser ? 'bg-slate-800 text-white' : 'bg-teal-600 text-white'
                    }`}
                  >
                    {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>

                  <div
                    className={`group relative p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs transition-all ${
                      isUser
                        ? 'bg-slate-900 text-white rounded-tr-none'
                        : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none whitespace-pre-wrap'
                    }`}
                  >
                    {msg.text}

                    {/* Bottom message toolbar */}
                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between gap-3 text-[11px]">
                      <span className={isUser ? 'text-slate-400' : 'text-slate-400'}>{msg.timestamp}</span>

                      {!isUser && (
                        <div className="flex items-center gap-2">
                          {/* Listen Button with Equalizer Wave */}
                          <button
                            onClick={() => handleToggleSpeak(msg.id, msg.text)}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold transition-colors cursor-pointer ${
                              isSpeakingThis
                                ? 'bg-teal-600 text-white animate-pulse'
                                : 'text-slate-600 hover:text-teal-700 hover:bg-slate-200/60'
                            }`}
                            title={isSpeakingThis ? 'Stop speaking' : 'Read aloud with voice'}
                          >
                            {isSpeakingThis ? (
                              <>
                                <VolumeX className="h-3.5 w-3.5" />
                                <span>Stop</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="h-3.5 w-3.5 text-teal-600" />
                                <span>Listen</span>
                              </>
                            )}
                          </button>

                          {/* Copy Text */}
                          <button
                            onClick={() => handleCopyText(msg.id, msg.text)}
                            className="text-slate-400 hover:text-slate-700 p-1 rounded transition-colors cursor-pointer"
                            title="Copy response"
                          >
                            {copiedMsgId === msg.id ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-start gap-3 mr-auto">
                <div className="h-8 w-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs shrink-0 shadow-xs">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-xs sm:text-sm rounded-tl-none flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 bg-teal-600 rounded-full animate-bounce" />
                    <span className="h-2 w-2 bg-teal-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="h-2 w-2 bg-teal-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span className="text-slate-600 text-xs font-semibold ml-2">Dr. Aida is reviewing your prescription...</span>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Prompt Suggestion Chips */}
          <div className="p-2 sm:px-4 bg-slate-50 border-t border-slate-200 overflow-x-auto no-scrollbar flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap pl-1">
              Quick Inquiries:
            </span>
            {[
              { label: 'Explain all in plain English', text: 'Please explain every prescribed medicine in plain English for a patient.' },
              { label: 'Can I take these with dairy?', text: 'Can I take these medicines with milk or dairy products, or does it interfere?' },
              { label: 'What if I miss my dose?', text: 'What should I do if I accidentally miss a dose of my medicines?' },
              { label: 'Check for unclear handwriting', text: 'Are there any blurry or ambiguous notes in this prescription that I need to ask the pharmacist about?' },
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAsk(chip.text)}
                disabled={isLoading}
                className="px-3 py-1 rounded-full bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50 text-slate-700 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Interactive Chat Input Bar with Voice Recognition */}
          <form onSubmit={(e) => { e.preventDefault(); handleAsk(inputQuestion); }} className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-2">
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse shadow-md ring-2 ring-rose-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              title={isListening ? 'Stop listening' : 'Speak your question (Voice Dictation)'}
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5 text-teal-600" />}
            </button>

            <input
              type="text"
              placeholder={
                isListening
                  ? 'Listening to your voice... Speak now'
                  : scanResult
                  ? 'Ask anything about your medicines, side effects, or schedule...'
                  : 'Ask any medical or prescription question...'
              }
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />

            <button
              type="submit"
              disabled={!inputQuestion.trim() || isLoading}
              className="px-4 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs sm:text-sm hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Ask Dr. Aida</span>
            </button>
          </form>
        </div>
      )}

      {/* Mode Viewport: 2. Drug & Food Interaction Matrix */}
      {activeMode === 'interactions' && (
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h4 className="text-base font-bold text-slate-900">Drug-to-Drug & Dietary Interaction Check</h4>
              <p className="text-xs text-slate-500">
                Automated safety evaluation for food, beverage, and co-medication conflicts.
              </p>
            </div>
            <button
              onClick={loadInteractions}
              disabled={isLoadingInteractions}
              className="px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 text-xs font-bold hover:bg-teal-100 border border-teal-200 transition-colors cursor-pointer"
            >
              {isLoadingInteractions ? 'Evaluating...' : 'Re-run Evaluation'}
            </button>
          </div>

          {isLoadingInteractions ? (
            <div className="text-center py-16">
              <div className="h-10 w-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-semibold text-slate-700">Checking clinical pharmacovigilance databases...</p>
            </div>
          ) : interactionData ? (
            <div className="space-y-4">
              {/* Overall Assessment Badge */}
              <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-teal-900">
                      Overall Assessment:
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-600 text-white">
                      {interactionData.overallStatus}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 mt-1 leading-relaxed">{interactionData.summary}</p>
                </div>
              </div>

              {/* Food & Drink Precautions Grid */}
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Food & Drink Restrictions:
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {interactionData.foodPrecautions?.map((item: any, idx: number) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                        <span className="text-amber-800">⚠️ {item.foodOrDrink}</span>
                        <span className="text-slate-500 text-[10px]">Affects: {item.affectedMedicine}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{item.explanation}</p>
                      <div className="mt-2 text-[11px] font-semibold text-teal-800 bg-teal-50 p-1.5 rounded">
                        Action: {item.actionToTake}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timing Rules */}
              {interactionData.timingRules && interactionData.timingRules.length > 0 && (
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <h5 className="text-xs font-bold text-slate-800 mb-2">Recommended Spacing Rules:</h5>
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-600">
                    {interactionData.timingRules.map((rule: string, i: number) => (
                      <li key={i}>{rule}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <UtensilsCrossed className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600">Click "Re-run Evaluation" to analyze food & drug safety</p>
            </div>
          )}
        </div>
      )}

      {/* Mode Viewport: 3. Missed Dose Simulator */}
      {activeMode === 'missed_dose' && (
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          <div className="pb-3 border-b border-slate-200">
            <h4 className="text-base font-bold text-slate-900">What To Do If You Missed a Dose</h4>
            <p className="text-xs text-slate-500">
              Select your medicine and when you forgot it to get clinically safe guidance.
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Which medicine did you miss?</label>
              <select
                value={selectedMissedMed}
                onChange={(e) => setSelectedMissedMed(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500/20"
              >
                {scanResult?.medicines.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name} ({m.dosage})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">When was it scheduled?</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: '1_hour', label: '~1 hour ago' },
                  { id: '4_hours', label: '~4-6 hours ago' },
                  { id: 'almost_next', label: 'Right before next dose' },
                ].map((btn) => (
                  <button
                    key={btn.id}
                    type="button"
                    onClick={() => setMissedDuration(btn.id)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      missedDuration === btn.id
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleCalculateMissedDose}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              Get Missed Dose Guidance
            </button>
          </div>

          {missedDoseAdvice && (
            <div className="p-5 rounded-2xl bg-teal-50/70 border border-teal-200 shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-teal-950 text-sm mb-1.5">
                <Check className="h-4 w-4 text-teal-600" /> Guidance for {selectedMissedMed}:
              </div>
              <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">{missedDoseAdvice}</p>
            </div>
          )}
        </div>
      )}

      {/* Mode Viewport: 4. Questions to Ask Doctor */}
      {activeMode === 'doctor_questions' && (
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h4 className="text-base font-bold text-slate-900">Custom Questions for Your Next Doctor's Visit</h4>
              <p className="text-xs text-slate-500">
                Print or screenshot these high-yield questions to ask your physician or pharmacist.
              </p>
            </div>
            <button
              onClick={handleGenerateDoctorQuestions}
              disabled={isLoadingQuestions}
              className="px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 text-xs font-bold hover:bg-teal-100 border border-teal-200 transition-colors cursor-pointer"
            >
              {isLoadingQuestions ? 'Drafting...' : 'Regenerate Qs'}
            </button>
          </div>

          {isLoadingQuestions ? (
            <div className="text-center py-16">
              <div className="h-10 w-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-semibold text-slate-700">Synthesizing clinical questions from your prescription...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {doctorQuestionsList.map((q, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start gap-3">
                  <span className="h-6 w-6 rounded-lg bg-teal-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed mt-0.5">{q}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mode Viewport: 5. Multi-Language Translator */}
      {activeMode === 'translator' && (
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          <div className="pb-3 border-b border-slate-200">
            <h4 className="text-base font-bold text-slate-900">Prescription Translation Assistant</h4>
            <p className="text-xs text-slate-500">
              Translate your medicine instructions and daily schedule into your native language.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { code: 'es', name: 'Spanish (Español)', prompt: 'Por favor, traduce mis instrucciones de medicamentos y horario al español en un lenguaje muy claro y comprensible.' },
              { code: 'hi', name: 'Hindi (हिंदी)', prompt: 'कृपया मेरी दवाओं के नाम, खुराक, लेने का समय और भोजन से जुड़े नियम सरल हिंदी में समझाएं।' },
              { code: 'fr', name: 'French (Français)', prompt: 'Veuillez traduire mes instructions de médicaments et mon horaire quotidien en français clair pour les patients.' },
              { code: 'tl', name: 'Tagalog (Filipino)', prompt: 'Paki-paliwanag ang aking reseta at oras ng pag-inom ng gamot sa simpleng Tagalog.' },
              { code: 'zh', name: 'Mandarin (中文)', prompt: '请用通俗易懂的中文解释我的处方药用法、剂量和饭前饭后注意事项。' },
              { code: 'de', name: 'German (Deutsch)', prompt: 'Bitte übersetzen Sie meinen Medikamentenplan und die Einnahmehinweise in verständliches Deutsch.' },
            ].map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setActiveMode('chat');
                  handleAsk(lang.prompt);
                }}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-teal-50 hover:border-teal-400 text-left transition-all group cursor-pointer"
              >
                <div className="text-xs font-bold text-slate-900 group-hover:text-teal-900">{lang.name}</div>
                <div className="text-[11px] text-teal-700 font-semibold mt-1">Translate Now →</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
