import React, { useState } from 'react';
import { House } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Star, ChevronLeft, ChevronRight, MapPin, Calendar, Heart, Award, ArrowRight, Sparkles, Zap } from 'lucide-react';

interface HouseCardProps {
  key?: React.Key;
  house: House;
  onBook: (house: House) => void;
  onView: (house: House) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onBoost?: (house: House) => void;
  onViewOwnerProfile?: (ownerName: string) => void;
}

export default function HouseCard({ house, onBook, onView, isFavorite, onToggleFavorite, onBoost, onViewOwnerProfile }: HouseCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [showHostBubble, setShowHostBubble] = useState(false);

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % house.images.length);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + house.images.length) % house.images.length);
  };

  return (
    <motion.div
      id={`house-card-${house.id}`}
      className="group relative bg-white/5 backdrop-blur-2xl border border-white/15 rounded-[32px] overflow-hidden shadow-2xl flex flex-col h-full text-slate-100/90"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowHostBubble(false);
      }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      {/* Property Image Section with Overlay Controls */}
      <div className="relative aspect-4/3 w-full bg-slate-800/50 overflow-hidden select-none">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentImageIndex}
            src={house.images[currentImageIndex]}
            alt={`${house.title} - Highlight ${currentImageIndex + 1}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            referrerPolicy="no-referrer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        </AnimatePresence>

        {/* Favorite Heart Button */}
        <button
          id={`favorite-btn-${house.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(house.id);
          }}
          className="absolute top-4 right-4 z-10 p-2 rounded-full backdrop-blur-md bg-black/40 text-white hover:bg-black/50 active:scale-95 border border-white/10 transition-all"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFavorite ? 'fill-red-500 text-red-500' : 'text-white'
            }`}
          />
        </button>

        {/* Carousel Arrow Controls */}
        <AnimatePresence>
          {isHovered && house.images.length > 1 && (
            <>
              <motion.button
                id={`carousel-prev-${house.id}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onClick={handlePrevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 shadow-md active:scale-90 border border-white/10 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </motion.button>
              <motion.button
                id={`carousel-next-${house.id}`}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onClick={handleNextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 shadow-md active:scale-90 border border-white/10 transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </>
          )}
        </AnimatePresence>

        {/* Image Progress Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {house.images.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentImageIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/40'
              }`}
            />
          ))}
        </div>

        {/* Verified tag overlay */}
        <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-1.5 items-center">
          <span className={`backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${
            house.propertyStatus === 'For Sale'
              ? 'bg-rose-500/90 text-white border-rose-405/50'
              : 'bg-emerald-600/90 text-white border-emerald-405/50'
          }`}>
            {house.propertyStatus || 'For Rent'}
          </span>
        </div>


      </div>

      {/* Property Information */}
      <div className="p-6 flex flex-col flex-1">
        {/* Rating and Location Header */}
        <div className="flex justify-between items-center gap-2 mb-2.5">
          <div className="flex items-center text-slate-300 text-xs font-medium gap-1">
            <MapPin className="w-3.5 h-3.5 text-rose-450" />
            <span className="truncate">{house.location}</span>
          </div>
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md text-xs font-semibold text-slate-300">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{house.rating}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-display font-medium text-lg text-white group-hover:text-indigo-300 transition-colors line-clamp-1 mb-1">
          {house.title}
        </h3>

        {/* Dynamic Booking Date Range */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3 font-mono">
          <Calendar className="w-3.5 h-3.5" />
          <span>{house.dateRange}</span>
        </div>

        {/* Bed/Bath Specs mini info */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400 mb-4 border-b border-white/10 pb-3 font-medium">
          {house.beds > 0 && (
            <>
              <span>{house.beds} {house.beds === 1 ? 'bed' : 'beds'}</span>
              <span>•</span>
            </>
          )}
          {house.baths > 0 && (
            <>
              <span>{house.baths} {house.baths === 1 ? 'bath' : 'baths'}</span>
              <span>•</span>
            </>
          )}
          <span>Up to {house.maxGuests} guests</span>
          {house.size && (
            <>
              <span>•</span>
              <span className="text-amber-350 font-bold font-mono bg-amber-400/10 px-2 py-0.5 rounded border border-amber-500/20">{house.size}</span>
            </>
          )}
        </div>

        {/* Host Avatar Info overlay banner inside info */}
        <div 
          onClick={(e) => {
            e.stopPropagation();
            if (onViewOwnerProfile) {
              onViewOwnerProfile(house.host.name);
            }
          }}
          className="flex items-center justify-between mb-5 p-2 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer select-none"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 font-bold flex items-center justify-center text-xs sm:text-sm uppercase shrink-0">
              {house.host.name ? house.host.name.charAt(0) : '👤'}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[11px] text-slate-400 leading-tight">
                {house.beds === 0 ? 'Verified Broker' : 'Superhost'} <strong className="text-slate-200 hover:text-indigo-400 transition-colors">{house.host.name}</strong>
              </span>
              <span className="text-[9px] text-slate-500 font-mono">Rating: {house.host.rating || 4.8} ★</span>
            </div>
          </div>
          <span className="text-[9px] border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider hover:bg-indigo-500/20 transition-all">
            Profile
          </span>
        </div>

        {/* Pricing tag */}
        <div className="flex items-baseline gap-1 mt-auto">
          <span className="font-display font-bold text-xl text-white font-mono">TSh {house.amount.toLocaleString()}</span>
          <span className="text-xs text-slate-400">
            {house.propertyStatus === 'For Sale' ? ' total price' : ' / month'}
          </span>
        </div>

        {/* Lower Navigation Action Buttons inside Card */}
        <div className="grid grid-cols-2 gap-2.5 mt-5 pt-4 border-t border-white/10">
          <button
            id={`view-btn-${house.id}`}
            onClick={() => onView(house)}
            aria-label={`View ${house.title} details`}
            className="w-full flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all text-xs font-bold text-white cursor-pointer uppercase tracking-wider text-[10px]"
          >
            Details
          </button>
          <button
            id={`book-btn-${house.id}`}
            onClick={() => onBook(house)}
            aria-label={house.beds === 0 ? `Contact Broker for ${house.title}` : `Book ${house.title} now`}
            className="w-full flex items-center justify-center gap-1 py-3 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold active:scale-95 transition-all text-xs cursor-pointer shadow-lg shadow-indigo-600/20 uppercase tracking-wider text-[10px]"
          >
            <span>{house.beds === 0 ? 'Contact Broker' : 'Book Now'}</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
