import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { TextInputSection } from './components/TextInputSection';
import { VoiceSelector } from './components/VoiceSelector';
import { StyleAndSpeedControls } from './components/StyleAndSpeedControls';
import { AudioPlayer } from './components/AudioPlayer';
import { AudioHistory } from './components/AudioHistory';
import { ToastContainer, ToastMessage } from './components/Toast';
import {
  UiLanguage,
  Voice,
  VoiceStyle,
  GeneratedAudio,
  SampleText,
} from './types';
import {
  DEFAULT_VOICES,
  I18N,
} from './data/constants';
import { Sparkles, ShieldCheck, Headphones, Volume2, HelpCircle } from 'lucide-react';

export default function App() {
  const [uiLang, setUiLang] = useState<UiLanguage>('hi');
  const [text, setText] = useState<string>('');
  const [selectedVoice, setSelectedVoice] = useState<string>('Kore');
  const [voices, setVoices] = useState<Voice[]>(DEFAULT_VOICES);
  const [language, setLanguage] = useState<string>('hi-IN');
  const [style, setStyle] = useState<VoiceStyle>('natural');
  const [speed, setSpeed] = useState<number>(1.0);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [currentAudio, setCurrentAudio] = useState<GeneratedAudio | null>(null);
  const [history, setHistory] = useState<GeneratedAudio[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Keep track of active blob URLs to revoke on cleanup
  const activeBlobUrlsRef = useRef<Set<string>>(new Set());
  const playerRef = useRef<HTMLDivElement>(null);

  const t = I18N[uiLang];

  // Fetch updated voices catalog from backend on mount
  useEffect(() => {
    fetch('/api/voices')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.voices && Array.isArray(data.voices) && data.voices.length > 0) {
          setVoices(data.voices);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch voices list from API, using defaults:', err);
      });

    return () => {
      // Revoke all created blob URLs on unmount
      activeBlobUrlsRef.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {
          // ignore
        }
      });
      activeBlobUrlsRef.current.clear();
    };
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      dismissToast(id);
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSelectSample = (sample: SampleText) => {
    setText(sample.text);
    setLanguage(sample.lang);
    if (sample.recommendedVoice) {
      setSelectedVoice(sample.recommendedVoice);
    }
    if (sample.recommendedStyle) {
      setStyle(sample.recommendedStyle);
    }
    setValidationError(null);
    showToast(
      uiLang === 'hi'
        ? `"${sample.titleHi}" नमूना लोड किया गया`
        : `Loaded prompt: "${sample.titleEn}"`,
      'info'
    );
  };

  const handleReset = () => {
    setText('');
    setSelectedVoice('Kore');
    setLanguage('hi-IN');
    setStyle('natural');
    setSpeed(1.0);
    setValidationError(null);
    showToast(uiLang === 'hi' ? 'सेटिंग्स रीसेट कर दी गई हैं' : 'Settings have been reset', 'info');
  };

  const handleGenerate = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      const errMsg = t.emptyWarning;
      setValidationError(errMsg);
      showToast(errMsg, 'error');
      return;
    }

    setValidationError(null);
    setIsGenerating(true);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: trimmed,
          voice: selectedVoice,
          language,
          style,
          speed,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.audioBase64) {
        throw new Error(data.error || 'ऑडियो जनरेशन असफल रहा। कृपया पुनः प्रयास करें।');
      }

      // Convert base64 to binary ArrayBuffer and create Blob
      const binaryString = atob(data.audioBase64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const mimeType = data.mimeType || 'audio/wav';
      const audioBlob = new Blob([bytes], { type: mimeType });
      const blobUrl = URL.createObjectURL(audioBlob);
      activeBlobUrlsRef.current.add(blobUrl);

      // Create a friendly filename
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const voiceObj = voices.find((v) => v.id === selectedVoice);
      const voiceLabel = voiceObj ? voiceObj.name : selectedVoice;
      const cleanSnippet = trimmed
        .replace(/[^\w\s\u0900-\u097F]/gi, '')
        .trim()
        .slice(0, 15)
        .replace(/\s+/g, '_');
      const filename = `EasyVoice_${dateStr}_${voiceLabel}_${cleanSnippet || 'audio'}.wav`;

      const newAudioItem: GeneratedAudio = {
        id: `audio_${Date.now()}`,
        text: trimmed,
        voice: selectedVoice,
        voiceName: voiceLabel,
        language,
        style,
        speed,
        blobUrl,
        duration: data.duration || 0,
        timestamp: Date.now(),
        filename,
        modelUsed: data.modelUsed,
      };

      setCurrentAudio(newAudioItem);
      setHistory((prev) => [newAudioItem, ...prev]);

      showToast(
        uiLang === 'hi'
          ? 'ऑडियो सफलतापूर्वक तैयार हो गया है!'
          : 'Audio generated successfully!',
        'success'
      );

      // Smooth scroll to audio player
      setTimeout(() => {
        playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    } catch (err: any) {
      console.error('TTS Generation failed:', err);
      const msg = err?.message || 'ऑडियो बनाने में समस्या हुई। कृपया जांचें।';
      showToast(msg, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearHistory = () => {
    history.forEach((item) => {
      try {
        URL.revokeObjectURL(item.blobUrl);
        activeBlobUrlsRef.current.delete(item.blobUrl);
      } catch (e) {
        // ignore
      }
    });
    setHistory([]);
    showToast(uiLang === 'hi' ? 'इतिहास साफ़ कर दिया गया' : 'History cleared', 'info');
  };

  return (
    <div className="app-shell min-h-screen text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white pb-16">
      {/* Toast Alert System */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Global Header */}
      <Header
        uiLang={uiLang}
        setUiLang={setUiLang}
        onReset={handleReset}
        isGenerating={isGenerating}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6 app-main">
        {/* Hero Banner / Tagline */}
        <div className="hero-panel text-center max-w-2xl mx-auto py-7 sm:py-9 px-5 sm:px-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/80 mb-3 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>{uiLang === 'hi' ? 'आसान, सजीव और उच्च गुणवत्ता वाली आवाज़ें' : 'Natural, Studio-Quality AI Speech'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
            {uiLang === 'hi' ? 'टेक्स्ट को बोलती आवाज़ में बदलें' : 'Transform Text into Natural Speech'}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            {t.appTagline}
          </p>
        </div>

        {/* Step 1: Text Input */}
        <TextInputSection
          text={text}
          setText={setText}
          uiLang={uiLang}
          onSelectSample={handleSelectSample}
          validationError={validationError}
          onClearValidationError={() => setValidationError(null)}
          showToast={showToast}
        />

        {/* Step 2: Voice Selection */}
        <VoiceSelector
          voices={voices}
          selectedVoice={selectedVoice}
          onSelectVoice={setSelectedVoice}
          uiLang={uiLang}
          showToast={showToast}
        />

        {/* Step 3: Language, Style & Speed Controls + Generate Button */}
        <StyleAndSpeedControls
          language={language}
          setLanguage={setLanguage}
          style={style}
          setStyle={setStyle}
          speed={speed}
          setSpeed={setSpeed}
          uiLang={uiLang}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          hasText={text.trim().length > 0}
        />

        {/* Generated Audio Player (Appears when audio is ready) */}
        <div ref={playerRef}>
          <AudioPlayer
            currentAudio={currentAudio}
            uiLang={uiLang}
            showToast={showToast}
          />
        </div>

        {/* Generation History */}
        <AudioHistory
          history={history}
          currentAudioId={currentAudio?.id}
          onSelectAudio={(item) => setCurrentAudio(item)}
          onClearHistory={handleClearHistory}
          uiLang={uiLang}
          showToast={showToast}
        />

        {/* Informative Feature Cards / Quick Tips */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-800 mb-1">
                {uiLang === 'hi' ? 'उच्च रिज़ॉल्यूशन WAV' : '24kHz Studio WAV'}
              </h4>
              <p className="text-xs text-slate-500 leading-normal">
                {uiLang === 'hi'
                  ? 'डाउनलोड किया गया ऑडियो किसी भी मीडिया प्लेयर, फोन और वीडियो एडिटर में सीधा चलता है।'
                  : 'Valid WAV container playable on VLC, Windows, QuickTime, iOS and Android.'}
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-800 mb-1">
                {uiLang === 'hi' ? 'सटीक हिंदी उच्चारण' : 'Authentic Pronunciation'}
              </h4>
              <p className="text-xs text-slate-500 leading-normal">
                {uiLang === 'hi'
                  ? 'मात्राओं और पूर्णविराम (।) का स्वाभाविक ठहराव। शुद्ध हिंदी एवं हिंग्लिश दोनों समर्थित।'
                  : 'Native cadence and natural schwa handling for Hindi and Indian English.'}
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-800 mb-1">
                {uiLang === 'hi' ? 'सर्वर-साइड सुरक्षित AI' : 'Secure Gemini API'}
              </h4>
              <p className="text-xs text-slate-500 leading-normal">
                {uiLang === 'hi'
                  ? 'सभी API कॉल्स सर्वर के माध्यम से सुरक्षित रूप से प्रोसेस होती हैं। कोई डेटा लीक नहीं।'
                  : 'Server-side API architecture protecting keys and ensuring fast generation.'}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-200/80 pt-6 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-medium">
            © {new Date().getFullYear()} Easy Voice AI • {t.modelBadge}
          </p>
          <p className="text-slate-400">
            {uiLang === 'hi' ? 'स्वच्छ एवं मोबाइल-अनुकूल डिज़ाइन' : 'Clean, Mobile-Friendly Design'}
          </p>
        </div>
      </footer>
    </div>
  );
}
