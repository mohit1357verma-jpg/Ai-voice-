import React, { useRef } from 'react';
import { Clipboard, Trash2, Sparkles, AlertCircle, FileText } from 'lucide-react';
import { UiLanguage, SampleText, VoiceStyle } from '../types';
import { I18N, SAMPLE_TEXTS } from '../data/constants';

interface TextInputSectionProps {
  text: string;
  setText: (t: string) => void;
  uiLang: UiLanguage;
  onSelectSample: (sample: SampleText) => void;
  validationError: string | null;
  onClearValidationError: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const MAX_CHARS = 3000;

export const TextInputSection: React.FC<TextInputSectionProps> = ({
  text,
  setText,
  uiLang,
  onSelectSample,
  validationError,
  onClearValidationError,
  showToast,
}) => {
  const t = I18N[uiLang];
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handlePaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clipboardText = await navigator.clipboard.readText();
        if (clipboardText) {
          setText(clipboardText.slice(0, MAX_CHARS));
          onClearValidationError();
          showToast(t.pastedSuccess, 'success');
          textareaRef.current?.focus();
        } else {
          showToast(uiLang === 'hi' ? 'क्लिपबोर्ड खाली है।' : 'Clipboard is empty.', 'info');
        }
      } else {
        showToast(
          uiLang === 'hi'
            ? 'कृपया कीबोर्ड शॉर्टकट (Ctrl+V या Cmd+V) का उपयोग करें।'
            : 'Please use Ctrl+V or Cmd+V to paste.',
          'info'
        );
      }
    } catch (err) {
      showToast(
        uiLang === 'hi'
          ? 'क्लिपबोर्ड एक्सेस की अनुमति नहीं मिली। कृपया सीधे पेस्ट करें।'
          : 'Clipboard access denied. Please paste directly.',
        'info'
      );
    }
  };

  const handleClear = () => {
    setText('');
    onClearValidationError();
    textareaRef.current?.focus();
  };

  const charCount = text.length;
  const isNearLimit = charCount > MAX_CHARS * 0.9;
  const progressPercent = Math.min(100, (charCount / MAX_CHARS) * 100);

  return (
    <section className="bg-white rounded-3xl p-5 sm:p-7 shadow-xs border border-slate-200/90 relative overflow-hidden transition-all">
      {/* Top row: Section title & quick tools */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
            1
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800">
            {t.inputSectionTitle}
          </h2>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePaste}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 rounded-xl transition-colors border border-indigo-200/60 active:scale-95"
            title={t.pasteText}
          >
            <Clipboard className="w-3.5 h-3.5" />
            <span>{t.pasteText}</span>
          </button>

          {text.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors border border-rose-200/60 active:scale-95"
              title={t.clearText}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.clearText}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Textarea Container */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            if (e.target.value.length <= MAX_CHARS) {
              setText(e.target.value);
              if (validationError) onClearValidationError();
            }
          }}
          placeholder={t.inputPlaceholder}
          rows={5}
          className={`w-full p-4 rounded-2xl text-slate-800 placeholder-slate-400 bg-slate-50/70 border text-base sm:text-lg leading-relaxed focus:bg-white focus:outline-none transition-all resize-y min-h-[140px] max-h-[380px] ${
            validationError
              ? 'border-rose-400 focus:ring-3 focus:ring-rose-200'
              : 'border-slate-200 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100'
          }`}
        />

        {/* Character Counter & Limit Bar */}
        <div className="flex items-center justify-between mt-2 px-1 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span
              className={`font-mono font-medium ${
                isNearLimit ? 'text-amber-600 font-bold' : 'text-slate-500'
              }`}
            >
              {charCount} / {MAX_CHARS} {t.characters}
            </span>
          </div>

          <div className="w-24 sm:w-32 bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                isNearLimit
                  ? 'bg-amber-500'
                  : progressPercent > 50
                  ? 'bg-indigo-500'
                  : 'bg-indigo-400'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Validation alert */}
      {validationError && (
        <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs sm:text-sm text-rose-700 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Quick Sample Prompts Section */}
      <div className="mt-4 pt-3.5 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>{t.sampleTextsTitle}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_TEXTS.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => onSelectSample(sample)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100/80 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 text-slate-700 border border-slate-200/70 transition-all text-left group"
            >
              <FileText className="w-3 h-3 text-slate-400 group-hover:text-indigo-500 transition-colors" />
              <span>
                {uiLang === 'hi' ? sample.titleHi : sample.titleEn}
              </span>
              <span className="text-[10px] text-slate-400 group-hover:text-indigo-400">
                ({sample.lang.startsWith('hi') ? 'हिंदी' : 'Eng'})
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
