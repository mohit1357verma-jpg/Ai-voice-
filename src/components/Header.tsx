import React from 'react';
import { Volume2, Sparkles, Languages, RotateCcw } from 'lucide-react';
import { UiLanguage } from '../types';
import { I18N } from '../data/constants';

interface HeaderProps {
  uiLang: UiLanguage;
  setUiLang: (lang: UiLanguage) => void;
  onReset: () => void;
  isGenerating: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  uiLang,
  setUiLang,
  onReset,
  isGenerating,
}) => {
  const t = I18N[uiLang];

  return (
    <header className="app-header sticky top-0 z-30 backdrop-blur-md border-b shadow-xs">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-blue-500 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white shrink-0">
            <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-1.5">
                {t.appTitle}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                <Sparkles className="w-3 h-3 text-indigo-600" />
                Gemini 3.8 TTS
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              {uiLang === 'hi' ? 'प्राकृतिक AI आवाज़ में रूपांतरण' : 'Natural AI Voice Synthesis'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Reset button */}
          <button
            onClick={onReset}
            disabled={isGenerating}
            title={t.resetButton}
            className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100/80 hover:bg-slate-200/80 rounded-xl transition-all disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">{t.resetButton}</span>
          </button>

          {/* Bilingual Language Selector */}
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setUiLang('hi')}
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs font-semibold rounded-lg transition-all ${
                uiLang === 'hi'
                  ? 'bg-white text-indigo-700 shadow-xs shadow-slate-200 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              हिंदी
            </button>
            <button
              onClick={() => setUiLang('en')}
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs font-semibold rounded-lg transition-all ${
                uiLang === 'en'
                  ? 'bg-white text-indigo-700 shadow-xs shadow-slate-200 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
