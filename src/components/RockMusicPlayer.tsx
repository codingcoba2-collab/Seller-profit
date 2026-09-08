import React, { useState, useEffect } from 'react';
import { 
  RockMusic, 
  ROCK_TRACKS 
} from '../services/rockMusic';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Flame, 
  ChevronUp, 
  ChevronDown, 
  Music,
  Radio
} from 'lucide-react';

interface RockMusicPlayerProps {
  onNotify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const RockMusicPlayer: React.FC<RockMusicPlayerProps> = ({ onNotify }) => {
  const [isPlaying, setIsPlaying] = useState(RockMusic.getIsPlaying());
  const [volume, setVolume] = useState(RockMusic.getVolume());
  const [currentStyle, setCurrentStyle] = useState(RockMusic.getCurrentStyle());
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const unsub = RockMusic.subscribe(() => {
      setIsPlaying(RockMusic.getIsPlaying());
      setVolume(RockMusic.getVolume());
      setCurrentStyle(RockMusic.getCurrentStyle());
    });

    const unsubBeat = RockMusic.onBeat((step) => {
      setActiveStep(step);
    });

    return () => {
      unsub();
      unsubBeat();
    };
  }, []);

  const handleTogglePlay = () => {
    RockMusic.togglePlay();
    if (!isPlaying) {
      onNotify?.('🎸 Instrumen musik rock diputar! Semangat live streaming!', 'success');
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    RockMusic.setVolume(val);
  };

  const handleToggleMute = () => {
    if (volume > 0) {
      RockMusic.setVolume(0);
    } else {
      RockMusic.setVolume(0.6);
    }
  };

  const currentTrack = ROCK_TRACKS.find((t) => t.id === currentStyle) || ROCK_TRACKS[0];

  return (
    <div className="fixed bottom-20 right-3 sm:right-5 z-50 select-none">
      {/* Expanded Player Card */}
      {isExpanded ? (
        <div className="w-80 p-4 rounded-3xl bg-[#161823]/95 backdrop-blur-xl border border-white/20 shadow-2xl space-y-3.5 text-white animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FE2C55] to-amber-500 flex items-center justify-center text-white shadow-md">
                <Flame className={`w-4 h-4 ${isPlaying ? 'animate-bounce' : ''}`} />
              </div>
              <div>
                <h4 className="text-xs font-black text-white flex items-center gap-1">
                  <span>Rock Instrumental</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#FE2C55]/20 text-[#FE2C55] border border-[#FE2C55]/30">LIVE</span>
                </h4>
                <p className="text-[10px] text-zinc-400">Musik Penyemangat Kerja &amp; Live Shop</p>
              </div>
            </div>

            <button
              type="button"
              id="btn-collapse-rock-player"
              onClick={() => setIsExpanded(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
              title="Kecilkan Player"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Track Visualizer & Info */}
          <div className="p-3 rounded-2xl bg-[#0b0c10] border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-white truncate max-w-[190px]">
                {currentTrack.name}
              </div>
              <span className="text-[10px] font-mono text-[#25F4EE] px-1.5 py-0.5 rounded bg-[#25F4EE]/10 border border-[#25F4EE]/20">
                {currentTrack.bpm} BPM
              </span>
            </div>

            <p className="text-[11px] text-zinc-400 line-clamp-1">
              {currentTrack.description}
            </p>

            {/* Equalizer Visualizer Bars */}
            <div className="h-6 flex items-end justify-between gap-1 pt-1 px-1">
              {[4, 8, 12, 16, 14, 10, 6, 12, 16, 8, 14, 18, 10, 15, 7, 13].map((height, idx) => {
                const isActive = isPlaying && ((activeStep % 16) === idx || (activeStep % 4) === (idx % 4));
                return (
                  <div
                    key={idx}
                    className={`flex-1 rounded-full transition-all duration-75 ${
                      isActive 
                        ? 'bg-gradient-to-t from-[#25F4EE] to-[#FE2C55]' 
                        : isPlaying 
                          ? 'bg-[#25F4EE]/40' 
                          : 'bg-white/10'
                    }`}
                    style={{
                      height: isPlaying ? `${isActive ? Math.min(24, height + 6) : Math.max(4, height / 2)}px` : '4px',
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Track Selector Pills */}
          <div className="grid grid-cols-3 gap-1.5">
            {ROCK_TRACKS.map((t) => (
              <button
                key={t.id}
                type="button"
                id={`btn-rock-style-${t.id}`}
                onClick={() => RockMusic.setStyle(t.id)}
                className={`py-1.5 px-1 rounded-xl text-[10px] font-bold text-center transition cursor-pointer truncate ${
                  currentStyle === t.id
                    ? 'bg-[#FE2C55] text-white shadow-sm'
                    : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/5'
                }`}
              >
                {t.name.split(' ')[0]} {t.name.split(' ')[1]}
              </button>
            ))}
          </div>

          {/* Controls: Play/Pause & Volume */}
          <div className="flex items-center gap-3 pt-1 border-t border-white/10">
            <button
              type="button"
              id="btn-play-pause-rock"
              onClick={handleTogglePlay}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition cursor-pointer shadow-lg active:scale-95 shrink-0 ${
                isPlaying 
                  ? 'bg-gradient-to-r from-[#25F4EE] to-emerald-400 text-black font-black' 
                  : 'bg-gradient-to-r from-[#FE2C55] to-amber-500 text-white font-black'
              }`}
              title={isPlaying ? 'Jeda Musik' : 'Putar Musik Rock'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            {/* Volume slider */}
            <div className="flex-1 flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleMute}
                className="text-zinc-400 hover:text-white transition cursor-pointer"
                title={volume === 0 ? 'Aktifkan Suara' : 'Bisukan Suara'}
              >
                {volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={handleVolumeChange}
                className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#25F4EE]"
              />
              <span className="text-[10px] font-mono text-zinc-400 w-7 text-right">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Floating Mini Pill / Icon Button */
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-floating-rock-music"
            onClick={() => setIsExpanded(true)}
            className={`group pl-2.5 pr-3 py-2 rounded-full border shadow-xl backdrop-blur-md flex items-center gap-2 transition-all cursor-pointer active:scale-95 ${
              isPlaying
                ? 'bg-[#161823]/90 border-[#FE2C55]/60 text-white shadow-[#FE2C55]/20'
                : 'bg-[#161823]/90 border-white/20 text-zinc-300 hover:text-white hover:border-[#25F4EE]/40'
            }`}
            title="Buka Musik Rock Instrumental"
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
              isPlaying ? 'bg-gradient-to-r from-[#FE2C55] to-amber-500 text-white animate-pulse' : 'bg-white/10 text-[#FE2C55]'
            }`}>
              <Flame className="w-4 h-4" />
            </div>

            <div className="text-left leading-none">
              <div className="text-[11px] font-black flex items-center gap-1">
                <span>Musik Rock</span>
                {isPlaying && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#25F4EE] animate-ping" />
                )}
              </div>
              <div className="text-[9px] text-zinc-400 font-medium">
                {isPlaying ? 'Memutar Riff...' : 'Klik utk Putar'}
              </div>
            </div>

            {/* Quick Play/Pause mini button */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                handleTogglePlay();
              }}
              className={`p-1.5 rounded-full ml-0.5 transition hover:scale-110 ${
                isPlaying ? 'bg-[#25F4EE] text-black' : 'bg-[#FE2C55] text-white'
              }`}
            >
              {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
