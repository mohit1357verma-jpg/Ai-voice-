import React from 'react';
import { History, Play, Download, Trash2, Clock, Check } from 'lucide-react';
import { UiLanguage, GeneratedAudio } from '../types';
import { I18N } from '../data/constants';

interface AudioHistoryProps {
  history: GeneratedAudio[];
  currentAudioId?: string;
  onSelectAudio: (item: GeneratedAudio) => void;
  onClearHistory: () => void;
  uiLang: UiLanguage;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AudioHistory: React.FC<AudioHistoryProps> = ({
  history,
  currentAudioId,
  onSelectAudio,
  onClearHistory,
  uiLang,
  showToast,
}) => {
  const t = I18N[uiLang];

  if (history.length === 0) {
    return null;
  }

  const handleDownloadItem = (item: GeneratedAudio, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const a = document.createElement('a');
      a.href = item.blobUrl;
      a.download = item.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast(t.downloadSuccess, 'success');
    } catch (err) {
      showToast('डाउनलोड में त्रुटि हुई', 'error');
    }
  };

  const formatTimestamp = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <section className="bg-white rounded-3xl p-5 sm:p-7 shadow-xs border border-slate-200/90 transition-all">
      {/* Title & Clear action */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-600" />
          <h3 className="text-base sm:text-lg font-bold text-slate-800">
            {t.historyTitle}
          </h3>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
            {history.length}
          </span>
        </div>

        <button
          type="button"
          onClick={onClearHistory}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors p-1.5"
          title={t.clearHistory}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t.clearHistory}</span>
        </button>
      </div>

      {/* History Items List */}
      <div className="divide-y divide-slate-100">
        {history.map((item) => {
          const isSelected = item.id === currentAudioId;

          return (
            <div
              key={item.id}
              onClick={() => onSelectAudio(item)}
              className={`p-3.5 sm:p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-indigo-50/70 border border-indigo-200'
                  : 'hover:bg-slate-50'
              }`}
            >
              {/* Text & Meta info */}
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-xs font-extrabold text-indigo-900 bg-indigo-100/80 px-2 py-0.5 rounded-md">
                    {item.voiceName}
                  </span>
                  <span className="text-[11px] font-medium text-slate-600 capitalize bg-slate-100 px-2 py-0.5 rounded-md">
                    {item.style}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTimestamp(item.timestamp)}
                  </span>
                  {item.duration > 0 && (
                    <span className="text-[11px] text-slate-500 font-mono">
                      ~{item.duration}s
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-slate-700 font-normal line-clamp-1 italic">
                  "{item.text}"
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => onSelectAudio(item)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{uiLang === 'hi' ? 'सुनें' : 'Play'}</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => handleDownloadItem(item, e)}
                  className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors border border-slate-200 hover:border-emerald-200"
                  title={t.downloadButton}
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
