import React from 'react';
import { House } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Mail, Phone, Star, ShieldCheck, Home, Award } from 'lucide-react';

interface OwnerProfileModalProps {
  owner: {
    name: string;
    avatar?: string;
    email: string;
    phone: string;
    location: string;
    username: string;
    isDatabaseOwner: boolean;
    bio: string;
    rating: number;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  houses: House[];
  onViewHouse: (house: House) => void;
}

export default function OwnerProfileModal({ owner, isOpen, onClose, houses, onViewHouse }: OwnerProfileModalProps) {
  if (!owner) return null;

  // Filter properties belonging to this owner
  const ownerProperties = houses.filter(
    (h) => h.host?.name?.toLowerCase().trim() === owner.name.toLowerCase().trim()
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="relative w-full max-w-2xl bg-slate-900/90 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] text-slate-100 backdrop-blur-2xl"
          >
            {/* Header / Banner Gradient */}
            <div className="relative h-28 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 flex items-center justify-between px-6 shrink-0">
              <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs uppercase tracking-widest font-black">
                <Award className="w-4 h-4" />
                <span>Verified Host Profile</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Avatar Overlay & Bio Details */}
            <div className="overflow-y-auto p-6 space-y-6 flex-1">
              {/* Profile Top Row */}
              <div className="flex flex-col sm:flex-row sm:items-end gap-5 -mt-16 relative z-10">
                {owner.avatar ? (
                  <img
                    src={owner.avatar}
                    alt={owner.name}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-slate-900 shadow-xl shadow-indigo-950/40 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-4 border-slate-900 text-white font-black text-4xl flex items-center justify-center uppercase shrink-0 shadow-xl shadow-indigo-950/40">
                    {owner.name ? owner.name.charAt(0) : '👤'}
                  </div>
                )}
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display font-bold text-2xl text-white">{owner.name}</h2>
                    {owner.isDatabaseOwner && (
                      <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-bold text-[9px] uppercase tracking-wider">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>DB Owner</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <p className="text-sm text-indigo-300 font-mono">{owner.username}</p>
                    <span className="text-slate-600 font-mono text-sm hidden sm:inline">•</span>
                    <div className="flex items-center gap-1 text-xs text-slate-400 font-mono">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>{owner.location}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Information / Contacts Grid */}
              <div className="grid grid-cols-1 gap-4">
                {/* Rating & Profile Metrics */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xs text-slate-400 font-mono uppercase tracking-wider mb-2">Host Standing</h3>
                    <div className="flex items-center gap-1.5">
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400" />
                        ))}
                      </div>
                      <span className="text-sm font-bold font-mono text-white mt-0.5">{owner.rating}</span>
                    </div>
                  </div>

                  <div className="sm:pl-6 sm:border-l sm:border-white/5 flex justify-between items-center text-xs gap-3">
                    <span className="text-slate-400">Stays Managed:</span>
                    <span className="font-black text-white font-mono bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      {ownerProperties.length} active listed
                    </span>
                  </div>
                </div>
              </div>

              {/* Bio description */}
              <div className="space-y-2">
                <h3 className="text-xs text-slate-400 font-mono uppercase tracking-wider">Biography</h3>
                <p className="text-xs text-slate-300 leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5">
                  {owner.bio}
                </p>
              </div>

              {/* Active Listings section */}
              <div className="space-y-3">
                <h3 className="text-xs text-slate-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <Home className="w-4 h-4 text-indigo-400" />
                  <span>Listed Properties ({ownerProperties.length})</span>
                </h3>

                {ownerProperties.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {ownerProperties.map((prop) => (
                      <div
                        key={prop.id}
                        onClick={() => {
                          onClose();
                          onViewHouse(prop);
                        }}
                        className="group flex gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all cursor-pointer text-left"
                      >
                        <img
                          src={prop.images[0]}
                          alt={prop.title}
                          className="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex flex-col justify-center min-w-0">
                          <h4 className="font-semibold text-xs text-white truncate group-hover:text-indigo-400 transition-colors">
                            {prop.title}
                          </h4>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-rose-500 inline shrink-0" />
                            <span className="truncate">{prop.location}</span>
                          </p>
                          <span className="text-[10px] text-slate-300 font-bold font-mono mt-1">
                            TSh {prop.amount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-white/5 border border-white/5 rounded-2xl">
                    <p className="text-xs text-slate-400">This host currently does not have active listings listed in Makazi.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end shrink-0">
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs active:scale-95 transition-all shadow-lg shadow-indigo-600/20 cursor-pointer uppercase tracking-wider text-[10px]"
              >
                Close Profile
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
