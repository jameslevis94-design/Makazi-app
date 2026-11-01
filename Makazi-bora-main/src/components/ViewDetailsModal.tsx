import React from 'react';
import { House } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, Bed, ShowerHead, Users, HelpCircle, ShieldAlert, BadgeCheck, Utensils, Waves, Trees, Compass } from 'lucide-react';

interface ViewDetailsModalProps {
  house: House | null;
  isOpen: boolean;
  onClose: () => void;
  onBookNow: (house: House) => void;
}

export default function ViewDetailsModal({ house, isOpen, onClose, onBookNow }: ViewDetailsModalProps) {
  if (!isOpen || !house) return null;

  // Map icon strings to Lucide components for real layout details!
  const getFeatureIcon = (feature: string) => {
    const fLower = feature.toLowerCase();
    if (fLower.includes('ocean') || fLower.includes('beach') || fLower.includes('pool') || fLower.includes('spa')) {
      return <Waves className="w-4 h-4 text-sky-500" />;
    }
    if (fLower.includes('forest') || fLower.includes('mountain') || fLower.includes('garden') || fLower.includes('zen')) {
      return <Trees className="w-4 h-4 text-emerald-500" />;
    }
    if (fLower.includes('kitchen') || fLower.includes('chef') || fLower.includes('breakfast') || fLower.includes('tea')) {
      return <Utensils className="w-4 h-4 text-amber-500" />;
    }
    return <Compass className="w-4 h-4 text-stone-500" />;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        />

        {/* Modal content body */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative bg-slate-900/95 w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden z-10 border border-white/10 max-h-[85vh] flex flex-col backdrop-blur-2xl text-slate-100"
        >
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
            <div>
              <h2 className="font-display font-medium text-lg text-white">
                Property Details
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">{house.location}</p>
            </div>
            <button
              id="close-details-modal-header"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrolling Content */}
          <div className="overflow-y-auto p-6 flex-1 space-y-6">
            {/* Image Grid with Floating Host Badge */}
            <div className="relative">
              <div className="grid grid-cols-3 gap-2.5 h-48 sm:h-60 rounded-2xl overflow-hidden border border-white/10">
                <div className="col-span-2 h-full">
                  <img
                    src={house.images[0]}
                    alt={`${house.title} highlight`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="grid grid-rows-2 gap-2 h-full">
                  <img
                    src={house.images[1] || house.images[0]}
                    alt={`${house.title} interior`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <img
                    src={house.images[2] || house.images[0]}
                    alt={`${house.title} patio`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              {/* Floating Owner Badge */}
              <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-2xl p-2.5 flex items-center gap-2.5 shadow-xl">
                <div className="w-8 h-8 rounded-full bg-indigo-600 border border-indigo-500/30 text-indigo-300 font-bold flex items-center justify-center text-xs uppercase shrink-0">
                  {house.host.name ? house.host.name.charAt(0) : '👤'}
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">Property Host</p>
                  <p className="text-xs font-black text-white mt-1 leading-none">{house.host.name}</p>
                </div>
              </div>
            </div>

            {/* Quick Specs */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h1 className="font-display font-bold text-2xl text-white">
                  {house.title}
                </h1>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-semibold text-slate-200">{house.rating} rating</span>
                  <span className="text-white/20">•</span>
                  <span className="text-xs text-slate-400">{house.reviews.length} superhost reviews</span>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl flex gap-4 text-xs font-medium text-slate-300">
                <div className="flex items-center gap-1">
                  <Bed className="w-4 h-4 text-indigo-300" />
                  <span>{house.beds} Beds</span>
                </div>
                <div className="flex items-center gap-1">
                  <ShowerHead className="w-4 h-4 text-indigo-300" />
                  <span>{house.baths} Baths</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-indigo-300" />
                  <span>{house.maxGuests} Guests max</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                The Accommodation
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed font-sans">
                {house.description}
              </p>
            </div>

            {/* Key Amenities */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                Premium Features
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                {house.features.map((feature, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-3 rounded-xl border border-white/5 bg-white/5 text-xs text-slate-200 font-medium"
                  >
                    {getFeatureIcon(feature)}
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Host Profile Spotlight */}
            <div className="p-4 rounded-xl border border-white/10 bg-white/5 flex flex-wrap items-center gap-4 justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 font-bold flex items-center justify-center text-base uppercase shrink-0 shadow">
                  {house.host.name ? house.host.name.charAt(0) : '👤'}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <h4 className="font-semibold text-white text-sm">{house.host.name}</h4>
                    <BadgeCheck className={`w-4 h-4 ${house.beds === 0 ? 'text-emerald-400 fill-emerald-400/20' : 'text-indigo-400 fill-indigo-400/20'}`} />
                  </div>
                  <p className="text-xs text-slate-400">
                    {house.beds === 0 ? 'Licensed Makazi Broker • Certified Agent' : 'Superhost • Verified Stay Advisor'}
                  </p>
                </div>
              </div>
              <div className="flex gap-4 text-center items-center divide-x divide-white/10">
                <div className="px-2">
                  <p className="font-mono font-bold text-indigo-300 text-sm">{house.host.rating}</p>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Rating</p>
                </div>
                <div className="pl-4">
                  <p className="font-mono font-bold text-indigo-300 text-sm">100%</p>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Response</p>
                </div>
              </div>
            </div>

            {/* Guest Reviews list */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                Guest Reviews ({house.reviews.length})
              </h3>
              <div className="space-y-3">
                {house.reviews.map((review, idx) => (
                  <div key={idx} className="p-4 border border-white/5 bg-white/5 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-200 text-xs">{review.author}</span>
                      <div className="flex items-center gap-1 text-amber-400">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 italic">"{review.text}"</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sticky footer info + Booking CTA */}
          <div className="p-5 border-t border-white/10 flex items-center justify-between bg-white/5">
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">Rate</span>
              <div className="flex items-baseline gap-1">
                <span className="font-display font-bold text-xl text-white font-mono">TSh {house.amount.toLocaleString()}</span>
                <span className="text-xs text-slate-400">/ month</span>
              </div>
            </div>
            <button
              id={`details-modal-book-now-${house.id}`}
              onClick={() => {
                onClose();
                onBookNow(house);
              }}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all text-xs shadow-lg shadow-indigo-600/25 active:scale-95 cursor-pointer uppercase tracking-wider text-[10px]"
            >
              {house.beds === 0 ? 'Contact Verified Broker' : 'Reserve this Stay'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
