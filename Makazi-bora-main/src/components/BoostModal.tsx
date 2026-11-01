import React, { useState, useEffect, useRef } from 'react';
import { House } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Video, Mic, ArrowUpRight, Check, 
  AlertCircle, RefreshCw, X, Play, Square, 
  Volume2, Languages, Megaphone, FileText, BadgeCheck, Zap
} from 'lucide-react';

interface BoostModalProps {
  house: House;
  isOpen: boolean;
  onClose: () => void;
  onApplyBoost: (houseId: string, updatedFields: Partial<House>) => void;
  userSubscription: 'premium' | 'business' | 'company' | 'none';
}

export default function BoostModal({ 
  house, 
  isOpen, 
  onClose, 
  onApplyBoost,
  userSubscription
}: BoostModalProps) {
  const [activeSubTab, setActiveSubTab] = useState<'ai' | 'video' | 'voice' | 'campaign'>('ai');
  
  // AI Post Editor states
  const [aiAction, setAiAction] = useState<'rewrite' | 'title' | 'marketing' | 'translate'>('rewrite');
  const [aiText, setAiText] = useState(house.description);
  const [aiContext, setAiContext] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Video Ad Generator states
  const [videoTemplate, setVideoTemplate] = useState('luxury');
  const [videoPrompt, setVideoPrompt] = useState(`High-end promotional ad for ${house.title} focusing on luxury amenities.`);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(house.adVideoUrl || null);
  const [videoSuccess, setVideoSuccess] = useState(false);

  // Voice Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(house.adAudioUrl || null);
  const [volumeLevel, setVolumeLevel] = useState<number[]>(Array(10).fill(1));
  const recordIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Campaign Boost States
  const [isBoosting, setIsBoosting] = useState(false);
  const [boostType, setBoostType] = useState<'normal' | 'featured'>(house.featured ? 'featured' : 'normal');
  const [boostSuccess, setBoostSuccess] = useState(false);

  // Set default AI input text if house changes
  useEffect(() => {
    if (house) {
      if (aiAction === 'title') {
        setAiText(house.title);
      } else {
        setAiText(house.description);
      }
    }
  }, [house, aiAction]);

  // Voice recording simulation
  useEffect(() => {
    if (isRecording) {
      recordIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
        // Simulate bouncing audio waves or random volumes
        setVolumeLevel(Array(15).fill(0).map(() => Math.floor(Math.random() * 8) + 2));
      }, 1000);
    } else {
      if (recordIntervalRef.current) {
        clearInterval(recordIntervalRef.current);
      }
      setRecordingSeconds(0);
      setVolumeLevel(Array(15).fill(1));
    }
    return () => {
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    };
  }, [isRecording]);

  if (!isOpen) return null;

  // 1. AI Post Editor Action Trigger
  const handleAiEnhancement = async () => {
    setIsAiLoading(true);
    setAiError(null);
    setAiResponse('');

    try {
      const response = await fetch('/api/gemini/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: aiAction,
          text: aiText,
          context: aiAction === 'translate' ? (aiContext || 'Swahili') : aiContext
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Server error enhancing listing');
      }

      const data = await response.json();
      setAiResponse(data.enhancedText);
    } catch (err: any) {
      setAiError(err.message || String(err));
    } finally {
      setIsAiLoading(false);
    }
  };

  // Apply AI Changes back to listing
  const handleApplyAiChanges = () => {
    if (!aiResponse) return;
    if (aiAction === 'title') {
      onApplyBoost(house.id, { title: aiResponse.trim() });
    } else {
      onApplyBoost(house.id, { description: aiResponse.trim() });
    }
    alert('AI enhancement successfully applied to your active stay listing!');
  };

  // 2. Video Ad Simulation
  const handleGenerateVideoAd = () => {
    setIsGeneratingVideo(true);
    setTimeout(() => {
      setIsGeneratingVideo(false);
      setGeneratedVideoUrl('https://assets.mixkit.co/videos/preview/mixkit-luxury-resort-with-swimming-pool-41970-large.mp4');
      setVideoSuccess(true);
      onApplyBoost(house.id, { adVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-luxury-resort-with-swimming-pool-41970-large.mp4' });
    }, 2500); // 2.5s simulation
  };

  // 3. Voice Ad Simulation (Simulated Micro)
  const startVoiceRecording = () => {
    setIsRecording(true);
  };

  const stopVoiceRecording = () => {
    setIsRecording(false);
    // Produce simulated voice link
    setRecordedAudioUrl('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
    onApplyBoost(house.id, { adAudioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' });
  };

  // 4. Boost Campaign Trigger
  const handleActivateBoost = () => {
    setIsBoosting(true);
    setTimeout(() => {
      setIsBoosting(false);
      setBoostSuccess(true);
      onApplyBoost(house.id, { 
        boosted: true, 
        featured: boostType === 'featured' || house.featured
      });
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark overlay backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
      />

      <motion.div
        id="boost-modal-container"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-3xl bg-slate-900 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[90vh]"
      >
        {/* Header Block with Sparkles/Boost theme */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-2xl">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Boost & AI Marketing Suite</span>
                <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {userSubscription.toUpperCase()} Active
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Accelerate leads, improve click rates and optimize listings via Gemini AI</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 bg-white/5 text-slate-400 hover:text-white rounded-full border border-white/5 active:scale-95 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Housing Mini-Banner */}
        <div className="bg-white/5 px-6 py-3 border-b border-white/10 flex items-center gap-3">
          <img 
            src={house.images[0]} 
            alt={house.title}
            className="w-10 h-10 rounded-lg object-cover border border-white/10"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Enhancing Listing</p>
            <h4 className="text-xs font-bold text-indigo-250 truncate">{house.title}</h4>
          </div>
          {house.boosted && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[9px] font-bold uppercase tracking-wider">
              <Zap className="w-3 h-3 fill-amber-400" />
              <span>Boost Active</span>
            </span>
          )}
        </div>

        {/* Tabs Rail */}
        <div className="flex bg-[#0b0f19] border-b border-white/10 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveSubTab('ai')}
            className={`flex-1 min-w-[120px] py-3.5 text-xs font-semibold border-b-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeSubTab === 'ai' 
                ? 'border-indigo-500 text-white bg-white/5' 
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>AI Post Editor</span>
          </button>

          <button
            onClick={() => setActiveSubTab('video')}
            className={`flex-1 min-w-[120px] py-3.5 text-xs font-semibold border-b-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeSubTab === 'video' 
                ? 'border-indigo-500 text-white bg-white/5' 
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Video Ads Lab</span>
          </button>

          <button
            onClick={() => setActiveSubTab('voice')}
            className={`flex-1 min-w-[120px] py-3.5 text-xs font-semibold border-b-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeSubTab === 'voice' 
                ? 'border-indigo-500 text-white bg-white/5' 
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Voice Promo Ads</span>
          </button>

          <button
            onClick={() => setActiveSubTab('campaign')}
            className={`flex-1 min-w-[120px] py-3.5 text-xs font-semibold border-b-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeSubTab === 'campaign' 
                ? 'border-indigo-500 text-white bg-white/5' 
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Campaign Boost</span>
          </button>
        </div>

        {/* Content Box */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <AnimatePresence mode="wait">
            
            {/* 1. AI Post Editor Workspace */}
            {activeSubTab === 'ai' && (
              <motion.div
                key="ai-editor"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 border-b border-white/5 pb-4">
                  <button 
                    onClick={() => setAiAction('rewrite')}
                    className={`p-2.5 text-left rounded-xl text-xs transition-colors flex flex-col gap-1 cursor-pointer ${
                      aiAction === 'rewrite' ? 'bg-indigo-600/25 border border-indigo-505/30 text-white' : 'hover:bg-white/5 text-slate-400 border border-transparent'
                    }`}
                  >
                    <span className="font-bold flex items-center gap-1">✨ Rewrite Description</span>
                    <span className="text-[10px] text-slate-400">Professional copy optimization</span>
                  </button>
                  <button 
                    onClick={() => setAiAction('title')}
                    className={`p-2.5 text-left rounded-xl text-xs transition-colors flex flex-col gap-1 cursor-pointer ${
                      aiAction === 'title' ? 'bg-indigo-600/25 border border-indigo-505/30 text-white' : 'hover:bg-white/5 text-slate-400 border border-transparent'
                    }`}
                  >
                    <span className="font-bold flex items-center gap-1">🌟 Improve Title</span>
                    <span className="text-[10px] text-slate-400">Maximum CTR optimize headers</span>
                  </button>
                  <button 
                    onClick={() => setAiAction('marketing')}
                    className={`p-2.5 text-left rounded-xl text-xs transition-colors flex flex-col gap-1 cursor-pointer ${
                      aiAction === 'marketing' ? 'bg-indigo-600/25 border border-indigo-505/30 text-white' : 'hover:bg-white/5 text-slate-400 border border-transparent'
                    }`}
                  >
                    <span className="font-bold flex items-center gap-1">📈 Copy & Keywords</span>
                    <span className="text-[10px] text-slate-400">Bullet hooks & hashtags</span>
                  </button>
                  <button 
                    onClick={() => setAiAction('translate')}
                    className={`p-2.5 text-left rounded-xl text-xs transition-colors flex flex-col gap-1 cursor-pointer ${
                      aiAction === 'translate' ? 'bg-indigo-600/25 border border-indigo-505/30 text-white' : 'hover:bg-white/5 text-slate-400 border border-transparent'
                    }`}
                  >
                    <span className="font-bold flex items-center gap-1">🌐 Translate Stays</span>
                    <span className="text-[10px] text-slate-400">Turn to Swahili or other tongues</span>
                  </button>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-semibold text-slate-300">Input Text for Gemini 3.5 Flash</label>
                  <textarea
                    rows={4}
                    value={aiText}
                    onChange={(e) => setAiText(e.target.value)}
                    className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                    placeholder="Enter the listing details to rewrite or translate..."
                  />
                  
                  {aiAction === 'translate' ? (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-305 flex items-center gap-1">
                        <Languages className="w-3.5 h-3.5" /> Target Language
                      </label>
                      <select 
                        value={aiContext}
                        onChange={(e) => setAiContext(e.target.value)}
                        className="bg-slate-950 border border-white/10 text-xs text-white rounded-xl p-2.5 focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="Swahili">Swahili (Kiswahili) - Locally Tuned</option>
                        <option value="German">German (Deutsch)</option>
                        <option value="French">French (Français)</option>
                        <option value="Italian">Italian (Italiano)</option>
                        <option value="Spanish">Spanish (Español)</option>
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-305">Custom Focus or Instructions (Optional)</label>
                      <input 
                        type="text"
                        value={aiContext}
                        onChange={(e) => setAiContext(e.target.value)}
                        placeholder="E.g. Focus on modern brutalist style, near the city center, beachfront views..."
                        className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  )}
                </div>

                {/* AI Error display */}
                {aiError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-450" />
                    <span>Error: {aiError}</span>
                  </div>
                )}

                {/* Action trigger button */}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    disabled={isAiLoading || !aiText}
                    onClick={handleAiEnhancement}
                    className="flex items-center gap-2 py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs disabled:opacity-45 transition-all cursor-pointer active:scale-95 shadow-md shadow-indigo-600/10"
                  >
                    {isAiLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Gemini is composing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-indigo-200" />
                        <span>Generate with Gemini 3.5 Flash</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Response outputs */}
                {aiResponse && (
                  <div className="space-y-3 pt-4 border-t border-white/5 animate-fade-in text-left">
                    <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-t-xl border-x border-t border-white/10">
                      <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                        <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" /> Model Suggestion Output
                      </span>
                      <button 
                        onClick={handleApplyAiChanges}
                        className="py-1 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold cursor-pointer"
                      >
                        Apply to Listing Feed
                      </button>
                    </div>
                    <div className="bg-slate-950/90 border-x border-b border-white/10 rounded-b-xl p-4 text-xs font-medium leading-relaxed font-mono whitespace-pre-wrap text-slate-100 select-all selection:bg-indigo-500/30">
                      {aiResponse}
                    </div>
                  </div>
                )}

              </motion.div>
            )}

            {/* 2. Video Ad Generator */}
            {activeSubTab === 'video' && (
              <motion.div
                key="video-ad-lab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-5 text-left"
              >
                <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl flex items-start gap-3">
                  <Video className="w-5 h-5 text-indigo-400 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-white">Create High-Engaging Video Advertising Campaigns</h5>
                    <p className="text-[11px] text-slate-400 mt-1">Generate social-ready landscape or story portrait video ads using stay snapshots and custom text. Business and Company plans include free uploads.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3.5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">Choose Cinematic Palette</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['luxury', 'vintage', 'hype'].map((temp) => (
                          <button
                            key={temp}
                            onClick={() => setVideoTemplate(temp)}
                            className={`p-2 border rounded-xl text-[11px] capitalize font-bold transition-all cursor-pointer ${
                              videoTemplate === temp 
                                ? 'bg-indigo-600/25 border-indigo-500 text-white' 
                                : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            {temp} Theme
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">Video Content Prompt</label>
                      <textarea
                        rows={3}
                        value={videoPrompt}
                        onChange={(e) => setVideoPrompt(e.target.value)}
                        className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-medium focus:ring-1 focus:ring-indigo-500"
                        placeholder="E.g. Pan view of the beachfront, showing beds, pools, and sunset drone views..."
                      />
                    </div>

                    <button
                      disabled={isGeneratingVideo}
                      onClick={handleGenerateVideoAd}
                      className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                    >
                      {isGeneratingVideo ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Generating Video Assets... (Simulated)</span>
                        </>
                      ) : (
                        <>
                          <Video className="w-4 h-4 text-indigo-200" />
                          <span>Compose & Generate HD Video Ad</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Right Column - Media screen simulation */}
                  <div className="bg-slate-955 rounded-2xl border border-white/10 p-3 h-64 flex flex-col justify-center items-center relative overflow-hidden bg-slate-950">
                    {generatedVideoUrl ? (
                      <div className="w-full h-full flex flex-col justify-between">
                        <video 
                          key={generatedVideoUrl}
                          className="w-full flex-1 rounded-lg object-cover bg-black"
                          src={generatedVideoUrl}
                          controls
                          loop
                          muted
                          autoPlay
                        />
                        <div className="pt-2 text-[10px] text-emerald-400 text-center font-bold flex items-center justify-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Ad Video ready and linked to stay listing
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-6 space-y-2">
                        <div className="w-10 h-10 rounded-full border border-dashed border-white/30 flex items-center justify-center mx-auto">
                          <Play className="w-4 h-4 text-slate-500" />
                        </div>
                        <p className="text-xs font-semibold text-slate-300">Video Mock Screen</p>
                        <p className="text-[10px] text-slate-500">Configure parameters on the left and tap generate to synthesize a video ad template.</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* 3. Voice Promo Ads Recorder */}
            {activeSubTab === 'voice' && (
              <motion.div
                key="voice-ads-lab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 text-left"
              >
                <div className="bg-slate-950/40 border border-white/10 p-4 rounded-2xl space-y-2">
                  <h5 className="text-xs font-bold text-white flex items-center gap-2">
                    <Mic className="w-4 h-4 text-rose-400" /> Make Voice Marketing Tracks
                  </h5>
                  <p className="text-[11px] text-slate-400">Record custom audio descriptions, greeting notes, or pricing pitches that guests can click and play directly in their browsers! Highly personalized and proven to conversion.</p>
                </div>

                <div className="flex flex-col items-center justify-center py-6 bg-slate-950 rounded-2xl border border-white/10 space-y-5">
                  
                  {isRecording ? (
                    <div className="text-center space-y-4">
                      {/* Recording Timer and waves */}
                      <span className="flex items-center justify-center gap-1.5 text-xs text-rose-500 font-mono font-bold animate-pulse">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        RECORDING: {recordingSeconds}s
                      </span>

                      {/* animated equalizer waves */}
                      <div className="flex items-center gap-1 justify-center h-12 w-64 px-4 overflow-hidden">
                        {volumeLevel.map((lvl, index) => (
                          <motion.div
                            key={index}
                            animate={{ height: `${lvl * 4}px` }}
                            transition={{ type: 'spring', stiffness: 200 }}
                            className="w-1 bg-gradient-to-t from-indigo-500 to-rose-400 rounded-full min-h-[4px]"
                          />
                        ))}
                      </div>

                      <button
                        onClick={stopVoiceRecording}
                        className="py-2.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 hover:text-white text-rose-400 border border-rose-500/20 text-xs font-bold flex items-center gap-1.5 mx-auto cursor-pointer"
                      >
                        <Square className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                        <span>Stop and Save Recording</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-center space-y-4 w-full px-8">
                      {recordedAudioUrl ? (
                        <div className="space-y-4 max-w-sm mx-auto">
                          <span className="text-xs text-slate-300 font-bold block">🎙️ Audio Recording Active</span>
                          
                          <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-xl">
                            <Volume2 className="w-4 h-4 text-slate-400" />
                            <audio 
                              className="flex-1 h-8 bg-transparent scale-90"
                              src={recordedAudioUrl} 
                              controls 
                            />
                          </div>

                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={startVoiceRecording}
                              className="py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-bold cursor-pointer"
                            >
                              Record Again
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3.5">
                          <p className="text-xs text-slate-400">No active audio advertisement found.</p>
                          <button
                            onClick={startVoiceRecording}
                            className="py-3 px-6 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 mx-auto cursor-pointer active:scale-95 transition-all shadow-lg shadow-rose-600/10"
                          >
                            <Mic className="w-4 h-4" />
                            <span>Start recording ad segment</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </motion.div>
            )}

            {/* 4. Campaign Booster settings */}
            {activeSubTab === 'campaign' && (
              <motion.div
                key="boosting-settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-5 text-left"
              >
                <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-3.5 rounded-2xl flex items-start gap-3">
                  <Zap className="w-5 h-5 text-amber-500 mt-0.5 animate-bounce" />
                  <div>
                    <h5 className="text-xs font-bold text-white">Boost Stay to Priority High-Conversion Feed Slot</h5>
                    <p className="text-[11px] text-slate-400 mt-1">Stays boosted with Premium plans appear at the very beginning of traveler searches, feature subtle gold-bordered cards, and rank 300% higher in SEO scoring systems.</p>
                  </div>
                </div>

                <div className="bg-slate-950 p-5 rounded-2xl border border-white/10 space-y-4">
                  <label className="text-xs font-bold text-slate-300">Select Booster Severity Weight</label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div 
                      onClick={() => setBoostType('normal')}
                      className={`p-4 border rounded-xl text-xs cursor-pointer transition-all ${
                        boostType === 'normal' 
                          ? 'border-indigo-500/80 bg-indigo-505/20 text-white' 
                          : 'border-white/5 bg-slate-950 text-slate-400 hover:border-white/10 hover:text-white'
                      }`}
                    >
                      <h6 className="font-bold flex items-center gap-1.5 text-slate-200">
                        <Zap className="w-3.5 h-3.5" /> Normal Feed Priority
                      </h6>
                      <p className="text-[10px] text-slate-400 mt-1">3x higher listing click rates, glowing tag embedded, priority display.</p>
                    </div>

                    <div 
                      onClick={() => setBoostType('featured')}
                      className={`p-4 border rounded-xl text-xs cursor-pointer transition-all ${
                        boostType === 'featured' 
                          ? 'border-indigo-550/80 bg-indigo-505/20 text-white' 
                          : 'border-white/5 bg-slate-950 text-slate-400 hover:border-white/10 hover:text-white'
                      }`}
                    >
                      <h6 className="font-bold flex items-center gap-1.5 text-amber-400">
                        <Check className="w-3.5 h-3.5" /> Featured Banner Placement
                      </h6>
                      <p className="text-[10px] text-slate-400 mt-1">Pinned to the top carousel, homepage banners, badge of luxury stay included.</p>
                    </div>
                  </div>

                  {boostSuccess ? (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs font-bold text-center">
                       🌟 Congratulations! Your listing has been boosted in real time. Feed checks now prioritize it!
                    </div>
                  ) : (
                    <button
                      disabled={isBoosting}
                      onClick={handleActivateBoost}
                      className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-45 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer pt-3"
                    >
                      {isBoosting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Activating Booster Signals...</span>
                        </>
                      ) : (
                        <span>Publish Boosted Stay in Makazi Stays Feed</span>
                      )}
                    </button>
                  )}
                </div>

              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-[#0b0f19] px-6 py-4 border-t border-white/10 flex justify-between items-center">
          <span className="text-[10px] text-slate-500 font-mono">ID: {house.id}</span>
          <button
            onClick={onClose}
            className="py-1.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:text-white text-slate-300 text-xs font-bold cursor-pointer"
          >
            Close Suite
          </button>
        </div>
      </motion.div>
    </div>
  );
}
