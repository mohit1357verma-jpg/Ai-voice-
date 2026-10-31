import React, { useState } from 'react';
import { Volume2, Loader2, Check, User, Sparkles } from 'lucide-react';
import { UiLanguage, Voice } from '../types';
import { I18N } from '../data/constants';

interface VoiceSelectorProps {
  voices: Voice[];
  selectedVoice: string;
  onSelectVoice: (voiceId: string) => void;
  uiLang: UiLanguage;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  voices,
  selectedVoice,
  onSelectVoice,
  uiLang,
  showToast,
}) => {
  const t = I18N[uiLang];
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [loadingVoiceId, setLoadingVoiceId] = useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const handlePreviewVoice = async (voice: Voice, e: React.MouseEvent) => {
    e.stopPropagation();

    // If already playing this voice, stop it
    if (playingVoiceId === voice.id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingVoiceId(null);
      return;
    }

    try {
      setLoadingVoiceId(voice.id);
      const res = await fetch('/api/tts/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voice: voice.id, lang: uiLang }),
      });

      const data = await res.json();
      if (!res.ok || !data.audioBase64) {
        throw new Error(data.error || 'पूर्वावलोकन में त्रुटि हुई');
      }

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(`data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`);
      audioRef.current = audio;

      audio.onended = () => {
        setPlayingVoiceId(null);
      };

      audio.onerror = () => {
        setPlayingVoiceId(null);
        showToast(t.previewError, 'error');
      };

      await audio.play();
      setPlayingVoiceId(voice.id);
    } catch (err: any) {
      console.error('Preview error:', err);
      showToast(err?.message || t.previewError, 'error');
    } finally {
      setLoadingVoiceId(null);
    }
  };

  return (
    <section className="bg-white rounded-3xl p-5 sm:p-7 shadow-xs border border-slate-200/90 transition-all">
      {/* Title */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
            2
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800">
            {t.voiceSectionTitle}
          </h2>
        </div>
        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
          {voices.length} {uiLang === 'hi' ? 'आवाज़ें उपलब्ध' : 'Voices Available'}
        </span>
      </div>

      {/* Voice cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {voices.map((voice) => {
          const isSelected = selectedVoice === voice.id;
          const isPreviewing = playingVoiceId === voice.id;
          const isLoadingPreview = loadingVoiceId === voice.id;

          return (
            <div
              key={voice.id}
              onClick={() => onSelectVoice(voice.id)}
              className={`relative rounded-2xl p-4 cursor-pointer transition-all border text-left flex flex-col justify-between ${
                isSelected
                  ? 'bg-gradient-to-br from-indigo-50/90 via-purple-50/50 to-white border-indigo-500 ring-2 ring-indigo-500/20 shadow-md shadow-indigo-100'
                  : 'bg-white hover:bg-slate-50/80 border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Top: Name, Gender & Select badge */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-slate-900 tracking-tight">
                      {voice.name}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        voice.gender === 'female'
                          ? 'bg-pink-100/80 text-pink-700 border border-pink-200/60'
                          : 'bg-blue-100/80 text-blue-700 border border-blue-200/60'
                      }`}
                    >
                      {voice.gender === 'female' ? t.female : t.male}
                    </span>
                  </div>

                  {/* Radio / Selection Indicator */}
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'border-2 border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>

                {/* Tone tag */}
                <p className="text-xs font-semibold text-indigo-700 mb-2">
                  {uiLang === 'hi' ? voice.toneHi : voice.tone}
                </p>

                {/* Description */}
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                  {uiLang === 'hi' ? voice.descriptionHi : voice.description}
                </p>
              </div>

              {/* Bottom: Best For tag & Preview button */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500 truncate" title={uiLang === 'hi' ? voice.bestForHi : voice.bestFor}>
                  {uiLang === 'hi' ? voice.bestForHi : voice.bestFor}
                </span>

                {/* Preview voice button */}
                <button
                  type="button"
                  onClick={(e) => handlePreviewVoice(voice, e)}
                  disabled={isLoadingPreview}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 active:scale-95 ${
                    isPreviewing
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-indigo-100 text-slate-700 hover:text-indigo-700'
                  }`}
                  title={isPreviewing ? 'रोकें / Stop' : t.previewVoice}
                >
                  {isLoadingPreview ? (
                    <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                  ) : (
                    <Volume2 className={`w-3 h-3 ${isPreviewing ? 'animate-pulse' : ''}`} />
                  )}
                  <span>
                    {isLoadingPreview
                      ? '...'
                      : isPreviewing
                      ? (uiLang === 'hi' ? 'बज रहा है' : 'Playing')
                      : t.previewVoice}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
