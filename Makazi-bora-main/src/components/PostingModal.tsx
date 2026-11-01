import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UploadCloud, Trash2, MapPin, DollarSign, FileText, Layout, Users, Star, Sparkles, Home } from 'lucide-react';
import { uploadFileToAppwrite } from '../lib/appwrite';
import { House, Host } from '../types';

interface PostingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitPosting: (postData: Partial<House>) => Promise<void>;
  currentHost?: Host;
}

export default function PostingModal({ isOpen, onClose, onSubmitPosting, currentHost }: PostingModalProps) {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [beds, setBeds] = useState(2);
  const [baths, setBaths] = useState(2);
  const [maxGuests, setMaxGuests] = useState(4);
  const [features, setFeatures] = useState<string>('Pristine Glass, Smart Home Automation, Private Infinity Spa');
  const [propertyStatus, setPropertyStatus] = useState<'For Sale' | 'For Rent'>('For Rent');
  const [size, setSize] = useState('120 sqm');
  
  // Images upload states
  const [imageFiles, setImageFiles] = useState<{ id: string; name: string; type: string; base64: string; previewUrl: string; rawFile?: File }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Read file as base64 helper
  const processFiles = (files: FileList) => {
    setUploadError(null);
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    Array.from(files).forEach((file) => {
      if (!validImageTypes.includes(file.type)) {
        setUploadError(`File type "${file.name}" is not supported. Please select JPEG, PNG, GIF, or WebP.`);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const base64Str = e.target.result as string;
          const uniqueId = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          setImageFiles((prev) => [
            ...prev,
            {
              id: uniqueId,
              name: file.name,
              type: file.type,
              base64: base64Str,
              previewUrl: URL.createObjectURL(file),
              rawFile: file
            }
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const removeImage = (idToRemove: string) => {
    setImageFiles((prev) => {
      const target = prev.find((img) => img.id === idToRemove);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((img) => img.id !== idToRemove);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setUploadError("Please enter a property title.");
    if (!location.trim()) return setUploadError("Please specify the property location.");
    if (!description.trim()) return setUploadError("Please provide a detailed property description.");
    if (!amount.trim() || isNaN(Number(amount))) return setUploadError("Please provide a valid property price.");
    if (imageFiles.length === 0) return setUploadError("Please upload at least 1 image.");

    setIsUploading(true);
    setUploadError(null);

    try {
      const uploadedImageUrls: string[] = [];
      
      // Upload images one-by-one to server Appwrite proxy
      for (const fileObj of imageFiles) {
        const uploadResult = await uploadFileToAppwrite(
          fileObj.name,
          fileObj.type,
          fileObj.base64,
          fileObj.rawFile
        );
        if (uploadResult && uploadResult.fileUrl) {
          uploadedImageUrls.push(uploadResult.fileUrl);
        } else {
          throw new Error('Upload output missing fileUrl reference.');
        }
      }

      const featuresList = features
        .split(',')
        .map((f) => f.trim())
        .filter((f) => f.length > 0);

      const dynamicHouse: Partial<House> = {
        title,
        description,
        location,
        amount: Number(amount),
        images: uploadedImageUrls,
        beds,
        baths,
        maxGuests,
        features: featuresList.length > 0 ? featuresList : ['Luxury Glass Architecture', 'Scenic Panorama'],
        rating: 5.0,
        dateRange: "Aug 20 - 27",
        propertyStatus,
        size,
        createdAt: new Date().toISOString(),
        host: currentHost || {
          name: "James Levis",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80",
          rating: 4.88
        }
      };

      await onSubmitPosting(dynamicHouse);
      
      // Clear forms
      setTitle('');
      setLocation('');
      setDescription('');
      setAmount('');
      setBeds(2);
      setBaths(2);
      setMaxGuests(4);
      setPropertyStatus('For Rent');
      setSize('120 sqm');
      setImageFiles([]);
      onClose();
    } catch (err: any) {
      console.error('[Posting Form Error]:', err);
      setUploadError(err.message || 'Failed to post property. Make sure Appwrite server proxy and storage container are linked.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" id="posting-modal-viewport">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity" 
        onClick={isUploading ? undefined : onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-3xl rounded-[32px] bg-[#0f172a]/95 border border-white/10 p-6 sm:p-8 shadow-2xl backdrop-blur-3xl overflow-hidden text-left text-white"
        >
          {/* Ambient Glows */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-[80px] pointer-events-none" />

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-[10px] font-bold uppercase tracking-wider mb-2 border border-indigo-500/25">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Publish New Stay</span>
              </div>
              <h2 className="font-display font-medium text-xl sm:text-2xl text-white">Post Your Private Sanctuary</h2>
              <p className="text-xs text-slate-400 mt-1">Submit high-definition glass stays directly to Appwrite database collections.</p>
            </div>
            <button
              id="close-posting-modal"
              onClick={onClose}
              disabled={isUploading}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/10 cursor-pointer disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
            
            {uploadError && (
              <div id="posting-error-banner" className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
                <span className="font-bold uppercase tracking-wider bg-rose-500/25 px-1.5 py-0.5 rounded text-[9px]">Error</span>
                <p className="flex-1 leading-relaxed">{uploadError}</p>
              </div>
            )}

            {/* Title / Price */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-2 space-y-2">
                <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5" htmlFor="property-title">
                  <Home className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Stay / House Title</span>
                </label>
                <input
                  id="property-title"
                  type="text"
                  placeholder="e.g. Kariakoo Deluxe Business Frame (Fremu ya Biashara)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isUploading}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-white/10 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5" htmlFor="property-amount">
                  <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Price per Month (TSh)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">TSh</span>
                  <input
                    id="property-amount"
                    type="text"
                    placeholder="500,000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={isUploading}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-white/10 transition-all font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Location / Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5" htmlFor="property-location">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Location (Area/Address)</span>
                </label>
                <input
                  id="property-location"
                  type="text"
                  placeholder="e.g. Kariakoo, Dar es Salaam or Malibu, California"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={isUploading}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-white/10 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5" htmlFor="property-features">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Key Amenities (Comma Separated)</span>
                </label>
                <input
                  id="property-features"
                  type="text"
                  placeholder="Glass Walls, Skylight, Outdoor Zen Garden"
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  disabled={isUploading}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-white/10 transition-all"
                />
              </div>
            </div>

            {/* Listing Type & Size */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Listing Type (Sale or Rent)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['For Rent', 'For Sale'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={isUploading}
                      onClick={() => setPropertyStatus(status)}
                      className={`py-3 rounded-xl border text-xs font-bold transition-all uppercase tracking-wider cursor-pointer text-center ${
                        propertyStatus === status
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5" htmlFor="property-size">
                  <Layout className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Property Size (e.g., 120 sqm)</span>
                </label>
                <input
                  id="property-size"
                  type="text"
                  placeholder="e.g., 150 sqm or 5,000 sqft"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  disabled={isUploading}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-white/10 transition-all font-mono"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5" htmlFor="property-description">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>Detailed Description</span>
              </label>
              <textarea
                id="property-description"
                rows={3}
                placeholder="Describe your design stay, views, architectural elements, and amenities."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isUploading}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-white/10 transition-all leading-relaxed resize-none"
              />
            </div>

            {/* Bed, Bath, Guests Counters */}
            <div className="grid grid-cols-3 gap-4 bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="space-y-1 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
                  <Layout className="w-3 h-3" />
                  Beds
                </span>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setBeds((b) => Math.max(1, b - 1))}
                    disabled={isUploading}
                    className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 font-bold flex items-center justify-center cursor-pointer disabled:opacity-50 text-xs"
                  >
                    -
                  </button>
                  <span className="text-sm font-mono font-bold text-white">{beds}</span>
                  <button
                    type="button"
                    onClick={() => setBeds((b) => b + 1)}
                    disabled={isUploading}
                    className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 font-bold flex items-center justify-center cursor-pointer disabled:opacity-50 text-xs"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-1 text-center border-x border-white/10">
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
                  <Layout className="w-3 h-3" />
                  Baths
                </span>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setBaths((b) => Math.max(1, b - 1))}
                    disabled={isUploading}
                    className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 font-bold flex items-center justify-center cursor-pointer disabled:opacity-50 text-xs"
                  >
                    -
                  </button>
                  <span className="text-sm font-mono font-bold text-white">{baths}</span>
                  <button
                    type="button"
                    onClick={() => setBaths((b) => b + 1)}
                    disabled={isUploading}
                    className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 font-bold flex items-center justify-center cursor-pointer disabled:opacity-50 text-xs"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-1 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center gap-1">
                  <Users className="w-3 h-3" />
                  Max Guests
                </span>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMaxGuests((g) => Math.max(1, g - 1))}
                    disabled={isUploading}
                    className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 font-bold flex items-center justify-center cursor-pointer disabled:opacity-50 text-xs"
                  >
                    -
                  </button>
                  <span className="text-sm font-mono font-bold text-white">{maxGuests}</span>
                  <button
                    type="button"
                    onClick={() => setMaxGuests((g) => g + 1)}
                    disabled={isUploading}
                    className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 font-bold flex items-center justify-center cursor-pointer disabled:opacity-50 text-xs"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Images Select (Supports multi image uploads, previews, and removal) */}
            <div className="space-y-3">
              <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                Property Showcase Images (More than 2 images supported!)
              </label>

              {/* Drag n Drop and File Trigger */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                  dragActive 
                    ? 'border-indigo-500 bg-indigo-500/10' 
                    : 'border-white/15 bg-white/5 hover:bg-white/8 hover:border-white/20'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isUploading}
                />
                <div className="p-3 bg-white/5 border border-white/10 rounded-full text-indigo-400">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-white">Drag & drop photos, or purchase local files</p>
                <p className="text-[10px] text-slate-400 font-mono">Accepts JPG, PNG, WebP • Large sizes allowed</p>
              </div>

              {/* Image Previews Grid */}
              <AnimatePresence>
                {imageFiles.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/5 border border-white/10 p-3.5 rounded-2xl"
                  >
                    {imageFiles.map((item, idx) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="group relative h-20 sm:h-24 rounded-lg overflow-hidden border border-white/10"
                      >
                        <img
                          src={item.previewUrl}
                          alt={`Thumbnail ${idx}`}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(item.id);
                            }}
                            className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow-md cursor-pointer active:scale-95 transition-all"
                            title="Remove Photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="absolute bottom-1 bg-black/60 px-1.5 py-0.5 rounded text-[8px] tracking-wide font-mono z-10 left-1">
                          #{idx + 1}
                        </span>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Form Footer Action */}
            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                disabled={isUploading}
                className="px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 text-xs font-semibold hover:text-white transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                id="submit-stay-listing"
                type="submit"
                disabled={isUploading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-75 disabled:pointer-events-none"
              >
                {isUploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Uploading Stays ({imageFiles.length} photos)...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Create Live Listing</span>
                  </>
                )}
              </button>
            </div>

          </form>

        </motion.div>
      </div>
    </div>
  );
}
