import React from 'react';
import {
  Globe,
  Sliders,
  Gauge,
  MessageSquare,
  Briefcase,
  Smile,
  BookOpen,
  Zap,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { UiLanguage, VoiceStyle } from '../types';
import {
  I18N,
  SUPPORTED_LANGUAGES,
  VOICE_STYLES,
  SPEED_OPTIONS,
} from '../data/constants';

interface StyleAndSpeedControlsProps {
  language: string;
  setLanguage: (lang: string) => void;
  style: VoiceStyle;
  setStyle: (style: VoiceStyle) => void;
  speed: number;
  setSpeed: (speed: number) => void;
  uiLang: UiLanguage;
  onGenerate: () => void;
  isGenerating: boolean;
  hasText: boolean;
}

export const StyleAndSpeedControls: React.FC<StyleAndSpeedControlsProps> = ({
  language,
  setLanguage,
  style,
  setStyle,
  speed,
  setSpeed,
  uiLang,
  onGenerate,
  isGenerating,
  hasText,
}) => {
  const t = I18N[uiLang];

  const getStyleIcon = (iconName: string) => {
    switch (iconName) {
      case 'Briefcase':
        return <Briefcase className="w-4 h-4 shrink-0" />;
      case 'Smile':
        return <Smile className="w-4 h-4 shrink-0" />;
      case 'BookOpen':
        return <BookOpen className="w-4 h-4 shrink-0" />;
      case 'Zap':
        return <Zap className="w-4 h-4 shrink-0" />;
      default:
        return <MessageSquare className="w-4 h-4 shrink-0" />;
    }
  };

  return (
    <section className="bg-white rounded-3xl p-5 sm:p-7 shadow-xs border border-slate-200/90 transition-all">
      {/* Title */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
          3
        </div>
        <h2 className="text-base sm:text-lg font-bold text-slate-800">
          {t.styleAndSpeedTitle}
        </h2>
      </div>

      <div className="space-y-6">
        {/* Row 1: Language selection */}
        <div>
          <label className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-700 mb-2">
            <Globe className="w-4 h-4 text-indigo-600" />
            <span>{t.languageLabel}</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SUPPORTED_LANGUAGES.slice(0, 4).map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code)}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                  language === lang.code
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <span>{lang.flag}</span>
                <span className="truncate">{lang.localName}</span>
              </button>
            ))}
          </div>

          {/* More languages dropdown */}
          <div className="mt-2.5">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name} ({lang.localName})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Voice Style selector */}
        <div>
          <label className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-700 mb-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <span>{t.styleLabel}</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {VOICE_STYLES.map((st) => {
              const isSelected = style === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStyle(st.id)}
                  className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'bg-indigo-50/90 border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-950 shadow-xs'
                      : 'bg-slate-50/70 hover:bg-slate-100/80 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-indigo-600">
                    {getStyleIcon(st.iconName)}
                    <span className="font-bold text-xs sm:text-sm text-slate-900">
                      {uiLang === 'hi' ? st.labelHi.split(' ')[0] : st.labelEn}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 line-clamp-2 leading-tight">
                    {uiLang === 'hi' ? st.descHi : st.descEn}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 3: Speed control */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-700">
              <Gauge className="w-4 h-4 text-indigo-600" />
              <span>{t.speedLabel}</span>
            </label>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
              {speed}x
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {SPEED_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSpeed(opt.value)}
                className={`py-2 px-1 text-center rounded-xl text-xs font-semibold border transition-all ${
                  speed === opt.value
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {uiLang === 'hi' ? opt.labelHi : opt.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Submit / Generate Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onGenerate}
            disabled={isGenerating}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-base sm:text-lg flex items-center justify-center gap-3 transition-all shadow-md active:scale-[0.99] ${
              isGenerating
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed shadow-none'
                : hasText
                ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 hover:from-indigo-700 hover:via-purple-700 hover:to-blue-700 text-white shadow-indigo-500/25 cursor-pointer hover:shadow-lg'
                : 'bg-indigo-600 text-white opacity-90 hover:opacity-100 cursor-pointer'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-indigo-600" />
                <span>{t.generatingButton}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300" />
                <span>{t.generateButton}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
};
