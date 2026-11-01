import React, { useState, useEffect } from 'react';
import { House, Booking } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Users, ShieldCheck, CheckCircle2, Loader2, User, Phone } from 'lucide-react';

interface BookingModalProps {
  house: House | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitBooking: (booking: Omit<Booking, 'id' | 'totalPrice'>) => void;
  currentUser?: {
    id?: string;
    name: string;
    email: string;
    phone?: string;
  };
}

export default function BookingModal({ house, isOpen, onClose, onSubmitBooking, currentUser }: BookingModalProps) {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [moveInDate, setMoveInDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [preferredDetails, setPreferredDetails] = useState('');
  const [guests, setGuests] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formError, setFormError] = useState('');

  // Reset/populate form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFullName(currentUser?.name || '');
      setPhoneNumber(currentUser?.phone || '');
      
      const todayString = new Date().toISOString().split('T')[0];
      setMoveInDate(todayString);
      
      setPreferredDetails('');
      setGuests(1);
      setIsSuccess(false);
      setIsSubmitting(false);
      setFormError('');
    }
  }, [isOpen, currentUser]);

  if (!isOpen || !house) return null;

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Field-level validation
    if (!fullName.trim()) {
      setFormError('Please provide your full name.');
      return;
    }
    if (!phoneNumber.trim()) {
      setFormError('Please provide a contact phone number.');
      return;
    }
    if (!moveInDate) {
      setFormError('Please select your preferred move-in date.');
      return;
    }
    if (!preferredDetails.trim()) {
      setFormError('Please describe your property details/requirements.');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate Appwrite registration delay with beautiful loader
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      
      // Submit mapped parameters back to local context
      onSubmitBooking({
        house,
        startDate: moveInDate,
        endDate: 'Flexible', // Since Check-Out is removed, we declare "Flexible" or identical
        guests,
        status: 'upcoming',
        fullName,
        phoneNumber,
        preferredDetails
      });
    }, 1500);
  };

  const handleSuccessClose = () => {
    setIsSuccess(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={isSubmitting ? undefined : onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        />

        {/* Modal content body */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative bg-slate-900/95 w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden z-10 border border-white/10 max-h-[92vh] flex flex-col backdrop-blur-2xl text-slate-100"
        >
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
            <div>
              <h2 className="font-display font-medium text-lg text-white">
                {!isSuccess 
                  ? (house.beds === 0 ? 'Send Request to Broker' : 'Reserve Sanctuary') 
                  : (house.beds === 0 ? 'Broker Request Sent!' : 'Request Received!')}
              </h2>
              {!isSuccess && <p className="text-xs text-slate-400 mt-0.5">{house.beds === 0 ? `Inquiring on Broker Stay: ${house.title}` : house.title}</p>}
            </div>
            {!isSubmitting && (
              <button
                id="close-booking-modal-header"
                onClick={isSuccess ? handleSuccessClose : onClose}
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Scrolling Container */}
          <div className="overflow-y-auto p-6 flex-1 space-y-5">
            {!isSuccess ? (
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                {formError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl text-rose-300 text-xs text-center font-medium">
                    ⚠️ {formError}
                  </div>
                )}

                {/* Full Name field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none placeholder:text-slate-505 transition-all focus:bg-white/10"
                    />
                  </div>
                </div>

                {/* Phone Number Field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="tel"
                      required
                      placeholder="+44 7700 900077"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none placeholder:text-slate-505 transition-all focus:bg-white/10"
                    />
                  </div>
                </div>

                {/* Move-In Date Selection block */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                    Move-In Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="date"
                      required
                      value={moveInDate}
                      onChange={(e) => setMoveInDate(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-mono text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all focus:bg-white/10"
                    />
                  </div>
                </div>

                {/* Preferred Property Details / Description (Textarea) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                    Preferred Property Details & Requirements
                  </label>
                  <div className="relative">
                    <textarea
                      required
                      rows={5}
                      placeholder={house.beds === 0 
                        ? "State your requirements directly for the broker, e.g.:\n• Move-in date and rental duration flexibility\n• Budget limits & payment terms\n• Essential features (WiFi, gated compound, security)\n• Preferred areas in Tanzanian markets" 
                        : "Describe what you are looking for, such as:\n• Preferred location\n• House type (apartment, villa, luxury suite)\n• Number of rooms / beds required\n• Target budget range\n• Any specific features or requirements"}
                      value={preferredDetails}
                      onChange={(e) => setPreferredDetails(e.target.value)}
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none placeholder:text-slate-505 transition-all min-h-[120px] focus:bg-white/10 leading-relaxed"
                    />
                  </div>
                </div>

                {/* Responsive Guest Selection Group */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                    Expected Guests Range
                  </label>
                  <div className="flex justify-between items-center p-3 border border-white/10 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-medium text-slate-200">Number of residents</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setGuests((g) => Math.max(1, g - 1))}
                        disabled={guests <= 1}
                        className="w-7 h-7 rounded-full border border-white/10 hover:bg-white/10 flex items-center justify-center text-sm font-semibold active:scale-95 disabled:opacity-30 select-none cursor-pointer text-white transition-colors"
                      >
                        -
                      </button>
                      <span className="text-xs font-mono font-bold text-indigo-300 w-4 text-center">
                        {guests}
                      </span>
                      <button
                        type="button"
                        onClick={() => setGuests((g) => Math.min(house.maxGuests || 10, g + 1))}
                        disabled={guests >= (house.maxGuests || 10)}
                        className="w-7 h-7 rounded-full border border-white/10 hover:bg-white/10 flex items-center justify-center text-sm font-semibold active:scale-95 disabled:opacity-30 select-none cursor-pointer text-white transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Notice text explicitly stating no payments are requested */}
                <div className="flex gap-2.5 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-slate-300 text-[11px] leading-relaxed">
                  <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span>
                    No immediate payment is required. This secures your spot and instantly notifies the host to arrange final details.
                  </span>
                </div>

                {/* Submit action button */}
                <button
                  id="booking-submit-confirm-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-805 text-white font-semibold py-3.5 px-4 rounded-xl text-xs transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer mt-4"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Sending Inquiry to Appwrite Database...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-indigo-200" />
                      <span>Submit Booking Request (Free)</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Booking Success view slide */
              <motion.div
                id="booking-success-container"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6 px-3 flex flex-col items-center"
              >
                <div className="p-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full mb-4">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <h3 className="font-display font-medium text-xl text-white font-semibold">
                  Reservation Request Sent!
                </h3>
                <p className="text-xs text-slate-300 mt-2.5 max-w-sm leading-relaxed">
                  Your property request was <strong className="text-emerald-300">successfully stored</strong> in the database. Your host, <strong className="text-white">{house.host.name}</strong>, has been notified to construct a perfect match and sent confirmation via your Inbox.
                </p>

                {/* Submitted inquiry summary */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 w-full mt-6 text-left space-y-2.5 text-xs text-slate-300">
                  <div className="flex justify-between items-start gap-4">
                    <span className="font-medium font-mono text-slate-400 uppercase tracking-wider text-[10px]">Property:</span>
                    <span className="text-white font-semibold text-right">{house.title}</span>
                  </div>
                  <div className="flex justify-between items-start gap-4">
                    <span className="font-medium font-mono text-slate-400 uppercase tracking-wider text-[10px]">Location:</span>
                    <span className="text-slate-200 text-right">{house.location}</span>
                  </div>
                  <div className="flex justify-between items-start gap-4">
                    <span className="font-medium font-mono text-slate-400 uppercase tracking-wider text-[10px]">Move-In Date:</span>
                    <span className="font-mono text-indigo-300">{moveInDate}</span>
                  </div>
                  <div className="flex justify-between items-start gap-4">
                    <span className="font-medium font-mono text-slate-400 uppercase tracking-wider text-[10px]">Contact Name:</span>
                    <span className="text-slate-200 font-medium">{fullName}</span>
                  </div>
                  <div className="border-t border-white/5 pt-2.5 mt-1">
                    <span className="block font-medium font-mono text-slate-400 uppercase tracking-wider text-[10px] mb-1">Your Requirements:</span>
                    <p className="text-slate-305 bg-black/25 border border-white/5 p-2 rounded-lg leading-relaxed italic text-[11px] whitespace-pre-wrap max-h-[100px] overflow-y-auto">
                      {preferredDetails}
                    </p>
                  </div>
                </div>

                <button
                  id="booking-success-view-profile-btn"
                  onClick={handleSuccessClose}
                  className="mt-6 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-xl text-xs shadow-lg shadow-indigo-600/25 transition-all active:scale-95 cursor-pointer uppercase tracking-wider text-[10px]"
                >
                  Return and Check Inbox
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
