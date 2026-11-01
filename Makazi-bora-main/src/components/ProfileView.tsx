import React, { useState, useRef, useMemo } from 'react';
import { Booking, House, Conversation } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Calendar, Compass, Star, Trash2, Heart, MessageSquare, CheckCircle, ShieldCheck, Camera, Edit2, Check, RefreshCw, PlusCircle, Sparkles, LogOut, AlertCircle, Award, FileText, Share2, Building, Shield, DollarSign, Percent, Briefcase, Users, CheckCircle2, XCircle, Send, Search } from 'lucide-react';
import { uploadFileToAppwrite } from '.././lib/appwrite';

interface ProfileViewProps {
  bookings: Booking[];
  favorites: string[];
  houses: House[];
  onToggleFavorite: (id: string) => void;
  onViewHouse: (house: House) => void;
  onCancelBooking: (id: string) => void;
  onSwitchToInbox: (house: House) => void;
  onDeleteHouse?: (id: string) => Promise<void>;
  onEditHouse?: (id: string, updatedData: Partial<House>) => Promise<void>;
  
  // Real active user profile parameters passed from App.tsx
  user: { 
    id: string;
    name: string; 
    avatar: string; 
    email: string; 
    location?: string; 
    role?: string; 
    username?: string;
    subscription?: 'none' | 'premium' | 'business' | 'company';
  };
  onUpdateUser: (userData: any) => Promise<void>;
  onOpenPostingModal: () => void;
  onLogout?: () => void;

  activeSubTab?: 'dashboard' | 'upgrade' | 'broker';
  onSubTabChange?: (tab: 'dashboard' | 'upgrade' | 'broker') => void;
  onUpdateBookings?: (bookings: Booking[]) => void;
  conversations?: Conversation[];
  onUpdateConversations?: (updated: Conversation[]) => void;
}

export default function ProfileView({
  bookings,
  favorites,
  houses,
  onToggleFavorite,
  onViewHouse,
  onCancelBooking,
  onSwitchToInbox,
  onDeleteHouse,
  onEditHouse,
  user,
  onUpdateUser,
  onOpenPostingModal,
  onLogout,
  activeSubTab = 'dashboard',
  onSubTabChange,
  onUpdateBookings,
  conversations = [],
  onUpdateConversations
}: ProfileViewProps) {
  // Grab real matches for the saved favorite house models
  const favoriteHouses = houses.filter((h) => favorites.includes(h.id));

  // Dynamic tab switcher with local state fallback support
  const [localSubTab, setLocalSubTab] = useState<'dashboard' | 'upgrade' | 'broker'>('dashboard');
  const subTab = onSubTabChange ? (activeSubTab || 'dashboard') : localSubTab;
  const setSubTab = onSubTabChange ? onSubTabChange : setLocalSubTab;

  // Subscription payment inputs & flow states
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<'premium' | 'business' | 'company'>('premium');
  const [transactionNumber, setTransactionNumber] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState(false);
  const screenshotInputRef = useRef<HTMLInputElement>(null);

  // Secure stay reservation payment state parameters
  const [activePaymentBookingId, setActivePaymentBookingId] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('Vodacom M-Pesa');
  const [paymentPhoneOrAccount, setPaymentPhoneOrAccount] = useState('');
  const [receiptImageBase64, setReceiptImageBase64] = useState<string | null>(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Broker Application states
  const [brokerFullName, setBrokerFullName] = useState(user.name);
  const [brokerPhone, setBrokerPhone] = useState((user as any).phone || '');
  const [brokerNationalId, setBrokerNationalId] = useState('');
  const [brokerEmail, setBrokerEmail] = useState(user.email);
  const [brokerLocation, setBrokerLocation] = useState(user.location || 'Dar es Salaam, Tanzania');
  const [brokerExperience, setBrokerExperience] = useState('');
  const [brokerPaymentMethod, setBrokerPaymentMethod] = useState('Vodacom M-Pesa');
  const [brokerPaymentNumber, setBrokerPaymentNumber] = useState('');
  const [brokerScreenshot, setBrokerScreenshot] = useState<string | null>(null);
  const [isUploadingBrokerScreenshot, setIsUploadingBrokerScreenshot] = useState(false);
  const brokerScreenshotInputRef = useRef<HTMLInputElement>(null);

  // We can load broker application from localStorage under 'makazi_broker_applications'
  const brokerApplication = useMemo(() => {
    try {
      const saved = localStorage.getItem('makazi_broker_applications');
      if (saved) {
        const apps = JSON.parse(saved) as any[];
        return apps.find((app: any) => app.userId === user.id || (user.email && app.email?.toLowerCase() === user.email.toLowerCase())) || null;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  }, [user.id, user.email, subTab]);

  // Edit / Share / Delete States for user listings
  const [editingHouse, setEditingHouse] = useState<House | null>(null);
  const [copiedHouseId, setCopiedHouseId] = useState<string | null>(null);
  const [deleteConfirmHouseId, setDeleteConfirmHouseId] = useState<string | null>(null);

  // Broker Dashboard states
  const [brokerTab, setBrokerTab] = useState<'profile' | 'properties' | 'requests' | 'messages' | 'payments'>('profile');
  const [isEditingBrokerInfo, setIsEditingBrokerInfo] = useState(false);
  const [editedBrokerName, setEditedBrokerName] = useState(user.name);
  const [editedBrokerPhone, setEditedBrokerPhone] = useState((user as any).phone || '');
  const [editedBrokerEmail, setEditedBrokerEmail] = useState(user.email);
  const [editedBrokerLocation, setEditedBrokerLocation] = useState(user.location || 'Dar es Salaam, Tanzania');
  const [editedBrokerExperience, setEditedBrokerExperience] = useState('');
  const [activeBrokerChatId, setActiveBrokerChatId] = useState<string | null>(null);
  const [brokerReplyText, setBrokerReplyText] = useState('');

  // Synchronize edited fields on broker application load
  React.useEffect(() => {
    if (brokerApplication) {
      setEditedBrokerName(brokerApplication.fullName || user.name);
      setEditedBrokerPhone(brokerApplication.phoneNumber || (user as any).phone || '');
      setEditedBrokerEmail(brokerApplication.email || user.email);
      setEditedBrokerLocation(brokerApplication.location || user.location || 'Dar es Salaam, Tanzania');
      setEditedBrokerExperience(brokerApplication.experience || '');
    }
  }, [brokerApplication, user]);

  const isCEOOrAdmin = user.email === 'jameslevis94@gmail.com' || user.role === 'admin' || user.role === 'CEO';

  const myPosts = useMemo(() => {
    return houses.filter((house) => {
      const matchesHostName = house.host?.name && house.host.name.toLowerCase().trim() === user.name.toLowerCase().trim();
      const matchesUserId = String((house as any).userid || "").toLowerCase() === String(user.id).toLowerCase() || 
                            String((house as any).userId || "").toLowerCase() === String(user.id).toLowerCase() ||
                            String((house as any).ownerId || "").toLowerCase() === String(user.id).toLowerCase() ||
                            (user.username && String((house as any).ownerId || "").toLowerCase() === String(user.username).toLowerCase());
      return matchesHostName || matchesUserId;
    });
  }, [houses, user.name, user.id, user.username]);

  const handleSharePost = (house: House) => {
    const shareUrl = `${window.location.origin}/?house=${house.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedHouseId(house.id);
      setTimeout(() => setCopiedHouseId(null), 2000);
    }).catch((err) => {
      console.error("Could not copy:", err);
    });
  };

  // Handle Broker Screenshot Upload (Convert to Base64)
  const handleBrokerScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploadingBrokerScreenshot(true);
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setBrokerScreenshot(event.target.result as string);
        }
        setIsUploadingBrokerScreenshot(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Broker Application details to localStorage and inform the user
  const handleSubmitBrokerApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brokerFullName.trim() || !brokerPhone.trim() || !brokerNationalId.trim() || !brokerEmail.trim() || !brokerLocation.trim() || !brokerExperience.trim() || !brokerPaymentNumber.trim()) {
      alert('Please fill out all required fields.');
      return;
    }

    const newApp = {
      id: `broker-app-${Date.now()}`,
      userId: user.id || 'james-levis-1',
      fullName: brokerFullName.trim(),
      phoneNumber: brokerPhone.trim(),
      nationalId: brokerNationalId.trim(),
      email: brokerEmail.trim(),
      location: brokerLocation.trim(),
      experience: brokerExperience.trim(),
      paymentMethod: brokerPaymentMethod,
      paymentNumber: brokerPaymentNumber.trim(),
      amountPaid: 10000,
      screenshot: brokerScreenshot || 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=400&q=80',
      status: 'pending' as const,
      submittedAt: new Date().toISOString()
    };

    try {
      const saved = localStorage.getItem('makazi_broker_applications');
      let apps = saved ? JSON.parse(saved) : [];
      apps = apps.filter((app: any) => app.userId !== user.id && (user.email ? app.email?.toLowerCase() !== user.email.toLowerCase() : true));
      apps.unshift(newApp);
      localStorage.setItem('makazi_broker_applications', JSON.stringify(apps));

      alert('Your Broker registration application and TZS 10,000 fee payment details have been sent to the CEO for verification. You will see status updates right here on this tab.');
      setLocalSubTab('broker');
    } catch (err) {
      console.error(err);
      alert('Could not submit broker application.');
    }
  };

  // Auto-transition to broker role once approved (protect CEO / admin roles)
  React.useEffect(() => {
    if (brokerApplication && brokerApplication.status === 'approved' && user.role !== 'broker' && !isCEOOrAdmin) {
      const updatedUser = {
        ...user,
        role: 'broker'
      };
      onUpdateUser(updatedUser);
    }
  }, [brokerApplication, user.role, isCEOOrAdmin]);

  // Load dynamic payment accounts configured by CEO
  const dynamicPaymentAccounts = useMemo(() => {
    try {
      const saved = localStorage.getItem('makazi_payment_accounts');
      if (saved) {
        return JSON.parse(saved) as any[];
      }
    } catch (e) {
      console.error('Failed to load dynamic payment accounts:', e);
    }
    return [
      {
        id: 'pay-1',
        method: 'Vodacom M-Pesa',
        merchantName: 'MAKAZI Group Ltd',
        numberType: 'Lipa Namba (Merchant Code)',
        numberValue: '569311',
        instructions: 'Dial *150*00#, choose Pay Merchant (Lipa kwa M-Pesa) and enter Lipa Namba 569311.',
        colorClass: 'border-red-500/30 bg-red-500/5 text-red-400',
        enabled: true
      },
      {
        id: 'pay-2',
        method: 'Tigo Pesa',
        merchantName: 'MAKAZI Group Ltd',
        numberType: 'Lipa Namba (Merchant Code)',
        numberValue: '809211',
        instructions: 'Dial *150*01#, choose Lipa kwa Simu, enter Merchant Code 809211.',
        colorClass: 'border-blue-500/30 bg-blue-500/5 text-blue-400',
        enabled: true
      },
      {
        id: 'pay-3',
        method: 'Airtel Money',
        merchantName: 'MAKAZI Group Ltd',
        numberType: 'Lipa Namba (Merchant Code)',
        numberValue: '122455',
        instructions: 'Dial *150*60#, choose Lipa kwa Airtel Money, enter Lipa Namba 122455.',
        colorClass: 'border-rose-500/30 bg-rose-500/5 text-rose-400',
        enabled: true
      },
      {
        id: 'pay-4',
        method: 'HaloPesa',
        merchantName: 'MAKAZI Group Ltd',
        numberType: 'Lipa Namba (Merchant Code)',
        numberValue: '601144',
        instructions: 'Dial *150*88#, choose Lipa kwa Halopesa, enter Merchant Code 601144.',
        colorClass: 'border-orange-500/30 bg-orange-500/5 text-orange-400',
        enabled: true
      },
      {
        id: 'pay-5',
        method: 'Visa Card',
        merchantName: 'MAKAZI RESIDENCES LTD',
        numberType: 'CRDB Bank Accounts',
        numberValue: '0152-4411-9210',
        instructions: 'Transfer to CRDB Bank Plc, Account Number: 0152-4411-9210, Account Name: MAKAZI RESIDENCES LTD. (USD & TZS accepted)',
        colorClass: 'border-indigo-500/30 bg-indigo-500/5 text-indigo-400',
        enabled: true
      }
    ];
  }, [activePaymentBookingId]); // reload details dynamically when checkout drawer opens

  const enabledAccounts = useMemo(() => {
    return dynamicPaymentAccounts.filter(acc => acc.enabled !== false);
  }, [dynamicPaymentAccounts]);

  const handleUpdateSubscriptionPlan = (plan: 'premium' | 'business' | 'company') => {
    setSelectedUpgradePlan(plan);
    const formEl = document.getElementById('payment-submission-wizard-section');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file for the screenshot.');
        return;
      }
      setIsUploadingScreenshot(true);
      try {
        const reader = new FileReader();
        reader.onload = async (event) => {
          if (event.target?.result) {
            const base64Str = event.target.result as string;
            try {
              const uploadOutput = await uploadFileToAppwrite(
                file.name,
                file.type,
                base64Str,
                file
              );
              if (uploadOutput && uploadOutput.fileUrl) {
                setScreenshot(uploadOutput.fileUrl);
              } else {
                setScreenshot(base64Str);
              }
            } catch (err) {
              setScreenshot(base64Str);
            }
          }
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error('Screenshot conversion failed:', err);
      } finally {
        setIsUploadingScreenshot(false);
      }
    }
  };

  const handleHavePaidSubmit = async () => {
    if (!selectedUpgradePlan) {
      alert('Please choose an upgrade plan first.');
      return;
    }
    if (!transactionNumber.trim()) {
      alert('Please enter your transaction number.');
      return;
    }

    const receiptImg = screenshot || 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=400&q=80';

    try {
      const updatedUser = {
        ...user,
        subscriptionStatus: 'pending' as const,
        pendingSubscriptionPlan: selectedUpgradePlan,
        pendingTransactionNumber: transactionNumber,
        pendingScreenshot: receiptImg,
        pendingSubmittedAt: new Date().toISOString()
      };

      // Update in localStorage and remote Appwrite via prop
      await onUpdateUser(updatedUser);

      // Save to global approvals requests table
      const requestsJson = localStorage.getItem('makazi_upgrade_requests');
      let currentRequests = [];
      try {
        if (requestsJson) currentRequests = JSON.parse(requestsJson);
      } catch (e) {}

      const newRequest = {
        id: `sub-${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id || 'james-levis-1',
        userName: user.name,
        userEmail: user.email,
        plan: selectedUpgradePlan,
        transactionNumber: transactionNumber,
        screenshot: receiptImg,
        submittedAt: new Date().toISOString(),
        status: 'pending' as const
      };

      currentRequests.unshift(newRequest);
      localStorage.setItem('makazi_upgrade_requests', JSON.stringify(currentRequests));

      alert('Payment details submitted successfully! Your account will be upgraded as soon as the CEO approves your transaction.');
    } catch (err: any) {
      alert(`Could not submit payment: ${err.message || err}`);
    }
  };

  // Stay Payments Receipts upload handlers
  const handleStayReceiptUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file for the screenshot.');
      return;
    }
    setIsUploadingReceipt(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          const base64Str = event.target.result as string;
          try {
            const uploadOutput = await uploadFileToAppwrite(
              file.name,
              file.type,
              base64Str,
              file
            ).catch(() => null);
            if (uploadOutput && uploadOutput.fileUrl) {
              setReceiptImageBase64(uploadOutput.fileUrl);
            } else {
              setReceiptImageBase64(base64Str);
            }
          } catch (err) {
            setReceiptImageBase64(base64Str);
          }
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Stay payment receipt conversion failed:', err);
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  const handleStayReceiptDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleStayReceiptDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleStayReceiptUpload(e.dataTransfer.files[0]);
    }
  };

  const getPaymentMethodDetails = (method: string) => {
    const found = dynamicPaymentAccounts.find((acc) => acc.method === method);
    if (found) {
      return {
        merchantName: found.merchantName,
        numberType: found.numberType,
        numberValue: found.numberValue,
        instructions: found.instructions,
        colorClass: found.colorClass || 'border-indigo-500/30 bg-indigo-500/5 text-indigo-400'
      };
    }
    return {
      merchantName: 'MAKAZI Group Ltd',
      numberType: 'Lipa Namba (Merchant Code)',
      numberValue: '569311',
      instructions: 'Dial *150*00#, choose Pay Merchant (Lipa kwa M-Pesa) and enter Lipa Namba 569311.',
      colorClass: 'border-red-500/30 bg-red-500/5 text-red-400'
    };
  };

  const handleBookingPaymentSubmit = (bookingId: string) => {
    if (!paymentPhoneOrAccount.trim()) {
      alert('Please provide your payment account number, transaction ID or phone number.');
      return;
    }
    if (!receiptImageBase64) {
      alert('Please upload a screenshot or copy of your payment receipt.');
      return;
    }

    const updatedBookings = bookings.map((b) => {
      if (b.id === bookingId) {
        return {
          ...b,
          paymentMethod: selectedPaymentMethod,
          paymentNumber: paymentPhoneOrAccount.trim(),
          paymentReceiptUrl: receiptImageBase64,
          paymentStatus: 'Pending' as const,
        };
      }
      return b;
    });

    if (onUpdateBookings) {
      onUpdateBookings(updatedBookings);
    }
    try {
      localStorage.setItem('makazi_bookings', JSON.stringify(updatedBookings));
    } catch (e) {}

    // Reset payment states
    setActivePaymentBookingId(null);
    setPaymentPhoneOrAccount('');
    setReceiptImageBase64(null);
    alert('Payment proof submitted successfully! CEO headquarters has been requested for authorization.');
  };

  // Editing profile states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editLocation, setEditLocation] = useState(user.location || 'London, UK');
  const [editEmail, setEditEmail] = useState(user.email);
  const [editPhone, setEditPhone] = useState((user as any).phone || '');
  const [editUsername, setEditUsername] = useState(user.username || '');
  
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoSuccess, setPhotoSuccess] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync profile editing when modal opens or user values shift
  const startEditing = () => {
    setEditName(user.name);
    setEditLocation(user.location || 'London, UK');
    setEditEmail(user.email);
    setEditPhone((user as any).phone || '');
    setEditUsername(user.username || '');
    setIsEditing(true);
  };

  const saveProfileEdits = async () => {
    if (!editName.trim()) return;
    try {
      await onUpdateUser({
        ...user,
        name: editName.trim(),
        location: editLocation.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
        username: editUsername.trim()
      });
      setIsEditing(false);
      setPhotoSuccess('Profile information saved successfully!');
      setTimeout(() => setPhotoSuccess(null), 3000);
    } catch (err: any) {
      alert(`Could not save profile changes: ${err.message || err}`);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validate type
      if (!file.type.startsWith('image/')) {
        setPhotoError('Selected file must be an image (PNG, JPG, WebP).');
        return;
      }

      setIsUploadingPhoto(true);
      setPhotoError(null);
      setPhotoSuccess(null);

      try {
        const reader = new FileReader();
        reader.onload = async (event) => {
          if (event.target?.result) {
            const base64Str = event.target.result as string;
            
            let finalAvatarUrl = base64Str;
            try {
              // Attempt upload to Appwrite storage with direct SDK
              const uploadOutput = await uploadFileToAppwrite(
                file.name,
                file.type,
                base64Str,
                file
              );

              if (uploadOutput && uploadOutput.fileUrl) {
                finalAvatarUrl = uploadOutput.fileUrl;
              }
            } catch (storageErr) {
              console.warn('[Avatar upload using reliable local fallback]:', storageErr);
            }

            try {
              // Update parent state preserving all user roles, subscriptions and parameters
              await onUpdateUser({
                ...user,
                avatar: finalAvatarUrl
              });
              setPhotoSuccess('Profile photo updated successfully!');
              setTimeout(() => setPhotoSuccess(null), 3500);
            } catch (err: any) {
              console.error('[Avatar update DB error]:', err);
              setPhotoError(`Photo update failed: ${err.message || err}`);
            } finally {
              setIsUploadingPhoto(false);
            }
          }
        };

        reader.onerror = () => {
          setPhotoError('Could not read image file from disk.');
          setIsUploadingPhoto(false);
        };

        reader.readAsDataURL(file);
      } catch (err: any) {
        console.error('[Avatar Update Failure]:', err);
        setPhotoError(`Upload failed: ${err.message || err}`);
        setIsUploadingPhoto(false);
      }
    }
  };

  return (
    <div className="space-y-8">
      
      {photoError && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center gap-2 animate-fade-in">
          <span className="font-bold uppercase tracking-wider text-[9px] bg-rose-500/25 px-1.5 py-0.5 rounded">Error</span>
          <span>{photoError}</span>
        </div>
      )}

      {photoSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-xl flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{photoSuccess}</span>
        </div>
      )}

      {/* Traveler Header Card Banner (Stateful, editable, with active photo upload triggers) */}
      <div className="bg-white/5 border border-[#ffffff10] rounded-[32px] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl backdrop-blur-2xl text-white relative overflow-hidden">
        
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          
          {/* Avatar frame with file uploader trigger */}
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
              disabled={isUploadingPhoto}
            />
            
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-indigo-500/40 shadow-xl group-hover:border-indigo-400 relative">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              
              {/* Photo Uploading Overlay */}
              {isUploadingPhoto ? (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
                </div>
              ) : (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-5 h-5 text-indigo-300" />
                </div>
              )}
            </div>

            <div className="absolute bottom-0 right-0 p-1.5 bg-indigo-600 rounded-full border-2 border-[#0f172a] shadow-md">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          {/* User Parameters Details & Inlines */}
          <div className="flex-1 space-y-2">
            {isEditing ? (
              <div className="space-y-2 max-w-sm">
                <div>
                  <label className="text-[9px] font-mono text-slate-400 uppercase font-bold block mb-0.5">Full Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full bg-white/10 border border-white/20 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono text-slate-400 uppercase font-bold block mb-0.5">Location</label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    placeholder="Location (e.g. Dar es Salaam, Tanzania)"
                    className="w-full bg-white/10 border border-white/20 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono text-slate-400 uppercase font-bold block mb-0.5">Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="Email Address"
                    className="w-full bg-white/10 border border-white/20 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-mono text-slate-400 uppercase font-bold block mb-0.5">Phone</label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="+255 7..."
                      className="w-full bg-white/10 border border-white/20 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-slate-400 uppercase font-bold block mb-0.5">Username</label>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      placeholder="username"
                      className="w-full bg-white/10 border border-white/20 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2 pt-1.5">
                  <button
                    onClick={saveProfileEdits}
                    className="flex items-center gap-1 py-1.5 px-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold cursor-pointer transition-all shadow-md active:scale-95"
                  >
                    <Check className="w-3" />
                    <span>Save Changes</span>
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[10px] font-bold cursor-pointer transition-all"
                  >
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <h2 className="font-display font-semibold text-xl sm:text-2xl text-white">{user.name}</h2>
                  <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] font-bold uppercase tracking-wider">
                    {user.role === 'owner' ? '🏡 Registered Owner' : user.role === 'broker' ? '🎖️ Licensed Broker' : isCEOOrAdmin ? '👑 CEO Admin' : '🔭 Luxe Explorer'}
                  </span>
                  
                  <button
                    onClick={startEditing}
                    className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                    title="Edit Profile"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {onLogout && (
                    <button
                      onClick={onLogout}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-white/5 transition-colors cursor-pointer ml-0.5"
                      title="Log Out Account"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Stays member • {user.location || 'London, UK'}
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-400 mt-0.5">
                  <span>{user.email}</span>
                  {(user as any).phone && (
                    <>
                      <span className="text-slate-600">•</span>
                      <span className="font-mono text-indigo-300">{(user as any).phone}</span>
                    </>
                  )}
                  {user.username && (
                    <>
                      <span className="text-slate-600">•</span>
                      <span className="font-mono text-slate-400">@{user.username}</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Travel Analytics Stats */}
        <div className="flex flex-col sm:flex-row gap-5 sm:gap-8 items-center border-t md:border-t-0 md:border-l border-white/10 pt-5 md:pt-0 md:pl-8 justify-between md:justify-end">
          <div className="flex gap-6 text-center sm:text-left">
            <div className="px-1.5">
              <p className="font-display font-bold text-white text-xl sm:text-2xl font-mono">{bookings.length}</p>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Booked Stays</p>
            </div>
            <div className="px-1.5 border-x border-white/10">
              <p className="font-display font-bold text-white text-xl sm:text-2xl font-mono">{favorites.length}</p>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Favorites</p>
            </div>
            <div className="px-1.5">
              <p className="font-display font-bold text-white text-xl sm:text-2xl font-mono">100%</p>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Verified</p>
            </div>
          </div>

          {/* Quick Action Button: Post Stay Listing */}
          <button
            onClick={onOpenPostingModal}
            className="flex items-center gap-2 py-3 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95 cursor-pointer uppercase tracking-wider text-[10px] w-full sm:w-auto text-center justify-center whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4 text-indigo-200 fill-indigo-600/10" />
            <span>Post New Stay Sanctuary</span>
          </button>
        </div>

      </div>

      {/* Sub-tab Selection Rail */}
      <div className="flex gap-4 border-b border-white/10 pb-1 mb-8">
        <button
          onClick={() => setSubTab('dashboard')}
          className={`pb-3 font-semibold text-xs uppercase tracking-wider transition-all relative cursor-pointer flex items-center gap-2 ${
            subTab === 'dashboard' ? 'text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Dashboard & Activity</span>
          {subTab === 'dashboard' && (
            <motion.div layoutId="profileUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
          )}
        </button>
        <button
          onClick={() => setSubTab('upgrade')}
          className={`pb-3 font-semibold text-xs uppercase tracking-wider transition-all relative cursor-pointer flex items-center gap-2 ${
            subTab === 'upgrade' ? 'text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400/15" />
          <span>Upgrade Account</span>
          <span className="bg-gradient-to-r from-pink-500 to-indigo-500 text-white text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
            Paid Ad Tools
          </span>
          {subTab === 'upgrade' && (
            <motion.div layoutId="profileUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500" />
          )}
        </button>
        <button
          onClick={() => setSubTab('broker')}
          className={`pb-3 font-semibold text-xs uppercase tracking-wider transition-all relative cursor-pointer flex items-center gap-2 ${
            subTab === 'broker' ? 'text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Award className="w-4 h-4 text-emerald-400" />
          <span>Become a Broker</span>
          <span className="bg-emerald-505/10 text-emerald-400 border border-emerald-500/30 text-[8px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
            License Suite
          </span>
          {subTab === 'broker' && (
            <motion.div layoutId="profileUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
          )}
        </button>
      </div>

      {subTab === 'upgrade' ? (
        <div className="space-y-8 animate-fade-in text-left text-sans">
          {/* Header Message */}
          <div className="p-6 rounded-[24px] bg-gradient-to-r from-slate-950 via-slate-900 to-slate-900 border border-white/10 flex flex-col md:flex-row gap-5 justify-between items-start md:items-center">
            <div className="space-y-1 font-sans">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>Upgrade Your Account</span>
                <span className="text-[10px] font-mono tracking-widest text-[#f59e0b] uppercase px-2 py-0.5 rounded bg-[#f59e0b]/10 border border-[#f59e0b]/20">Pro Suite</span>
              </h2>
              <p className="text-xs text-slate-400">Unlock powerful marketing tools, Gemini AI listings writing, and paid ad networks.</p>
            </div>
            
            <div className="text-xs font-semibold px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 text-indigo-300 max-w-sm font-mono">
              <CheckCircle className="w-5 h-5 text-indigo-400 flex-shrink-0 animate-pulse" />
              <span>Current Plan: <strong className="text-white uppercase">{user.subscription && user.subscription !== 'none' ? user.subscription : 'FREE LISTINGS'}</strong></span>
            </div>
          </div>

          {(user as any).subscriptionStatus === 'pending' ? (
            /* WAIT FOR APPROVAL STATUS - SHOWN AS THE PRIMARY VIEW WHEN STATUS IS PENDING */
            <div className="p-8 rounded-[32px] bg-slate-900 border border-white/10 space-y-6 max-w-2xl mx-auto shadow-2xl relative overflow-hidden animate-fade-in font-sans" id="upgrade-pending-status-card">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-indigo-500" />
              
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">Upgrade Approval Pending</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Your subscription payment details are currently being reviewed by our administrative team.
                </p>
              </div>

              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-xs space-y-3">
                <h4 className="font-bold text-slate-200 border-b border-white/5 pb-2 uppercase tracking-wider text-[10px] font-mono">Submission Details</h4>
                
                <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                  <span className="text-slate-400">Chosen Plan:</span>
                  <span className="text-white font-bold uppercase font-mono text-right">
                    {(user as any).pendingSubscriptionPlan ? `${(user as any).pendingSubscriptionPlan} plan` : 'Premium Plan'}
                  </span>

                  <span className="text-slate-400">Price / Duration:</span>
                  <span className="text-emerald-400 font-bold text-right font-mono">
                    {(user as any).pendingSubscriptionPlan === 'company' ? 'TZS 20,000' : (user as any).pendingSubscriptionPlan === 'business' ? 'TZS 15,000' : 'TZS 5,000'} / 2 Months
                  </span>

                  <span className="text-slate-400">Transaction Number:</span>
                  <span className="text-amber-400 font-bold text-right font-mono select-all">
                    {(user as any).pendingTransactionNumber || 'N/A'}
                  </span>

                  <span className="text-slate-400">Submitted:</span>
                  <span className="text-slate-300 text-right">
                    {(user as any).pendingSubmittedAt ? new Date((user as any).pendingSubmittedAt).toLocaleString() : 'Just now'}
                  </span>
                </div>

                {(user as any).pendingScreenshot && (
                  <div className="space-y-1.5 pt-2">
                    <span className="text-slate-400 block pb-1">Payment Verification Screenshot:</span>
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 max-w-sm mx-auto bg-black">
                      <img 
                        src={(user as any).pendingScreenshot} 
                        alt="Payment Screenshot Receipt" 
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={async () => {
                      if (confirm('Are you sure you want to cancel this request and submit new payment details?')) {
                        await onUpdateUser({
                          ...user,
                          subscriptionStatus: 'none',
                          pendingSubscriptionPlan: undefined,
                          pendingTransactionNumber: undefined,
                          pendingScreenshot: undefined,
                          pendingSubmittedAt: undefined
                        });
                      }
                    }}
                    className="flex-1 py-3 px-4 rounded-xl border border-white/10 hover:border-white/20 text-slate-300 hover:text-white text-xs font-bold cursor-pointer transition-all active:scale-[0.99] text-center"
                    id="cancel-upgrade-request-btn"
                  >
                    Cancel & Reset Form
                  </button>

                  <button
                    onClick={() => alert('Our team is reviewing your transaction. You will see a notification once approved. Thank you for your patience!')}
                    className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-550 text-white text-xs font-bold cursor-pointer transition-all active:scale-[0.99] text-center shadow-lg rounded-xl"
                  >
                    Wait for Approval...
                  </button>
                </div>

                {/* Benefits checklist */}
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-300 uppercase block font-mono tracking-widest mb-2.5 text-center">Benefits After Approval</span>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                      <span>Create advertisements</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                      <span>Upload advertising videos</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                      <span>Record advertising audio</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                      <span>AI-powered post editing</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                      <span>Boost posts</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                      <span>Priority visibility</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Core Premium Features Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* AI Post Editor details card */}
            <div className="p-6 bg-white/5 border border-white/10 rounded-[28px] space-y-4 hover:border-white/15 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">AI Post Editor Suite</h3>
                  <p className="text-[10px] text-slate-400">Perfect your housing listings inside Makazi using AI tools</p>
                </div>
              </div>
              
              <ul className="space-y-2.5 text-xs text-slate-300 font-medium">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 font-bold block mt-0.5">•</span>
                  <span><strong>Rewrite post descriptions:</strong> Professional upscale copywriting optimized for high traveler interest.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 font-bold block mt-0.5">•</span>
                  <span><strong>Improve titles automatically:</strong> Increase your banner click-through rate instantly.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 font-bold block mt-0.5">•</span>
                  <span><strong>Generate marketing text:</strong> Targeted sales hooks and highlights.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 font-bold block mt-0.5">•</span>
                  <span><strong>Tags & Keywords:</strong> Auto-rank 300% higher with trending search hashtags.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 font-bold block mt-0.5">•</span>
                  <span><strong>Multi-lingual translation:</strong> Localize listings to Swahili, German, French or Spanish instantly.</span>
                </li>
              </ul>
            </div>

            {/* Video Advertisements list card */}
            <div className="p-6 bg-white/5 border border-white/10 rounded-[28px] space-y-4 hover:border-white/15 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/15">
                  <Camera className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Creative Video Ads Lab</h3>
                  <p className="text-[10px] text-slate-400">Launch rich, immersive promotional assets</p>
                </div>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-300 font-medium">
                <li className="flex items-start gap-2">
                  <span className="text-rose-450 font-bold block mt-0.5">•</span>
                  <span><strong>Video Advertisements:</strong> Generate and render interactive promotional clips.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-425 font-bold block mt-0.5">•</span>
                  <span><strong>Voice Recordings:</strong> Link audio greeting memos or sales voice pitches to stays.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-425 font-bold block mt-0.5">•</span>
                  <span><strong>Promotional Campaigns:</strong> Reach active digital nomads or local travelers.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-405 font-bold block mt-0.5">•</span>
                  <span><strong>Business presentations:</strong> Premium slides generated from listing metadata files.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-410 font-bold block mt-0.5">•</span>
                  <span><strong>AI Marketing Videos:</strong> High-conversion narrative clips for listings.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="space-y-4 pt-4 text-center">
            <h3 className="text-sm font-bold text-white tracking-wider flex items-center justify-center gap-2 font-mono uppercase">
              <PlusCircle className="w-4 h-4 text-amber-500" />
              <span>Paid Promotion Plans</span>
            </h3>
            <p className="text-xs text-slate-400 max-w-lg mx-auto">Choose a plan that fits your business scale. Subscribing unlocks both AI utilities and feed boosting features.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-3 text-left">
              
              {/* Premium Plan TZS 5,000 */}
              <div className={`p-6 rounded-[28px] border relative flex flex-col justify-between transition-all hover:-translate-y-1 ${
                user.subscription === 'premium' 
                  ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/30' 
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}>
                {/* Active indicator badge */}
                {user.subscription === 'premium' && (
                  <span className="absolute top-4 right-4 bg-indigo-600 text-white text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    Activated
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 tracking-widest block">LEVEL 1</span>
                    <h4 className="text-sm font-bold text-white mt-1">Premium Plan</h4>
                    <p className="text-[10px] text-slate-400 mt-1">For single property hosts getting serious.</p>
                  </div>

                  <div className="flex items-baseline gap-1 font-mono">
                    <span className="text-sm font-bold text-slate-100">TZS 5,000</span>
                    <span className="text-xs text-slate-400 font-sans">/ 2 Months</span>
                  </div>

                  <hr className="border-white/10" />

                  <ul className="space-y-2 text-xs text-slate-300 font-medium">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-450 flex-shrink-0" />
                      <span>Promote posts</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-450 flex-shrink-0" />
                      <span>AI post editing</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-450 flex-shrink-0" />
                      <span>Upload video advertisements</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-450 flex-shrink-0" />
                      <span>Priority listing</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleUpdateSubscriptionPlan('premium')}
                  className={`w-full mt-6 py-2.5 px-4 rounded-xl font-bold text-xs text-center border cursor-pointer active:scale-95 transition-all ${
                    user.subscription === 'premium' ? 'bg-indigo-600 text-white border-transparent' : 'text-slate-300 border-white/10 hover:bg-white/5'
                  }`}
                >
                  {user.subscription === 'premium' ? 'Plan Subscribed ✓' : 'Upgrade to Premium'}
                </button>
              </div>

              {/* Business Plan TZS 15,000 */}
              <div className={`p-6 rounded-[28px] border relative flex flex-col justify-between transition-all hover:-translate-y-1 ${
                user.subscription === 'business' 
                  ? 'bg-rose-955/30 border-rose-500 ring-2 ring-rose-550/30' 
                  : 'bg-white/5 border border-indigo-505/15 hover:border-indigo-400'
              }`}>
                {/* popular badge */}
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 to-indigo-500 text-white text-[8px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">
                  Most Popular
                </span>

                {user.subscription === 'business' && (
                  <span className="absolute top-4 right-4 bg-rose-600 text-white text-[8px] font-bold px-2.5 py-1 rounded uppercase tracking-wider">
                    Activated
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-indigo-400 tracking-widest block">LEVEL 2</span>
                    <h4 className="text-sm font-bold text-white mt-1">Business Plan</h4>
                    <p className="text-[10px] text-slate-400 mt-1">For multi-listing hosts and luxury agencies.</p>
                  </div>

                  <div className="flex items-baseline gap-1 font-mono">
                    <span className="text-sm font-bold text-rose-350">TZS 15,000</span>
                    <span className="text-xs text-slate-400 font-sans">/ 2 Months</span>
                  </div>

                  <hr className="border-white/10" />

                  <ul className="space-y-2 text-xs text-slate-300 font-medium font-sans">
                    <li className="flex items-center gap-2 text-indigo-200">
                      <Check className="w-3.5 h-3.5 text-emerald-450 flex-shrink-0" />
                      <strong>Everything in Premium</strong>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-450 flex-shrink-0" />
                      <span>Featured business badge</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-450 flex-shrink-0" />
                      <span>Higher search ranking</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-450 flex-shrink-0" />
                      <span>Unlimited promoted posts</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleUpdateSubscriptionPlan('business')}
                  className={`w-full mt-6 py-2.5 px-4 rounded-xl font-bold text-xs text-center border cursor-pointer active:scale-95 transition-all ${
                    user.subscription === 'business' ? 'bg-rose-600 text-white border-transparent' : 'bg-indigo-605 text-white border-transparent'
                  }`}
                >
                  {user.subscription === 'business' ? 'Plan Subscribed ✓' : 'Upgrade to Business'}
                </button>
              </div>

              {/* Company Plan TZS 20,000 */}
              <div className={`p-6 rounded-[28px] border relative flex flex-col justify-between transition-all hover:-translate-y-1 ${
                user.subscription === 'company' 
                  ? 'bg-amber-955/20 border-amber-500 ring-2 ring-amber-500/30' 
                  : 'bg-white/5 border border-white/10 hover:border-white/20'
              }`}>
                {user.subscription === 'company' && (
                  <span className="absolute top-4 right-4 bg-amber-500 text-slate-900 text-[8px] font-bold px-2.5 py-1 rounded uppercase tracking-wider font-mono">
                    Activated
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-amber-450 tracking-widest block">LEVEL 3</span>
                    <h4 className="text-sm font-bold text-white mt-1">Company Plan</h4>
                    <p className="text-[10px] text-slate-400 mt-1">Designed for professional real estate conglomerates.</p>
                  </div>

                  <div className="flex items-baseline gap-1 font-mono">
                    <span className="text-sm font-bold text-amber-400">TZS 20,000</span>
                    <span className="text-xs text-slate-400 font-sans">/ 2 Months</span>
                  </div>

                  <hr className="border-white/10" />

                  <ul className="space-y-2 text-xs text-slate-355 font-medium font-sans">
                    <li className="flex items-center gap-2 text-amber-200">
                      <Check className="w-3.5 h-3.5 text-emerald-450 flex-shrink-0" />
                      <strong>Everything in Business</strong>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-450 flex-shrink-0" />
                      <span>Company verification badge</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-450 flex-shrink-0" />
                      <span>Homepage promotion</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-450 flex-shrink-0" />
                      <span>Advanced analytics & support</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleUpdateSubscriptionPlan('company')}
                  className={`w-full mt-6 py-2.5 px-4 rounded-xl font-bold text-xs text-center border cursor-pointer active:scale-95 transition-all ${
                    user.subscription === 'company' ? 'bg-amber-500 text-slate-900 border-transparent' : 'text-slate-300 border-white/10 hover:bg-white/5'
                  }`}
                >
                  {selectedUpgradePlan === 'company' ? 'Plan Selected ✓' : 'Select Company'}
                </button>
              </div>

            </div>
          </div>

          {/* TWO COLUMN WIZARD: PAYMENT METHODS & FORM */}
          <div id="payment-submission-wizard-section" className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6 border-t border-white/5 font-sans text-left">
            
            {/* COLUMN A: PAYMENT METHODS */}
            <div className="p-6 rounded-[28px] bg-slate-900/60 border border-white/10 space-y-6 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-black uppercase font-mono tracking-widest text-[#f59e0b] flex items-center gap-2 mb-4">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Payment Providers</span>
                </h3>

                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Pay the subscription fee securely to any of the numbers below. Remember to take a screenshot of your transaction receipt.
                </p>

                <div className="space-y-4 font-sans">
                  {/* Yas Payment Card */}
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2 relative overflow-hidden transition-all hover:border-indigo-500/30">
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 uppercase text-slate-900/40 text-3xl font-black font-mono select-none">YAS</div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block font-mono">PROVIDER ONE</span>
                    <h4 className="text-sm font-bold text-white uppercase font-sans">Yas</h4>
                    <div className="text-lg font-mono font-bold text-indigo-400 pt-1 select-all hover:underline cursor-pointer">
                      07658949430
                    </div>
                  </div>

                  {/* Vodacom M-Pesa Payment Card */}
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2 relative overflow-hidden transition-all hover:border-red-500/30">
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 uppercase text-slate-900/40 text-3xl font-black font-mono select-none font-mono">M-PESA</div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block font-mono">PROVIDER TWO</span>
                    <h4 className="text-sm font-bold text-red-405 uppercase font-sans">Vodacom M-Pesa</h4>
                    <div className="text-lg font-mono font-bold text-red-400 pt-1 select-all hover:underline cursor-pointer">
                      0760744474
                    </div>
                  </div>
                </div>
              </div>

              {/* Active subscription time info */}
              <div className="p-4 bg-[#f59e0b]/5 border border-[#f59e0b]/15 rounded-2xl text-xs text-[#f59e0b] font-sans mt-4">
                <strong>Our Subscription Duration:</strong>
                <p className="text-[11px] text-slate-400 mt-1 font-sans leading-relaxed">
                  Your subscription remains active for exactly <strong>2 months</strong> from the approval date of the purchase.
                </p>
              </div>
            </div>

            {/* COLUMN B: AFTER PAYMENT FORM */}
            <div className="p-6 rounded-[28px] bg-slate-900/60 border border-white/10 space-y-5 text-left font-sans">
              <h3 className="text-xs font-black uppercase font-mono tracking-widest text-[#f59e0b] flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>Verification & Upload</span>
              </h3>

              {/* Steps checklist */}
              <div className="bg-black/20 p-3.5 border border-white/5 rounded-2xl text-xs text-slate-300 space-y-2 font-sans">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Instruction Steps:</span>
                <ol className="space-y-1 text-[11px] list-decimal list-inside text-slate-400 font-medium">
                  <li>Complete payment via one of the accounts.</li>
                  <li>Upload a screenshot image of the payment receipt.</li>
                  <li>Type your unique transaction number / SMS code.</li>
                  <li>Click "I Have Paid" to submit for CEO approval.</li>
                </ol>
              </div>

              {/* Selected plan details review */}
              <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between text-xs font-sans">
                <span className="text-slate-400">Upgrade Plan:</span>
                <span className="font-bold text-emerald-400 uppercase font-mono">
                  {selectedUpgradePlan.toUpperCase()} — {selectedUpgradePlan === 'company' ? 'TZS 20,000' : selectedUpgradePlan === 'business' ? 'TZS 15,000' : 'TZS 5,000'}
                </span>
              </div>

              <div className="space-y-4">
                {/* Input: Transaction Number */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <span>Transaction ID or SMS Reference Code</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. TXN987654 or Mpesa ID"
                    value={transactionNumber}
                    onChange={(e) => setTransactionNumber(e.target.value)}
                    className="w-full bg-slate-950 hover:bg-slate-950/80 focus:bg-slate-950 transition-all border border-white/10 focus:border-[#f59e0b] outline-none text-white text-xs py-2.5 px-3 rounded-xl font-mono font-medium"
                  />
                </div>

                {/* Input: Screenshot Receipt image */}
                <div className="space-y-1.5 font-sans">
                  <label className="text-[10px] font-semibold font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <span>Screenshot Image Receipt</span>
                    <span className="text-rose-500">*</span>
                  </label>

                  <div 
                    onClick={() => screenshotInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); }}
                    onDrop={async (e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        const file = e.dataTransfer.files[0];
                        if (file.type.startsWith('image/')) {
                          setIsUploadingScreenshot(true);
                          const reader = new FileReader();
                          reader.onload = async (event) => {
                            if (event.target?.result) {
                              setScreenshot(event.target.result as string);
                            }
                          };
                          reader.readAsDataURL(file);
                          setIsUploadingScreenshot(false);
                        } else {
                          alert('Please upload an image receipt.');
                        }
                      }
                    }}
                    className="border border-dashed border-white/10 hover:border-[#f59e0b]/40 rounded-2xl p-4 text-center cursor-pointer bg-slate-950/40 relative min-h-[90px] flex flex-col justify-center items-center gap-1.5 hover:bg-slate-950/70 transition-all select-none"
                  >
                    <input 
                      type="file"
                      ref={screenshotInputRef}
                      onChange={handleScreenshotUpload}
                      accept="image/*"
                      className="hidden"
                    />

                    {isUploadingScreenshot ? (
                      <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
                    ) : screenshot ? (
                      <div className="absolute inset-0.5 rounded-[14px] overflow-hidden bg-black flex items-center justify-center">
                        <img 
                          src={screenshot} 
                          alt="Screenshot Preview" 
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/50 hover:opacity-100 opacity-0 transition-opacity flex items-center justify-center text-[10px] text-white font-extrabold uppercase font-mono">
                          Click to replace screenshot
                        </div>
                      </div>
                    ) : (
                      <>
                        <Camera className="w-5 h-5 text-slate-500 animate-pulse" />
                        <div className="space-y-0.5">
                          <p className="text-[11px] text-white font-bold">Drag & Drop or Tap to Upload</p>
                          <p className="text-[9px] text-slate-500 font-sans">Payment verification receipt screenshot</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Submit upgrade action */}
                <button
                  type="button"
                  onClick={handleHavePaidSubmit}
                  disabled={isUploadingScreenshot || !transactionNumber.trim() || !screenshot}
                  className={`w-full py-3 px-6 rounded-xl font-black uppercase text-xs tracking-widest text-center shadow-lg transition-all active:scale-[0.98] ${
                    screenshot && transactionNumber.trim()
                      ? 'bg-gradient-to-r from-[#f59e0b] to-amber-600 hover:from-amber-600 hover:to-[#f59e0b] text-slate-950 cursor-pointer text-xs'
                      : 'bg-white/5 text-slate-500 pointer-events-none border border-white/5'
                  }`}
                  id="update-ihavepaid-submit-btn"
                >
                  I Have Paid
                </button>
              </div>
            </div>

          </div>

            </>
          )}

          {/* Checkout & Payments warning policy */}
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3 justify-start max-w-xl mx-auto font-sans">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-left font-sans col-span-1">
              <span className="text-xs font-bold text-white block">Payment Required Notice</span>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed font-sans mt-1">
                To promote a post, create an advertisement, upload ad videos, or use AI post enhancement tools, an active subscription is required. Upgrade now.
              </p>
            </div>
          </div>

        </div>
      ) : subTab === 'broker' ? (
        <div className="space-y-8 animate-fade-in text-left text-sans">
          {user.role === 'broker' ? (
            <div className="space-y-6">
              {/* Dashboard Navigation Tabs */}
              <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
                {( [
                  { id: 'profile' as const, label: 'Broker Info', icon: Award },
                  { id: 'properties' as const, label: 'My Listings', icon: Building },
                  { id: 'requests' as const, label: 'Inquiries & Requests', icon: Calendar },
                  { id: 'messages' as const, label: 'Client Messages', icon: MessageSquare },
                  { id: 'payments' as const, label: 'Ledger & Revenue', icon: DollarSign },
                ] ).map((tabItem) => {
                  const isActive = brokerTab === tabItem.id;
                  const TabIcon = tabItem.icon;
                  return (
                    <button
                      key={tabItem.id}
                      onClick={() => {
                        setBrokerTab(tabItem.id);
                        if (tabItem.id !== 'messages') {
                          setActiveBrokerChatId(null);
                        }
                      }}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-sans text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/15 border border-emerald-500/20 scale-102'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-transparent'
                      }`}
                    >
                      <TabIcon className="w-4 h-4" />
                      <span>{tabItem.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Broker Tab: Profile & Info */}
              {brokerTab === 'profile' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Official License Badging */}
                  <div className="bg-slate-950/60 border border-emerald-500/20 rounded-3xl p-6 relative overflow-hidden backdrop-blur-md flex flex-col justify-between text-center min-h-[300px]">
                    <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div>
                      <Award className="w-14 h-14 text-emerald-400 mx-auto animate-pulse mb-3" />
                      <h3 className="font-mono font-black text-white text-lg tracking-tight uppercase">Verified Makazi Broker</h3>
                      <p className="font-mono text-[9px] text-emerald-400 font-black uppercase tracking-widest mt-0.5">Officially Certified & Licensed</p>
                      
                      <div className="border border-white/5 bg-white/5 rounded-2xl p-3.5 text-left text-xs space-y-2 mt-5 text-slate-300">
                        <span className="font-bold text-[10px] text-emerald-400 uppercase tracking-wider block font-mono">Guaranteed Rights:</span>
                        <ul className="list-disc list-inside space-y-1 font-sans text-[11px]">
                          <li>List high-end sanctuaries directly</li>
                          <li>Signature "Broker Verified" badge listing icon</li>
                          <li>Direct priority line to CEO support</li>
                          <li>10% host fee commission tier</li>
                        </ul>
                      </div>
                    </div>
                    <div className="text-slate-500 text-[10px] font-mono uppercase tracking-widest pt-4 border-t border-white/5 mt-4">
                      Cert ID: MKB-{user.id.toUpperCase().slice(-6) || '88390'} • STATUS: ACTIVE
                    </div>
                  </div>

                  {/* Right Column: Broker Details Manager */}
                  <div className="lg:col-span-2 bg-slate-950/40 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
                      <div>
                        <h4 className="font-display font-bold text-white text-base">Broker Information</h4>
                        <p className="text-xs text-slate-400 mt-0.5">Manage your active broker identity details and operating locations.</p>
                      </div>
                      {!isEditingBrokerInfo ? (
                        <button
                          onClick={() => {
                            if (brokerApplication) {
                              setEditedBrokerName(brokerApplication.fullName || user.name);
                              setEditedBrokerPhone(brokerApplication.phoneNumber || (user as any).phone || '');
                              setEditedBrokerEmail(brokerApplication.email || user.email);
                              setEditedBrokerLocation(brokerApplication.location || user.location || 'Dar es Salaam, Tanzania');
                              setEditedBrokerExperience(brokerApplication.experience || '');
                            }
                            setIsEditingBrokerInfo(true);
                          }}
                          className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1.5 rounded-xl text-emerald-400 font-sans text-xs font-semibold cursor-pointer select-none transition-colors hover:bg-emerald-500/20"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit Details</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setIsEditingBrokerInfo(false)}
                            className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-slate-300 font-sans text-xs cursor-pointer hover:bg-white/10"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              try {
                                const saved = localStorage.getItem('makazi_broker_applications');
                                if (saved) {
                                  const apps = JSON.parse(saved) as any[];
                                  const updatedApps = apps.map((app) => {
                                    if (app.userId === user.id) {
                                      return {
                                        ...app,
                                        fullName: editedBrokerName.trim(),
                                        phoneNumber: editedBrokerPhone.trim(),
                                        email: editedBrokerEmail.trim(),
                                        location: editedBrokerLocation.trim(),
                                        experience: editedBrokerExperience.trim(),
                                      };
                                    }
                                    return app;
                                  });
                                  localStorage.setItem('makazi_broker_applications', JSON.stringify(updatedApps));
                                  onUpdateUser({
                                    ...user,
                                    name: editedBrokerName.trim(),
                                    location: editedBrokerLocation.trim()
                                  });
                                  setIsEditingBrokerInfo(false);
                                }
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            className="flex items-center gap-1.5 bg-emerald-600 border border-emerald-500 px-3 py-1.5 rounded-xl text-white font-sans text-xs font-semibold cursor-pointer hover:bg-emerald-500"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Save Changes</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {!isEditingBrokerInfo ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
                          <span className="text-[10px] font-mono text-slate-400 uppercase block tracking-wider font-extrabold mb-1">Broker Name</span>
                          <span className="text-white font-semibold text-xs">{editedBrokerName || user.name}</span>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
                          <span className="text-[10px] font-mono text-slate-400 uppercase block tracking-wider font-extrabold mb-1">Phone Number</span>
                          <span className="text-indigo-300 font-mono text-xs">{editedBrokerPhone || 'No custom number registered'}</span>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
                          <span className="text-[10px] font-mono text-slate-400 uppercase block tracking-wider font-extrabold mb-1">Active Operating Location</span>
                          <span className="text-emerald-400 font-semibold text-xs flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{editedBrokerLocation || 'Dar es Salaam, Tanzania'}</span>
                          </span>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
                          <span className="text-[10px] font-mono text-slate-400 uppercase block tracking-wider font-extrabold mb-1">Email Address</span>
                          <span className="text-white text-xs text-slate-300 font-mono">{editedBrokerEmail || user.email}</span>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 sm:col-span-2">
                          <span className="text-[10px] font-mono text-slate-400 uppercase block tracking-wider font-extrabold mb-1">Specialized Experience & Services</span>
                          <p className="text-slate-300 mt-1 leading-relaxed text-xs">{editedBrokerExperience || 'No agency description provided. Fill this out so the CEO and prospective clients can learn about your specialized coverage regions and service experience.'}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 font-sans text-left">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest">Broker Public Name</label>
                            <input
                              type="text"
                              value={editedBrokerName}
                              onChange={(e) => setEditedBrokerName(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-xs text-white placeholder-slate-700 outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest">Contact Phone</label>
                            <input
                              type="text"
                              value={editedBrokerPhone}
                              onChange={(e) => setEditedBrokerPhone(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-xs text-white placeholder-slate-700 outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest">Operating Region / Location</label>
                            <input
                              type="text"
                              value={editedBrokerLocation}
                              onChange={(e) => setEditedBrokerLocation(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-xs text-white placeholder-slate-700 outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest">Email Address</label>
                            <input
                              type="email"
                              value={editedBrokerEmail}
                              onChange={(e) => setEditedBrokerEmail(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-xs text-white placeholder-slate-700 outline-none"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest">Agency Experience & Specialties</label>
                          <textarea
                            rows={4}
                            value={editedBrokerExperience}
                            onChange={(e) => setEditedBrokerExperience(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-xs text-white placeholder-slate-700 outline-none"
                            placeholder="Describe your property coverage, commission models, and active listing types..."
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Broker Tab: Manage Properties */}
              {brokerTab === 'properties' && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-950/40 border border-white/5 rounded-3xl p-5">
                    <div>
                      <h4 className="font-display font-bold text-white text-base">My Properties Portfolio</h4>
                      <p className="text-xs text-slate-400 mt-0.5">You have listed <b className="text-emerald-400 font-mono font-bold">{myPosts.length} properties</b> directly representing clients.</p>
                    </div>
                    <button
                      onClick={onOpenPostingModal}
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-xs font-semibold px-4.5 py-2 rounded-xl transition-all shadow-md cursor-pointer self-start sm:self-center"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Create New Listing</span>
                    </button>
                  </div>

                  {myPosts.length === 0 ? (
                    <div className="py-12 text-center rounded-3xl border border-dashed border-white/10 bg-slate-950/20">
                      <Building className="w-12 h-12 text-slate-650 mx-auto mb-3" />
                      <h5 className="font-bold text-sm text-slate-300">No Premium Listings Found</h5>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">Click 'Create New Listing' to add elegant villas, apartments or workspaces on the Makazi database.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {myPosts.map((house) => {
                        const isCopied = copiedHouseId === house.id;
                        return (
                          <div
                            key={house.id}
                            className="bg-slate-950/30 border border-white/10 rounded-2xl overflow-hidden hover:border-emerald-500/30 transition-all flex flex-col group relative"
                          >
                            <img
                              src={house.images[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c'}
                              alt={house.title}
                              className="w-full h-40 object-cover"
                              referrerPolicy="no-referrer"
                            />
                            {house.propertyStatus && (
                              <span className="absolute top-3 left-3 bg-slate-900/90 text-[9px] font-bold text-slate-205 border border-white/15 px-2.5 py-0.5 rounded-full font-sans uppercase tracking-wider">
                                {house.propertyStatus}
                              </span>
                            )}
                            <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                              <div className="text-left">
                                <h5 className="font-bold text-white text-xs line-clamp-1">{house.title}</h5>
                                <div className="flex items-center gap-1 text-slate-400 text-[11px] mt-1">
                                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate">{house.location}</span>
                                </div>
                                <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-300">
                                  <span className="font-mono font-bold text-slate-300">TZS {house.amount?.toLocaleString() || '180,000'}/mo</span>
                                  {house.size && <span className="font-mono text-slate-400">{house.size}</span>}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 pt-2 border-t border-white/5 w-full">
                                <button
                                  onClick={() => onViewHouse(house)}
                                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-1.5 rounded-lg text-white font-sans text-[10px] font-semibold transition-all cursor-pointer"
                                >
                                  View Details
                                </button>
                                <button
                                  onClick={() => setEditingHouse(house)}
                                  className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 rounded-lg text-indigo-400 transition-all cursor-pointer"
                                  title="Edit Listing"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleSharePost(house)}
                                  className={`p-1.5 border rounded-lg transition-all cursor-pointer relative ${
                                    isCopied
                                      ? 'bg-emerald-500/20 border-emerald-500/35 text-emerald-400'
                                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                                  }`}
                                  title="Share Link"
                                >
                                  {isCopied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                                </button>
                                {deleteConfirmHouseId === house.id ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={async () => {
                                        if (onDeleteHouse) {
                                          await onDeleteHouse(house.id);
                                          setDeleteConfirmHouseId(null);
                                        }
                                      }}
                                      className="px-2 py-1 bg-rose-600 text-white font-semibold text-[9px] rounded hover:bg-rose-500 cursor-pointer"
                                    >
                                      Delete
                                    </button>
                                    <button
                                      onClick={() => setDeleteConfirmHouseId(null)}
                                      className="px-2 py-1 bg-white/5 text-slate-400 text-[9px] rounded hover:bg-white/10 cursor-pointer"
                                    >
                                      No
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setDeleteConfirmHouseId(house.id)}
                                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 rounded-lg text-rose-450 transition-all cursor-pointer"
                                    title="Delete Listing"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Broker Tab: Inquiries & Requests */}
              {brokerTab === 'requests' && (
                <div className="space-y-4">
                  <div className="bg-slate-950/40 border border-white/5 rounded-3xl p-5 mb-2">
                    <h4 className="font-display font-bold text-white text-base">Booking Inquiries & Requests</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Manage viewing appointments, rental inquiries, and reservation contracts sent by clients on your active properties.</p>
                  </div>

                  {bookings.filter(b => myPosts.some(house => house.id === b.house.id)).length === 0 ? (
                    <div className="py-12 text-center rounded-3xl border border-dashed border-white/10 bg-slate-950/20">
                      <Calendar className="w-12 h-12 text-slate-650 mx-auto mb-3" />
                      <h5 className="font-bold text-sm text-slate-300">No Client Inquiries Yet</h5>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">Whenever active users send details, inquiries, or viewing reservations on your listings, they will appear dynamically here.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 font-sans text-left">
                      {bookings.filter(b => myPosts.some(house => house.id === b.house.id)).map((booking) => {
                        const guestCount = booking.guests || 1;
                        const statusColor = booking.status === 'completed'
                          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                          : booking.status === 'cancelled'
                            ? 'border-rose-500/20 bg-rose-500/10 text-rose-400'
                            : 'border-amber-500/20 bg-amber-500/10 text-amber-400';

                        const statusLabel = booking.status === 'completed' ? 'Inquiry Approved' : booking.status === 'cancelled' ? 'Inquiry Rejected' : 'Pending Review';

                        return (
                          <div
                            key={booking.id}
                            className="p-5 rounded-2xl bg-slate-950/40 border border-white/15 flex flex-col md:flex-row md:items-center md:justify-between gap-5 transition-all text-xs text-slate-300 relative"
                          >
                            <div className="space-y-3 flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-mono tracking-widest text-emerald-400 font-extrabold uppercase">INQUIRY REF: {booking.id.toUpperCase().slice(-6)}</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${statusColor}`}>
                                  {statusLabel}
                                </span>
                              </div>
                              
                              <h5 className="font-sans font-extrabold text-white text-sm line-clamp-1">{booking.house.title}</h5>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-slate-400 bg-slate-950/30 p-3 rounded-xl border border-white/5">
                                <div>
                                  <span className="block text-[9px] text-slate-500 uppercase tracking-wider font-mono">Customer Name:</span>
                                  <b className="text-white text-xs">{booking.fullName || 'Anonymous Resident'}</b>
                                </div>
                                <div>
                                  <span className="block text-[9px] text-slate-500 uppercase tracking-wider font-mono">Move-In / Viewing:</span>
                                  <b className="font-mono text-white text-xs">{booking.startDate}</b>
                                </div>
                                <div>
                                  <span className="block text-[9px] text-slate-500 uppercase tracking-wider font-mono">Expected Residents:</span>
                                  <span className="font-bold text-slate-200">{guestCount} {guestCount > 1 ? 'Residents' : 'Resident'}</span>
                                </div>
                                <div className="sm:col-span-3 border-t border-white/5 pt-2 mt-1">
                                  <span className="block text-[9px] text-slate-500 uppercase tracking-wider font-mono mb-1">Requirements & Message:</span>
                                  <p className="text-slate-300 italic text-[11px] leading-relaxed bg-black/40 p-2 rounded-lg border border-white/5 whitespace-pre-wrap">{booking.preferredDetails || 'No preference notes submitted.'}</p>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-row md:flex-col gap-2.5 items-stretch shrink-0 justify-end">
                              {booking.status === 'upcoming' && (
                                <>
                                  <button
                                    onClick={() => {
                                      if (onUpdateBookings) {
                                        const updated = bookings.map((b) => b.id === booking.id ? { ...b, status: 'completed' as const } : b);
                                        onUpdateBookings(updated);
                                      }
                                    }}
                                    className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold font-sans px-3.5 py-2 rounded-xl transition-all text-xs cursor-pointer"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Accept Inquiry</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (onUpdateBookings) {
                                        const updated = bookings.map((b) => b.id === booking.id ? { ...b, status: 'cancelled' as const } : b);
                                        onUpdateBookings(updated);
                                      }
                                    }}
                                    className="flex items-center justify-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 px-3.5 py-2 rounded-xl transition-all text-xs cursor-pointer"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>Reject Request</span>
                                  </button>
                                </>
                              )}

                              <button
                                onClick={() => {
                                  // Locate or create a conversation for this booking/house
                                  let existing = conversations.find(c => c.house.id === booking.house.id);
                                  if (!existing) {
                                    // Generate a custom placeholder conversation
                                    existing = {
                                      id: `conv-broker-${Date.now()}`,
                                      house: booking.house,
                                      lastMessage: 'Let\'s connect to schedule your viewing appointment!',
                                      lastUpdated: 'Just now',
                                      messages: [
                                        {
                                          id: `m-init-${Date.now()}`,
                                          sender: 'host',
                                          text: `Hello ${booking.fullName || 'Resident Owner'}! I am representing ${booking.house.title} in ${booking.house.location}. Let's coordinate details.`,
                                          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                        }
                                      ]
                                    };
                                    if (onUpdateConversations) {
                                      onUpdateConversations([existing, ...conversations]);
                                    }
                                  }
                                  setBrokerTab('messages');
                                  setActiveBrokerChatId(existing.id);
                                }}
                                className="flex items-center justify-center gap-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/25 px-3.5 py-2 rounded-xl transition-all text-xs cursor-pointer"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Message Client</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Broker Tab: Client Messages */}
              {brokerTab === 'messages' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px] border border-white/10 rounded-3xl overflow-hidden bg-slate-950/40 backdrop-blur-md">
                  {/* Sidebar of Conversations */}
                  <div className="bg-black/20 border-r border-white/10 h-full flex flex-col min-w-0">
                    <div className="p-4 border-b border-white/10 bg-white/5">
                      <h4 className="font-display font-bold text-white text-xs">Customer Conversations</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Manage live chat queries with prospective buyers/renters.</p>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                      {conversations.filter(c => myPosts.some(h => h.id === c.house.id)).length === 0 ? (
                        <div className="p-6 text-center text-slate-500 text-xs font-mono">
                          No active client conversations registered.
                        </div>
                      ) : (
                        conversations.filter(c => myPosts.some(h => h.id === c.house.id)).map((conv) => {
                          const isActive = activeBrokerChatId === conv.id;
                          return (
                            <button
                              key={conv.id}
                              onClick={() => {
                                setActiveBrokerChatId(conv.id);
                              }}
                              className={`w-full p-4 text-left flex items-start gap-2.5 transition-all text-xs cursor-pointer ${
                                isActive ? 'bg-white/10 border-l-[3px] border-emerald-500' : 'hover:bg-white/5'
                              }`}
                            >
                              <img
                                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                                alt="Client Avatar"
                                className="w-8 h-8 rounded-full border border-white/10 object-cover shrink-0 mt-0.5"
                                referrerPolicy="no-referrer"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex justify-between items-baseline mb-0.5">
                                  <span className="font-bold text-white text-xs truncate">Guest Resident</span>
                                  <span className="text-[9px] text-slate-500 font-mono shrink-0">{conv.lastUpdated}</span>
                                </div>
                                <p className="text-[10px] text-emerald-400 font-semibold truncate mb-1">{conv.house.title}</p>
                                <p className="text-[11px] text-slate-300 truncate">{conv.lastMessage}</p>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Message Log Thread panel */}
                  <div className="lg:col-span-2 h-full flex flex-col justify-between bg-black/10">
                    {activeBrokerChatId && conversations.find(c => c.id === activeBrokerChatId) ? (
                      (() => {
                        const activeConv = conversations.find(c => c.id === activeBrokerChatId)!;
                        return (
                          <>
                            {/* Thread Header */}
                            <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
                              <div className="text-left">
                                <span className="text-[9px] font-bold text-emerald-400 font-mono uppercase tracking-widest block">SUPERHOST CHAT TERMINAL</span>
                                <h5 className="font-bold text-white text-xs">{activeConv.house.title}</h5>
                              </div>
                              <span className="font-mono text-[10px] text-slate-400 underline truncate">{activeConv.house.location}</span>
                            </div>

                            {/* Text Messages list */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                              {activeConv.messages.map((msg) => {
                                // Broker represents 'host' role in current stay interactions
                                const isBrokerSender = msg.sender === 'host';
                                return (
                                  <div
                                    key={msg.id}
                                    className={`flex flex-col max-w-[80%] ${isBrokerSender ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                                  >
                                    <div className={`p-3 rounded-2xl text-[11.5px] leading-relaxed text-left border ${
                                      isBrokerSender
                                        ? 'bg-emerald-600/20 text-slate-100 border-emerald-500/20 rounded-tr-none'
                                        : 'bg-white/5 text-slate-300 border-white/5 rounded-tl-none'
                                    }`}>
                                      <p>{msg.text}</p>
                                    </div>
                                    <span className="text-[9px] text-slate-500 font-mono mt-1 px-1.5">{msg.timestamp}</span>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Reply Input Form */}
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                if (!brokerReplyText.trim()) return;
                                
                                const brokerMsg = {
                                  id: `m-broker-${Date.now()}`,
                                  sender: 'host' as const,
                                  text: brokerReplyText.trim(),
                                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                };
                                const updatedMessages = [...activeConv.messages, brokerMsg];
                                const updatedConv = {
                                  ...activeConv,
                                  messages: updatedMessages,
                                  lastMessage: brokerReplyText.trim(),
                                  lastUpdated: 'Just now'
                                };
                                if (onUpdateConversations) {
                                  onUpdateConversations(conversations.map(c => c.id === activeBrokerChatId ? updatedConv : c));
                                }
                                setBrokerReplyText('');
                              }}
                              className="p-3 border-t border-white/10 flex items-center gap-2 bg-white/5"
                            >
                              <input
                                type="text"
                                value={brokerReplyText}
                                onChange={(e) => setBrokerReplyText(e.target.value)}
                                placeholder="Type answer, coordinate check-in times or details..."
                                className="flex-1 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-700 outline-none"
                              />
                              <button
                                type="submit"
                                className="bg-emerald-600 hover:bg-emerald-500 text-white p-2.5 rounded-xl transition-all cursor-pointer shadow-lg active:scale-95 shrink-0"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            </form>
                          </>
                        );
                      })()
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8">
                        <MessageSquare className="w-10 h-10 text-slate-700 mb-2.5 animate-bounce" style={{ animationDuration: '3s' }} />
                        <h5 className="font-bold text-xs text-slate-400 uppercase tracking-widest font-mono">Select a conversation</h5>
                        <p className="text-[11px] text-slate-500 mt-1 max-w-xs text-center">Click on any client conversation in the sidebar tab to open messages and text clients directly.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Broker Tab: Ledger & Revenue reports */}
              {brokerTab === 'payments' && (
                <div className="space-y-6">
                  {/* Financial KPI Summary block */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-5 rounded-3xl bg-slate-950/40 border border-white/5 text-left">
                      <span className="text-[10px] font-bold uppercase text-slate-400 font-mono tracking-widest block">Licence Subscriptions</span>
                      <p className="text-white font-extrabold text-2xl mt-1.5 font-mono">TZS 10,000</p>
                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-1">
                        <Check className="w-3 h-3 text-emerald-450" />
                        <span>Successfully Certified</span>
                      </span>
                    </div>

                    <div className="p-5 rounded-3xl bg-slate-950/40 border border-white/5 text-left">
                      <span className="text-[10px] font-bold uppercase text-slate-400 font-mono tracking-widest block">Commission Tier</span>
                      <p className="text-emerald-400 font-extrabold text-2xl mt-1.5 font-mono">10% Commission</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">Prioritized escrow payout directly to wallet</span>
                    </div>

                    <div className="p-5 rounded-3xl bg-slate-950/40 border border-white/5 text-left">
                      <span className="text-[10px] font-bold uppercase text-slate-400 font-mono tracking-widest block">Portfolio Valuation</span>
                      <p className="text-white font-extrabold text-2xl mt-1.5 font-mono">
                        TZS {(myPosts.reduce((sum, h) => sum + (h.amount || 0), 0) * 12).toLocaleString()}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block">Projected annual client transaction power</span>
                    </div>
                  </div>

                  {/* Transaction list ledger */}
                  <div className="bg-slate-950/40 border border-white/5 rounded-3xl p-6 text-left">
                    <div className="border-b border-white/5 pb-3 mb-4">
                      <h4 className="font-display font-bold text-white text-sm">Payment History & Statements</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Transactions processed through the Makazi broker escrow engine.</p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs font-sans text-slate-300">
                        <thead>
                          <tr className="border-b border-white/5 text-slate-400 text-[10px] font-mono uppercase tracking-wider text-left">
                            <th className="pb-3 pt-1 font-bold">Transaction Reference</th>
                            <th className="pb-3 pt-1 font-bold">Item & Description</th>
                            <th className="pb-3 pt-1 font-bold">Amount</th>
                            <th className="pb-3 pt-1 font-bold">Method</th>
                            <th className="pb-3 pt-1 font-bold">Processed Date</th>
                            <th className="pb-3 pt-1 font-bold text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-sans leading-relaxed">
                          {/* License Setup Fee row */}
                          <tr className="hover:bg-white/2">
                            <td className="py-3 font-mono text-indigo-300 font-bold">TXN-MKB-{user.id.toUpperCase().slice(-6)}</td>
                            <td className="py-3">
                              <span className="font-bold text-slate-205 text-xs block">Broker License Activation</span>
                              <span className="text-[10px] text-slate-400">Certified Broker Membership Registration Fee</span>
                            </td>
                            <td className="py-3 font-mono text-white text-xs font-bold">TZS 10,000</td>
                            <td className="py-3 font-mono">{brokerApplication?.paymentMethod || 'Vodacom M-Pesa'}</td>
                            <td className="py-3 text-slate-400">{brokerApplication ? new Date(brokerApplication.submittedAt).toLocaleDateString() : 'Today'}</td>
                            <td className="py-3 text-right">
                              <span className="inline-flex items-center gap-1 text-[9px] px-2.5 py-0.5 border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 font-bold uppercase rounded-full">
                                <Check className="w-3 h-3 text-emerald-450" />
                                <span>Approved</span>
                              </span>
                            </td>
                          </tr>

                          {/* Matching Completed client bookings can be listed here dynamically */}
                          {bookings.filter(b => b.status === 'completed' && myPosts.some(h => h.id === b.house.id)).map((booking) => {
                            const comm = (booking.totalPrice || 0) * 0.1;
                            return (
                              <tr key={booking.id} className="hover:bg-white/2">
                                <td className="py-3 font-mono text-indigo-300 font-bold">TXN-MATCH-{booking.id.toUpperCase().slice(-6)}</td>
                                <td className="py-3">
                                  <span className="font-bold text-slate-205 text-xs block">Escrow Matches Reward</span>
                                  <span className="text-[10px] text-slate-400">10% Broker match commission on {booking.house.title}</span>
                                </td>
                                <td className="py-3 font-mono text-emerald-400 text-xs font-extrabold">+TZS {comm.toLocaleString()}</td>
                                <td className="py-3 font-mono">Commission Vault</td>
                                <td className="py-3 text-slate-400">{booking.startDate}</td>
                                <td className="py-3 text-right">
                                  <span className="inline-flex items-center gap-1 text-[9px] px-2.5 py-0.5 border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 font-bold uppercase rounded-full">
                                    <Check className="w-3 h-3 text-indigo-455" />
                                    <span>Settled</span>
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : brokerApplication ? (
            brokerApplication.status === 'pending' ? (
              <div className="p-8 rounded-[32px] bg-slate-950/60 border border-amber-500/20 text-center max-w-2xl mx-auto space-y-6 backdrop-blur-md">
                <RefreshCw className="w-12 h-12 text-amber-500 mx-auto animate-spin" />
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-white">Broker Application Pending</h2>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
                    Your registration is currently being verified by the CEO. We will verify your credentials and TZS 10,000 application fee.
                  </p>
                </div>

                <div className="p-5 bg-black/45 border border-white/5 rounded-2xl text-left text-xs font-mono space-y-2">
                  <div className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Submitted Document & Info:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
                    <div>Name: <span className="text-white font-sans font-semibold">{brokerApplication.fullName}</span></div>
                    <div>Phone: <span className="text-white font-sans font-semibold">{brokerApplication.phoneNumber}</span></div>
                    <div>National ID: <span className="text-white font-sans font-semibold">{brokerApplication.nationalId}</span></div>
                    <div>Email: <span className="text-white font-sans font-semibold">{brokerApplication.email}</span></div>
                    {brokerApplication.location && (
                      <div className="sm:col-span-2">Location: <span className="text-white font-sans font-semibold">{brokerApplication.location}</span></div>
                    )}
                    <div className="sm:col-span-2 border-t border-white/5 pt-2 mt-1">
                      <span className="text-slate-400 font-sans block text-[11px] mb-1">Experience & Services:</span>
                      <p className="text-white font-sans font-normal leading-relaxed text-xs bg-slate-900/40 p-2.5 rounded-xl border border-white/5">{brokerApplication.experience}</p>
                    </div>
                  </div>
                  <div className="border-t border-white/5 pt-2 mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Payment Transaction ID:</span>
                      <span className="text-[#f59e0b] font-bold">{brokerApplication.paymentNumber} ({brokerApplication.paymentMethod})</span>
                    </div>
                    <div className="text-[11px] text-amber-500 font-sans font-black uppercase bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                      Fee: TZS 10,000 (Paid)
                    </div>
                  </div>
                </div>
                
                <div className="text-[11px] text-slate-500 font-sans">
                  Submitted at: {new Date(brokerApplication.submittedAt).toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-[32px] bg-slate-950/60 border border-rose-500/20 text-center max-w-2xl mx-auto space-y-6 backdrop-blur-md">
                <AlertCircle className="w-12 h-12 text-rose-500 mx-auto animate-pulse" />
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-white">Application Disapproved</h2>
                  <p className="text-sm text-slate-400 max-w-md mx-auto">
                    CEO reviewed and rejected your broker application. Ensure your National ID, phone number, and TZS 10,000 transaction details are accurate.
                  </p>
                  {brokerApplication.notes && (
                    <div className="p-3.5 bg-rose-500/5 border border-rose-500/15 rounded-xl text-left max-w-md mx-auto">
                      <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block font-mono">Feedback Notes:</span>
                      <p className="text-xs text-slate-300 font-sans leading-relaxed mt-1 font-normal">{brokerApplication.notes}</p>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => {
                    try {
                      const saved = localStorage.getItem('makazi_broker_applications');
                      if (saved) {
                        let apps = JSON.parse(saved);
                        apps = apps.filter((a: any) => a.userId !== user.id);
                        localStorage.setItem('makazi_broker_applications', JSON.stringify(apps));
                        setLocalSubTab('broker');
                      }
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs active:scale-95 transition-all cursor-pointer font-sans uppercase tracking-widest"
                >
                  Submit New Application
                </button>
              </div>
            )
          ) : (
            <form onSubmit={handleSubmitBrokerApplication} className="space-y-8 animate-fade-in text-left text-sans max-w-4xl mx-auto flex flex-col">
              {/* Form Header */}
              <div className="p-6 rounded-[24px] bg-gradient-to-r from-emerald-950/20 via-slate-900 to-slate-900 border border-emerald-500/20 flex flex-col md:flex-row gap-5 justify-between items-start md:items-center">
                <div className="space-y-1 font-sans">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Award className="w-6 h-6 text-emerald-405" />
                    <span>Broker Licensing Portal</span>
                  </h2>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed font-sans">
                    Submit your official credentials alongside the non-refundable registration fee of <strong>TZS 10,000</strong> to obtain Verified Broker licensing.
                  </p>
                </div>
                <div className="bg-emerald-500/10 px-4 py-2 rounded-2xl border border-emerald-500/20 font-mono text-center">
                  <span className="text-[10px] text-emerald-450 text-emerald-400 block tracking-wider uppercase font-mono">NON-REFUNDABLE FEE</span>
                  <span className="text-sm font-black text-white">TZS 10,000</span>
                </div>
              </div>

              <div id="broker-application-sections" className="grid grid-cols-1 lg:grid-cols-2 gap-8 font-sans text-left">
                {/* COLUMN A: CREDENTIALS FORM */}
                <div className="p-6 rounded-[28px] bg-slate-900/60 border border-white/10 space-y-4">
                  <h3 className="text-xs font-black uppercase font-mono tracking-widest text-[#f59e0b] flex items-center gap-2 pb-2 border-b border-white/5">
                    <FileText className="w-4 h-4 text-[#f59e0b]" />
                    <span>1. Personal & Professional Details</span>
                  </h3>

                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest">Full Name <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={brokerFullName}
                      onChange={(e) => setBrokerFullName(e.target.value)}
                      placeholder="e.g., Ally Salim"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-xs text-white placeholder-slate-650"
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest">Phone Number <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={brokerPhone}
                      onChange={(e) => setBrokerPhone(e.target.value)}
                      placeholder="e.g., +255 712 345 678"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-xs text-white placeholder-slate-650 font-mono"
                    />
                  </div>

                  {/* National ID Document */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest">National ID (NIDA) or ID Document <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={brokerNationalId}
                      onChange={(e) => setBrokerNationalId(e.target.value)}
                      placeholder="e.g., 19940822-xxxxx-xxxxx-xx"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-xs text-white placeholder-slate-650 font-mono"
                    />
                  </div>

                  {/* Email address */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest">Email Address <span className="text-rose-500">*</span></label>
                    <input
                      type="email"
                      required
                      value={brokerEmail}
                      onChange={(e) => setBrokerEmail(e.target.value)}
                      placeholder="e.g., ally@makazi-broker.com"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-xs text-white placeholder-slate-650"
                    />
                  </div>

                  {/* Operating Location */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest">Active/Operating Location <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={brokerLocation}
                      onChange={(e) => setBrokerLocation(e.target.value)}
                      placeholder="e.g., Dar es Salaam, Tanzania"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-xs text-white placeholder-slate-650"
                    />
                  </div>

                  {/* Experience */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest">Experience & Services <span className="text-rose-500">*</span></label>
                    <textarea
                      required
                      rows={4}
                      value={brokerExperience}
                      onChange={(e) => setBrokerExperience(e.target.value)}
                      placeholder="Describe your property agency experience, active regions, and specialized broker services..."
                      className="w-full bg-slate-950 border border-slate-800 border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-xs text-white placeholder-slate-650 font-sans leading-relaxed text-left font-normal"
                    />
                  </div>
                </div>

                {/* COLUMN B: PAYMENT & SCREENSHOT */}
                <div className="p-6 rounded-[28px] bg-slate-900/60 border border-white/10 space-y-5">
                  <h3 className="text-xs font-black uppercase font-mono tracking-widest text-[#f59e0b] flex items-center gap-2 pb-2 border-b border-white/5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>2. License Fee Submission (TZS 10,000)</span>
                  </h3>

                  <div className="space-y-3 font-sans">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Send exactly TZS 10,000 to any verified Makazi merchant channel below and fill in the payment reference.
                    </p>

                    <div className="grid grid-cols-1 gap-2.5">
                      {enabledAccounts.map((acc) => (
                        <div 
                          key={acc.id} 
                          type="button"
                          onClick={() => {
                            setBrokerPaymentMethod(acc.method);
                            const cleanVal = acc.numberValue.replace(/[^a-zA-Z0-9]/g, '');
                            navigator.clipboard.writeText(acc.numberValue);
                          }}
                          className={`p-3 rounded-xl border transition-all cursor-pointer text-left relative overflow-hidden flex flex-col gap-1 ${
                            brokerPaymentMethod === acc.method 
                              ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/20' 
                              : 'border-white/5 bg-black/30 hover:border-white/15'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-white uppercase">{acc.method}</span>
                            {brokerPaymentMethod === acc.method && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 font-sans" />}
                          </div>
                          <div className="text-xs font-mono font-bold text-emerald-400 mt-0.5 font-mono">
                            {acc.numberType}: {acc.numberValue}
                          </div>
                          <div className="text-[9px] text-slate-400 font-sans mt-0.5">{acc.instructions}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Input: Transaction ID */}
                  <div className="space-y-1 font-sans">
                    <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <span>Payment Transaction Reference / SMS Code</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={brokerPaymentNumber}
                      onChange={(e) => setBrokerPaymentNumber(e.target.value)}
                      placeholder="e.g., MP123456789 or Reference Account"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-xs text-white placeholder-slate-650 font-mono"
                    />
                  </div>

                  {/* Input: Screenshot Upload */}
                  <div className="space-y-1.5 font-sans">
                    <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest">
                      Receipt Upload Verification Receipt
                    </label>
                    <div
                      onClick={() => brokerScreenshotInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); }}
                      onDrop={async (e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                          const file = e.dataTransfer.files[0];
                          if (file.type.startsWith('image/')) {
                            setIsUploadingBrokerScreenshot(true);
                            const reader = new FileReader();
                            reader.onload = async (event) => {
                              if (event.target?.result) {
                                setBrokerScreenshot(event.target.result as string);
                              }
                            };
                            reader.readAsDataURL(file);
                            setIsUploadingBrokerScreenshot(false);
                          } else {
                            alert('Please upload an image receipt.');
                          }
                        }
                      }}
                      className="border border-dashed border-white/10 hover:border-emerald-500/40 rounded-2xl p-4 text-center cursor-pointer bg-slate-950/40 relative min-h-[90px] flex flex-col justify-center items-center gap-1.5 hover:bg-slate-950/70 transition-all select-none"
                    >
                      <input 
                        type="file"
                        ref={brokerScreenshotInputRef}
                        onChange={handleBrokerScreenshotUpload}
                        accept="image/*"
                        className="hidden"
                      />

                      {isUploadingBrokerScreenshot ? (
                        <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
                      ) : brokerScreenshot ? (
                        <div className="absolute inset-0.5 rounded-[14px] overflow-hidden bg-black flex items-center justify-center">
                          <img 
                            src={brokerScreenshot} 
                            alt="Receipt Screenshot" 
                            className="w-full h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/50 hover:opacity-100 opacity-0 transition-opacity flex items-center justify-center text-[10px] text-white font-extrabold uppercase font-mono">
                            Click to change screenshot
                          </div>
                        </div>
                      ) : (
                        <>
                          <Camera className="w-5 h-5 text-slate-500 animate-pulse" />
                          <div className="space-y-0.5">
                            <p className="text-[11px] text-white font-bold">Drag & Drop or Tap to Upload</p>
                            <p className="text-[9px] text-slate-500 font-sans">Payment verification receipt screenshot</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Submit application action */}
                  <button
                    type="submit"
                    disabled={isUploadingBrokerScreenshot || !brokerPaymentNumber.trim()}
                    className={`w-full py-3 px-6 rounded-xl font-black uppercase text-xs tracking-widest text-center shadow-lg transition-all active:scale-[0.98] ${
                      brokerPaymentNumber.trim()
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-teal-600 hover:to-emerald-500 text-white cursor-pointer'
                        : 'bg-white/5 text-slate-500 pointer-events-none border border-white/5'
                    }`}
                  >
                    Submit Broker License Form
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Columns - Active Reservations */}
          <div className="lg:col-span-2 space-y-4 font-normal">
          <h3 className="font-display font-medium text-lg text-white flex items-center gap-2">
            <span>Your Reserved Stays</span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] text-slate-200 font-mono font-bold">
              {bookings.length}
            </span>
          </h3>

          <div className="space-y-4">
            {bookings.length > 0 ? (
              bookings.map((booking) => (
                <div
                  id={`booking-receipt-${booking.id}`}
                  key={booking.id}
                  className="bg-white/5 border border-white/10 rounded-[24px] overflow-hidden shadow-xl hover:border-white/20 transition-all flex flex-col backdrop-blur-md"
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* Property highlight preview image */}
                    <img
                      src={booking.house.images[0]}
                      alt={booking.house.title}
                      className="w-full sm:w-44 h-32 sm:h-auto object-cover"
                      referrerPolicy="no-referrer"
                    />

                    {/* Booking parameters metadata */}
                    <div className="p-5 flex-1 flex flex-col justify-between text-left">
                      <div>
                        {/* Booking status badges */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-2.5 justify-between">
                          <div className="flex flex-wrap gap-1.5">
                            <span className="inline-flex items-center gap-1 text-[9px] px-2.5 py-1 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 uppercase tracking-wider">
                              <CheckCircle className="w-3 h-3 text-emerald-450" />
                              <span>Request Submitted</span>
                            </span>

                            {booking.paymentStatus === 'Approved' ? (
                              <span className="inline-flex items-center gap-1 text-[9px] px-2.5 py-1 rounded-full font-bold bg-green-500/20 text-green-300 border border-green-500/30 uppercase tracking-wider">
                                <ShieldCheck className="w-3.5 h-3.5 text-green-450" />
                                <span>Paid & Approved</span>
                              </span>
                            ) : booking.paymentStatus === 'Pending' ? (
                              <span className="inline-flex items-center gap-1 text-[9px] px-2.5 py-1 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider animate-pulse">
                                <RefreshCw className="w-3 h-3 text-amber-455 animate-spin" style={{ animationDuration: '4s' }} />
                                <span>Payment Pending Approval</span>
                              </span>
                            ) : booking.paymentStatus === 'Rejected' ? (
                              <span className="inline-flex items-center gap-1 text-[9px] px-2.5 py-1 rounded-full font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase tracking-wider">
                                <AlertCircle className="w-3.5 h-3.5 text-rose-450" />
                                <span>Payment Rejected</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] px-2.5 py-1 rounded-full font-bold bg-slate-500/20 text-slate-300 border border-slate-500/20 uppercase tracking-wider">
                                <span>Unpaid</span>
                              </span>
                            )}
                          </div>
                          
                          <span className="text-sm font-bold text-indigo-300 font-mono">
                            {booking.totalPrice && booking.totalPrice > 0 ? `Total: $${booking.totalPrice}` : 'Free Inquiry'}
                          </span>
                        </div>

                        <h4 className="font-semibold text-white text-sm">{booking.house.title}</h4>
                        <p className="text-xs text-slate-355 mt-0.5">{booking.house.location}</p>

                        <div className="flex flex-wrap gap-4 mt-3.5 text-xs text-slate-300 font-medium">
                          <div className="flex items-center gap-1.5 font-mono">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {booking.endDate === 'Flexible' ? (
                              <span>Move-in: {booking.startDate} (Flexible)</span>
                            ) : (
                              <span>{booking.startDate} to {booking.endDate}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Compass className="w-3.5 h-3.5 text-slate-400" />
                            <span>{booking.guests} Guest(s)</span>
                          </div>
                        </div>

                        {/* Submitted payment credentials banner */}
                        {booking.paymentStatus && (
                          <div className="mt-4 p-3 rounded-xl bg-black/30 border border-white/5 text-[11px] text-slate-300 text-left space-y-1">
                            <span className="font-extrabold text-[10px] uppercase text-indigo-400 tracking-wider">Submitted Cash Receipt Info:</span>
                            <div className="grid grid-cols-2 gap-2 mt-1 font-mono">
                              <div>Channel: <span className="text-white font-sans font-bold">{booking.paymentMethod}</span></div>
                              <div>Ref account: <span className="text-amber-400 font-sans font-bold">{booking.paymentNumber}</span></div>
                            </div>
                            {booking.paymentReceiptUrl && (
                              <div className="mt-1 flex items-center gap-1.5 border-t border-white/5 pt-1">
                                <span className="text-[10px] text-slate-400 font-normal">Extract preview:</span>
                                <a
                                  href={booking.paymentReceiptUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-amber-100 hover:underline font-extrabold text-[10px]"
                                >
                                  Open Receipt Invoice Image ↗
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Booking detailed controls */}
                      <div className="flex flex-wrap gap-3 justify-between items-center mt-5 pt-3.5 border-t border-white/10">
                        <div className="flex flex-wrap gap-2">
                          <button
                            id={`profile-stay-inbox-btn-${booking.id}`}
                            onClick={() => onSwitchToInbox(booking.house)}
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 bg-white/5 text-white cursor-pointer active:scale-95 transition-all"
                          >
                            <MessageSquare className="w-3.5 h-3.5 animate-pulse" />
                            <span>Message Host</span>
                          </button>
                          
                          {booking.paymentStatus !== 'Approved' && (
                            <button
                              id={`profile-payment-trigger-btn-${booking.id}`}
                              onClick={() => {
                                if (activePaymentBookingId === booking.id) {
                                  setActivePaymentBookingId(null);
                                } else {
                                  setActivePaymentBookingId(booking.id);
                                  setSelectedPaymentMethod('Vodacom M-Pesa');
                                  setPaymentPhoneOrAccount('');
                                  setReceiptImageBase64(null);
                                }
                              }}
                              className={`flex items-center gap-1 text-xs font-black px-3 py-1.5 rounded-lg text-white cursor-pointer active:scale-95 transition-all select-none border ${
                                activePaymentBookingId === booking.id
                                  ? 'bg-slate-700 border-slate-600 hover:bg-slate-650'
                                  : booking.paymentStatus === 'Rejected'
                                  ? 'bg-amber-600 border-amber-500 hover:bg-amber-505 animate-pulse'
                                  : 'bg-indigo-650 border-indigo-600 hover:bg-indigo-600'
                              }`}
                            >
                              <span>💰 {booking.paymentStatus === 'Rejected' ? 'Resubmit Payment Receipt' : 'Pay via M-Pesa / Card'}</span>
                            </button>
                          )}

                          <button
                            id={`profile-stay-details-btn-${booking.id}`}
                            onClick={() => onViewHouse(booking.house)}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg text-slate-300 hover:text-white cursor-pointer"
                          >
                            View Details
                          </button>
                        </div>
                        <button
                          id={`cancel-booking-btn-${booking.id}`}
                          onClick={() => onCancelBooking(booking.id)}
                          className="text-xs text-slate-404 hover:text-rose-400 p-2 rounded-lg hover:bg-rose-500/10 transition-all flex items-center gap-1 font-semibold cursor-pointer"
                          title="Cancel Stay"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Cancel Stay</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Stay Payment Checkout Drawer form */}
                  {activePaymentBookingId === booking.id && (
                    <div className="m-5 mt-0 p-5 border-t border-white/10 space-y-4 text-xs font-sans bg-slate-950/40 rounded-2xl border border-white/5">
                      <div className="space-y-3">
                        <div className="text-left">
                          <h5 className="font-extrabold text-xs text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                            <span>HQ Money Transfer Options</span>
                          </h5>
                          <p className="text-[11px] text-slate-400 leading-snug mt-1">
                            Choose your preferred Tanzania cash or international card payment gateway to resolve your reservation checkout dues:
                          </p>
                        </div>

                        {/* SELECTABLE PAYMENT CHANNELS */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-2">
                          {(enabledAccounts.length > 0 ? enabledAccounts : [
                            { id: 'pay-1', method: 'Vodacom M-Pesa' },
                            { id: 'pay-2', method: 'Tigo Pesa' },
                            { id: 'pay-3', method: 'Airtel Money' },
                            { id: 'pay-4', method: 'HaloPesa' },
                            { id: 'pay-5', method: 'Visa Card' }
                          ]).map((acc) => {
                            const method = acc.method;
                            const isSelected = selectedPaymentMethod === method;
                            return (
                              <button
                                key={acc.id}
                                type="button"
                                onClick={() => {
                                  setSelectedPaymentMethod(method);
                                  setPaymentPhoneOrAccount('');
                                }}
                                className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border text-[11px] font-black text-center transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.05)]'
                                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                                }`}
                                id={`select-pay-method-${method.replace(/\s+/g, '-')}`}
                              >
                                <span className="truncate">{method}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* CHOSEN CHANNEL DETAILS */}
                        {(() => {
                          const details = getPaymentMethodDetails(selectedPaymentMethod);
                          return (
                            <div className={`p-4 rounded-xl border flex flex-col gap-2 mt-3 text-left ${details.colorClass}`}>
                              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <span className="font-extrabold uppercase tracking-widest text-[9px] opacity-75">{details.numberType} COORDINATES</span>
                                <span className="font-black text-xs px-2.5 py-1 rounded bg-white/10 tracking-widest select-all">{details.numberValue}</span>
                              </div>
                              <div className="leading-relaxed">
                                <p className="text-[11px] text-slate-200 font-sans">Recipient Account: <b className="text-white font-extrabold">{details.merchantName}</b></p>
                                <p className="text-[10px] text-slate-300 font-mono mt-1.5 bg-black/40 p-2 rounded-lg border border-white/5 leading-normal">{details.instructions}</p>
                              </div>
                            </div>
                          );
                        })()}

                        {/* PAYMENT SENDER DETAILS INPUT */}
                        <div className="space-y-1.5 text-left mt-4">
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                            {['Visa Card', 'MasterCard', 'Bank Account', 'Visa', 'Mastercard'].includes(selectedPaymentMethod) ? 'Your Bank Account Name / Card Holder Reference:' : 'Your Mobile Money Phone Number or Sender Account Reference (used to send funds):'}
                          </label>
                          <input
                            type="text"
                            required
                            value={paymentPhoneOrAccount}
                            onChange={(e) => setPaymentPhoneOrAccount(e.target.value)}
                            placeholder={['Visa Card', 'MasterCard', 'Bank Account', 'Visa', 'Mastercard'].includes(selectedPaymentMethod) ? 'e.g., DEOGRATIAS L. SHAYO' : 'e.g., 0754 990 120'}
                            className="w-full bg-slate-950 border border-white/10 focus:border-amber-500 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none"
                            id="payment-sender-number-field"
                          />
                        </div>

                        {/* RECEIPT FILE PICKER */}
                        <div className="space-y-2 mt-4">
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-left">
                            Attach Transaction Receipt / SMS Screenshot
                          </label>

                          <div
                            onDragEnter={handleStayReceiptDrag}
                            onDragOver={handleStayReceiptDrag}
                            onDragLeave={handleStayReceiptDrag}
                            onDrop={handleStayReceiptDrop}
                            onClick={() => {
                              const fileEl = document.getElementById(`receipt-file-input-${booking.id}`);
                              if (fileEl) fileEl.click();
                            }}
                            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                              dragActive
                                ? 'border-amber-500 bg-amber-500/10'
                                : receiptImageBase64
                                ? 'border-emerald-500/50 bg-emerald-500/5'
                                : 'border-white/10 bg-slate-950/40 hover:bg-slate-950/80 hover:border-white/25'
                            }`}
                            id={`drag-drop-payment-box-${booking.id}`}
                          >
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleStayReceiptUpload(e.target.files[0]);
                                }
                              }}
                              className="hidden"
                              id={`receipt-file-input-${booking.id}`}
                            />

                            {isUploadingReceipt ? (
                              <p className="text-xs text-slate-400 select-none flex items-center justify-center gap-2">
                                <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                                <span>Encoding receipt file securely...</span>
                              </p>
                            ) : receiptImageBase64 ? (
                              <div className="space-y-2.5">
                                <p className="text-xs text-emerald-400 font-black flex items-center justify-center gap-1">✓ Receipt attached successfully.</p>
                                <img
                                  src={receiptImageBase64}
                                  alt="Payment Receipt Mock"
                                  className="max-h-28 mx-auto object-contain rounded-xl border border-white/10 shadow-lg"
                                  referrerPolicy="no-referrer"
                                />
                                <p className="text-[10px] text-slate-500">Drag/drop or click here again to replace file</p>
                              </div>
                            ) : (
                              <div className="space-y-1 py-1.5">
                                <p className="font-bold text-slate-200">Drag & Drop transaction confirmation or browse files</p>
                                <p className="text-[10px] text-slate-500">Supports PDF screenshot, PNG or JPG mobile payment receipt</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* FORM CONTROL TRIGGERS */}
                        <div className="flex gap-2 justify-end pt-3.5 border-t border-white/5 mt-4">
                          <button
                            type="button"
                            onClick={() => {
                              setActivePaymentBookingId(null);
                              setReceiptImageBase64(null);
                              setPaymentPhoneOrAccount('');
                            }}
                            className="px-4 py-2 border border-white/10 rounded-xl bg-transparent hover:bg-white/5 text-slate-400 hover:text-white transition-all text-xs font-semibold cursor-pointer"
                          >
                            Cancel
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleBookingPaymentSubmit(booking.id)}
                            disabled={!paymentPhoneOrAccount.trim() || !receiptImageBase64 || isUploadingReceipt}
                            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 disabled:bg-slate-900 disabled:text-slate-600 font-extrabold text-slate-950 text-xs rounded-xl transition-all cursor-pointer shadow-md select-none"
                          >
                            Submit Payment Record
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div id="empty-stays-profile-pane" className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl p-6">
                <p className="text-xs text-slate-300 font-semibold">No active bookings detected for your profile.</p>
                <p className="text-[10px] text-slate-404 mt-1">Your next sanctuary is waiting. Discover our current listings on the Home page.</p>
              </div>
            )}
          </div>

          {/* My Posts Section */}
          <div className="pt-6 border-t border-white/10 space-y-4 mt-8 text-sans" id="profile-my-posts-section">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h3 className="font-display font-medium text-lg text-white flex items-center gap-2">
                <span>My Posts</span>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-[11px] text-indigo-300 font-mono font-bold">
                  {myPosts.length}
                </span>
                {isCEOOrAdmin ? (
                  <span className="px-2 py-0.5 text-[8px] bg-amber-500/10 text-amber-400 font-mono rounded border border-amber-500/20 uppercase font-black tracking-wider">
                    CEO Admin View
                  </span>
                ) : null}
              </h3>
              
              <button
                onClick={onOpenPostingModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs rounded-xl active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Create Post</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myPosts.length > 0 ? (
                myPosts.map((house) => {
                  const displayDate = house.createdAt 
                    ? new Date(house.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'Jun 1, 2026';

                  return (
                    <div
                      key={house.id}
                      id={`my-post-card-${house.id}`}
                      className="bg-white/5 border border-white/10 rounded-[24px] overflow-hidden shadow-xl hover:border-white/20 transition-all flex flex-col justify-between backdrop-blur-md"
                    >
                      <div>
                        {/* Post Header Image / Badges */}
                        <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                          <img
                            src={house.images && house.images.length > 0 ? house.images[0] : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'}
                            alt={house.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          
                          {/* Property Status Badge */}
                          <div className="absolute top-3 left-3 flex gap-1.5">
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border text-white ${
                              house.propertyStatus === 'For Sale'
                                ? 'bg-emerald-600 border-emerald-500'
                                : 'bg-indigo-600 border-indigo-500'
                            }`}>
                              {house.propertyStatus || 'For Rent'}
                            </span>
                          </div>
                          
                          {/* Price Tag Overlay */}
                          <div className="absolute bottom-3 right-3 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-sm">
                            <span className="font-mono text-xs text-indigo-300 font-bold">
                              TSh {house.amount?.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Post details */}
                        <div className="p-5 space-y-2.5 text-left">
                          <div>
                            <span className="text-[9px] text-indigo-405 text-indigo-400 font-bold font-mono uppercase tracking-wider block">
                              Created on: {displayDate}
                            </span>
                            <h4 className="text-white font-bold font-sans text-sm mt-0.5 line-clamp-1">{house.title}</h4>
                            <p className="text-slate-400 font-sans text-xs flex items-center gap-1 mt-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span>{house.location}</span>
                            </p>
                            {house.size ? (
                              <p className="text-[10px] text-[#f59e0b] font-mono mt-1 font-semibold">
                                Size: {house.size}
                              </p>
                            ) : null}
                          </div>
                          <p className="text-slate-300 text-slate-300 font-sans text-xs leading-relaxed line-clamp-2">
                            {house.description}
                          </p>
                        </div>
                      </div>

                      {/* Management actions */}
                      <div className="p-4 border-t border-white/5 bg-black/10 flex flex-wrap gap-2 items-center justify-between">
                        <button
                          onClick={() => onViewHouse(house)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer hover:bg-white/5 rounded-lg transition-all"
                        >
                          View Details
                        </button>
                        
                        <div className="flex gap-1">
                          {/* Share button */}
                          <button
                            onClick={() => handleSharePost(house)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all relative cursor-pointer"
                            title="Share Post Link"
                          >
                            <Share2 className="w-4 h-4" />
                            {copiedHouseId === house.id && (
                              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-indigo-650 text-white font-sans text-[8px] font-bold rounded px-1.5 py-0.5 tracking-wider uppercase border border-indigo-500 whitespace-nowrap">
                                Copied!
                              </span>
                            )}
                          </button>

                          {deleteConfirmHouseId === house.id ? (
                            <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-xl">
                              <span className="text-[10px] text-rose-400 font-bold font-mono">Delete?</span>
                              <button
                                onClick={async () => {
                                  setDeleteConfirmHouseId(null);
                                  if (onDeleteHouse) {
                                    await onDeleteHouse(house.id);
                                  }
                                }}
                                className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-rose-600 hover:bg-rose-700 text-white rounded cursor-pointer transition-all"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setDeleteConfirmHouseId(null)}
                                className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-white/10 hover:bg-white/20 text-slate-300 rounded cursor-pointer transition-all"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-1">
                              {/* Edit action */}
                              <button
                                onClick={() => setEditingHouse(house)}
                                className="p-1.5 rounded-lg text-[#f59e0b] hover:bg-[#f59e0b]/5 transition-all cursor-pointer"
                                title="Edit Listing details"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              {/* Delete action */}
                              <button
                                onClick={() => setDeleteConfirmHouseId(house.id)}
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/5 transition-all cursor-pointer"
                                title="Remove Listing"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div id="no-my-posts-fallback" className="col-span-1 md:col-span-2 text-center py-12 bg-white/5 border border-white/10 rounded-3xl p-6">
                  <p className="text-sm font-semibold text-slate-300">No posts found. Create your first post.</p>
                  <p className="text-[11px] text-indigo-400 mt-2 hover:underline cursor-pointer font-bold" onClick={onOpenPostingModal}>
                    ✨ Begin listing property sales or rentals now
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Columns - Favorite Stays */}
        <div className="space-y-4 text-left">
          <h3 className="font-display font-medium text-lg text-white flex items-center gap-2">
            <span>Your Favorites</span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] text-slate-200 font-mono font-bold">
              {favoriteHouses.length}
            </span>
          </h3>

          <div className="space-y-3">
            {favoriteHouses.length > 0 ? (
              favoriteHouses.map((house) => (
                <div
                  id={`favorite-item-${house.id}`}
                  key={house.id}
                  className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex gap-3 hover:border-white/20 transition-all cursor-pointer relative"
                  onClick={() => onViewHouse(house)}
                >
                  <img
                    src={house.images[0]}
                    alt={house.title}
                    className="w-16 h-16 rounded-lg object-cover scroll-none"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0 pr-6">
                    <h4 className="font-semibold text-white text-xs truncate">{house.title}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">{house.location}</p>
                    <div className="flex items-center justify-between mt-1.5 font-semibold">
                      <span className="font-mono text-xs text-indigo-300 font-bold">TSh {house.amount.toLocaleString()}</span>
                      <div className="flex items-center gap-0.5 text-amber-400 text-[11px] font-bold">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{house.rating}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick toggle heart button strictly to delete from favorites list inside profile */}
                  <button
                    id={`profile-remove-fav-${house.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(house.id);
                    }}
                    className="absolute top-2.5 right-2.5 p-1 text-rose-500 hover:bg-white/10 rounded cursor-pointer transition-colors"
                  >
                    <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                  </button>
                </div>
              ))
            ) : (
              <div id="empty-favorites-profile-pane" className="text-center py-8 bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-xs text-slate-400">Your wishlist is empty.</p>
                <p className="text-[10px] text-slate-400 mt-1">Tap the heart icons on housing cards to populate this drawer with properties you like.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )}

    {/* Edit Listing Modal Drawer */}
    <AnimatePresence>
      {editingHouse && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-slate-900 border border-white/10 rounded-[32px] w-full max-w-xl overflow-hidden shadow-2xl flex flex-col font-sans text-left text-white"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 bg-gradient-to-r from-slate-950 to-slate-900 flex justify-between items-center">
              <div>
                <h3 className="text-md font-bold uppercase tracking-wider text-indigo-400 font-mono">Edit Property Details</h3>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5">Modify parameters for your listing securely.</p>
              </div>
              <button
                onClick={() => setEditingHouse(null)}
                className="p-1 px-3 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all text-xs font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form Body */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!editingHouse) return;

                const form = e.currentTarget;
                const title = (form.elements.namedItem('edit-title') as HTMLInputElement).value;
                const amountValue = Number((form.elements.namedItem('edit-amount') as HTMLInputElement).value);
                const location = (form.elements.namedItem('edit-location') as HTMLInputElement).value;
                const propertyStatus = (form.elements.namedItem('edit-status') as HTMLSelectElement).value as 'For Sale' | 'For Rent';
                const description = (form.elements.namedItem('edit-desc') as HTMLTextAreaElement).value;
                const size = (form.elements.namedItem('edit-size') as HTMLInputElement).value;

                const updatedFieldValues: Partial<House> = {
                  title,
                  amount: amountValue,
                  location,
                  propertyStatus,
                  description,
                  size,
                };

                if (onEditHouse) {
                  await onEditHouse(editingHouse.id, updatedFieldValues);
                }
                
                setEditingHouse(null);
              }}
              className="p-6 space-y-4 max-h-[70vh] overflow-y-auto"
            >
              {/* Title */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest">Property Title</label>
                <input
                  name="edit-title"
                  type="text"
                  required
                  defaultValue={editingHouse.title}
                  className="w-full bg-slate-950 border border-white/5 focus:border-indigo-500 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Amount / Price */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest">Price (TSh)</label>
                  <input
                    name="edit-amount"
                    type="number"
                    required
                    defaultValue={editingHouse.amount}
                    className="w-full bg-slate-950 border border-white/5 focus:border-indigo-500 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>

                {/* Size */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest">Property Size</label>
                  <input
                    name="edit-size"
                    type="text"
                    defaultValue={editingHouse.size || ''}
                    className="w-full bg-slate-950 border border-white/5 focus:border-indigo-500 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest">Location Address</label>
                <input
                  name="edit-location"
                  type="text"
                  required
                  defaultValue={editingHouse.location}
                  className="w-full bg-slate-950 border border-white/5 focus:border-indigo-500 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              {/* Status For Sale / For Rent */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest">List Status</label>
                <select
                  name="edit-status"
                  defaultValue={editingHouse.propertyStatus || 'For Rent'}
                  className="w-full bg-slate-950 border border-indigo-500 rounded-xl p-2.5 text-xs text-white"
                >
                  <option value="For Rent">🏠 For Rent</option>
                  <option value="For Sale">🔑 For Sale</option>
                </select>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest">Description</label>
                <textarea
                  name="edit-desc"
                  required
                  rows={4}
                  defaultValue={editingHouse.description}
                  className="w-full bg-slate-950 border border-white/5 focus:border-indigo-500 rounded-xl p-2.5 text-xs text-white leading-normal"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-white/5 mt-4 font-sans">
                <button
                  type="button"
                  onClick={() => setEditingHouse(null)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-500 hover:bg-indigo-400 text-white font-extrabold text-xs rounded-xl active:scale-95 transition-all cursor-pointer shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  </div>
);
}
