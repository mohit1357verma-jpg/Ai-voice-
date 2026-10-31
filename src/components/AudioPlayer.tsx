import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Volume2,
  VolumeX,
  FastForward,
  Rewind,
  Music,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { UiLanguage, GeneratedAudio } from '../types';
import { I18N } from '../data/constants';

interface AudioPlayerProps {
  currentAudio: GeneratedAudio | null;
  uiLang: UiLanguage;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  currentAudio,
  uiLang,
  showToast,
}) => {
  const t = I18N[uiLang];
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Initialize or update audio when currentAudio changes
  useEffect(() => {
    if (!currentAudio) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    const audio = new Audio(currentAudio.blobUrl);
    audioRef.current = audio;
    audio.playbackRate = playbackSpeed;
    audio.volume = isMuted ? 0 : volume;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || currentAudio.duration || 0);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    // Auto-play the newly generated speech for delightful UX
    audio
      .play()
      .then(() => setIsPlaying(true))
      .catch((e) => {
        console.log('Autoplay prevented by browser:', e);
        setIsPlaying(false);
      });

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentAudio]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.error('Playback error:', err);
          showToast('प्लेबैक प्रारंभ नहीं हो सका', 'error');
        });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleSkip = (seconds: number) => {
    if (!audioRef.current) return;
    const target = Math.min(Math.max(0, audioRef.current.currentTime + seconds), duration);
    audioRef.current.currentTime = target;
    setCurrentTime(target);
  };

  const handleReplay = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
    audioRef.current.play().then(() => setIsPlaying(true));
  };

  const handleSpeedChange = (spd: number) => {
    setPlaybackSpeed(spd);
    if (audioRef.current) {
      audioRef.current.playbackRate = spd;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 1;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const handleDownload = () => {
    if (!currentAudio) return;
    setIsDownloading(true);

    try {
      const a = document.createElement('a');
      a.href = currentAudio.blobUrl;
      a.download = currentAudio.filename || `EasyVoice_AI_${Date.now()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      showToast(t.downloadSuccess, 'success');
    } catch (err) {
      console.error('Download error:', err);
      showToast('डाउनलोड में त्रुटि हुई', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const formatTime = (timeInSec: number) => {
    if (isNaN(timeInSec) || !isFinite(timeInSec)) return '0:00';
    const mins = Math.floor(timeInSec / 60);
    const secs = Math.floor(timeInSec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!currentAudio) {
    return null;
  }

  return (
    <section className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 sm:p-7 shadow-xl border border-indigo-700/40 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header of Player */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base sm:text-lg tracking-tight text-white flex items-center gap-2">
              {t.playerTitle}
              <span className="text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                WAV 24kHz
              </span>
            </h3>
            <p className="text-xs text-indigo-200/80">
              {uiLang === 'hi' ? 'आवाज़:' : 'Voice:'} {currentAudio.voiceName} • {currentAudio.style}
            </p>
          </div>
        </div>

        {/* Prominent Download Button */}
        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>{isDownloading ? t.downloading : t.downloadButton}</span>
        </button>
      </div>

      {/* Spoken Text Preview Snippet */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-3 mb-5 text-xs sm:text-sm text-indigo-100/90 italic line-clamp-2">
        "{currentAudio.text}"
      </div>

      {/* Visualizer bars animation */}
      <div className="flex items-end justify-center gap-1.5 h-12 mb-4 px-2">
        {[20, 45, 75, 95, 60, 30, 85, 100, 50, 25, 70, 90, 40, 65, 80, 55, 35, 75, 45, 90, 60].map((h, i) => (
          <div
            key={i}
            className={`w-1 sm:w-1.5 rounded-full transition-all duration-150 ${
              isPlaying
                ? 'bg-gradient-to-t from-indigo-500 to-purple-400 animate-pulse'
                : 'bg-indigo-400/30'
            }`}
            style={{
              height: isPlaying ? `${Math.max(15, (h * (i % 2 === 0 ? 0.8 : 1.1)) % 100)}%` : '18%',
              animationDelay: `${i * 70}ms`,
            }}
          />
        ))}
      </div>

      {/* Seek / Progress Bar */}
      <div className="space-y-1 mb-4">
        <input
          type="range"
          min={0}
          max={duration || 100}
          step="0.01"
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-2 bg-indigo-950 rounded-lg appearance-none cursor-pointer accent-indigo-400 focus:outline-none"
        />
        <div className="flex justify-between text-xs font-mono text-indigo-300">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Player Controls Center */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/10">
        {/* Left: Replay & Skip */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReplay}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-indigo-200 transition-colors"
            title={t.replay}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleSkip(-5)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-indigo-200 transition-colors"
            title="-5s"
          >
            <Rewind className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Play/Pause Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={togglePlay}
            className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/40 active:scale-95 transition-all"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-0.5" />
            )}
          </button>
        </div>

        {/* Right: Forward & Speed & Volume */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSkip(5)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-indigo-200 transition-colors"
            title="+5s"
          >
            <FastForward className="w-4 h-4" />
          </button>

          {/* Speed badge toggle */}
          <div className="flex items-center bg-white/10 rounded-xl p-0.5">
            {[1.0, 1.25, 1.5].map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => handleSpeedChange(spd)}
                className={`px-2 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  playbackSpeed === spd
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-indigo-200 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Volume control */}
          <div className="hidden sm:flex items-center gap-1.5 ml-2">
            <button
              type="button"
              onClick={toggleMute}
              className="p-1.5 text-indigo-200 hover:text-white"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1.5 bg-indigo-950 rounded-lg appearance-none cursor-pointer accent-indigo-400"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
