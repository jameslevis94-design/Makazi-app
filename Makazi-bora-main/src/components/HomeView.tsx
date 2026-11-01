import React, { useState, useMemo, useEffect, useRef } from 'react';
import { House, HeroContent, DEFAULT_HERO_CONTENT } from '../types';
import HouseCard from './HouseCard';
import { 
  SlidersHorizontal, Search, Sparkles, Map, Compass, 
  Pencil, Check, X, Shield, RefreshCw, Play, Pause, 
  Volume2, VolumeX, RotateCcw, Clock, Video, Film, FastForward,
  UploadCloud, AlertCircle
} from 'lucide-react';
import { saveStoredVideo, clearStoredVideo } from '../lib/videoStorage';

interface HomeViewProps {
  houses: House[];
  searchQuery: string;
  onBook: (house: House) => void;
  onView: (house: House) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onBoost?: (house: House) => void;
  onViewOwnerProfile?: (ownerName: string) => void;
  heroContent?: HeroContent;
  onUpdateHeroContent?: (content: HeroContent) => void;
  isCEO?: boolean;
  onOpenCEODashboard?: () => void;
}

const CATEGORIES = [
  { id: 'all', label: 'All Stays', icon: Compass },
  { id: 'fremu', label: 'Fremu za biashara', keyword: 'fremu' },
  { id: 'self', label: 'Self room', keyword: 'self' },
  { id: 'chumba', label: 'Chumba kimoja', keyword: 'chumba' },
  { id: 'lodge', label: 'Logde room', keyword: 'lodge' },
  { id: 'kiwanja', label: 'Kiwanja and NHF', keyword: 'kiwanja' },
];

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function HomeView({ 
  houses, 
  searchQuery, 
  onBook, 
  onView, 
  favorites, 
  onToggleFavorite, 
  onBoost, 
  onViewOwnerProfile,
  heroContent = DEFAULT_HERO_CONTENT,
  onUpdateHeroContent,
  isCEO = false,
  onOpenCEODashboard
}: HomeViewProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isEditingHero, setIsEditingHero] = useState(false);
  const [draftHero, setDraftHero] = useState<HeroContent>(() => heroContent || DEFAULT_HERO_CONTENT);
  const [heroSuccessMsg, setHeroSuccessMsg] = useState(false);

  // Video cycle states: 'video' | 'text' (Initializes to 'video' automatically on first visit or after 5 hours)
  const [displayMode, setDisplayMode] = useState<'video' | 'text'>(() => {
    if (heroContent.videoEnabled === false) return 'text';
    const lastEndedStr = localStorage.getItem('makazi_hero_video_last_ended');
    if (!lastEndedStr) return 'video';
    const lastEnded = parseInt(lastEndedStr, 10);
    const cycleMs = (heroContent.cycleIntervalHours ?? 5) * 60 * 60 * 1000;
    return (Date.now() - lastEnded >= cycleMs) ? 'video' : 'text';
  });
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [remainingTimeText, setRemainingTimeText] = useState<string>('');
  const [videoProgress, setVideoProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Automatic video playback without requiring manual interaction
  useEffect(() => {
    if (displayMode === 'video' && heroContent.videoEnabled !== false && videoRef.current) {
      videoRef.current.muted = isVideoMuted;
      videoRef.current.currentTime = 0;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsVideoPlaying(true))
          .catch(() => {
            // Autoplay policy fallback: enforce mute and play automatically
            if (videoRef.current) {
              videoRef.current.muted = true;
              setIsVideoMuted(true);
              videoRef.current.play()
                .then(() => setIsVideoPlaying(true))
                .catch((e) => console.warn('Autoplay error:', e));
            }
          });
      }
    }
  }, [displayMode, heroContent.videoUrl]);

  // Drag and Drop notice state (used inside Hariri Hero CEO editor)
  const [dragDropNotice, setDragDropNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const inlineFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setDraftHero(heroContent || DEFAULT_HERO_CONTENT);
  }, [heroContent]);

  // Process dropped or selected video file
  const processVideoFile = async (file: File) => {
    const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v|ogg|ogv)$/i.test(file.name);
    if (!isVideo) {
      setDragDropNotice({
        type: 'error',
        message: 'Tafadhali buruta au chagua faili halisi la video (MP4, WebM, MOV, OGG).'
      });
      setTimeout(() => setDragDropNotice(null), 4500);
      return;
    }

    try {
      // 1. Save to browser IndexedDB so it survives page reloads
      await saveStoredVideo(file, file.name, file.type);

      // 2. Create Object URL for direct high-performance playback
      const objectUrl = URL.createObjectURL(file);

      // 3. Construct updated Hero content
      const updated: HeroContent = {
        ...(heroContent || DEFAULT_HERO_CONTENT),
        videoUrl: objectUrl,
        videoFileName: file.name,
        videoFileSize: file.size,
        isCustomUpload: true,
        videoEnabled: true
      };

      if (onUpdateHeroContent) {
        onUpdateHeroContent(updated);
      } else {
        localStorage.setItem('makazi_hero_content', JSON.stringify(updated));
      }
      setDraftHero(updated);

      // 4. Reset video cycle timer so new video starts playing immediately!
      localStorage.removeItem('makazi_hero_video_last_ended');
      setDisplayMode('video');
      setIsVideoPlaying(true);
      setVideoProgress(0);

      if (videoRef.current) {
        videoRef.current.src = objectUrl;
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }

      setDragDropNotice({
        type: 'success',
        message: `Video "${file.name}" (${formatFileSize(file.size)}) imepakiwa na inaanza kucheza sasa! Baada ya kuisha, maandishi yataonekana na mzunguko wa masaa 5 utaanza mfululizo.`
      });
      setTimeout(() => setDragDropNotice(null), 6000);
    } catch (err) {
      console.error('Error handling dropped video:', err);
      setDragDropNotice({
        type: 'error',
        message: 'Hitilafu ilitokea wakati wa kupakia video. Tafadhali jaribu tena.'
      });
      setTimeout(() => setDragDropNotice(null), 4500);
    }
  };

  // Reset custom video and restore default
  const handleResetCustomVideo = async () => {
    try {
      await clearStoredVideo();
      const updated: HeroContent = {
        ...(heroContent || DEFAULT_HERO_CONTENT),
        videoUrl: DEFAULT_HERO_CONTENT.videoUrl,
        videoFileName: undefined,
        videoFileSize: undefined,
        isCustomUpload: false
      };
      if (onUpdateHeroContent) {
        onUpdateHeroContent(updated);
      } else {
        localStorage.setItem('makazi_hero_content', JSON.stringify(updated));
      }
      setDraftHero(updated);
      localStorage.removeItem('makazi_hero_video_last_ended');
      setDisplayMode('video');
      setIsVideoPlaying(true);
      setVideoProgress(0);
      if (videoRef.current) {
        videoRef.current.src = DEFAULT_HERO_CONTENT.videoUrl || '';
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
      setDragDropNotice({
        type: 'success',
        message: 'Video imerejeshwa kwenye video asili ya makazi.'
      });
      setTimeout(() => setDragDropNotice(null), 4000);
    } catch (err) {
      console.error('Error resetting video:', err);
    }
  };

  // Cycle interval in milliseconds (default 5 hours)
  const cycleIntervalMs = useMemo(() => {
    const hours = heroContent.cycleIntervalHours ?? 5;
    return hours * 60 * 60 * 1000;
  }, [heroContent.cycleIntervalHours]);

  // Persistent continuous cycle tracker: Video -> Text (5 hours) -> Video (loop)
  useEffect(() => {
    if (heroContent.videoEnabled === false) {
      setDisplayMode('text');
      return;
    }

    const checkCycle = () => {
      const lastEndedStr = localStorage.getItem('makazi_hero_video_last_ended');
      if (!lastEndedStr) {
        // Initial visit: start with video
        setDisplayMode('video');
        return;
      }

      const lastEnded = parseInt(lastEndedStr, 10);
      const now = Date.now();
      const elapsed = now - lastEnded;

      if (elapsed >= cycleIntervalMs) {
        // 5 hours have elapsed -> restart cycle with video automatically!
        localStorage.removeItem('makazi_hero_video_last_ended');
        setDisplayMode('video');
        setIsVideoPlaying(true);
        setVideoProgress(0);
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.play().catch(() => {});
        }
      } else {
        // Within 5 hours -> show text mode
        setDisplayMode('text');
        const remaining = cycleIntervalMs - elapsed;
        const totalMinutes = Math.floor(remaining / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const seconds = Math.floor((remaining % 60000) / 1000);

        if (hours > 0) {
          setRemainingTimeText(`${hours}h ${minutes}m ${seconds}s`);
        } else if (minutes > 0) {
          setRemainingTimeText(`${minutes}m ${seconds}s`);
        } else {
          setRemainingTimeText(`${seconds}s`);
        }
      }
    };

    checkCycle();
    const interval = setInterval(checkCycle, 1000);
    return () => clearInterval(interval);
  }, [heroContent.videoEnabled, cycleIntervalMs]);

  // Video ended handler: transition to text and record timestamp for 5-hour countdown
  const handleVideoEnded = () => {
    localStorage.setItem('makazi_hero_video_last_ended', Date.now().toString());
    setDisplayMode('text');
    setVideoProgress(100);
  };

  // Replay video manually anytime (CEO testing or user interest)
  const handleReplayVideo = () => {
    localStorage.removeItem('makazi_hero_video_last_ended');
    setDisplayMode('video');
    setIsVideoPlaying(true);
    setVideoProgress(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  };

  const handleTogglePlayVideo = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
        setIsVideoPlaying(true);
      } else {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      }
    }
  };

  const handleToggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsVideoMuted(videoRef.current.muted);
    }
  };

  const handleSaveInlineHero = () => {
    if (onUpdateHeroContent) {
      onUpdateHeroContent(draftHero);
    } else {
      localStorage.setItem('makazi_hero_content', JSON.stringify(draftHero));
    }
    setIsEditingHero(false);
    setHeroSuccessMsg(true);
    setTimeout(() => setHeroSuccessMsg(false), 3500);
  };

  // Render title with optional accent phrase highlighting
  const renderHighlightedTitle = (title: string, accent?: string) => {
    if (!accent || !accent.trim() || !title.toLowerCase().includes(accent.toLowerCase().trim())) {
      return title;
    }
    const escaped = accent.trim().replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = title.split(regex);
    return parts.map((part, idx) => 
      part.toLowerCase() === accent.toLowerCase().trim() ? (
        <span key={idx} className="text-indigo-300 font-semibold">{part}</span>
      ) : (
        part
      )
    );
  };

  // Filter listings based on category selection AND top-level search queries
  const filteredHouses = useMemo(() => {
    return houses.filter((house) => {
      // 1. Category check
      const currentCat = CATEGORIES.find((c) => c.id === selectedCategory);
      if (currentCat && currentCat.keyword) {
        const hasKeyword = 
          house.features.some((f) => f.toLowerCase().includes(currentCat.keyword!)) ||
          house.description.toLowerCase().includes(currentCat.keyword!) ||
          house.title.toLowerCase().includes(currentCat.keyword!);
        if (!hasKeyword) return false;
      }

      // 2. Search Query check (location, title, description, features)
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const matchesLocation = house.location.toLowerCase().includes(query);
        const matchesTitle = house.title.toLowerCase().includes(query);
        const matchesDesc = house.description.toLowerCase().includes(query);
        const matchesFeatures = house.features.some((f) => f.toLowerCase().includes(query));
        
        return matchesLocation || matchesTitle || matchesDesc || matchesFeatures;
      }

      return true;
    });
  }, [houses, selectedCategory, searchQuery]);

  const activeVideoUrl = heroContent.videoUrl || DEFAULT_HERO_CONTENT.videoUrl;

  return (
    <div className="space-y-6">
      {/* Drag & Drop Feedback Toast (Visible when CEO uploads/updates a video) */}
      {dragDropNotice && (
        <div className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-lg animate-fadeIn ${
          dragDropNotice.type === 'success'
            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
            : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {dragDropNotice.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{dragDropNotice.message}</span>
          </div>
          <button 
            onClick={() => setDragDropNotice(null)}
            className="text-slate-400 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* CEO Update Success Toast */}
      {heroSuccessMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-between shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Maandishi na mipangilio ya Hero Banner yamehifadhiwa na yanaonekana moja kwa moja!</span>
          </div>
          <button 
            onClick={() => setHeroSuccessMsg(false)}
            className="text-slate-400 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Banner Hero Container (Holds Video OR Text, cycling every 5 hours automatically) */}
      <div 
        className="relative rounded-[32px] overflow-hidden bg-gradient-to-r from-indigo-950/70 to-slate-900/80 text-white p-6 sm:p-12 border border-white/10 shadow-2xl backdrop-blur-3xl transition-all duration-300"
      >
        {/* Ambient glow inside hero */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-[200px] h-[200px] bg-rose-500/10 rounded-full blur-[60px] pointer-events-none" />
        
        {/* Top Right Action Controls */}
        {!isEditingHero && (
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 flex flex-wrap items-center justify-end gap-2">
            {/* If video is currently playing, provide a clean skip button */}
            {displayMode === 'video' && heroContent.videoEnabled !== false && (
              <button
                onClick={handleVideoEnded}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/50 hover:bg-black/80 border border-white/20 text-white text-xs font-semibold backdrop-blur-md transition-all cursor-pointer hover:scale-105 active:scale-95"
                title="Ruka video uone maandishi sasa"
              >
                <FastForward className="w-3.5 h-3.5 text-yellow-300" />
                <span>Ruka Video (Skip)</span>
              </button>
            )}
          </div>
        )}

        {/* 1. VIDEO MODE (Plays first, transitions to text upon completion) */}
        {!isEditingHero && displayMode === 'video' && heroContent.videoEnabled !== false ? (
          <div className="relative z-10 max-w-4xl space-y-4 animate-fadeIn">
            {/* Video Showcase Header Tag */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-600/80 text-white text-[10px] font-bold uppercase tracking-widest leading-none border border-indigo-400/40 shadow-xs">
                <Film className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                <span>
                  {heroContent.isCustomUpload 
                    ? `Video: ${heroContent.videoFileName || 'Custom Video'}` 
                    : 'Makazi Architectural Showcase Video'}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                <Clock className="w-3 h-3 text-indigo-400" />
                Inacheza kiotomatiki • Itaondolewa mara moja ikimalizika na kuonyesha maandishi (Mzunguko wa masaa 5)
              </span>
            </div>

            {/* Video Player Card */}
            <div className="relative rounded-2xl overflow-hidden bg-black/60 border border-white/15 aspect-video max-h-[380px] w-full shadow-2xl group">
              <video
                ref={videoRef}
                src={activeVideoUrl}
                autoPlay
                playsInline
                muted={isVideoMuted}
                onEnded={handleVideoEnded}
                onTimeUpdate={(e) => {
                  const target = e.currentTarget;
                  if (target.duration) {
                    setVideoProgress((target.currentTime / target.duration) * 100);
                    // Automatically remove the video and show text as soon as it reaches the end
                    if (target.duration > 0 && target.currentTime >= target.duration - 0.15) {
                      handleVideoEnded();
                    }
                  }
                }}
                onError={() => {
                  console.warn('Video failed to play, switching automatically to text mode');
                  handleVideoEnded();
                }}
                className="w-full h-full object-cover"
              />

              {/* Video Bottom Floating Controls */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTogglePlayVideo}
                    className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-all cursor-pointer"
                    title={isVideoPlaying ? "Sitisha (Pause)" : "Cheza (Play)"}
                  >
                    {isVideoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={handleToggleMute}
                    className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-all cursor-pointer"
                    title={isVideoMuted ? "Washa Sauti (Unmute)" : "Zima Sauti (Mute)"}
                  >
                    {isVideoMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                  </button>
                  <span className="text-[11px] text-slate-300 font-mono hidden sm:inline">
                    {isVideoMuted ? "Sauti imezimwa (Muted)" : "Sauti inawaka"}
                  </span>
                </div>

                <button
                  onClick={handleVideoEnded}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg transition-all cursor-pointer"
                >
                  <span>Onyesha Maandishi Sasa</span>
                  <FastForward className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Visual Progress Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-200"
                  style={{ width: `${videoProgress}%` }}
                />
              </div>
            </div>
          </div>
        ) : !isEditingHero ? (
          /* 2. TEXT MODE (Shows after video ends, clean & pristine without clutter) */
          <div className="relative z-10 max-w-2xl space-y-4 animate-fadeIn">
            {/* Super-title badge */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest leading-none border border-white/10 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>{heroContent.badge || DEFAULT_HERO_CONTENT.badge}</span>
              </div>
            </div>

            {/* Headline H1 */}
            <h1 className="font-display font-medium text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight">
              {renderHighlightedTitle(
                heroContent.title || DEFAULT_HERO_CONTENT.title, 
                heroContent.accentWord ?? DEFAULT_HERO_CONTENT.accentWord
              )}
            </h1>

            {/* Description Paragraph */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg">
              {heroContent.description || DEFAULT_HERO_CONTENT.description}
            </p>
          </div>
        ) : (
          /* 3. INLINE CEO EDITING MODE (All video upload, drag & drop, testing & controls consolidated here) */
          <div className="relative z-10 max-w-3xl space-y-4 animate-fadeIn">
            {/* Hidden file input for inline editor */}
            <input
              type="file"
              ref={inlineFileInputRef}
              accept="video/mp4,video/webm,video/ogg,video/quicktime,video/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  processVideoFile(e.target.files[0]);
                }
              }}
            />

            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="inline-flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-yellow-300 animate-spin" />
                <span>CEO Editorial Mode — Hariri Maandishi na Video ya Hero Banner</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDraftHero(DEFAULT_HERO_CONTENT)}
                  className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 transition-all cursor-pointer"
                  title="Rejesha maandishi asili"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Rejesha Asili</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingHero(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
                  title="Ghairi"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Field 1: Super-Title / Badge */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block">
                1. Super-Title / Badge (Chaguo-msingi: Discover Exquisite Escapes)
              </label>
              <input
                type="text"
                value={draftHero.badge}
                onChange={(e) => setDraftHero({ ...draftHero, badge: e.target.value })}
                className="w-full bg-slate-950/90 border border-white/20 focus:border-indigo-400 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 outline-none transition-all shadow-inner"
                placeholder="Discover Exquisite Escapes"
              />
            </div>

            {/* Field 2: Headline Title */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block">
                2. Main Headline (Chaguo-msingi: Pata hifadhi katika usanifu wa kipekee.)
              </label>
              <input
                type="text"
                value={draftHero.title}
                onChange={(e) => setDraftHero({ ...draftHero, title: e.target.value })}
                className="w-full bg-slate-950/90 border border-white/20 focus:border-indigo-400 rounded-xl px-3.5 py-2 text-base font-medium text-white placeholder-slate-500 outline-none transition-all shadow-inner"
                placeholder="Pata hifadhi katika usanifu wa kipekee."
              />
            </div>

            {/* Field 3: Accent Word */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-widest text-indigo-300 font-bold block">
                3. Maneno ya Kung'aa (Glow Accent Words ndani ya Kichwa)
              </label>
              <input
                type="text"
                value={draftHero.accentWord || ''}
                onChange={(e) => setDraftHero({ ...draftHero, accentWord: e.target.value })}
                className="w-full bg-slate-950/90 border border-white/20 focus:border-indigo-400 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none transition-all shadow-inner"
                placeholder="usanifu wa kipekee"
              />
            </div>

            {/* Field 4: Description */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block">
                  4. Description Paragraph (Maelezo ya Kina ya Sehemu ya Mbele)
                </label>
                <span className="text-[10px] text-slate-500 font-mono">{draftHero.description.length} chars</span>
              </div>
              <textarea
                rows={3}
                value={draftHero.description}
                onChange={(e) => setDraftHero({ ...draftHero, description: e.target.value })}
                className="w-full bg-slate-950/90 border border-white/20 focus:border-indigo-400 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none transition-all shadow-inner resize-y leading-relaxed"
                placeholder="Maajabu ya usanifu yaliyochaguliwa kwa umakini mkubwa..."
              />
            </div>

            {/* Field 5: Video Drag & Drop Zone, Upload, Preview, & Revert */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-indigo-400" />
                  <span>5. Video ya Hero (Buruta Faili / Pakia / URL)</span>
                </label>
                {draftHero.videoFileName && (
                  <span className="text-[10px] text-emerald-400 font-mono">
                    Custom Video Active
                  </span>
                )}
              </div>

              {/* Dedicated Drag-and-Drop Dropzone in CEO Editor */}
              <div 
                onClick={() => inlineFileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    processVideoFile(e.dataTransfer.files[0]);
                  }
                }}
                className="p-5 rounded-2xl border-2 border-dashed border-indigo-400/50 hover:border-indigo-400 bg-slate-950/70 hover:bg-slate-950/90 flex flex-col items-center justify-center text-center cursor-pointer transition-all group shadow-inner"
              >
                <UploadCloud className="w-9 h-9 text-indigo-400 group-hover:scale-110 mb-2 transition-transform" />
                <span className="text-xs font-bold text-white mb-0.5">
                  Buruta video mpya hapa au Bonyeza kupakia
                </span>
                <span className="text-[11px] text-slate-400">
                  (MP4, WebM, MOV • Inahifadhiwa kwenye kivinjari)
                </span>
                
                {draftHero.videoFileName && (
                  <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-xs text-indigo-300 font-medium">
                    <Film className="w-3.5 h-3.5 text-yellow-300" />
                    <span>{draftHero.videoFileName}</span>
                    {draftHero.videoFileSize && (
                      <span className="font-mono text-[10px] text-indigo-400">({formatFileSize(draftHero.videoFileSize)})</span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions row inside CEO Editor: Preview video & Revert */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingHero(false);
                    handleReplayVideo();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95"
                  title="Cheza video hii sasa hivi kwenye ukurasa wa mbele"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Tazama / Cheza Video Sasa</span>
                </button>

                {draftHero.isCustomUpload && (
                  <button
                    type="button"
                    onClick={handleResetCustomVideo}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
                    title="Rejesha video asili ya makazi"
                  >
                    <RefreshCw className="w-3 h-3 text-slate-400" />
                    <span>Rejesha Video Asili</span>
                  </button>
                )}
              </div>

              {/* Direct Video URL input */}
              <div className="space-y-1 pt-1.5">
                <span className="text-[10px] text-slate-400 font-mono">Au weka Kiungo cha moja kwa moja (MP4/WebM URL):</span>
                <input
                  type="text"
                  value={draftHero.videoUrl || ''}
                  onChange={(e) => setDraftHero({ ...draftHero, videoUrl: e.target.value })}
                  placeholder="https://example.com/video.mp4"
                  className="w-full bg-slate-950/90 border border-white/20 focus:border-indigo-400 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Field 6: 5-Hour Cycle Duration & Test Controls */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block flex items-center justify-between">
                <span>6. Muda wa Mzunguko wa Video (Cycle Hours)</span>
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
              </label>
              
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  min="0.005"
                  step="0.5"
                  value={draftHero.cycleIntervalHours ?? 5}
                  onChange={(e) => setDraftHero({ ...draftHero, cycleIntervalHours: parseFloat(e.target.value) || 5 })}
                  className="w-24 bg-slate-950/90 border border-white/20 focus:border-indigo-400 rounded-xl px-3 py-1.5 text-xs text-white outline-none font-mono"
                />
                <span className="text-xs text-slate-400">masaa (5 hours)</span>
                
                {/* Presets */}
                <button
                  type="button"
                  onClick={() => setDraftHero({ ...draftHero, cycleIntervalHours: 5 })}
                  className="text-[10px] bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-lg text-slate-300 cursor-pointer transition-all"
                >
                  5 hrs (Kawaida)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const simulatedLastEnded = Date.now() - (cycleIntervalMs - 10000);
                    localStorage.setItem('makazi_hero_video_last_ended', simulatedLastEnded.toString());
                    setDragDropNotice({
                      type: 'success',
                      message: '⚡ Jaribio la Mzunguko: Video itarudi baada ya sekunde 10!'
                    });
                    setTimeout(() => setDragDropNotice(null), 3500);
                  }}
                  className="text-[10px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2.5 py-1.5 rounded-lg cursor-pointer font-bold transition-all"
                  title="Jaribu mzunguko wa video kwa haraka (sekunde 10)"
                >
                  ⚡ Jaribu Mzunguko (10s)
                </button>
              </div>

              {/* Live Cycle Indicator inside CEO Editor */}
              {heroContent.videoEnabled !== false && remainingTimeText && (
                <div className="p-2.5 rounded-xl bg-indigo-950/50 border border-indigo-500/30 flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                    <span>Hali ya Mzunguko Moja kwa Moja:</span>
                  </div>
                  <span className="font-mono text-indigo-200 font-bold">
                    Video itarudi kiotomatiki baada ya: <strong className="text-white">{remainingTimeText}</strong>
                  </span>
                </div>
              )}
              
              <p className="text-[10px] text-slate-400">
                Baada ya video kuisha, inaondolewa na maandishi yanaonyeshwa kwa masaa 5, kisha video inarudi na kucheza tena kiotomatiki mfululizo.
              </p>
            </div>

            {/* Field 7: Video Enabled Switch */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-300 font-medium flex items-center gap-2">
                <Film className="w-4 h-4 text-indigo-400" />
                <span>Wezesha Video kucheza kwanza, kisha kuonyesha maandishi baada ya kuisha (kila masaa 5 mfululizo)</span>
              </span>
              <button
                type="button"
                onClick={() => setDraftHero({ ...draftHero, videoEnabled: draftHero.videoEnabled === false ? true : false })}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  draftHero.videoEnabled !== false 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                    : 'bg-white/10 text-slate-400 border border-white/10'
                }`}
              >
                {draftHero.videoEnabled !== false ? 'Washa (Enabled)' : 'Zima (Disabled)'}
              </button>
            </div>

            {/* Action Save Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
              <div className="text-[11px] text-emerald-400 font-medium">
                Mabadiliko yatahifadhiwa mara moja kwenye ukurasa wa mwanzo.
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingHero(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                >
                  Ghairi (Cancel)
                </button>
                <button
                  type="button"
                  onClick={handleSaveInlineHero}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/25 transition-all cursor-pointer active:scale-95"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Hifadhi Mabadiliko (Save Live)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Categories & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-b border-white/10">
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none scroll-smooth">
          {CATEGORIES.map((category) => {
            const Icon = category.icon || Compass;
            const isActive = selectedCategory === category.id;
            return (
              <button
                id={`cat-filter-${category.id}`}
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 py-2.5 px-5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/25'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <span>{category.label}</span>
              </button>
            );
          })}
        </div>

        {/* Counter indicator */}
        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
          <SlidersHorizontal className="w-4 h-4 text-slate-400" />
          <span>{filteredHouses.length} sanctuaries ready</span>
        </div>
      </div>

      {/* Houses Cards Grid layout */}
      {filteredHouses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredHouses.map((house) => (
            <HouseCard
              key={house.id}
              house={house}
              onBook={onBook}
              onView={onView}
              isFavorite={favorites.includes(house.id)}
              onToggleFavorite={onToggleFavorite}
              onBoost={onBoost}
              onViewOwnerProfile={onViewOwnerProfile}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div id="no-stays-found-state" className="text-center py-20 bg-white/5 border border-white/10 rounded-[32px] p-8 max-w-md mx-auto backdrop-blur-md">
          <div className="p-4 bg-white/5 border border-white/10 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Search className="w-6 h-6 text-indigo-400" />
          </div>
          <h3 className="font-display font-semibold text-lg text-white">
            No Sanctuary Found
          </h3>
          <p className="text-xs text-slate-400 mt-2">
            No properties fit your parameters. Try editing your search query or selecting "All Stays" to clear filters.
          </p>
          <button
            id="clear-filters-btn"
            onClick={() => {
              setSelectedCategory('all');
            }}
            className="mt-6 px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-500 rounded-xl text-xs font-semibold transition-all shadow-lg shadow-indigo-600/20 active:scale-95 cursor-pointer uppercase tracking-wider text-[10px]"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
