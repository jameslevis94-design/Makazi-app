import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, ArrowLeft, Users, Tent, Clock, CheckCircle, XCircle, 
  Search, Filter, RefreshCw, Phone, Mail, MapPin, ChevronRight, 
  Crown, ChevronLeft, ToggleLeft, ToggleRight, MessageSquare, 
  Info, Calendar, Hash, DollarSign, Activity, Check, Trash2, Heart,
  Send, CheckCheck, CreditCard, AlertCircle, Award, ExternalLink,
  Lock, Code, Copy, ChevronDown, ChevronUp, Database, FileText,
  Table as TableIcon, LayoutGrid, ArrowRight, UserCheck, AlertTriangle,
  Eye, Sparkles, Tag, SlidersHorizontal, ShieldAlert, CheckSquare, Layers,
  UploadCloud, Film, Pencil, Play, X
} from 'lucide-react';
import { saveStoredVideo, clearStoredVideo } from '../lib/videoStorage';
import { 
  fetchRequestsFromAppwrite, 
  fetchBookingsFromAppwrite, 
  updateBookingStatusInAppwrite, 
  fetchOwnersFromAppwrite, 
  getAppwriteImageUrl,
  APPWRITE_DEFAULTS
} from '../lib/appwrite';
import { House, Booking, Conversation, Message, HeroContent, DEFAULT_HERO_CONTENT } from '../types';
import LoadingSpinner from './ui/LoadingSpinner';
import MakaziLogo from './MakaziLogo';

interface CEODashboardProps {
  onBack: () => void;
  houses: House[];
  currentUser?: any;
  onUpdateCurrentUser?: (updatedUser: any) => Promise<void> | void;
  conversations: Conversation[];
  onUpdateConversations: (updated: Conversation[]) => void;
  bookings?: Booking[];
  onUpdateBookings?: (bookings: Booking[]) => void;
  onDeleteHouse?: (id: string) => Promise<void>;
  heroContent?: HeroContent;
  onUpdateHeroContent?: (content: HeroContent) => void;
}

export interface AppwriteErrorState {
  message: string;
  code?: number;
  type?: string;
  details?: string;
  collectionId?: string;
  databaseId?: string;
}

export interface ParsedAppwriteOwner {
  documentId: string;       // Appwrite document ID
  ownerId: string;          // Owner/user ID
  fullName: string;         // Full name
  email?: string;           // Email, if available
  phone?: string;           // Phone number, if available
  profileImage?: string;    // Profile image URL
  location: string;
  rating: number;
  bio?: string;
  role?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  properties: House[];
  requests: ParsedAppwriteRequest[];
  rawDoc: any;              // All other fields from Appwrite
}

export interface ParsedAppwriteRequest {
  documentId: string;       // Request/document ID
  userId: string;           // User ID
  ownerId?: string;         // Owner ID, if associated
  status: string;           // Request status
  requestType: string;      // Request type
  createdAt: string;        // Created date/time
  fullName: string;
  phone?: string;
  email?: string;
  messages?: string;
  propertyId?: string;
  moveInDate?: string;
  currentHolder?: string;
  rawDoc: any;              // All other fields from Appwrite
  associatedOwner?: ParsedAppwriteOwner;
  associatedHouse?: House;
}

export type WebBookingRequest = ParsedAppwriteRequest;

export default function CEODashboard({ 
  onBack, 
  houses, 
  currentUser, 
  onUpdateCurrentUser, 
  conversations, 
  onUpdateConversations,
  bookings = [],
  onUpdateBookings,
  onDeleteHouse,
  heroContent = DEFAULT_HERO_CONTENT,
  onUpdateHeroContent
}: CEODashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<'requests' | 'owners' | 'users' | 'upgrades' | 'chats' | 'payments' | 'brokers' | 'content'>('requests');
  const [brokerFilter, setBrokerFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedChatId, setSelectedChatId] = useState<string>(conversations[0]?.id || '');
  const [ceoTypedText, setCeoTypedText] = useState('');
  const [sendAsIdentity, setSendAsIdentity] = useState<'ceo' | 'host'>('ceo');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequestForDetail, setSelectedRequestForDetail] = useState<ParsedAppwriteRequest | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'CEO' | 'owner' | 'broker' | 'explorer'>('all');

  // CEO Hero Banner customizer state
  const [heroForm, setHeroForm] = useState<HeroContent>(() => {
    return heroContent || DEFAULT_HERO_CONTENT;
  });
  const [heroSavedToast, setHeroSavedToast] = useState(false);
  const [ceoVideoNotice, setCeoVideoNotice] = useState<string | null>(null);
  const ceoFileInputRef = React.useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (heroContent) {
      setHeroForm(heroContent);
    }
  }, [heroContent]);

  const handleProcessVideoFileInCEO = async (file: File) => {
    const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v|ogg|ogv)$/i.test(file.name);
    if (!isVideo) {
      setCeoVideoNotice('Tafadhali chagua faili la video pekee (MP4, WebM, MOV, OGG).');
      setTimeout(() => setCeoVideoNotice(null), 4000);
      return;
    }

    try {
      await saveStoredVideo(file, file.name, file.type);
      const objectUrl = URL.createObjectURL(file);
      const updated: HeroContent = {
        ...heroForm,
        videoUrl: objectUrl,
        videoFileName: file.name,
        videoFileSize: file.size,
        isCustomUpload: true,
        videoEnabled: true
      };
      setHeroForm(updated);
      if (onUpdateHeroContent) {
        onUpdateHeroContent(updated);
      } else {
        localStorage.setItem('makazi_hero_content', JSON.stringify(updated));
      }
      localStorage.removeItem('makazi_hero_video_last_ended');
      setCeoVideoNotice(`Video "${file.name}" imepakiwa na kuhifadhiwa kikamilifu!`);
      setTimeout(() => setCeoVideoNotice(null), 5000);
    } catch (err) {
      console.error(err);
      setCeoVideoNotice('Hitilafu ilitokea wakati wa kupakia video.');
      setTimeout(() => setCeoVideoNotice(null), 4000);
    }
  };

  const handleResetCustomVideoInCEO = async () => {
    await clearStoredVideo();
    const updated: HeroContent = {
      ...heroForm,
      videoUrl: DEFAULT_HERO_CONTENT.videoUrl,
      videoFileName: undefined,
      videoFileSize: undefined,
      isCustomUpload: false
    };
    setHeroForm(updated);
    if (onUpdateHeroContent) {
      onUpdateHeroContent(updated);
    } else {
      localStorage.setItem('makazi_hero_content', JSON.stringify(updated));
    }
    setCeoVideoNotice('Video imerejeshwa kwenye video ya asili.');
    setTimeout(() => setCeoVideoNotice(null), 4000);
  };

  // Live cycle indicator inside CEO Dashboard
  const [ceoRemainingTimeText, setCeoRemainingTimeText] = useState<string>('');

  useEffect(() => {
    const cycleIntervalMs = (heroForm.cycleIntervalHours ?? 5) * 60 * 60 * 1000;
    const checkCeoCycle = () => {
      const lastEndedStr = localStorage.getItem('makazi_hero_video_last_ended');
      if (!lastEndedStr) {
        setCeoRemainingTimeText('Video inaanza mara tu ukurasa unapofunguliwa');
        return;
      }
      const lastEnded = parseInt(lastEndedStr, 10);
      const elapsed = Date.now() - lastEnded;
      if (elapsed >= cycleIntervalMs) {
        setCeoRemainingTimeText('Muda umefika (Masaa 5) - Video itacheza sasa!');
      } else {
        const remaining = cycleIntervalMs - elapsed;
        const totalMinutes = Math.floor(remaining / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const seconds = Math.floor((remaining % 60000) / 1000);
        if (hours > 0) {
          setCeoRemainingTimeText(`${hours}h ${minutes}m ${seconds}s`);
        } else if (minutes > 0) {
          setCeoRemainingTimeText(`${minutes}m ${seconds}s`);
        } else {
          setCeoRemainingTimeText(`${seconds}s`);
        }
      }
    };
    checkCeoCycle();
    const interval = setInterval(checkCeoCycle, 1000);
    return () => clearInterval(interval);
  }, [heroForm.cycleIntervalHours]);

  const handleSimulate10sCycleInCEO = () => {
    const cycleIntervalMs = (heroForm.cycleIntervalHours ?? 5) * 60 * 60 * 1000;
    const simulatedLastEnded = Date.now() - (cycleIntervalMs - 10000);
    localStorage.setItem('makazi_hero_video_last_ended', simulatedLastEnded.toString());
    setCeoVideoNotice('⚡ Jaribio la Mzunguko: Video itarudi kiotomatiki baada ya sekunde 10!');
    setTimeout(() => setCeoVideoNotice(null), 4500);
  };

  const handlePlayVideoNowInCEO = () => {
    localStorage.removeItem('makazi_hero_video_last_ended');
    setCeoVideoNotice('🎬 Mzunguko umewekwa upya: Video itacheza sasa ukurasa wa mbele unapofunguliwa!');
    setTimeout(() => setCeoVideoNotice(null), 4000);
    if (onBack) onBack();
  };

  const handleSaveHero = () => {
    if (onUpdateHeroContent) {
      onUpdateHeroContent(heroForm);
    } else {
      localStorage.setItem('makazi_hero_content', JSON.stringify(heroForm));
    }
    setHeroSavedToast(true);
    setTimeout(() => setHeroSavedToast(false), 3500);
  };

  const handleResetHero = async () => {
    await clearStoredVideo();
    setHeroForm(DEFAULT_HERO_CONTENT);
    if (onUpdateHeroContent) {
      onUpdateHeroContent(DEFAULT_HERO_CONTENT);
    } else {
      localStorage.setItem('makazi_hero_content', JSON.stringify(DEFAULT_HERO_CONTENT));
    }
    setHeroSavedToast(true);
    setTimeout(() => setHeroSavedToast(false), 3500);
  };

  // Dynamic payment accounts state
  const [paymentAccounts, setPaymentAccounts] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('makazi_payment_accounts');
      if (saved) return JSON.parse(saved);
    } catch {}
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
  });

  useEffect(() => {
    localStorage.setItem('makazi_payment_accounts', JSON.stringify(paymentAccounts));
  }, [paymentAccounts]);

  // States for payment accounts management form
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [newAccMethod, setNewAccMethod] = useState('Vodacom M-Pesa');
  const [newAccMerchantName, setNewAccMerchantName] = useState('');
  const [newAccNumberType, setNewAccNumberType] = useState('Lipa Namba (Merchant Code)');
  const [newAccNumberValue, setNewAccNumberValue] = useState('');
  const [newAccInstructions, setNewAccInstructions] = useState('');
  const [newAccEnabled, setNewAccEnabled] = useState(true);

  // General billing ledger search filters
  const [paymentQueryLog, setPaymentQueryLog] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'Pending' | 'Approved' | 'Rejected' | 'Unpaid'>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');

  // Upgrade receipt claims list state
  const [upgradeRequests, setUpgradeRequests] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('makazi_upgrade_requests');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Broker applications state & rejection notes inputs
  const [brokerApplications, setBrokerApplications] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('makazi_broker_applications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [brokerRejectionReasons, setBrokerRejectionReasons] = useState<{[key: string]: string}>({});

  const handleReviewBrokerApplication = async (appId: string, status: 'approved' | 'rejected') => {
    const notes = brokerRejectionReasons[appId] || '';
    const updatedApps = brokerApplications.map(app => {
      if (app.id === appId) {
        return {
          ...app,
          status,
          notes,
          reviewedAt: new Date().toISOString()
        };
      }
      return app;
    });

    setBrokerApplications(updatedApps);
    localStorage.setItem('makazi_broker_applications', JSON.stringify(updatedApps));

    // If approved, update active user's roles
    const updatedApp = updatedApps.find(a => a.id === appId);
    if (updatedApp && status === 'approved') {
      try {
        const savedUserStr = localStorage.getItem('makazi_user');
        if (savedUserStr) {
          const storedUser = JSON.parse(savedUserStr);
          if (storedUser.id === updatedApp.userId) {
            storedUser.role = 'broker';
            localStorage.setItem('makazi_user', JSON.stringify(storedUser));
            if (onUpdateCurrentUser) {
              await onUpdateCurrentUser(storedUser);
            }
          }
        }
        
        // Also update in makazi_users registry
        const usersStr = localStorage.getItem('makazi_users');
        if (usersStr) {
          const usersList = JSON.parse(usersStr) as any[];
          const updatedUsersList = usersList.map((u: any) => {
            if (u.id === updatedApp.userId) {
              return { ...u, role: 'broker' };
            }
            return u;
          });
          localStorage.setItem('makazi_users', JSON.stringify(updatedUsersList));
        }
      } catch (e) {
        console.error('Error updating broker role values:', e);
      }
    }

    alert(`Broker application has been successfully ${status === 'approved' ? 'Approved & badge granted!' : 'Rejected with reasons recorded!'}`);
  };

  // Raw fetched requests/bookings from database
  const [rawRequests, setRawRequests] = useState<any[]>([]);

  // Raw fetched owners from database (Collection: owner)
  const [rawOwners, setRawOwners] = useState<any[]>([]);

  // Granular Appwrite loading and error states
  const [ownersLoading, setOwnersLoading] = useState(false);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [ownersError, setOwnersError] = useState<AppwriteErrorState | null>(null);
  const [requestsError, setRequestsError] = useState<AppwriteErrorState | null>(null);

  // View modes (Cards vs Table)
  const [ownersViewMode, setOwnersViewMode] = useState<'cards' | 'table'>('cards');
  const [requestsViewMode, setRequestsViewMode] = useState<'cards' | 'table'>('cards');

  // Interactive inspect states
  const [expandedOwnerDocId, setExpandedOwnerDocId] = useState<string | null>(null);
  const [expandedRequestDocId, setExpandedRequestDocId] = useState<string | null>(null);
  const [copiedFieldId, setCopiedFieldId] = useState<string | null>(null);
  const [ownerFilterForRequests, setOwnerFilterForRequests] = useState<string | null>(null);

  // Copy helper
  const handleCopyText = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedFieldId(id);
    setTimeout(() => setCopiedFieldId(null), 2000);
  };
  
  // Local toggles for activated/deactivated owner accounts stored in localStorage
  const [deactivatedOwners, setDeactivatedOwners] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('makazi_deactivated_owners');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // State for search and pagination in Requests
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Search and view state for Owners
  const [ownerSearchQuery, setOwnerSearchQuery] = useState('');
  const [selectedOwnerRow, setSelectedOwnerRow] = useState<string | null>(null);

  // Live fetch function connected directly to Appwrite database
  const loadData = async (isManualSync = false) => {
    if (isManualSync) setSyncing(true);
    else setLoading(true);
    setError(null);
    setOwnersLoading(true);
    setRequestsLoading(true);

    try {
      const [ownersResult, requestsResult] = await Promise.allSettled([
        fetchOwnersFromAppwrite(currentUser?.email),
        fetchRequestsFromAppwrite(currentUser?.email)
      ]);

      // 1. Process Appwrite Owners Response
      if (ownersResult.status === 'fulfilled') {
        setRawOwners(ownersResult.value || []);
        setOwnersError(null);
      } else {
        const err: any = ownersResult.reason;
        console.warn('Appwrite owners fetch error:', err);
        setOwnersError({
          message: err.message || 'Failed to retrieve owner profiles from Appwrite',
          code: err.code || 500,
          type: err.type || 'appwrite_error',
          details: err.details,
          collectionId: err.collectionId || APPWRITE_DEFAULTS.ownerCollectionId,
          databaseId: err.databaseId || APPWRITE_DEFAULTS.databaseId
        });
        setRawOwners([]);
      }

      // 2. Process Appwrite User Requests Response
      if (requestsResult.status === 'fulfilled') {
        setRawRequests(requestsResult.value || []);
        setRequestsError(null);
      } else {
        const err: any = requestsResult.reason;
        console.warn('Appwrite requests fetch error:', err);
        setRequestsError({
          message: err.message || 'Failed to retrieve user requests from Appwrite',
          code: err.code || 500,
          type: err.type || 'appwrite_error',
          details: err.details,
          collectionId: err.collectionId || APPWRITE_DEFAULTS.requestsCollectionId,
          databaseId: err.databaseId || APPWRITE_DEFAULTS.databaseId
        });
        setRawRequests([]);
      }
    } catch (err: any) {
      setError(err?.message || 'Error connecting to Appwrite cloud database');
    } finally {
      setOwnersLoading(false);
      setRequestsLoading(false);
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update Request Status on Appwrite and dynamically update local state
  const handleUpdateStatus = async (requestId: string, newStatus: string) => {
    try {
      setError(null);
      // Attempt backend update
      await updateBookingStatusInAppwrite(requestId, newStatus, currentUser?.email);
      
      // Update local state instantly
      setRawRequests(prev => prev.map(req => {
        const docId = req.$id || req.id || req.requestId || req.$documentId;
        if (docId === requestId) {
          return { ...req, status: newStatus, booking_status: newStatus };
        }
        return req;
      }));
    } catch (err: any) {
      console.warn('Error updating Appwrite status, updating locally only:', err.message);
      // Update local state anyway on fallback error so it is responsive/client-perfect
      setRawRequests(prev => prev.map(req => {
        const docId = req.$id || req.id || req.requestId || req.$documentId;
        if (docId === requestId) {
          return { ...req, status: newStatus, booking_status: newStatus };
        }
        return req;
      }));
    }
  };

  // Update request status directly from the "Who Sent To Who" detail modal
  const handleModalUpdateStatus = async (newStatus: string) => {
    if (!selectedRequestForDetail) return;
    await handleUpdateStatus(selectedRequestForDetail.documentId, newStatus);
    setSelectedRequestForDetail(prev => prev ? { ...prev, status: newStatus } : null);
    if (onUpdateBookings && bookings) {
      const updatedBookings = bookings.map(b => {
        if (b.id === selectedRequestForDetail.documentId) {
          return {
            ...b,
            status: (newStatus === 'approved' ? 'completed' : newStatus === 'rejected' ? 'cancelled' : 'upcoming') as any
          };
        }
        return b;
      });
      onUpdateBookings(updatedBookings);
    }
  };

  // Launch a direct corporate message in HQ Comm Channels with a person
  const handleStartDirectChat = (personName: string, personRole: string, defaultMessage?: string) => {
    const existing = conversations.find(c => c.house?.host?.name?.toLowerCase().trim() === personName.toLowerCase().trim());
    if (existing) {
      setSelectedChatId(existing.id);
      setActiveSubTab('chats');
      setSelectedRequestForDetail(null);
      const el = document.getElementById('ceo-main-subtab-container');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    const baseHouse: House = houses[0] ? {
      ...houses[0],
      host: {
        name: personName,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(personName)}`,
        rating: 4.95
      }
    } : {
      id: `h-direct-${Date.now()}`,
      title: `Makazi HQ Communication Channel`,
      description: `Direct communications channel with ${personName}`,
      location: 'Makazi HQ Office',
      dateRange: 'Flexible',
      amount: 0,
      rating: 5.0,
      images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80'],
      beds: 3,
      baths: 2,
      maxGuests: 4,
      reviews: [],
      host: {
        name: personName,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(personName)}`,
        rating: 4.95
      },
      features: ['Direct CEO Channel']
    };

    const newConv: Conversation = {
      id: `conv-hq-${Date.now()}`,
      house: baseHouse,
      lastMessage: defaultMessage || 'Direct inquiry line opened',
      lastUpdated: 'Just now',
      messages: defaultMessage ? [
        {
          id: `msg-${Date.now()}`,
          sender: 'ceo',
          text: defaultMessage,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ] : []
    };
    onUpdateConversations([newConv, ...conversations]);
    setSelectedChatId(newConv.id);
    setActiveSubTab('chats');
    setSelectedRequestForDetail(null);
    const el = document.getElementById('ceo-main-subtab-container');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Toggle Owner Activation State and persist locally
  const handleToggleOwnerActivation = (ownerName: string) => {
    const isDeactivated = deactivatedOwners.includes(ownerName);
    let updated: string[];
    if (isDeactivated) {
      updated = deactivatedOwners.filter(name => name !== ownerName);
    } else {
      updated = [...deactivatedOwners, ownerName];
    }
    setDeactivatedOwners(updated);
    localStorage.setItem('makazi_deactivated_owners', JSON.stringify(updated));
  };

  // Authorize or decline reservation stay checkout payments
  const handleUpdateBookingPaymentStatus = (bookingId: string, status: 'Approved' | 'Rejected') => {
    if (onUpdateBookings) {
      const updated = bookings.map((b) => {
        if (b.id === bookingId) {
          return {
            ...b,
            paymentStatus: status,
          };
        }
        return b;
      });
      onUpdateBookings(updated);
      alert(`Booking stay payment has been successfully authorized as: ${status.toUpperCase()}`);
    }
  };

  // Save dynamic payment account (Add or edit)
  const handleSavePaymentAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccMerchantName || !newAccNumberValue) {
      alert('Please fill in the merchant account name and coordinates value.');
      return;
    }

    let colorClass = 'border-slate-500/30 bg-slate-500/5 text-slate-400';
    if (newAccMethod === 'Vodacom M-Pesa') colorClass = 'border-red-500/30 bg-red-505/5 text-red-400';
    else if (newAccMethod === 'Tigo Pesa') colorClass = 'border-blue-500/30 bg-blue-505/5 text-blue-400';
    else if (newAccMethod === 'Airtel Money') colorClass = 'border-rose-500/30 bg-rose-505/5 text-rose-400';
    else if (newAccMethod === 'HaloPesa') colorClass = 'border-orange-500/30 bg-orange-505/5 text-orange-400';
    else if (['Visa Card', 'MasterCard', 'Bank Account'].includes(newAccMethod)) colorClass = 'border-indigo-500/30 bg-indigo-505/5 text-indigo-400';

    if (editingAccountId) {
      // Edit
      const updated = paymentAccounts.map(acc => {
        if (acc.id === editingAccountId) {
          return {
            ...acc,
            method: newAccMethod,
            merchantName: newAccMerchantName,
            numberType: newAccNumberType,
            numberValue: newAccNumberValue,
            instructions: newAccInstructions,
            enabled: newAccEnabled,
            colorClass
          };
        }
        return acc;
      });
      setPaymentAccounts(updated);
      setEditingAccountId(null);
      alert('Payment account details updated successfully!');
    } else {
      // Add
      const newAcc = {
        id: 'pay-' + Date.now(),
        method: newAccMethod,
        merchantName: newAccMerchantName,
        numberType: newAccNumberType,
        numberValue: newAccNumberValue,
        instructions: newAccInstructions,
        enabled: newAccEnabled,
        colorClass
      };
      setPaymentAccounts([...paymentAccounts, newAcc]);
      alert('New payment account registered successfully!');
    }

    // Reset Form
    setNewAccMerchantName('');
    setNewAccNumberValue('');
    setNewAccInstructions('');
    setNewAccMethod('Vodacom M-Pesa');
    setNewAccNumberType('Lipa Namba (Merchant Code)');
    setNewAccEnabled(true);
  };

  const handleStartEditAccount = (acc: any) => {
    setEditingAccountId(acc.id);
    setNewAccMethod(acc.method);
    setNewAccMerchantName(acc.merchantName);
    setNewAccNumberType(acc.numberType || 'Lipa Namba (Merchant Code)');
    setNewAccNumberValue(acc.numberValue);
    setNewAccInstructions(acc.instructions || '');
    setNewAccEnabled(acc.enabled !== false);

    // Scroll smoothly to edit form and auto-focus the Number/Code value field
    setTimeout(() => {
      const inputEl = document.getElementById('ceo-payment-number-value-input');
      if (inputEl) {
        inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        (inputEl as HTMLInputElement).focus();
        (inputEl as HTMLInputElement).select();
      }
    }, 120);
  };

  const handleDeletePaymentAccount = (id: string) => {
    if (confirm('Are you absolutely sure you want to delete this payment account? This will restrict clients from resolving stays using this route.')) {
      const filtered = paymentAccounts.filter(acc => acc.id !== id);
      setPaymentAccounts(filtered);
      if (editingAccountId === id) {
        setEditingAccountId(null);
      }
    }
  };

  const handleTogglePaymentAccountEnabled = (id: string) => {
    const updated = paymentAccounts.map(acc => {
      if (acc.id === id) {
        return {
          ...acc,
          enabled: !acc.enabled
        };
      }
      return acc;
    });
    setPaymentAccounts(updated);
  };

  const handleDownloadLedgerReport = () => {
    const filteredLedger = bookings.filter(b => {
      const matchesStatus = paymentStatusFilter === 'all' || b.paymentStatus === paymentStatusFilter || (paymentStatusFilter === 'Unpaid' && !b.paymentStatus);
      const matchesMethod = paymentMethodFilter === 'all' || b.paymentMethod === paymentMethodFilter;
      const matchesQuery = !paymentQueryLog.trim() || 
        b.id.toLowerCase().includes(paymentQueryLog.toLowerCase()) ||
        b.house.title.toLowerCase().includes(paymentQueryLog.toLowerCase()) ||
        (b.paymentNumber && b.paymentNumber.toLowerCase().includes(paymentQueryLog.toLowerCase())) ||
        (b.fullName && b.fullName.toLowerCase().includes(paymentQueryLog.toLowerCase())) ||
        b.startDate.includes(paymentQueryLog);
      return matchesStatus && matchesMethod && matchesQuery;
    });

    if (filteredLedger.length === 0) {
      alert('No payment entries match your current filter settings to export.');
      return;
    }

    let csvHeader = 'Stay ID,Guest Name,Property Title,Date Interval,Price Dues,Payment Method,Sender Reference,Status,Created At\n';
    let csvBody = filteredLedger.map(b => {
      const guestName = b.fullName ? b.fullName.replace(/,/g, ' ') : 'Guest Client';
      const property = b.house.title.replace(/,/g, ' ');
      const method = b.paymentMethod || 'None';
      const senderRef = b.paymentNumber || 'N/A';
      const status = b.paymentStatus || 'Unpaid';
      const payDate = b.startDate || 'N/A';
      return `"${b.id}","${guestName}","${property}","${payDate}","$${b.totalPrice || 0}","${method}","${senderRef}","${status}","${b.startDate}"`;
    }).join('\n');

    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(csvHeader + csvBody);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', csvContent);
    downloadAnchor.setAttribute('download', `MAKAZI_Financials_Ledger_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  };

  // Re-format status descriptions nicely for tags
  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'approved' || s === 'reserved & confirmed') {
      return {
        bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        text: 'Approved',
        dot: 'bg-emerald-400'
      };
    }
    if (s === 'rejected' || s === 'cancelled' || s === 'canceled') {
      return {
        bg: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
        text: 'Rejected',
        dot: 'bg-rose-400'
      };
    }
    return {
      bg: 'bg-amber-500/10 border-amber-500/20 text-text-amber-300 text-amber-400',
      text: 'Pending',
      dot: 'bg-amber-400'
    };
  };

  // 1. DEDUPLICATE & MAP ALL OWNERS (Appwrite + All Property Hosts in App)
  const parsedOwners = useMemo<ParsedAppwriteOwner[]>(() => {
    const map = new Map<string, ParsedAppwriteOwner>();

    // A. Appwrite Owners from database
    rawOwners.forEach((doc, idx) => {
      const docId = doc.$id || doc.id || `own-doc-${idx}`;
      const ownerId = doc.ownerId || doc.userId || doc.accountId || docId;
      const key = (doc.$id || doc.ownerId || doc.userId || (doc.email ? doc.email.toLowerCase() : '') || (doc.fullName || doc.name || '')).trim().toLowerCase();
      if (!key || map.has(key)) return;

      const fullName = doc.fullName || doc.name || doc.creator || doc.ownerName || 'Verified Property Owner';
      const email = doc.email || doc.emailurl || undefined;
      const phone = doc.phone || doc.phoneNumber || doc.phonenumber || doc.sms || undefined;
      
      let profileImage: string | undefined = undefined;
      const imgVal = doc.imageurl || doc.imagesurl || doc.avatar || doc.profileImage || doc.imageid;
      if (imgVal) {
        profileImage = getAppwriteImageUrl(imgVal);
      }

      const location = doc.location || doc.address || doc.city || 'Tanzania';
      const rating = typeof doc.rating === 'number' ? doc.rating : 4.95;
      const bio = doc.bio || doc.description || undefined;
      const role = doc.role || 'Property Owner';
      const status = doc.status || 'Active';
      const createdAt = doc.$createdAt || doc.createdAt || doc.date || undefined;
      const updatedAt = doc.$updatedAt || doc.updatedAt || undefined;

      map.set(key, {
        documentId: docId,
        ownerId,
        fullName,
        email,
        phone,
        profileImage,
        location,
        rating,
        bio,
        role,
        status,
        createdAt,
        updatedAt,
        properties: [],
        requests: [],
        rawDoc: doc
      });
    });

    // B. All Hosts / Owners from active listed properties in Makazi
    houses.forEach((h, idx) => {
      if (h.host && h.host.name) {
        const hostName = h.host.name.trim();
        const key = hostName.toLowerCase();
        if (!map.has(key)) {
          const ownerId = (h as any).ownerId || `host-${idx + 1}-${hostName.toLowerCase().replace(/\s+/g, '-')}`;
          const cleanEmail = (h.host as any).email || `${hostName.toLowerCase().replace(/\s+/g, '.')}@makazi.co`;
          const cleanPhone = (h.host as any).phone || '+255 774 200 110';
          
          map.set(key, {
            documentId: `doc-${ownerId}`,
            ownerId,
            fullName: hostName,
            email: cleanEmail,
            phone: cleanPhone,
            profileImage: h.host.avatar,
            location: h.location || 'Tanzania',
            rating: h.host.rating || 4.95,
            bio: `Verified Mmiliki & Host of ${h.title}`,
            role: 'Property Owner (Mmiliki)',
            status: 'Active',
            createdAt: '2026-01-10T10:00:00.000Z',
            properties: [],
            requests: [],
            rawDoc: { host: h.host, propertyTitle: h.title, houseId: h.id }
          });
        }
      }
    });

    // C. Approved Broker / Mmiliki Applications
    brokerApplications.forEach((b: any, idx: number) => {
      if (b.status === 'approved' && b.fullName) {
        const key = b.fullName.trim().toLowerCase();
        if (!map.has(key)) {
          map.set(key, {
            documentId: b.id || `broker-doc-${idx}`,
            ownerId: b.userId || `broker-${idx}`,
            fullName: b.fullName,
            email: b.email,
            phone: b.phoneNumber,
            profileImage: b.screenshot || undefined,
            location: b.location || 'Tanzania',
            rating: 4.9,
            bio: `Licensed Broker & Mmiliki: ${b.companyName || 'Makazi Exclusive'}`,
            role: 'Certified Broker / Owner',
            status: 'Active',
            createdAt: b.submittedAt,
            properties: [],
            requests: [],
            rawDoc: b
          });
        }
      }
    });

    return Array.from(map.values());
  }, [rawOwners, houses, brokerApplications]);

  // 2. MAP APPWRITE & LOCAL USER REQUESTS / INQUIRIES
  const parsedRequests = useMemo<ParsedAppwriteRequest[]>(() => {
    const map = new Map<string, ParsedAppwriteRequest>();

    // A. Appwrite user requests from database collection
    rawRequests.forEach((doc, idx) => {
      const documentId = doc.$id || doc.id || doc.msgid || `req-${idx}`;
      const userId = doc.userId || doc.applicantId || doc.accountId || 'anonymous-user';
      const ownerId = doc.ownerId || doc.receiverId || doc.currentHolder || undefined;
      const status = doc.status || doc.statusid || 'upcoming';
      const requestType = doc.requestType || doc.type || doc.housetype || (doc.messages ? 'Stay Inquiry' : 'Stay Booking Reservation');
      const createdAt = doc.$createdAt || doc.createdAt || doc.date || doc['msg.createdAt'] || new Date().toISOString();
      const fullName = doc.name || doc.fullName || doc.applicantName || doc['msg.applicantName'] || 'James Levis';
      const phone = doc.phone || doc.applicantPhone || doc.phoneNumber || undefined;
      const email = doc.email || doc.emailId || undefined;
      const messages = doc.messages || doc.contentid || doc.preferredDetails || undefined;
      const propertyId = doc.propertyId || doc.postid || doc.houseId || undefined;
      const moveInDate = doc.moveInDate || doc.startDate || undefined;
      const currentHolder = doc.currentHolder || doc.houseHostName || undefined;

      map.set(documentId, {
        documentId,
        userId,
        ownerId,
        status,
        requestType,
        createdAt,
        fullName,
        phone,
        email,
        messages,
        propertyId,
        moveInDate,
        currentHolder,
        rawDoc: doc
      });
    });

    // B. App local bookings & inquiries (from bookings prop & localStorage)
    const combinedBookings = [...(bookings || [])];
    try {
      const localBookings = localStorage.getItem('makazi_bookings');
      if (localBookings) {
        const parsed = JSON.parse(localBookings);
        if (Array.isArray(parsed)) {
          parsed.forEach((b: any) => {
            if (!combinedBookings.some(existing => existing.id === b.id)) {
              combinedBookings.push(b);
            }
          });
        }
      }
    } catch (e) {
      console.warn(e);
    }

    combinedBookings.forEach((b: any, idx: number) => {
      const docId = b.id || `booking-${idx}`;
      if (map.has(docId)) return;

      const userId = b.userId || (b.fullName ? b.fullName.toLowerCase().replace(/\s+/g, '-') : `user-inquiry-${idx}`);
      const ownerId = b.house?.host?.name || b.house?.ownerId || 'host-owner';
      const status = b.status === 'completed' ? 'approved' : b.status === 'cancelled' ? 'rejected' : 'upcoming';
      const requestType = b.preferredDetails ? 'Stay Inquiry' : 'Stay Booking Reservation';
      const createdAt = b.createdAt || b.date || new Date(Date.now() - idx * 3600000).toISOString();
      const fullName = b.fullName || (currentUser?.name && idx === 0 ? currentUser.name : 'James Levis');
      const phone = b.phoneNumber || b.phone || '+44 7700 900077';
      const email = b.email || (currentUser?.email ? currentUser.email : 'jameslevis94@gmail.com');
      const messages = b.preferredDetails || b.messages || `Interested in reserving ${b.house?.title || 'Sanctuary stay'}. Please confirm availability and viewings.`;
      const propertyId = b.house?.id || b.houseId;
      const moveInDate = b.startDate || '2026-07-01';
      const currentHolder = b.house?.host?.name || 'Elena Rostova';

      map.set(docId, {
        documentId: docId,
        userId,
        ownerId,
        status,
        requestType,
        createdAt,
        fullName,
        phone,
        email,
        messages,
        propertyId,
        moveInDate,
        currentHolder,
        rawDoc: b
      });
    });

    // Sort requests from newest to oldest (from new to last)
    return Array.from(map.values()).sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime() || 0;
      const timeB = new Date(b.createdAt).getTime() || 0;
      return timeB - timeA;
    });
  }, [rawRequests, bookings, currentUser]);

  // 3. ENRICH RELATIONSHIPS: LINK OWNERS WITH HOUSES & REQUESTS
  const enrichedOwners = useMemo<ParsedAppwriteOwner[]>(() => {
    return parsedOwners.map(owner => {
      const ownerNameClean = owner.fullName.toLowerCase().trim();
      const ownerIdClean = owner.ownerId.toLowerCase().trim();
      const docIdClean = owner.documentId.toLowerCase().trim();

      // Find matching listed properties
      const matchedHouses = houses.filter(h => {
        const hostClean = h.host?.name?.toLowerCase().trim();
        const houseOwnerId = (h as any).ownerId?.toString().toLowerCase().trim();
        const matchesName = hostClean && hostClean === ownerNameClean;
        const matchesId = houseOwnerId && (houseOwnerId === ownerIdClean || houseOwnerId === docIdClean);
        return Boolean(matchesName || matchesId);
      });

      // Find matching user requests
      const matchedRequests = parsedRequests.filter(r => {
        const rOwnerId = r.ownerId?.toLowerCase().trim();
        const rHolder = r.currentHolder?.toLowerCase().trim();
        if (rOwnerId && (rOwnerId === ownerIdClean || rOwnerId === docIdClean)) return true;
        if (rHolder && rHolder === ownerNameClean) return true;
        return false;
      });

      return {
        ...owner,
        properties: matchedHouses,
        requests: matchedRequests
      };
    });
  }, [parsedOwners, houses, parsedRequests]);

  // 4. ENRICH RELATIONSHIPS: LINK REQUESTS WITH ASSOCIATED OWNERS & HOUSES
  const enrichedRequests = useMemo<ParsedAppwriteRequest[]>(() => {
    return parsedRequests.map(req => {
      const rOwnerId = req.ownerId?.toLowerCase().trim();
      const rHolder = req.currentHolder?.toLowerCase().trim();

      // Find associated house listing
      const associatedHouse = houses.find(h => {
        if (req.propertyId && (h.id === req.propertyId || (h as any).postid === req.propertyId)) return true;
        if (rHolder && h.host?.name?.toLowerCase().trim() === rHolder) return true;
        if (rOwnerId && (h as any).ownerId?.toString().toLowerCase().trim() === rOwnerId) return true;
        return false;
      });

      // Find associated owner profile from Appwrite / app owners
      let associatedOwner = enrichedOwners.find(o => {
        if (rOwnerId && (o.ownerId.toLowerCase().trim() === rOwnerId || o.documentId.toLowerCase().trim() === rOwnerId)) return true;
        if (rHolder && o.fullName.toLowerCase().trim() === rHolder) return true;
        if (associatedHouse && associatedHouse.host?.name?.toLowerCase().trim() === o.fullName.toLowerCase().trim()) return true;
        return false;
      });

      // Fallback owner info if not found directly
      if (!associatedOwner) {
        const fallbackName = req.currentHolder || associatedHouse?.host?.name || 'Verified Property Host';
        associatedOwner = {
          documentId: `doc-${req.ownerId || 'host'}`,
          ownerId: req.ownerId || 'host-1',
          fullName: fallbackName,
          email: `${fallbackName.toLowerCase().replace(/\s+/g, '.')}@makazi.co`,
          phone: '+255 770 000 000',
          location: associatedHouse?.location || 'Tanzania',
          rating: 4.9,
          properties: associatedHouse ? [associatedHouse] : [],
          requests: [req],
          rawDoc: {}
        };
      }

      return {
        ...req,
        associatedOwner,
        associatedHouse
      };
    });
  }, [parsedRequests, enrichedOwners, houses]);

  // Comprehensive directory of all users across the platform
  const allAppUsers = useMemo(() => {
    const map = new Map<string, any>();

    // 1. Current logged-in user / CEO
    if (currentUser) {
      map.set(currentUser.email || currentUser.id || 'current-user', {
        id: currentUser.id || 'james-levis-1',
        name: currentUser.name || 'James Levis',
        email: currentUser.email || 'jameslevis94@gmail.com',
        phone: currentUser.phone || '+44 7700 900077',
        role: currentUser.role === 'admin' || currentUser.email === 'jameslevis94@gmail.com' ? 'CEO' : (currentUser.role || 'explorer'),
        location: currentUser.location || 'London, UK',
        avatar: currentUser.avatar || '',
        source: 'CEO Admin Session',
        createdAt: 'Active Now'
      });
    }

    // 2. Registered users in local storage (makazi_users)
    try {
      const localUsersStr = localStorage.getItem('makazi_users');
      if (localUsersStr) {
        const parsed = JSON.parse(localUsersStr);
        if (Array.isArray(parsed)) {
          parsed.forEach((u: any) => {
            const key = u.email || u.id || u.username;
            if (key && !map.has(key)) {
              map.set(key, {
                id: u.id || `u-${Math.random().toString(36).substr(2, 6)}`,
                name: u.name || u.fullName || 'Registered User',
                email: u.email || '',
                phone: u.phone || u.phoneNumber || '',
                role: u.role || 'explorer',
                location: u.location || 'Tanzania',
                avatar: u.avatar || '',
                source: 'User Registry',
                createdAt: u.createdAt || 'Registered'
              });
            }
          });
        }
      }
    } catch {}

    // 3. Broker applicants
    brokerApplications.forEach((b: any) => {
      const key = b.email || b.userId;
      if (key && !map.has(key)) {
        map.set(key, {
          id: b.userId,
          name: b.fullName,
          email: b.email,
          phone: b.phoneNumber,
          role: b.status === 'approved' ? 'broker' : 'explorer',
          location: b.location,
          avatar: b.screenshot || '',
          source: 'Broker License Portal',
          createdAt: b.submittedAt ? new Date(b.submittedAt).toLocaleDateString() : 'Recent'
        });
      }
    });

    // 4. Stays Request / Inquiry submitters
    enrichedRequests.forEach((req: any) => {
      const key = req.email || req.userId;
      if (key && !map.has(key)) {
        map.set(key, {
          id: req.userId,
          name: req.fullName || 'Client Explorer',
          email: req.email || '',
          phone: req.phone || '',
          role: 'explorer',
          location: req.associatedHouse?.location || 'Guest Traveler',
          avatar: '',
          source: 'Stays Inquiries',
          createdAt: req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'Recent'
        });
      }
    });

    // 5. Owners as users
    enrichedOwners.forEach((owner: any) => {
      const key = owner.email || owner.ownerId || owner.documentId;
      if (key && !map.has(key)) {
        map.set(key, {
          id: owner.ownerId || owner.documentId,
          name: owner.fullName,
          email: owner.email || '',
          phone: owner.phone || '',
          role: 'owner',
          location: owner.location || 'Tanzania',
          avatar: owner.profileImage || '',
          source: 'Registered Host',
          createdAt: owner.createdAt || 'Recent'
        });
      }
    });

    return Array.from(map.values());
  }, [currentUser, brokerApplications, enrichedRequests, enrichedOwners]);

  const filteredUsers = useMemo(() => {
    return allAppUsers.filter(u => {
      if (userRoleFilter !== 'all') {
        const r = (u.role || '').toLowerCase();
        if (userRoleFilter === 'CEO' && !r.includes('ceo') && !r.includes('admin')) return false;
        if (userRoleFilter === 'owner' && !r.includes('owner')) return false;
        if (userRoleFilter === 'broker' && !r.includes('broker')) return false;
        if (userRoleFilter === 'explorer' && (r.includes('ceo') || r.includes('owner') || r.includes('broker'))) return false;
      }
      if (userSearchQuery.trim()) {
        const q = userSearchQuery.toLowerCase().trim();
        return (
          (u.name && u.name.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.phone && u.phone.toLowerCase().includes(q)) ||
          (u.id && u.id.toLowerCase().includes(q)) ||
          (u.location && u.location.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [allAppUsers, userRoleFilter, userSearchQuery]);

  // Statistics Calculations
  const stats = useMemo(() => {
    const totalRequests = enrichedRequests.length;
    let pending = 0;
    let approved = 0;
    let rejected = 0;

    enrichedRequests.forEach(r => {
      const s = r.status.toLowerCase();
      if (s === 'approved' || s === 'reserved & confirmed') approved++;
      else if (s === 'rejected' || s === 'cancelled' || s === 'canceled') rejected++;
      else pending++;
    });

    // Count distinct users
    const totalUsers = Math.max(allAppUsers.length, 1);

    // Calculate pending upgrade request accounts
    const pendingUpgrades = upgradeRequests.filter(r => r.status === 'pending').length;

    return {
      totalUsers,
      totalOwners: enrichedOwners.length,
      totalProperties: houses.length,
      totalRequests,
      pending,
      approved,
      rejected,
      pendingUpgrades
    };
  }, [enrichedRequests, enrichedOwners, houses, upgradeRequests, allAppUsers]);

  // Filter and Search Requests list
  const filteredRequests = useMemo(() => {
    const list = enrichedRequests.filter(req => {
      // 1. Status Filter
      if (statusFilter !== 'all') {
        const parsed = getStatusColor(req.status).text.toLowerCase();
        if (parsed !== statusFilter) return false;
      }

      // 2. Specific Owner Filter (if clicked from an owner's requests chip)
      if (ownerFilterForRequests) {
        const matchesOwner = req.ownerId === ownerFilterForRequests || 
                             req.associatedOwner?.documentId === ownerFilterForRequests || 
                             req.associatedOwner?.ownerId === ownerFilterForRequests;
        if (!matchesOwner) return false;
      }

      // 3. Search Query (Doc ID, User ID, Owner ID, Name, Phone, Email, Property, Remarks)
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const matchesDocId = req.documentId.toLowerCase().includes(query);
        const matchesUserId = req.userId.toLowerCase().includes(query);
        const matchesOwnerId = Boolean(req.ownerId && req.ownerId.toLowerCase().includes(query));
        const matchesName = req.fullName.toLowerCase().includes(query);
        const matchesPhone = Boolean(req.phone && req.phone.toLowerCase().includes(query));
        const matchesEmail = Boolean(req.email && req.email.toLowerCase().includes(query));
        const matchesContent = Boolean(req.messages && req.messages.toLowerCase().includes(query));
        const matchesType = Boolean(req.requestType && req.requestType.toLowerCase().includes(query));
        const matchesProp = Boolean(req.propertyId && req.propertyId.toLowerCase().includes(query)) ||
                            Boolean(req.associatedHouse?.title && req.associatedHouse.title.toLowerCase().includes(query));
        return matchesDocId || matchesUserId || matchesOwnerId || matchesName || matchesPhone || matchesEmail || matchesContent || matchesType || matchesProp;
      }

      return true;
    });

    // Sort by createdAt descending (newest first - from new to last)
    return [...list].sort((a, b) => {
      const getTimestamp = (val: any) => {
        if (!val) return 0;
        const d = new Date(val).getTime();
        return isNaN(d) ? 0 : d;
      };
      const timeA = getTimestamp(a.createdAt || a.rawDoc?.$createdAt || a.rawDoc?.date);
      const timeB = getTimestamp(b.createdAt || b.rawDoc?.$createdAt || b.rawDoc?.date);
      return timeB - timeA;
    });
  }, [enrichedRequests, statusFilter, searchQuery, ownerFilterForRequests]);

  // Pagination bounds
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRequests.slice(start, start + itemsPerPage);
  }, [filteredRequests, currentPage]);

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage) || 1;

  // Filter Owners
  const filteredOwners = useMemo(() => {
    if (!ownerSearchQuery.trim()) return enrichedOwners;
    const query = ownerSearchQuery.toLowerCase().trim();
    return enrichedOwners.filter(o => 
      o.fullName.toLowerCase().includes(query) || 
      (o.email && o.email.toLowerCase().includes(query)) || 
      (o.phone && o.phone.toLowerCase().includes(query)) ||
      o.ownerId.toLowerCase().includes(query) ||
      o.documentId.toLowerCase().includes(query) ||
      o.location.toLowerCase().includes(query)
    );
  }, [enrichedOwners, ownerSearchQuery]);

  if (!currentUser || currentUser.email !== 'jameslevis94@gmail.com') {
    return (
      <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl" id="ceo-component-unauthorized-view">
        <Shield className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-slate-400 text-sm mb-6">Unauthorized access to CEO Command Center detected. This page is only accessible via the verified CEO account.</p>
        <button onClick={onBack} className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-600 rounded-xl text-xs font-bold text-white cursor-pointer select-none transition-all">Go back</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh] bg-slate-950/10 w-full rounded-3xl">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="w-full text-slate-200 selection:bg-indigo-500/30 font-sans antialiased max-w-7xl mx-auto px-4 py-6 md:py-10">
      
      {/* 1. TOP HEADER NAVIGATION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-3 bg-slate-900 border border-slate-800 rounded-2xl hover:bg-slate-800 transition-all duration-200 text-slate-400 hover:text-white active:scale-95 shadow-inner cursor-pointer"
            id="ceo-dashboard-back-btn"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-4">
            <MakaziLogo iconSize={52} showText={false} />
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1 px-2.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest border border-indigo-500/20 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> High Agency Headquarters
                </span>
              </div>
              <h1 className="text-3xl font-black text-white tracking-tighter uppercase mt-1 italic">
                Makazi CEO Command Log
              </h1>
              <p className="text-xs text-slate-400">
                Operational dashboard overviewing booking requests, property transactions, and partner hosts.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-center">
          <button
            onClick={() => {
              setActiveSubTab('content');
              setTimeout(() => {
                document.getElementById('ceo-hero-editor-section')?.scrollIntoView({ behavior: 'smooth' });
              }, 80);
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95 ${
              activeSubTab === 'content'
                ? 'bg-indigo-600 text-white border border-indigo-400 ring-2 ring-indigo-400/30'
                : 'bg-indigo-600/20 hover:bg-indigo-600/35 text-indigo-200 border border-indigo-500/40'
            }`}
            id="ceo-hariri-hero-header-btn"
            title="Hariri Hero Banner, Video, na Mzunguko wa Masaa 5"
          >
            <Pencil className="w-3.5 h-3.5 text-yellow-300" />
            <span>Hariri Hero (CEO)</span>
          </button>
          <button
            onClick={() => loadData(true)}
            disabled={syncing}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95 disabled:opacity-50"
            id="ceo-sync-button"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-indigo-400' : ''}`} />
            {syncing ? 'Syncing...' : 'Force Live Sync'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-450 text-xs flex items-center gap-2" id="ceo-error-banner">
          <XCircle className="w-4 h-4 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. DASHBOARD STATISTICS PANEL (All cards interactive on click) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-10" id="ceo-statistics-panel">
        
        {/* 1. TOTAL USERS */}
        <div 
          onClick={() => {
            setActiveSubTab('users');
            const el = document.getElementById('ceo-main-subtab-container');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className={`border p-4 rounded-2xl shadow-sm transition-all cursor-pointer group active:scale-95 ${
            activeSubTab === 'users'
              ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/20'
              : 'bg-slate-900/50 border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-900/80'
          }`}
          title="Click to view all registered users across the platform"
        >
          <p className="text-[10px] text-slate-500 group-hover:text-indigo-400 font-bold uppercase tracking-wider transition-colors">Total Users</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-2xl font-black text-white font-mono">{stats.totalUsers}</h3>
            <Users className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
          </div>
        </div>

        {/* 2. TOTAL OWNERS */}
        <div 
          onClick={() => {
            setActiveSubTab('owners');
            setOwnerSearchQuery('');
            const el = document.getElementById('ceo-main-subtab-container');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className={`border p-4 rounded-2xl shadow-sm transition-all cursor-pointer group active:scale-95 ${
            activeSubTab === 'owners'
              ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/20'
              : 'bg-slate-900/50 border-slate-800/80 hover:border-amber-500/50 hover:bg-slate-900/80'
          }`}
          title="Click to take to all owners in the app"
        >
          <p className="text-[10px] text-slate-500 group-hover:text-amber-400 font-bold uppercase tracking-wider transition-colors">Total Owners</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-2xl font-black text-white font-mono">{stats.totalOwners}</h3>
            <Crown className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
        </div>

        {/* 3. PROPERTIES */}
        <div 
          onClick={() => {
            setActiveSubTab('owners');
            const el = document.getElementById('ceo-main-subtab-container');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="bg-slate-900/50 border border-slate-800/80 p-4 rounded-2xl shadow-sm hover:border-blue-500/50 hover:bg-slate-900/80 transition-all cursor-pointer group active:scale-95"
          title="Click to view host listings & properties"
        >
          <p className="text-[10px] text-slate-500 group-hover:text-blue-400 font-bold uppercase tracking-wider transition-colors">Properties</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-2xl font-black text-white font-mono">{stats.totalProperties}</h3>
            <Tent className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
          </div>
        </div>

        {/* 4. INQUIRIES SENT */}
        <div 
          onClick={() => {
            setActiveSubTab('requests');
            setStatusFilter('all');
            setOwnerFilterForRequests(null);
            setSearchQuery('');
            setCurrentPage(1);
            const el = document.getElementById('ceo-main-subtab-container');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className={`border p-4 rounded-2xl shadow-sm transition-all cursor-pointer group active:scale-95 col-span-2 md:col-span-1 ${
            activeSubTab === 'requests' && statusFilter === 'all'
              ? 'bg-indigo-950/50 border-indigo-500 ring-2 ring-indigo-500/20'
              : 'bg-slate-900/50 border-indigo-500/40 hover:border-indigo-400 hover:bg-indigo-950/20'
          }`}
          title="Click to show all requests sorted from new to last"
        >
          <p className="text-[10px] text-indigo-400 font-black uppercase tracking-wider">Inquiries Sent</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-2xl font-black text-indigo-300 font-mono">{stats.totalRequests}</h3>
            <Activity className="w-5 h-5 text-indigo-400 animate-pulse group-hover:scale-110 transition-transform" />
          </div>
        </div>

        {/* 5. PENDING INQUIRY */}
        <div 
          onClick={() => {
            setActiveSubTab('requests');
            setStatusFilter('pending');
            setCurrentPage(1);
            const el = document.getElementById('ceo-main-subtab-container');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className={`border p-4 rounded-2xl shadow-sm transition-all cursor-pointer group active:scale-95 ${
            activeSubTab === 'requests' && statusFilter === 'pending'
              ? 'bg-amber-950/50 border-amber-500 ring-2 ring-amber-500/20'
              : 'bg-slate-900/50 border-slate-800/80 hover:border-amber-400 hover:bg-amber-950/20'
          }`}
          title="Click to view pending inquiries"
        >
          <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Pending Inquiry</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-2xl font-black text-amber-400 font-mono">{stats.pending}</h3>
            <Clock className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
        </div>

        {/* 6. APPROVED INQUIRY */}
        <div 
          onClick={() => {
            setActiveSubTab('requests');
            setStatusFilter('approved');
            setCurrentPage(1);
            const el = document.getElementById('ceo-main-subtab-container');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className={`border p-4 rounded-2xl shadow-sm transition-all cursor-pointer group active:scale-95 ${
            activeSubTab === 'requests' && statusFilter === 'approved'
              ? 'bg-emerald-950/50 border-emerald-500 ring-2 ring-emerald-500/20'
              : 'bg-slate-900/50 border-slate-800/80 hover:border-emerald-400 hover:bg-emerald-950/20'
          }`}
          title="Click to view approved inquiries"
        >
          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Approved Inquiry</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-2xl font-black text-emerald-400 font-mono">{stats.approved}</h3>
            <CheckCircle className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
        </div>

        {/* 7. REJECTED INQUIRY */}
        <div 
          onClick={() => {
            setActiveSubTab('requests');
            setStatusFilter('rejected');
            setCurrentPage(1);
            const el = document.getElementById('ceo-main-subtab-container');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className={`border p-4 rounded-2xl shadow-sm transition-all cursor-pointer group active:scale-95 ${
            activeSubTab === 'requests' && statusFilter === 'rejected'
              ? 'bg-rose-950/50 border-rose-500 ring-2 ring-rose-500/20'
              : 'bg-slate-900/50 border-slate-800/80 hover:border-rose-400 hover:bg-rose-950/20'
          }`}
          title="Click to view rejected inquiries"
        >
          <p className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">Rejected Inquiry</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-2xl font-black text-rose-400 font-mono">{stats.rejected}</h3>
            <XCircle className="w-5 h-5 text-rose-500 group-hover:scale-110 transition-transform" />
          </div>
        </div>

        {/* 8. UPGRADES CLAIMS */}
        <div 
          onClick={() => {
            setActiveSubTab('upgrades');
            const el = document.getElementById('ceo-main-subtab-container');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className={`border p-4 rounded-2xl shadow-md transition-all cursor-pointer active:scale-95 group ${
            activeSubTab === 'upgrades'
              ? 'bg-amber-950/50 border-[#f59e0b] ring-2 ring-[#f59e0b]/20'
              : 'bg-slate-900/50 border-[#f59e0b]/20 hover:bg-slate-950/40 hover:border-[#f59e0b]/40'
          }`}
          title="Click to review account upgrade payment claims"
        >
          <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">Upgrades Claims</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-2xl font-black text-[#f59e0b] font-mono">{stats.pendingUpgrades || 0}</h3>
            <Crown className="w-5 h-5 text-[#f59e0b] animate-pulse group-hover:scale-110 transition-transform" />
          </div>
        </div>

        {/* 9. PENDING BROKERS */}
        <div 
          onClick={() => {
            setActiveSubTab('brokers');
            setBrokerFilter('pending');
            const el = document.getElementById('ceo-main-subtab-container');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className={`border p-4 rounded-2xl shadow-md transition-all cursor-pointer active:scale-95 group ${
            activeSubTab === 'brokers'
              ? 'bg-emerald-950/50 border-emerald-500 ring-2 ring-emerald-500/20'
              : 'bg-slate-900/50 border-emerald-500/20 hover:bg-slate-950/40 hover:border-emerald-500/40'
          }`}
          title="Click to review pending broker applications"
        >
          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider font-sans">Pending Brokers</p>
          <div className="flex items-end justify-between mt-2 font-sans">
            <h3 className="text-2xl font-black text-emerald-400 font-mono">{brokerApplications.filter(app => app.status === 'pending').length}</h3>
            <Award className="w-5 h-5 text-emerald-400 animate-pulse group-hover:scale-110 transition-transform" />
          </div>
        </div>

        {/* 10. HARIRI HERO (CEO) */}
        <div 
          onClick={() => {
            setActiveSubTab('content');
            const el = document.getElementById('ceo-main-subtab-container');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className={`border p-4 rounded-2xl shadow-md transition-all cursor-pointer active:scale-95 group ${
            activeSubTab === 'content'
              ? 'bg-indigo-950/50 border-indigo-500 ring-2 ring-indigo-500/20'
              : 'bg-slate-900/50 border-indigo-500/20 hover:bg-slate-950/40 hover:border-indigo-500/40'
          }`}
          title="Click to open Hariri Hero (CEO) editorial suite"
        >
          <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider font-sans">Hariri Hero (CEO)</p>
          <div className="flex items-end justify-between mt-2 font-sans">
            <h3 className="text-sm font-black text-white truncate max-w-[140px]">{heroForm.badge}</h3>
            <Pencil className="w-4 h-4 text-yellow-300 animate-pulse group-hover:scale-110 transition-transform" />
          </div>
        </div>

      </div>

      {/* 3. SUB-METRIC TABS SWITCHER */}
      <div className="flex items-center border-b border-slate-800 mb-8 gap-2 overflow-x-auto scrollbar-none" id="ceo-main-subtab-container">
        <button
          onClick={() => {
            setActiveSubTab('requests');
            setOwnerFilterForRequests(null);
          }}
          className={`px-6 py-3 text-xs uppercase font-black tracking-widest border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeSubTab === 'requests'
              ? 'border-indigo-500 text-white font-black'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
          id="ceo-tab-requests"
        >
          <Database className="w-3.5 h-3.5 text-indigo-400" />
          User Requests ({enrichedRequests.length})
        </button>
        <button
          onClick={() => setActiveSubTab('owners')}
          className={`px-6 py-3 text-xs uppercase font-black tracking-widest border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeSubTab === 'owners'
              ? 'border-indigo-500 text-white font-black'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
          id="ceo-tab-owners"
        >
          <Crown className="w-3.5 h-3.5 text-amber-500" />
          Owner Profiles ({enrichedOwners.length})
        </button>
        <button
          onClick={() => setActiveSubTab('users')}
          className={`px-6 py-3 text-xs uppercase font-black tracking-widest border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeSubTab === 'users'
              ? 'border-indigo-500 text-white font-black'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
          id="ceo-tab-users"
        >
          <Users className="w-3.5 h-3.5 text-indigo-400" />
          Total Users ({allAppUsers.length})
        </button>
        <button
          onClick={() => setActiveSubTab('upgrades')}
          className={`px-6 py-3 text-xs uppercase font-black tracking-widest border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'upgrades'
              ? 'border-indigo-500 text-[#f59e0b] font-black'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
          id="ceo-tab-upgrades"
        >
          Upgrades Queue ({stats.pendingUpgrades || 0})
        </button>
        <button
          onClick={() => setActiveSubTab('brokers')}
          className={`px-6 py-3 text-xs uppercase font-black tracking-widest border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'brokers'
              ? 'border-emerald-500 text-emerald-400 font-black shadow-[0_-2px_0_inset_#10b981]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
          id="ceo-tab-brokers"
        >
          ⭐ Brokers Review ({brokerApplications.filter(app => app.status === 'pending').length})
        </button>
        <button
          onClick={() => setActiveSubTab('chats')}
          className={`px-6 py-3 text-xs uppercase font-black tracking-widest border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'chats'
              ? 'border-indigo-500 text-white font-black'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
          id="ceo-tab-chats"
        >
          HQ COMM CHANNELS ({conversations.length})
        </button>
        <button
          onClick={() => setActiveSubTab('payments')}
          className={`px-6 py-3 text-xs uppercase font-black tracking-widest border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'payments'
              ? 'border-indigo-500 text-amber-500 font-extrabold shadow-[0_-2px_0_inset_#f59e0b]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
          id="ceo-tab-payments"
        >
          💳 Payments & Accounts
        </button>
        <button
          onClick={() => setActiveSubTab('content')}
          className={`px-6 py-3 text-xs uppercase font-black tracking-widest border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeSubTab === 'content'
              ? 'border-indigo-500 text-indigo-400 font-black shadow-[0_-2px_0_inset_#6366f1]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
          id="ceo-tab-content"
        >
          <Pencil className="w-3.5 h-3.5 text-yellow-400" />
          Hariri Hero (CEO)
        </button>
      </div>

      {/* 4. PRIMARY CONTROLLER CHANNELS */}
      {activeSubTab === 'requests' && (
        <section id="requests-management-section">

          {/* STAYS PAYMENTS REVIEW QUEUE */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 mb-8 text-left space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-800 pb-3 gap-2">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-500 animate-pulse" />
                  <span>Stay Bookings Cash Payments Review Queue</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Verify receipts and authorize payments submitted by clients for their luxury home stay reservations.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-black text-amber-400 font-mono self-start sm:self-auto">
                {bookings.filter(b => b.paymentStatus === 'Pending').length} Pending Review
              </span>
            </div>

            {bookings.filter(b => b.paymentStatus === 'Pending' || b.paymentStatus === 'Approved' || b.paymentStatus === 'Rejected').length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                No active stay payment submissions detected in the centralized ledger.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bookings.filter(b => b.paymentStatus === 'Pending' || b.paymentStatus === 'Approved' || b.paymentStatus === 'Rejected').map((booking) => {
                  return (
                    <div
                      key={booking.id}
                      className={`p-5 rounded-2xl border transition-all text-left flex flex-col justify-between ${
                        booking.paymentStatus === 'Approved'
                          ? 'bg-emerald-950/10 border-emerald-900/30'
                          : booking.paymentStatus === 'Rejected'
                          ? 'bg-rose-950/10 border-rose-900/30'
                          : 'bg-slate-950/90 border-slate-800/80 shadow-lg'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-black">STAY ID: {booking.id}</span>
                            <h4 className="font-extrabold text-white text-sm mt-0.5">{booking.house.title}</h4>
                          </div>
                          
                          <span className={`inline-flex items-center gap-1 text-[9px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                            booking.paymentStatus === 'Approved'
                              ? 'bg-green-500/20 text-green-300 border border-green-500/20'
                              : booking.paymentStatus === 'Rejected'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/20'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/20 animate-pulse'
                          }`}>
                            {booking.paymentStatus}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-300 bg-black/30 p-3 rounded-xl border border-white/5">
                          <div>
                            <p className="text-[9px] text-slate-500 uppercase tracking-wider font-extrabold">Method selected</p>
                            <p className="text-white font-bold">{booking.paymentMethod}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-500 uppercase tracking-wider font-extrabold">Sender Ref/Phone</p>
                            <p className="text-amber-400 font-mono font-bold select-all">{booking.paymentNumber}</p>
                          </div>
                          <div className="col-span-2 border-t border-white/5 pt-1.5 mt-1 flex justify-between items-center font-semibold text-xs">
                            <span>Cost: <b className="text-slate-100">${booking.totalPrice || 0}</b></span>
                            <span>Period: <b className="text-slate-100">{booking.startDate}</b></span>
                          </div>
                        </div>

                        {booking.paymentReceiptUrl && (
                          <div className="space-y-1">
                            <p className="text-[10px] text-slate-500 font-black uppercase">Receipt screenshot attachment:</p>
                            <div className="relative group rounded-xl overflow-hidden border border-white/10 bg-black/40 p-2 text-center">
                              <img
                                src={booking.paymentReceiptUrl}
                                alt="Transaction Proof Receipt"
                                className="max-h-36 mx-auto object-contain rounded-lg"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {booking.paymentStatus === 'Pending' && (
                        <div className="flex gap-2 mt-4 pt-3.5 border-t border-white/5 justify-end">
                          <button
                            type="button"
                            onClick={() => handleUpdateBookingPaymentStatus(booking.id, 'Rejected')}
                            className="px-3.5 py-1.5 text-[11px] bg-rose-500/25 hover:bg-rose-500/40 text-rose-300 font-bold rounded-lg border border-rose-500/30 cursor-pointer active:scale-95 transition-all select-none"
                          >
                            Reject Receipt
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateBookingPaymentStatus(booking.id, 'Approved')}
                            className="px-4 py-1.5 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-lg border border-emerald-500/20 cursor-pointer active:scale-95 transition-all select-none shadow-md shadow-emerald-950/20"
                          >
                            Approve Payment ✔
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* APPWRITE ERROR BANNER (IF CONNECTIVITY OR PERMISSION FAILS) */}
          {requestsError && (
            <div className="mb-6 p-5 bg-rose-500/10 border border-rose-500/30 rounded-3xl text-left space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">Appwrite Requests Database Error</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {requestsError.type || 'Error'} ({requestsError.code})
                      </span>
                    </div>
                    <p className="text-xs text-rose-300/90 mt-0.5 font-medium">{requestsError.message}</p>
                  </div>
                </div>

                <button
                  onClick={() => loadData(true)}
                  disabled={syncing}
                  className="px-3.5 py-1.5 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/40 text-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                  Retry Sync
                </button>
              </div>

              {requestsError.type === 'project_paused' && (
                <div className="p-3 bg-slate-950/60 rounded-xl border border-rose-500/20 text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-300 leading-relaxed">
                    Notice: Your Appwrite Cloud project was paused due to inactivity. You can resume operations by logging into your Appwrite Console and restoring the project with 1 click.
                  </span>
                  <a
                    href="https://cloud.appwrite.io/console"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-[11px] whitespace-nowrap transition-all shadow-md shrink-0"
                  >
                    Open Appwrite Console <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-400 font-mono pt-1 border-t border-rose-500/20">
                <span>Database: <b className="text-slate-200">{requestsError.databaseId || APPWRITE_DEFAULTS.databaseId}</b></span>
                <span>Collection: <b className="text-slate-200">{requestsError.collectionId || APPWRITE_DEFAULTS.requestsCollectionId}</b></span>
              </div>
            </div>
          )}

          {/* ACTIVE FILTER BY OWNER CHIP (IF APPLIED) */}
          {ownerFilterForRequests && (
            <div className="mb-4 p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-slate-300">
                  Filtering requests associated with Owner: <b className="text-indigo-300 font-mono">{ownerFilterForRequests}</b>
                </span>
              </div>
              <button
                onClick={() => setOwnerFilterForRequests(null)}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
              >
                Clear Owner Filter ✕
              </button>
            </div>
          )}
          
          {/* SEARCH & FILTERS BAR */}
          <div className="flex flex-col lg:flex-row items-center gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80 mb-6">
            <div className="relative w-full lg:flex-1">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by Request ID, User ID, Owner ID, applicant name, phone, email, or property..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-950 hover:bg-slate-950/80 filter duration-250 border border-slate-800/80 pl-10 pr-4 py-2.5 text-xs rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 text-white font-medium"
                id="requests-search-input"
              />
            </div>

            <div className="flex flex-wrap md:flex-nowrap items-center justify-between lg:justify-end gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto scrollbar-none">
                {(['all', 'pending', 'approved', 'rejected'] as const).map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      setStatusFilter(item);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border ${
                      statusFilter === item
                        ? 'bg-indigo-600 text-white border-indigo-455'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              {/* VIEW SWITCHER: CARDS VS TABLE */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setRequestsViewMode('cards')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    requestsViewMode === 'cards'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Card View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[10px]">Cards</span>
                </button>
                <button
                  onClick={() => setRequestsViewMode('table')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    requestsViewMode === 'table'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Table View"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[10px]">Table</span>
                </button>
              </div>
            </div>
          </div>

          {/* LOADING STATE */}
          {requestsLoading && (
            <div className="space-y-4 py-8">
              {[1, 2, 3].map((n) => (
                <div key={n} className="p-6 bg-slate-900/30 border border-slate-800/60 rounded-3xl animate-pulse space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-slate-800 rounded w-1/4" />
                    <div className="h-6 bg-slate-800 rounded-full w-20" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="h-16 bg-slate-800/40 rounded-xl" />
                    <div className="h-16 bg-slate-800/40 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* REQUESTS LIST CONTAINER */}
          {!requestsLoading && (
            <>
              {filteredRequests.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/20 rounded-3xl border border-dashed border-slate-800" id="requests-empty-state">
                  <Info className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-400">No matching user requests found</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {searchQuery || statusFilter !== 'all' || ownerFilterForRequests
                      ? 'Try clearing the search or resetting active filters.'
                      : 'No requests currently exist in the Appwrite requests collection.'}
                  </p>
                </div>
              ) : requestsViewMode === 'cards' ? (
                /* 1. INTERACTIVE RICH CARDS VIEW */
                <div className="space-y-6">
                  {paginatedRequests.map((req) => {
                    const statusMeta = getStatusColor(req.status);
                    const isExpandedRaw = expandedRequestDocId === req.documentId;
                    const associatedOwner = req.associatedOwner;
                    const associatedHouse = req.associatedHouse;

                    const ownerDisplayName = associatedOwner?.fullName || req.currentHolder || req.ownerId || 'Unassigned Host';
                    const ownerAvatar = associatedOwner?.profileImage;

                    return (
                      <div
                        key={req.documentId}
                        onClick={() => setSelectedRequestForDetail(req)}
                        className="bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/60 hover:bg-slate-900/80 rounded-3xl p-6 shadow-md shadow-slate-950/30 max-w-full backdrop-blur-md relative overflow-hidden transition-all duration-200 cursor-pointer group"
                        id={`request-card-${req.documentId}`}
                      >
                        {/* Status Badge & Inspect button in corner */}
                        <div className="absolute top-5 right-5 flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRequestForDetail(req);
                            }}
                            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/40 text-indigo-200 hover:text-white rounded-full text-[10px] font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Who Sent To Who ➔</span>
                          </button>
                          <span className={`inline-flex items-center gap-1 text-[10px] px-3 py-1.5 border rounded-full font-black uppercase tracking-wider ${statusMeta.bg}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                            <span>{statusMeta.text}</span>
                          </span>
                        </div>

                        {/* Top Identification Header: Doc ID & Request Type */}
                        <div className="flex flex-wrap items-center gap-2 mb-2 pr-40 sm:pr-60">
                          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-500 uppercase font-black">DOC ID:</span>
                            <span className="text-[11px] text-indigo-400 font-mono font-bold select-all">{req.documentId}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyText(req.documentId, `req-${req.documentId}`);
                              }}
                              className="text-slate-500 hover:text-white transition-colors cursor-pointer"
                              title="Copy Document ID"
                            >
                              {copiedFieldId === `req-${req.documentId}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>

                          <div className="flex items-center gap-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                            <Tag className="w-3 h-3 text-indigo-400" />
                            <span>Type: {req.requestType}</span>
                          </div>

                          <span className="text-[10px] text-slate-500 font-mono">
                            Created: {(() => {
                              try {
                                return new Date(req.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
                              } catch {
                                return req.createdAt;
                              }
                            })()}
                          </span>
                        </div>

                        {/* VISUAL RELATIONSHIP PATHWAY BANNER */}
                        <div className="my-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 group-hover:border-indigo-500/30 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[9px] uppercase tracking-widest text-indigo-400 font-black flex items-center gap-1.5">
                              <ArrowRight className="w-3 h-3 text-cyan-400" />
                              Routing Bridge: [WHO SENT: {req.fullName}] ➔ [TO WHO: {ownerDisplayName}]
                            </span>
                            <span className="text-[9px] text-indigo-300/80 font-mono font-bold">
                              Click to view who sent to who
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                            {/* 1. USER */}
                            <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800">
                              <span className="text-[9px] text-slate-500 font-black uppercase flex items-center gap-1">
                                <Users className="w-3 h-3 text-indigo-400" /> Submitter User
                              </span>
                              <p className="font-bold text-white text-xs truncate mt-0.5">{req.fullName}</p>
                              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-0.5">
                                <span>UID:</span>
                                <span className="text-indigo-300 truncate select-all">{req.userId}</span>
                                <button
                                  onClick={() => handleCopyText(req.userId, `uid-${req.documentId}`)}
                                  className="text-slate-500 hover:text-white transition-colors cursor-pointer shrink-0"
                                  title="Copy User ID"
                                >
                                  {copiedFieldId === `uid-${req.documentId}` ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                                </button>
                              </div>
                            </div>

                            {/* 2. REQUEST */}
                            <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800">
                              <span className="text-[9px] text-slate-500 font-black uppercase flex items-center gap-1">
                                <FileText className="w-3 h-3 text-cyan-400" /> Request Details
                              </span>
                              <p className="font-bold text-cyan-300 text-xs truncate mt-0.5">{req.requestType}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">Status: <b className="text-slate-200">{req.status}</b></p>
                            </div>

                            {/* 3. OWNER */}
                            <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800">
                              <span className="text-[9px] text-slate-500 font-black uppercase flex items-center gap-1">
                                <Crown className="w-3 h-3 text-amber-400" /> Assigned Owner
                              </span>
                              <p className="font-bold text-white text-xs truncate mt-0.5">{ownerDisplayName}</p>
                              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-0.5">
                                <span>OID:</span>
                                <span className="text-amber-300 truncate select-all">{req.ownerId || associatedOwner?.ownerId || 'N/A'}</span>
                                {req.ownerId && (
                                  <button
                                    onClick={() => handleCopyText(req.ownerId!, `oid-${req.documentId}`)}
                                    className="text-slate-500 hover:text-white transition-colors cursor-pointer shrink-0"
                                    title="Copy Owner ID"
                                  >
                                    {copiedFieldId === `oid-${req.documentId}` ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* 4. PROPERTY */}
                            <div className="p-2.5 bg-slate-900/50 rounded-xl border border-slate-800">
                              <span className="text-[9px] text-slate-500 font-black uppercase flex items-center gap-1">
                                <Tent className="w-3 h-3 text-emerald-400" /> Stay Property
                              </span>
                              <p className="font-bold text-white text-xs truncate mt-0.5">
                                {associatedHouse?.title || req.propertyId || 'Listing Property'}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                {associatedHouse?.location || 'Direct Cloud Post'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* TWO-COLUMN DETAILS LAYOUT */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4 pt-4 border-t border-slate-900">
                          {/* LEFT: SUBMITTER PROFILE & CONTACT INFO */}
                          <div className="space-y-3">
                            <h4 className="text-xs uppercase font-black text-white/50 tracking-wider flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-slate-400" /> Submitter Contact Profile
                            </h4>

                            <div className="space-y-2">
                              <p className="text-slate-100 font-bold text-base">{req.fullName}</p>
                              
                              <div className="flex flex-col gap-1.5 text-xs text-slate-400">
                                {req.phone && (
                                  <span className="flex items-center gap-1.5 font-bold">
                                    <Phone className="w-3.5 h-3.5 text-slate-500" /> Phone: 
                                    <a href={`tel:${req.phone}`} className="text-slate-200 select-all font-mono hover:text-indigo-400 transition-colors">
                                      {req.phone}
                                    </a>
                                  </span>
                                )}
                                {req.email && (
                                  <span className="flex items-center gap-1.5">
                                    <Mail className="w-3.5 h-3.5 text-slate-500" /> Email: 
                                    <a href={`mailto:${req.email}`} className="text-slate-200 select-all font-mono hover:text-indigo-400 transition-colors">
                                      {req.email}
                                    </a>
                                  </span>
                                )}
                                {req.moveInDate && (
                                  <span className="flex items-center gap-1.5 font-bold mt-1 text-emerald-400 font-mono">
                                    <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Move-In Date: {req.moveInDate}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Remarks / Preferences */}
                            {req.messages && (
                              <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3">
                                <span className="text-[10px] font-black uppercase tracking-wide text-slate-500 block mb-1">
                                  User Preferences & Remarks:
                                </span>
                                <p className="text-xs text-slate-300 leading-relaxed font-medium italic">
                                  "{req.messages}"
                                </p>
                              </div>
                            )}
                          </div>

                          {/* RIGHT: ASSOCIATED OWNER & PROPERTY DETAILS */}
                          <div className="space-y-3 border-t lg:border-t-0 lg:border-l border-slate-900 pt-4 lg:pt-0 lg:pl-6">
                            <h4 className="text-xs uppercase font-black text-white/50 tracking-wider flex items-center gap-1.5">
                              <Crown className="w-3.5 h-3.5 text-slate-400" /> Associated Owner & Destination Property
                            </h4>

                            {/* Owner Cardlet */}
                            <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5 min-w-0">
                                {ownerAvatar ? (
                                  <img 
                                    src={ownerAvatar} 
                                    alt={ownerDisplayName} 
                                    className="w-10 h-10 rounded-xl object-cover border border-slate-800 shrink-0" 
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center font-black text-white text-sm shrink-0">
                                    {ownerDisplayName.charAt(0)}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-white truncate">{ownerDisplayName}</p>
                                  <p className="text-[10px] text-amber-400 font-mono truncate">
                                    Owner ID: {req.ownerId || associatedOwner?.ownerId || 'Unassigned'}
                                  </p>
                                  {associatedOwner?.phone && (
                                    <p className="text-[10px] text-slate-400 font-mono truncate">{associatedOwner.phone}</p>
                                  )}
                                </div>
                              </div>

                              {associatedOwner && (
                                <button
                                  onClick={() => {
                                    setActiveSubTab('owners');
                                    setOwnerSearchQuery(associatedOwner.fullName);
                                  }}
                                  className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-300 hover:text-white transition-all cursor-pointer whitespace-nowrap"
                                >
                                  View Profile ➔
                                </button>
                              )}
                            </div>

                            {/* Property Cardlet */}
                            {associatedHouse && (
                              <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 flex items-center gap-3">
                                {associatedHouse.images?.[0] && (
                                  <img
                                    src={associatedHouse.images[0]}
                                    alt={associatedHouse.title}
                                    className="w-12 h-12 object-cover rounded-lg shrink-0 border border-slate-800"
                                  />
                                )}
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-white truncate">{associatedHouse.title}</p>
                                  <p className="text-[10px] text-slate-400 flex items-center gap-0.5 mt-0.5">
                                    <MapPin className="w-2.5 h-2.5 text-rose-500" /> {associatedHouse.location}
                                  </p>
                                  <p className="text-[10px] text-indigo-400 font-mono font-bold mt-0.5">
                                    TSh {associatedHouse.amount?.toLocaleString()} / month
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* RAW JSON DOCUMENT TOGGLE */}
                        <div className="mt-4 pt-3 border-t border-slate-900 flex justify-between items-center text-[10px]">
                          <button
                            onClick={() => setExpandedRequestDocId(isExpandedRaw ? null : req.documentId)}
                            className="text-slate-500 hover:text-indigo-400 font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Code className="w-3 h-3" />
                            {isExpandedRaw ? 'Hide Raw Appwrite Document' : 'Inspect Raw Appwrite Document Fields'}
                          </button>
                        </div>

                        {/* RAW DOCUMENT VIEWER */}
                        {isExpandedRaw && (
                          <div className="mt-3 p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-bold text-slate-400 uppercase">Original Appwrite Document Payload:</span>
                              <button
                                onClick={() => handleCopyText(JSON.stringify(req.rawDoc, null, 2), `raw-req-${req.documentId}`)}
                                className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 rounded border border-slate-800 text-slate-400 hover:text-white flex items-center gap-1"
                              >
                                {copiedFieldId === `raw-req-${req.documentId}` ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                                Copy JSON
                              </button>
                            </div>
                            <pre className="text-[10px] font-mono text-cyan-300 overflow-x-auto p-2 bg-slate-950/80 rounded border border-slate-900 max-h-48 scrollbar-thin">
                              {JSON.stringify(req.rawDoc, null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* ACTIONS ROW: CEO Decision Gate */}
                        <div className="mt-6 pt-4 border-t border-slate-900 flex flex-wrap gap-2 items-center justify-between">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRequestForDetail(req);
                            }}
                            className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer shadow-lg shadow-indigo-600/30 flex items-center gap-2 active:scale-95"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Show Who Sent To Who ➔</span>
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateStatus(req.documentId, 'upcoming');
                              }}
                              disabled={req.status === 'upcoming' || req.status === 'pending'}
                              className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                            >
                              Reset to Pending
                            </button>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateStatus(req.documentId, 'rejected');
                              }}
                              disabled={req.status === 'rejected'}
                              className="px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider bg-rose-950/20 hover:bg-rose-900/20 border border-rose-900/30 hover:border-rose-800/40 text-rose-400 hover:text-rose-350 transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                            >
                              Reject Inquiry
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateStatus(req.documentId, 'approved');
                              }}
                              disabled={req.status === 'approved' || req.status === 'reserved & confirmed'}
                              className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 hover:scale-[1.01] active:scale-[0.99] border border-emerald-500/20 text-white transition-all cursor-pointer shadow-lg shadow-emerald-900/20 disabled:bg-slate-950 disabled:text-slate-600 disabled:opacity-30 disabled:border-slate-800 disabled:pointer-events-none"
                            >
                              Approve Stay
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              ) : (
                /* 2. STRUCTURED DATA TABLE VIEW */
                <div className="bg-slate-900/40 rounded-3xl border border-slate-800/80 overflow-hidden shadow-xl" id="requests-registry-table">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-950/60 text-[10px] text-indigo-400 font-extrabold uppercase tracking-widest">
                          <th className="py-4 px-5">Request / Doc ID</th>
                          <th className="py-4 px-5">User ID & Submitter</th>
                          <th className="py-4 px-5">Type</th>
                          <th className="py-4 px-5">Associated Owner</th>
                          <th className="py-4 px-5">Stay Property</th>
                          <th className="py-4 px-5">Created At</th>
                          <th className="py-4 px-5 text-center">Status</th>
                          <th className="py-4 px-5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-xs">
                        {paginatedRequests.map((req) => {
                          const statusMeta = getStatusColor(req.status);
                          const ownerDisplayName = req.associatedOwner?.fullName || req.currentHolder || req.ownerId || 'Unassigned Host';

                          return (
                            <tr 
                              key={req.documentId} 
                              onClick={() => setSelectedRequestForDetail(req)}
                              className="hover:bg-indigo-950/20 cursor-pointer transition-colors group"
                            >
                              <td className="py-4 px-5 font-mono text-[11px]">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-indigo-400 font-bold select-all">{req.documentId}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopyText(req.documentId, `tbl-${req.documentId}`);
                                    }}
                                    className="text-slate-500 hover:text-white transition-colors cursor-pointer"
                                    title="Copy Document ID"
                                  >
                                    {copiedFieldId === `tbl-${req.documentId}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                </div>
                              </td>
                              <td className="py-4 px-5">
                                <span className="font-extrabold text-white text-xs block truncate group-hover:text-indigo-300 transition-colors">{req.fullName}</span>
                                <span className="text-[10px] text-slate-500 font-mono tracking-tight font-bold">UID: {req.userId}</span>
                                {req.phone && <span className="text-[10px] text-slate-400 block font-mono">{req.phone}</span>}
                              </td>
                              <td className="py-4 px-5">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 whitespace-nowrap">
                                  {req.requestType}
                                </span>
                              </td>
                              <td className="py-4 px-5">
                                <span className="font-bold text-white text-xs block truncate">{ownerDisplayName}</span>
                                <span className="text-[10px] text-amber-400 font-mono">OID: {req.ownerId || req.associatedOwner?.ownerId || 'N/A'}</span>
                              </td>
                              <td className="py-4 px-5">
                                <span className="font-bold text-indigo-300 text-xs block truncate">{req.associatedHouse?.title || req.propertyId || 'Listing Property'}</span>
                                <span className="text-[10px] text-slate-500">{req.associatedHouse?.location || 'Direct Post'}</span>
                              </td>
                              <td className="py-4 px-5 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                                {(() => {
                                  try {
                                    return new Date(req.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                                  } catch {
                                    return req.createdAt;
                                  }
                                })()}
                              </td>
                              <td className="py-4 px-5 text-center">
                                <span className={`inline-flex items-center gap-1 text-[9px] px-2.5 py-1 border rounded-full font-black uppercase tracking-wider ${statusMeta.bg}`}>
                                  <span>{statusMeta.text}</span>
                                </span>
                              </td>
                              <td className="py-4 px-5 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedRequestForDetail(req);
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/40 text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1 shadow-sm"
                                    title="Click to view who sent to who"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>Who ➔ To Who</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUpdateStatus(req.documentId, 'approved');
                                    }}
                                    disabled={req.status === 'approved'}
                                    className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                                    title="Approve"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUpdateStatus(req.documentId, 'rejected');
                                    }}
                                    disabled={req.status === 'rejected'}
                                    className="p-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 text-[10px] font-bold cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                                    title="Reject"
                                  >
                                    <XCircle className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* PAGINATION CONTROLLER */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-10 bg-slate-900/30 p-4 border border-slate-800/60 rounded-2xl" id="requests-pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              
              <span className="text-xs text-slate-400 font-bold font-mono">
                Page {currentPage} of {totalPages} ({filteredRequests.length} total)
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 cursor-pointer"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </section>
      )}

      {activeSubTab === 'owners' && (
        <section id="owners-management-section">

          {/* APPWRITE ERROR BANNER (IF CONNECTIVITY OR PERMISSION FAILS) */}
          {ownersError && (
            <div className="mb-6 p-5 bg-rose-500/10 border border-rose-500/30 rounded-3xl text-left space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">Appwrite Owners Database Error</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {ownersError.type || 'Error'} ({ownersError.code})
                      </span>
                    </div>
                    <p className="text-xs text-rose-300/90 mt-0.5 font-medium">{ownersError.message}</p>
                  </div>
                </div>

                <button
                  onClick={() => loadData(true)}
                  disabled={syncing}
                  className="px-3.5 py-1.5 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/40 text-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                  Retry Sync
                </button>
              </div>

              {ownersError.type === 'project_paused' && (
                <div className="p-3 bg-slate-950/60 rounded-xl border border-rose-500/20 text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-300 leading-relaxed">
                    Notice: Your Appwrite Cloud project was paused due to inactivity. You can resume operations by logging into your Appwrite Console and restoring the project with 1 click.
                  </span>
                  <a
                    href="https://cloud.appwrite.io/console"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-[11px] whitespace-nowrap transition-all shadow-md shrink-0"
                  >
                    Open Appwrite Console <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-400 font-mono pt-1 border-t border-rose-500/20">
                <span>Database: <b className="text-slate-200">{ownersError.databaseId || APPWRITE_DEFAULTS.databaseId}</b></span>
                <span>Collection: <b className="text-slate-200">{ownersError.collectionId || APPWRITE_DEFAULTS.ownerCollectionId}</b></span>
              </div>
            </div>
          )}
          
          {/* OWNERS TOOLBAR & SEARCH BAR */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
            <div className="relative w-full sm:flex-1">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search owner profiles by full name, owner ID, document ID, email, phone, or location..."
                value={ownerSearchQuery}
                onChange={(e) => setOwnerSearchQuery(e.target.value)}
                className="w-full bg-slate-900 hover:bg-slate-900 filter duration-250 border border-slate-800 p-3 pl-11 text-xs rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 text-white font-medium shadow-sm"
                id="owners-search-input"
              />
            </div>

            {/* VIEW MODE TOGGLE */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                {filteredOwners.length} Unique Profile{filteredOwners.length === 1 ? '' : 's'}
              </span>

              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setOwnersViewMode('cards')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    ownersViewMode === 'cards'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Card View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[10px]">Cards</span>
                </button>
                <button
                  onClick={() => setOwnersViewMode('table')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    ownersViewMode === 'table'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Table View"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[10px]">Table</span>
                </button>
              </div>
            </div>
          </div>

          {/* LOADING STATE */}
          {ownersLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-8">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="p-6 bg-slate-900/30 border border-slate-800/60 rounded-3xl animate-pulse space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-800" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-slate-800 rounded w-1/3" />
                      <div className="h-3 bg-slate-800 rounded w-1/4" />
                    </div>
                  </div>
                  <div className="h-20 bg-slate-800/40 rounded-xl" />
                </div>
              ))}
            </div>
          )}

          {/* OWNERS CONTENT CONTAINER */}
          {!ownersLoading && (
            <>
              {filteredOwners.length === 0 ? (
                <div className="py-20 text-center bg-slate-900/20 rounded-3xl border border-dashed border-slate-800" id="owners-empty-state">
                  <Crown className="w-8 h-8 text-amber-500/40 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-400">No owner profiles found</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {ownerSearchQuery 
                      ? 'No profiles match your current search query.'
                      : 'No owner documents currently exist in Appwrite collection.'}
                  </p>
                </div>
              ) : ownersViewMode === 'cards' ? (
                /* 1. RICH OWNER PROFILE CARDS GRID */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="owners-cards-grid">
                  {filteredOwners.map((owner) => {
                    const isSuspended = deactivatedOwners.includes(owner.fullName);
                    const isExpandedProps = selectedOwnerRow === owner.documentId;
                    const isExpandedRaw = expandedOwnerDocId === owner.documentId;
                    const hasProperties = owner.properties.length > 0;
                    const hasRequests = owner.requests.length > 0;

                    return (
                      <div
                        key={owner.documentId}
                        className="bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/30 rounded-3xl p-6 shadow-md shadow-slate-950/30 flex flex-col justify-between transition-all duration-200 text-left relative overflow-hidden"
                        id={`owner-card-${owner.documentId}`}
                      >
                        {/* Top Identification Badge: Doc ID & Status */}
                        <div className="flex justify-between items-start gap-3 mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 font-mono uppercase font-black">DOC ID:</span>
                            <span className="text-[11px] text-indigo-400 font-mono font-bold select-all">{owner.documentId}</span>
                            <button
                              onClick={() => handleCopyText(owner.documentId, `own-doc-${owner.documentId}`)}
                              className="text-slate-500 hover:text-white transition-colors cursor-pointer"
                              title="Copy Document ID"
                            >
                              {copiedFieldId === `own-doc-${owner.documentId}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>

                          <button
                            onClick={() => handleToggleOwnerActivation(owner.fullName)}
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider cursor-pointer select-none transition-all active:scale-95 ${
                              isSuspended
                                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                            }`}
                          >
                            {isSuspended ? (
                              <>
                                <XCircle className="w-3 h-3" /> Suspended
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-3 h-3" /> Operational
                              </>
                            )}
                          </button>
                        </div>

                        {/* Owner Header: Profile Image, Name, Role & Owner ID */}
                        <div className="flex items-start gap-4 mb-4">
                          {owner.profileImage ? (
                            <img
                              src={owner.profileImage}
                              alt={owner.fullName}
                              className="w-14 h-14 rounded-2xl object-cover shadow-lg border border-slate-800 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 flex items-center justify-center font-black text-white text-xl shadow-lg shrink-0">
                              {owner.fullName.charAt(0)}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base font-extrabold text-white truncate">{owner.fullName}</h3>
                              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                                {owner.role || 'Host'}
                              </span>
                            </div>

                            {/* Owner / User ID */}
                            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-mono text-slate-400">
                              <span className="text-slate-500 uppercase font-black text-[9px]">OWNER/USER ID:</span>
                              <span className="text-amber-400 font-bold select-all">{owner.ownerId}</span>
                              <button
                                onClick={() => handleCopyText(owner.ownerId, `oid-val-${owner.documentId}`)}
                                className="text-slate-500 hover:text-white transition-colors cursor-pointer"
                                title="Copy Owner/User ID"
                              >
                                {copiedFieldId === `oid-val-${owner.documentId}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-rose-500" /> {owner.location}
                              </span>
                              <span className="text-amber-400 font-bold flex items-center gap-1">
                                ★ {owner.rating}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Contact Information (Email, Phone) */}
                        <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 mb-4 space-y-2 text-xs font-mono">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-500 text-[10px] font-black uppercase flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-500" /> Email:
                            </span>
                            {owner.email ? (
                              <a href={`mailto:${owner.email}`} className="text-slate-200 select-all hover:text-indigo-400 transition-colors font-bold truncate">
                                {owner.email}
                              </a>
                            ) : (
                              <span className="text-slate-600 italic">Not available</span>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-500 text-[10px] font-black uppercase flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-500" /> Phone:
                            </span>
                            {owner.phone ? (
                              <a href={`tel:${owner.phone}`} className="text-slate-200 select-all hover:text-indigo-400 transition-colors font-bold">
                                {owner.phone}
                              </a>
                            ) : (
                              <span className="text-slate-600 italic">Not available</span>
                            )}
                          </div>
                        </div>

                        {/* Bio / Description if available */}
                        {owner.bio && (
                          <div className="mb-4 text-xs text-slate-400 italic bg-black/20 p-2.5 rounded-xl border border-white/5">
                            "{owner.bio}"
                          </div>
                        )}

                        {/* RELATIONSHIPS: LISTED STAYS & RECEIVED REQUESTS */}
                        <div className="pt-3 border-t border-slate-900 space-y-3">
                          <span className="text-[9px] uppercase tracking-widest text-indigo-400 font-black block">
                            Platform Entity Relationships
                          </span>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {/* Listed Houses */}
                            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                  <Tent className="w-3 h-3 text-indigo-400" /> Listed Stays
                                </span>
                                <b className="text-white font-mono text-sm">{owner.properties.length}</b>
                              </div>
                              {hasProperties && (
                                <button
                                  onClick={() => setSelectedOwnerRow(isExpandedProps ? null : owner.documentId)}
                                  className="mt-2 text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  {isExpandedProps ? 'Hide Properties' : 'Inspect Properties ➔'}
                                </button>
                              )}
                            </div>

                            {/* Received Requests */}
                            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                  <FileText className="w-3 h-3 text-cyan-400" /> User Requests
                                </span>
                                <b className="text-white font-mono text-sm">{owner.requests.length}</b>
                              </div>
                              {hasRequests && (
                                <button
                                  onClick={() => {
                                    setOwnerFilterForRequests(owner.ownerId || owner.documentId);
                                    setActiveSubTab('requests');
                                  }}
                                  className="mt-2 text-[10px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  Filter Inquiries ➔
                                </button>
                              )}
                            </div>
                          </div>

                          {/* EXPANDED PROPERTIES LISTING */}
                          {isExpandedProps && hasProperties && (
                            <div className="mt-3 p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                              <h5 className="text-[10px] uppercase font-black text-indigo-400">
                                Properties Managed by {owner.fullName}:
                              </h5>
                              <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                                {owner.properties.map((prop) => (
                                  <div key={prop.id} className="p-2 bg-slate-900/60 rounded-lg flex items-center justify-between gap-2 border border-slate-800">
                                    <div className="flex items-center gap-2 min-w-0">
                                      {prop.images?.[0] && (
                                        <img src={prop.images[0]} alt={prop.title} className="w-8 h-8 rounded-md object-cover shrink-0" />
                                      )}
                                      <div className="min-w-0">
                                        <p className="text-white text-xs font-bold truncate">{prop.title}</p>
                                        <p className="text-[10px] text-slate-400 truncate">{prop.location} • TSh {prop.amount?.toLocaleString()}</p>
                                      </div>
                                    </div>
                                    {onDeleteHouse && (
                                      <button
                                        onClick={async () => {
                                          if (confirm(`CEO Admin Override Warning:\nAre you sure you want to PERMANENTLY remove listing "${prop.title}" from the Makazi Platform? This cannot be undone.`)) {
                                            await onDeleteHouse(prop.id);
                                          }
                                        }}
                                        className="p-1.5 text-rose-500 hover:text-white hover:bg-rose-600 rounded-md shrink-0 cursor-pointer transition-all"
                                        title="Delete listing"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* RAW JSON DOCUMENT TOGGLE */}
                        <div className="mt-4 pt-3 border-t border-slate-900 flex justify-between items-center text-[10px]">
                          <button
                            onClick={() => setExpandedOwnerDocId(isExpandedRaw ? null : owner.documentId)}
                            className="text-slate-500 hover:text-indigo-400 font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Code className="w-3 h-3" />
                            {isExpandedRaw ? 'Hide Raw Document' : 'Inspect Raw Appwrite Document Fields'}
                          </button>
                        </div>

                        {/* RAW DOCUMENT VIEWER */}
                        {isExpandedRaw && (
                          <div className="mt-3 p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-bold text-slate-400 uppercase">Original Appwrite Document Payload:</span>
                              <button
                                onClick={() => handleCopyText(JSON.stringify(owner.rawDoc, null, 2), `raw-own-${owner.documentId}`)}
                                className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 rounded border border-slate-800 text-slate-400 hover:text-white flex items-center gap-1"
                              >
                                {copiedFieldId === `raw-own-${owner.documentId}` ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                                Copy JSON
                              </button>
                            </div>
                            <pre className="text-[10px] font-mono text-cyan-300 overflow-x-auto p-2 bg-slate-950/80 rounded border border-slate-900 max-h-48 scrollbar-thin">
                              {JSON.stringify(owner.rawDoc, null, 2)}
                            </pre>
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              ) : (
                /* 2. STRUCTURED REGISTRY TABLE VIEW */
                <div className="bg-slate-900/40 rounded-3xl border border-slate-800/80 overflow-hidden shadow-xl" id="owners-registry-table">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-950/60 text-[10px] text-indigo-400 font-extrabold uppercase tracking-widest">
                          <th className="py-4 px-6">Owner Account Profile</th>
                          <th className="py-4 px-6">Appwrite Doc ID</th>
                          <th className="py-4 px-6">Owner/User ID</th>
                          <th className="py-4 px-6">Verification Data</th>
                          <th className="py-4 px-6">Location</th>
                          <th className="py-4 px-6 text-center">Listed Stays</th>
                          <th className="py-4 px-6 text-center">Requests</th>
                          <th className="py-4 px-6 text-center">Account Shield</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-xs">
                        {filteredOwners.map((owner) => {
                          const isSuspended = deactivatedOwners.includes(owner.fullName);

                          return (
                            <tr key={owner.documentId} className="hover:bg-slate-800/10 transition-colors">
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                  {owner.profileImage ? (
                                    <img 
                                      src={owner.profileImage} 
                                      alt={owner.fullName} 
                                      className="w-10 h-10 rounded-xl object-cover shadow-lg border border-slate-800 shrink-0"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-650 to-violet-750 flex items-center justify-center font-black text-white text-sm shadow-lg shrink-0">
                                      {owner.fullName.charAt(0)}
                                    </div>
                                  )}
                                  <div>
                                    <span className="font-extrabold text-white text-sm block">
                                      {owner.fullName}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-mono tracking-tight font-bold">
                                      {owner.role || 'Property Owner'}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              <td className="py-4 px-6 font-mono text-[11px]">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-indigo-400 font-bold select-all">{owner.documentId}</span>
                                  <button
                                    onClick={() => handleCopyText(owner.documentId, `tbl-doc-${owner.documentId}`)}
                                    className="text-slate-500 hover:text-white transition-colors cursor-pointer"
                                    title="Copy Document ID"
                                  >
                                    {copiedFieldId === `tbl-doc-${owner.documentId}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                </div>
                              </td>

                              <td className="py-4 px-6 font-mono text-[11px]">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-amber-400 font-bold select-all">{owner.ownerId}</span>
                                  <button
                                    onClick={() => handleCopyText(owner.ownerId, `tbl-oid-${owner.documentId}`)}
                                    className="text-slate-500 hover:text-white transition-colors cursor-pointer"
                                    title="Copy Owner ID"
                                  >
                                    {copiedFieldId === `tbl-oid-${owner.documentId}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                </div>
                              </td>

                              <td className="py-4 px-6 font-mono text-[11px] whitespace-nowrap">
                                <div className="space-y-0.5">
                                  <div className="text-slate-200 flex items-center gap-1 font-bold">
                                    <Phone className="w-3 h-3 text-slate-500" /> {owner.phone || 'N/A'}
                                  </div>
                                  <div className="text-slate-400 flex items-center gap-1">
                                    <Mail className="w-3 h-3 text-slate-500" /> {owner.email || 'N/A'}
                                  </div>
                                </div>
                              </td>

                              <td className="py-4 px-6 text-slate-300">
                                <span className="flex items-center gap-1 font-semibold">
                                  <MapPin className="w-3.5 h-3.5 text-rose-500" /> {owner.location}
                                </span>
                              </td>

                              <td className="py-4 px-6 text-center font-bold text-white font-mono text-sm">
                                {owner.properties.length}
                              </td>

                              <td className="py-4 px-6 text-center">
                                <button
                                  onClick={() => {
                                    setOwnerFilterForRequests(owner.ownerId || owner.documentId);
                                    setActiveSubTab('requests');
                                  }}
                                  className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 rounded-full font-mono text-xs text-indigo-400 font-extrabold cursor-pointer transition-all"
                                  title="View user requests for this owner"
                                >
                                  {owner.requests.length} Request(s)
                                </button>
                              </td>

                              <td className="py-4 px-6 text-center">
                                <button
                                  onClick={() => handleToggleOwnerActivation(owner.fullName)}
                                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider cursor-pointer select-none transition-all active:scale-95 ${
                                    isSuspended
                                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                                  }`}
                                >
                                  {isSuspended ? (
                                    <>
                                      <XCircle className="w-3.5 h-3.5" /> Suspended
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="w-3.5 h-3.5" /> Operational
                                    </>
                                  )}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

        </section>
      )}

      {activeSubTab === 'upgrades' && (
        <section id="upgrades-management-section" className="space-y-6 animate-fade-in font-sans">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/40 p-5 rounded-3xl border border-slate-800">
            <div className="text-left">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Crown className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
                <span>Upgrade Requests Queue</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">Review pending, approved or rejected host upgrade receipts securely.</p>
            </div>
            
            <button
              onClick={() => {
                try {
                  const saved = localStorage.getItem('makazi_upgrade_requests');
                  setUpgradeRequests(saved ? JSON.parse(saved) : []);
                } catch {}
              }}
              className="px-4 py-2 bg-slate-950 border border-white/5 hover:border-white/10 text-xs font-bold font-sans text-slate-300 hover:text-white rounded-xl cursor-pointer"
            >
              Refresh Claims
            </button>
          </div>

          <div className="space-y-6">
            {upgradeRequests.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/10 rounded-3xl border border-dashed border-slate-800">
                <Crown className="w-8 h-8 text-amber-500/40 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-400">No account upgrade claims found</p>
                <p className="text-xs text-slate-500 mt-1">Once hosts attempt to purchase a plan and submit their transaction details, they will list here.</p>
              </div>
            ) : (
              [...upgradeRequests].sort((a, b) => {
                const tA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
                const tB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
                return (isNaN(tB) ? 0 : tB) - (isNaN(tA) ? 0 : tA);
              }).map((req) => {
                const isPending = req.status === 'pending';
                return (
                  <div
                    key={req.id}
                    className="bg-slate-900/65 border border-slate-800 hover:border-indigo-500/20 rounded-3xl p-6 relative overflow-hidden transition-all duration-200"
                    id={`upgrade-request-card-${req.id}`}
                  >
                    {/* Status Badge */}
                    <div className="absolute top-6 right-6">
                      <span className={`inline-flex items-center gap-1 text-[10px] px-3 py-1 border rounded-full font-black uppercase tracking-wider ${
                        req.status === 'approved' 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                          : req.status === 'rejected'
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                          : 'bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse'
                      }`}>
                        <div className={`w-1 h-1 rounded-full ${
                          req.status === 'approved' ? 'bg-emerald-400' : req.status === 'rejected' ? 'bg-rose-400' : 'bg-amber-500'
                        }`} />
                        <span>{req.status}</span>
                      </span>
                    </div>

                    <p className="text-[10px] text-indigo-400 font-mono uppercase tracking-widest font-black flex items-center gap-1.5 mb-2">
                      <Crown className="w-3.5 h-3.5" /> ID: {req.id}
                    </p>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2 animate-fade-in">
                      
                      {/* Left Block: Submitter Info */}
                      <div className="space-y-3.5 text-left font-sans">
                        <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">User Account Profile</h4>
                        <div>
                          <p className="text-white font-bold text-lg">{req.userName || 'Anonymous Host'}</p>
                          <p className="text-xs text-slate-400 mt-1">Email: <span className="text-slate-200 select-all font-mono">{req.userEmail}</span></p>
                          <p className="text-xs text-slate-400 mt-1">User ID: <span className="text-slate-300 font-mono">{req.userId}</span></p>
                        </div>

                        <div className="bg-black/20 p-4 border border-white/5 rounded-2xl text-xs space-y-2.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400">Chosen Premium Plan:</span>
                            <span className="font-bold text-white uppercase font-mono">{req.plan}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400">Transaction ID / SMS reference:</span>
                            <span className="font-bold text-amber-400 font-mono select-all text-xs border-b border-dashed border-amber-400/30">{req.transactionNumber}</span>
                          </div>
                          <div className="flex justify-between items-center text-[11px] text-slate-500">
                            <span>Submission Date:</span>
                            <span>{req.submittedAt ? new Date(req.submittedAt).toLocaleString() : 'N/A'}</span>
                          </div>
                        </div>

                        {/* Actions for CEO */}
                        {isPending && (
                          <div className="flex gap-4 pt-4 font-sans">
                            <button
                              onClick={async () => {
                                if (confirm(`Approve payment receipt for ${req.userName} to level up to ${req.plan.toUpperCase()}?`)) {
                                  try {
                                    // 1. Update request status
                                    const updatedRequests = upgradeRequests.map(r => {
                                      if (r.id === req.id) return { ...r, status: 'approved' };
                                      return r;
                                    });
                                    setUpgradeRequests(updatedRequests);
                                    localStorage.setItem('makazi_upgrade_requests', JSON.stringify(updatedRequests));

                                    // 2. Clear pending status, upgrade subscription on active user Object
                                    if (currentUser && (currentUser.email === req.userEmail || currentUser.id === req.userId)) {
                                      if (onUpdateCurrentUser) {
                                        await onUpdateCurrentUser({
                                          ...currentUser,
                                          subscription: req.plan,
                                          subscriptionStatus: 'approved',
                                          pendingSubscriptionPlan: undefined,
                                          pendingTransactionNumber: undefined,
                                          pendingScreenshot: undefined,
                                          pendingSubmittedAt: undefined
                                        });
                                      }
                                    } else {
                                      // Or if it's another user in mock database
                                      // Update potential local storage of other users as well
                                      const usersJson = localStorage.getItem('makazi_users');
                                      if (usersJson) {
                                        try {
                                          const users = JSON.parse(usersJson);
                                          const matched = users.map((u: any) => {
                                            if (u.email === req.userEmail || u.id === req.userId) {
                                              return {
                                                ...u,
                                                subscription: req.plan,
                                                subscriptionStatus: 'approved',
                                                pendingSubscriptionPlan: undefined,
                                                pendingTransactionNumber: undefined,
                                                pendingScreenshot: undefined,
                                                pendingSubmittedAt: undefined
                                              };
                                            }
                                            return u;
                                          });
                                          localStorage.setItem('makazi_users', JSON.stringify(matched));
                                        } catch {}
                                      }
                                    }
                                    alert('Successfully approved subscription renewal and upgraded owner account!');
                                  } catch (err: any) {
                                    alert(`Approval failed: ${err.message}`);
                                  }
                                }
                              }}
                              className="flex-1 py-3 px-4 bg-emerald-650 hover:bg-emerald-600 text-slate-900 hover:text-white font-sans text-xs font-bold rounded-xl cursor-pointer transition-all active:scale-95 text-center flex items-center justify-center gap-1.5 uppercase font-mono tracking-widest shadow-lg"
                            >
                              <Check className="w-4 h-4" />
                              <span>Approve</span>
                            </button>

                            <button
                              onClick={async () => {
                                if (confirm(`Reject payment receipt for ${req.userName}?`)) {
                                  try {
                                    const updatedRequests = upgradeRequests.map(r => {
                                      if (r.id === req.id) return { ...r, status: 'rejected' };
                                      return r;
                                    });
                                    setUpgradeRequests(updatedRequests);
                                    localStorage.setItem('makazi_upgrade_requests', JSON.stringify(updatedRequests));

                                    if (currentUser && (currentUser.email === req.userEmail || currentUser.id === req.userId)) {
                                      if (onUpdateCurrentUser) {
                                        await onUpdateCurrentUser({
                                          ...currentUser,
                                          subscriptionStatus: 'rejected',
                                          pendingSubscriptionPlan: undefined,
                                          pendingTransactionNumber: undefined,
                                          pendingScreenshot: undefined,
                                          pendingSubmittedAt: undefined
                                        });
                                      }
                                    }
                                    alert('Successfully marked subscription payment as rejected!');
                                  } catch (err: any) {
                                    alert(`Rejection failed: ${err.message}`);
                                  }
                                }
                              }}
                              className="py-3 px-4 bg-transparent hover:bg-white/5 border border-white/10 hover:border-rose-500/40 text-rose-450 hover:text-rose-400 text-xs font-bold rounded-xl cursor-pointer transition-all active:scale-95 text-center flex items-center justify-center gap-1 font-sans"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject Receipt</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Right Block: Image Screenshot Preview */}
                      <div className="space-y-3 text-left font-sans col-span-1">
                        <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">Proof of Payment Screenshot</h4>
                        
                        {req.screenshot ? (
                          <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black group max-w-md">
                            <img
                              src={req.screenshot}
                              alt="Verification Receipt"
                              className="w-full h-full object-contain filter hover:scale-105 duration-300 pointer-events-auto"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 duration-200 flex items-center justify-center pointer-events-none p-3 text-center">
                              <span className="text-[10px] text-white font-mono uppercase font-bold tracking-widest break-all">
                                code: {req.transactionNumber}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="py-8 bg-slate-950/40 border border-white/5 rounded-2xl text-center text-xs text-slate-500 font-sans">
                            No verification receipt screenshot uploaded.
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      {activeSubTab === 'chats' && (
        <section id="ceo-chats-section" className="space-y-6 animate-fade-in font-sans">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/40 p-5 rounded-3xl border border-slate-800">
            <div className="text-left font-sans">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4.5 h-4.5 text-indigo-400" />
                <span>HQ Communications Console</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">Interject or correspond on behalf of estate hosts or as Official CEO HQ Support.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-950/20 border border-slate-800/80 rounded-[32px] overflow-hidden min-h-[550px] shadow-2xl backdrop-blur-3xl p-2.5">
            
            {/* LEFT PANE: SELECT DISCUSSION */}
            <div className="lg:col-span-4 border-r border-slate-800/60 flex flex-col h-full bg-slate-950/40 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/10">
                <h4 className="font-semibold text-xs text-white uppercase tracking-wider font-sans">Active Stay Channels</h4>
                <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full text-indigo-400 font-bold font-mono">
                  {conversations.length} Threads
                </span>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-800/30 max-h-[480px]">
                {conversations.length > 0 ? (
                  conversations.map((c) => {
                    const isActive = c.id === selectedChatId;
                    const lastMsg = c.messages[c.messages.length - 1];
                    const isLastFromGuest = lastMsg?.sender === 'user';
                    
                    return (
                      <button
                        key={c.id}
                        onClick={() => setSelectedChatId(c.id)}
                        className={`w-full p-4 text-left flex items-start gap-3 transition-all cursor-pointer ${
                          isActive 
                            ? 'bg-indigo-650/10 border-l-4 border-indigo-500' 
                            : 'hover:bg-slate-900/25'
                        }`}
                        id={`ceo-chat-row-${c.id}`}
                      >
                        <div className="w-10 h-10 rounded-full bg-indigo-650/20 border border-indigo-500/30 text-indigo-300 font-bold flex items-center justify-center text-xs uppercase shrink-0 mt-0.5">
                          {c.house.host.name ? c.house.host.name.charAt(0) : '👤'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-0.5">
                            <h5 className="font-bold text-xs text-white truncate font-sans">{c.house.host.name}</h5>
                            <span className="text-[10px] text-slate-500 font-mono">{c.lastUpdated}</span>
                          </div>
                          <p className="text-[11px] font-medium text-slate-400 truncate mb-1 font-sans">
                            Regarding: <span className="text-indigo-400">{c.house.title}</span>
                          </p>
                          <p className="text-xs text-slate-300 truncate leading-snug flex items-center gap-1.5 mt-1 font-sans">
                            {isLastFromGuest && (
                              <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-1 rounded font-black font-sans uppercase shrink-0">Inquiry</span>
                            )}
                            <span className="truncate">{c.lastMessage}</span>
                          </p>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-slate-500 text-xs py-20 font-sans">
                    No active stay discussions found on system.
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT PANE: SYSTEM INTERJECTION COMM */}
            <div className="lg:col-span-8 flex flex-col justify-between bg-slate-950/20 rounded-2xl overflow-hidden min-h-[500px]">
              {(() => {
                const activeChatConv = conversations.find(c => c.id === selectedChatId) || conversations[0];
                
                const handleCeoSendMessage = (e: React.FormEvent) => {
                  e.preventDefault();
                  if (!ceoTypedText.trim() || !activeChatConv) return;

                  const newMsg: Message = {
                    id: `m-staff-${Date.now()}`,
                    sender: sendAsIdentity,
                    text: ceoTypedText,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  };

                  const updatedMessages = [...activeChatConv.messages, newMsg];
                  const updatedConv: Conversation = {
                    ...activeChatConv,
                    messages: updatedMessages,
                    lastMessage: ceoTypedText,
                    lastUpdated: 'Just now'
                  };

                  const nextConversations = conversations.map((c) => (c.id === activeChatConv.id ? updatedConv : c));
                  onUpdateConversations(nextConversations);
                  setCeoTypedText('');
                };

                if (activeChatConv) {
                  return (
                    <>
                      {/* Thread Header info */}
                      <div className="p-4 border-b border-slate-800 bg-slate-900/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-650/20 border border-indigo-500/30 text-indigo-300 font-bold flex items-center justify-center text-xs uppercase shrink-0">
                            {activeChatConv.house.host.name ? activeChatConv.house.host.name.charAt(0) : '👤'}
                          </div>
                          <div className="text-left font-sans">
                            <h4 className="font-extrabold text-xs text-white">Channel: {activeChatConv.house.host.name}</h4>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400">
                              <span>Listing: {activeChatConv.house.title} ({activeChatConv.house.location})</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] bg-indigo-500/10 text-indigo-400 font-mono font-bold border border-indigo-500/20 px-2 py-0.5 rounded-md uppercase">
                            Secure Log
                          </span>
                        </div>
                      </div>

                      {/* Operational Chat Scrubber messages */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/50 min-h-[300px]">
                        {activeChatConv.messages.map((m, index) => {
                          const isUserMsg = m.sender === 'user';
                          const isCeoMsg = m.sender === 'ceo';
                          const isHostMsg = m.sender === 'host';
                          
                          return (
                            <div
                              key={m.id || index}
                              className={`flex ${isCeoMsg ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`max-w-[75%] rounded-2xl p-4 text-xs leading-relaxed border ${
                                isCeoMsg
                                  ? 'bg-amber-600/10 border-amber-500/30 text-amber-100 rounded-br-none shadow-[0_4px_20px_rgba(245,158,11,0.05)]'
                                  : isUserMsg
                                  ? 'bg-slate-900 border-slate-800 text-white rounded-bl-none'
                                  : 'bg-indigo-950/20 border-indigo-900/30 text-indigo-200 rounded-bl-none'
                              }`}>
                                <div className="flex items-center gap-1.5 mb-1 text-[9px] opacity-75 font-mono uppercase font-black">
                                  {isUserMsg ? (
                                    <span className="text-indigo-400">Guest (Client User)</span>
                                  ) : isHostMsg ? (
                                    <span className="text-emerald-400">Registered host: {activeChatConv.house.host.name}</span>
                                  ) : (
                                    <span className="text-amber-400 flex items-center gap-1"><Crown className="w-3 h-3 text-amber-500 inline" /> You (CEO JAMES LEVIS)</span>
                                  )}
                                  <span className="ml-auto opacity-50">{m.timestamp}</span>
                                </div>
                                <p className="font-semibold text-left">{m.text}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* HQ Decision Form sending thread with credentials */}
                      <form onSubmit={handleCeoSendMessage} className="p-4 border-t border-slate-800/80 bg-slate-900/20 space-y-3 font-sans">
                        
                        {/* Identity choice controller */}
                        <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 text-xs">
                          <span className="text-slate-400 text-[10px] uppercase font-black tracking-wider flex items-center gap-1 font-sans">
                            <Shield className="w-3.5 h-3.5 text-indigo-500" />
                            Send message as:
                          </span>
                          
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setSendAsIdentity('ceo')}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 border ${
                                sendAsIdentity === 'ceo'
                                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-sm'
                                  : 'bg-transparent text-slate-500 border-transparent hover:text-slate-300'
                              }`}
                            >
                              <Crown className="w-3 h-3 text-amber-500" />
                              <span>CEO Support</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSendAsIdentity('host')}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 border ${
                                sendAsIdentity === 'host'
                                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/40 shadow-sm'
                                  : 'bg-transparent text-slate-500 border-transparent hover:text-slate-300'
                              }`}
                            >
                              <Users className="w-3 h-3 text-blue-400" />
                              <span>Host Proxy</span>
                            </button>
                          </div>
                        </div>

                        {/* Text field sending submit */}
                        <div className="flex gap-2 items-center">
                          <input
                            id="ceo-message-input"
                            type="text"
                            required
                            value={ceoTypedText}
                            onChange={(e) => setCeoTypedText(e.target.value)}
                            placeholder={
                              sendAsIdentity === 'ceo'
                                ? "Provide corporate CEO support to resolve this stay inquiry..."
                                : `Speak on behalf of Host ${activeChatConv.house.host.name}...`
                            }
                            className="flex-1 py-3 px-4 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                          />
                          <button
                            id="ceo-message-send-btn"
                            type="submit"
                            disabled={!ceoTypedText.trim()}
                            className="p-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:bg-slate-900 disabled:text-slate-600 disabled:border-transparent active:scale-95 transition-all text-xs cursor-pointer flex items-center gap-1 font-extrabold border border-indigo-500/20 shadow-md"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>

                      </form>
                    </>
                  );
                }

                return (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500 py-28 font-sans">
                    <MessageSquare className="w-12 h-12 text-slate-600 mb-3" />
                    <h4 className="font-display font-medium text-sm text-white font-sans">No discussion channel selected</h4>
                    <p className="text-xs text-slate-400 mt-1">Select an active stay thread from the side panel to view correspondences and interject.</p>
                  </div>
                );
              })()}
            </div>

          </div>

        </section>
      )}

      {/* 5. PAYMENTS LEDGER & ACCOUNTS EXCLUSIVE HQ PANEL */}
      {activeSubTab === 'payments' && (
        <section id="payments-management-dashboard-section" className="space-y-8 animate-fade-in font-sans text-left">
          
          {/* HEADER EXCLUSIVE ACCESS BAR */}
          <div className="bg-slate-900/40 p-5 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="text-left font-sans">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-500 animate-pulse" />
                <span>MAKAZI Executive Payment Control Suite</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Authorized Executive access only. Audit guest receipts, alter corporate payment coordinates, and monitor platform collection.
              </p>
            </div>
            <div className="flex gap-2 self-start md:self-auto">
              <button
                type="button"
                onClick={handleDownloadLedgerReport}
                className="px-4 py-2 text-xs font-black bg-emerald-650 hover:bg-emerald-600 text-white rounded-xl active:scale-95 transition-all flex items-center gap-2 border border-emerald-500/20 shadow-md cursor-pointer select-none"
              >
                📥 Export CSV Financial Report
              </button>
            </div>
          </div>

          {/* ANALYTICS AND REVENUE COUNTERS PANEL */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="payments-revenue-bento-grid">
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950/20 border border-indigo-900/30 p-5 rounded-2xl shadow-sm">
              <p className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-widest">Aggregate Platform Revenue</p>
              <div className="flex items-baseline justify-between mt-2.5">
                <h3 className="text-2xl font-mono font-black text-white select-all">
                  ${bookings.reduce((sum, b) => b.paymentStatus === 'Approved' ? sum + (b.totalPrice || 0) : sum, 0).toLocaleString()}
                </h3>
                <DollarSign className="w-5 h-5 text-indigo-400" />
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800/80 p-5 rounded-2xl shadow-sm">
              <p className="text-[10px] text-green-450 font-extrabold uppercase tracking-widest text-emerald-400">Successful Stays (Confirmed)</p>
              <div className="flex items-baseline justify-between mt-2.5">
                <h3 className="text-2xl font-mono font-black text-emerald-400">
                  {bookings.filter(b => b.paymentStatus === 'Approved').length}
                </h3>
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800/80 p-5 rounded-2xl shadow-sm">
              <p className="text-[10px] text-amber-500 font-extrabold uppercase tracking-widest">Pending Verification Receipts</p>
              <div className="flex items-baseline justify-between mt-2.5">
                <h3 className="text-2xl font-mono font-black text-amber-400 animate-pulse">
                  {bookings.filter(b => b.paymentStatus === 'Pending').length}
                </h3>
                <Activity className="w-5 h-5 text-amber-500" />
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800/80 p-5 rounded-2xl shadow-sm">
              <p className="text-[10px] text-rose-455 font-extrabold uppercase tracking-widest text-rose-400">Failed/Rejected Transactions</p>
              <div className="flex items-baseline justify-between mt-2.5">
                <h3 className="text-2xl font-mono font-black text-rose-400">
                  {bookings.filter(b => b.paymentStatus === 'Rejected').length}
                </h3>
                <XCircle className="w-5 h-5 text-rose-550" />
              </div>
            </div>
          </div>

          {/* SECONDARY PLATFORM SYSTEM REVENUES CARD */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="platform-micropayments-grid">
            <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[9px] text-[#f59e0b] font-extrabold uppercase tracking-widest font-sans">Broker Application Fees Received</p>
                <h4 className="text-xl font-mono font-black text-white mt-1">
                  TZS {(brokerApplications.length * 10000).toLocaleString()}
                </h4>
                <p className="text-[9px] text-slate-500 mt-0.5">From {brokerApplications.length} professional applications submitted</p>
              </div>
              <Award className="w-8 h-8 text-[#f59e0b] opacity-80" />
            </div>

            <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[9px] text-emerald-400 font-extrabold uppercase tracking-widest font-sans">Authorized Broker Commissions</p>
                <h4 className="text-xl font-mono font-black text-emerald-400 mt-1">
                  TZS {(brokerApplications.filter(a => a.status === 'approved').length * 10000).toLocaleString()}
                </h4>
                <p className="text-[9px] text-slate-500 mt-0.5">License approvals currently active on platform</p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-400 opacity-80" />
            </div>

            <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[9px] text-indigo-400 font-extrabold uppercase tracking-widest font-sans">Premium Upgrades Claims Verified</p>
                <h4 className="text-xl font-mono font-black text-white mt-1">
                  {upgradeRequests.filter(u => u.status === 'approved').length} Upgrades
                </h4>
                <p className="text-[9px] text-slate-500 mt-0.5">Host and VIP registrations validated</p>
              </div>
              <Shield className="w-8 h-8 text-indigo-400 opacity-80" />
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            
            {/* LEFT 7 COLS: PLATFORM BILLING CENTRAL LEDGER */}
            <div className="xl:col-span-7 bg-slate-950/20 border border-slate-800/80 p-6 rounded-[32px] space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-800/80 pb-4">
                <div>
                  <h4 className="text-xs uppercase font-extrabold text-white tracking-wider">Central Transactions Ledger</h4>
                  <p className="text-[10px] text-slate-400">Audit, search, filter and execute confirmations of platform guest invoice requests.</p>
                </div>
                <div className="text-[10px] bg-black/40 px-2.5 py-1 rounded border border-white/5 font-mono text-slate-400 font-bold">
                  {bookings.length} RecordEntries
                </div>
              </div>

              {/* SEARCH & FILTERS ON THE TRANSACTIONS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={paymentQueryLog}
                    onChange={(e) => setPaymentQueryLog(e.target.value)}
                    placeholder="Search stay ID, name, number..."
                    className="w-full bg-slate-950 border border-slate-800/80 focus:border-indigo-500 rounded-xl py-1.5 pl-8 pr-3 text-[11px] text-white focus:outline-none"
                  />
                </div>

                <select
                  value={paymentStatusFilter}
                  onChange={(e: any) => setPaymentStatusFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800/80 focus:border-indigo-505 rounded-xl py-1.5 px-3 text-[11px] text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="all">💳 Status Filter: All Entries</option>
                  <option value="Pending">🕒 Pending Review Only</option>
                  <option value="Approved">✔ Approved / Settled</option>
                  <option value="Rejected">❌ Rejected / Voided</option>
                  <option value="Unpaid">🔗 Unpaid Reservations</option>
                </select>

                <select
                  value={paymentMethodFilter}
                  onChange={(e) => setPaymentMethodFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800/80 focus:border-indigo-505 rounded-xl py-1.5 px-3 text-[11px] text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="all">🔌 Gateway: All Methods</option>
                  <option value="Vodacom M-Pesa">Vodacom M-Pesa</option>
                  <option value="Tigo Pesa">Tigo Pesa</option>
                  <option value="Airtel Money">Airtel Money</option>
                  <option value="HaloPesa">HaloPesa</option>
                  <option value="Visa Card">Visa Card</option>
                  <option value="MasterCard">MasterCard</option>
                  <option value="Bank Account">Bank Account</option>
                </select>
              </div>

              {/* TRANSACTIONS FLOW STREAM */}
              <div className="space-y-3 min-h-[350px] max-h-[580px] overflow-y-auto pr-1">
                {(() => {
                  const filteredList = bookings.filter(b => {
                    const matchesStatus = paymentStatusFilter === 'all' || b.paymentStatus === paymentStatusFilter || (paymentStatusFilter === 'Unpaid' && !b.paymentStatus);
                    const matchesMethod = paymentMethodFilter === 'all' || b.paymentMethod === paymentMethodFilter;
                    const matchesQuery = !paymentQueryLog.trim() || 
                      b.id.toLowerCase().includes(paymentQueryLog.toLowerCase()) ||
                      b.house.title.toLowerCase().includes(paymentQueryLog.toLowerCase()) ||
                      (b.paymentNumber && b.paymentNumber.toLowerCase().includes(paymentQueryLog.toLowerCase())) ||
                      (b.fullName && b.fullName.toLowerCase().includes(paymentQueryLog.toLowerCase())) ||
                      b.startDate.includes(paymentQueryLog);
                    return matchesStatus && matchesMethod && matchesQuery;
                  });

                  if (filteredList.length === 0) {
                    return (
                      <div className="text-center py-20 bg-slate-900/10 rounded-2xl border border-dashed border-slate-800/80 text-xs text-slate-500">
                        No transactions found matching ledger criteria.
                      </div>
                    );
                  }

                  return filteredList.map(b => (
                    <div key={b.id} className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-700/50 transition-all font-sans">
                      <div className="space-y-1 text-left min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono text-indigo-400 font-extrabold uppercase">STAY: #{b.id}</span>
                          <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase font-mono border ${
                            b.paymentStatus === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            b.paymentStatus === 'Rejected' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                            b.paymentStatus === 'Pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse' :
                            'bg-slate-500/10 text-slate-400 border-slate-800'
                          }`}>
                            {b.paymentStatus || 'Unpaid'}
                          </span>
                        </div>
                        <h5 className="font-extrabold text-xs text-white truncate">{b.house.title}</h5>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-2 text-[10px] text-slate-400 font-mono">
                          <p>Guest: <b className="text-slate-300 font-sans">{b.fullName || 'Guest Client'}</b></p>
                          <p>Phone: <b className="text-slate-300 font-mono">{b.phoneNumber || 'N/A'}</b></p>
                          <p>Method: <b className="text-amber-500 font-mono">{b.paymentMethod || 'Unpaid (Yet to submit)'}</b></p>
                          <p>User Ref: <b className="text-indigo-400 font-mono select-all font-bold">{b.paymentNumber || 'N/A'}</b></p>
                          <p className="col-span-2 text-slate-500 border-t border-slate-900 mt-1 pt-1 font-sans">
                            Reservation: <b className="text-slate-300 font-sans">{b.startDate}</b> | Rent: <b className="text-white">${b.totalPrice || 0}</b>
                          </p>
                        </div>

                        {b.paymentReceiptUrl && (
                          <div className="mt-2.5 pt-2 border-t border-slate-900/80">
                            <span className="text-[8px] text-slate-500 uppercase tracking-widest block mb-1">Receipt Screenshot:</span>
                            <a href={b.paymentReceiptUrl} target="_blank" rel="noreferrer" className="inline-block relative">
                              <img
                                src={b.paymentReceiptUrl}
                                alt="Client Transaction Code Receipt"
                                className="max-h-16 rounded border border-slate-800 bg-black/40 hover:opacity-85 transition-opacity cursor-zoom-in"
                                referrerPolicy="no-referrer"
                              />
                            </a>
                          </div>
                        )}
                      </div>

                      {b.paymentStatus === 'Pending' && (
                        <div className="flex flex-row sm:flex-col gap-1.5 w-full sm:w-auto self-stretch sm:self-auto justify-end">
                          <button
                            type="button"
                            onClick={() => handleUpdateBookingPaymentStatus(b.id, 'Approved')}
                            className="flex-1 px-3 py-1.5 text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-lg active:scale-95 transition-all cursor-pointer whitespace-nowrap shadow border border-emerald-500/25 animate-bounce"
                          >
                            Approve ✔
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateBookingPaymentStatus(b.id, 'Rejected')}
                            className="flex-1 px-3 py-1.5 text-[10px] bg-rose-500/10 hover:bg-rose-500/30 text-rose-350 font-bold border border-rose-500/35 rounded-lg active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                          >
                            Reject ❌
                          </button>
                        </div>
                      )}
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* RIGHT 5 COLS: DYNAMIC ACCOUNTS CONTROL CENTER AND SETTINGS FORM */}
            <div className="xl:col-span-5 space-y-6">
              
              {/* PAYMENT ACCOUNTS REGISTRY DISPLAY LIST */}
              <div className="bg-slate-950/20 border border-slate-800/80 p-6 rounded-[32px] space-y-4 shadow-xl">
                <div>
                  <h4 className="text-xs uppercase font-extrabold text-white tracking-wider">Active Payment Accounts ({paymentAccounts.length})</h4>
                  <p className="text-[10px] text-slate-400">Add, alter, toggle on/off or change payment numbers instantly. Changes update checkout interfaces in real time.</p>
                </div>

                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {paymentAccounts.map(acc => (
                    <div key={acc.id} className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 text-left transition-colors relative ${acc.enabled ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-950/25 border-dashed border-slate-900 opacity-60'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${acc.colorClass || 'bg-slate-800 text-slate-300'}`}>
                            {acc.method}
                          </span>
                          <h5 className="font-extrabold text-xs text-white mt-1.5 select-all">{acc.merchantName}</h5>
                          <p className="text-[10px] text-indigo-400 font-mono font-bold mt-1 tracking-wider">{acc.numberType}: <span className="bg-white/5 py-0.5 px-1.5 rounded text-white font-black select-all text-xs">{acc.numberValue}</span></p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleTogglePaymentAccountEnabled(acc.id)}
                            className="text-xs focus:outline-none"
                            title={acc.enabled ? 'Click to deactivate account' : 'Click to activate account'}
                          >
                            {acc.enabled ? (
                              <ToggleRight className="w-8 h-8 text-emerald-500 cursor-pointer" />
                            ) : (
                              <ToggleLeft className="w-8 h-8 text-slate-600 cursor-pointer" />
                            )}
                          </button>
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-400 font-mono bg-black/30 p-2.5 rounded-lg border border-white/5 leading-normal">
                        {acc.instructions}
                      </p>

                      <div className="flex justify-end gap-2 border-t border-white/5 pt-2.5">
                        <button
                          type="button"
                          onClick={() => handleStartEditAccount(acc)}
                          className="px-2.5 py-1 text-[10px] text-amber-450 hover:text-amber-300 font-extrabold uppercase tracking-wide cursor-pointer hover:bg-white/5 rounded transition-all"
                        >
                          ✏ Edit Card
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePaymentAccount(acc.id)}
                          className="px-2.5 py-1 text-[10px] text-rose-400 hover:text-rose-350 font-extrabold uppercase tracking-wide cursor-pointer hover:bg-rose-500/10 rounded transition-all"
                        >
                          🗑 Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PAYMENT ACCOUNTS CONFIGURE (ADD or EDIT FORM PANEL) */}
              <div className="bg-slate-950/20 border border-slate-800/80 p-6 rounded-[32px] space-y-4 shadow-xl">
                <div>
                  <h4 className="text-xs uppercase font-extrabold text-white tracking-wider">
                    {editingAccountId ? '✏ Modify Coordinates' : '➕ Register New Payment gateway'}
                  </h4>
                  <p className="text-[10px] text-slate-400">Change platform configurations dynamically. Fields accept mobile code coordinates or bank addresses.</p>
                </div>

                <form onSubmit={handleSavePaymentAccount} className="space-y-3 font-sans text-xs">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1 text-left">Select payment method:</label>
                    <select
                      value={newAccMethod}
                      onChange={(e) => {
                        setNewAccMethod(e.target.value);
                        if (['Visa Card', 'MasterCard', 'Bank Account'].includes(e.target.value)) {
                          setNewAccNumberType(e.target.value === 'Bank Account' ? 'Tanzanian Bank Account' : 'International Card Number');
                        } else {
                          setNewAccNumberType('Lipa Namba (Merchant Code)');
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-indigo-505 focus:outline-none cursor-pointer"
                    >
                      <option value="Vodacom M-Pesa">Vodacom M-Pesa</option>
                      <option value="Tigo Pesa">Tigo Pesa</option>
                      <option value="Airtel Money">Airtel Money</option>
                      <option value="HaloPesa">HaloPesa</option>
                      <option value="Visa Card">Visa Card</option>
                      <option value="MasterCard">MasterCard</option>
                      <option value="Bank Account">Bank Account (e.g. CRDB, NMB, KCB)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="text-left">
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Holder name:</label>
                      <input
                        type="text"
                        required
                        value={newAccMerchantName}
                        onChange={(e) => setNewAccMerchantName(e.target.value)}
                        placeholder="e.g., MAKAZI Group Ltd"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2.5 text-xs text-white placeholder-slate-650"
                      />
                    </div>
                    <div className="text-left">
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Code/Number Value:</label>
                      <input
                        type="text"
                        required
                        id="ceo-payment-number-value-input"
                        value={newAccNumberValue}
                        onChange={(e) => setNewAccNumberValue(e.target.value)}
                        placeholder="e.g., 569311"
                        className={`w-full bg-slate-950 border rounded-xl p-2.5 text-xs text-white placeholder-slate-650 font-mono transition-all ${
                          editingAccountId 
                            ? 'border-amber-500 ring-2 ring-amber-500/20 animate-pulse bg-slate-900' 
                            : 'border-slate-800 focus:border-indigo-500'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="text-left">
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Coordinate Label Type:</label>
                    <input
                      type="text"
                      required
                      value={newAccNumberType}
                      onChange={(e) => setNewAccNumberType(e.target.value)}
                      placeholder="e.g., Lipa Namba (Merchant Code) or CRDB Account Number"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2.5 text-xs text-white placeholder-slate-650"
                    />
                  </div>

                  <div className="text-left">
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Client step instructions:</label>
                    <textarea
                      rows={2.5}
                      required
                      value={newAccInstructions}
                      onChange={(e) => setNewAccInstructions(e.target.value)}
                      placeholder="Specify dial codes, menu paths, bank reference tags. e.g. Dial *150*00#, select Lipa Merchant, enter Lipa Namba 569311."
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2.5 text-[11px] text-white placeholder-slate-650 font-sans"
                    />
                  </div>

                  <div className="flex justify-between items-center bg-black/40 p-2.5 rounded-xl border border-white/5 my-2">
                    <span className="text-[10px] text-slate-400 uppercase font-extrabold">Enable account immediately?</span>
                    <input
                      type="checkbox"
                      checked={newAccEnabled}
                      onChange={(e) => setNewAccEnabled(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-slate-950 accent-amber-500 cursor-pointer"
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-1">
                    {editingAccountId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAccountId(null);
                          setNewAccMerchantName('');
                          setNewAccNumberValue('');
                          setNewAccInstructions('');
                        }}
                        className="px-3.5 py-2 text-[11px] hover:bg-slate-900 border border-white/5 text-slate-300 font-bold rounded-xl cursor-pointer"
                      >
                        Cancel Edit
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-5 py-2 text-[11px] bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl active:scale-95 transition-all text-center cursor-pointer border border-amber-500/25"
                    >
                      {editingAccountId ? 'Save Coordinates' : 'Register Account'}
                    </button>
                  </div>
                </form>
              </div>

            </div>

          </div>

        </section>
      )}

      {activeSubTab === 'brokers' && (
        <section id="brokers-licensing-reviews-section" className="space-y-6 text-left">
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 text-left space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-800 pb-4 gap-2">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-400 rotate-12" />
                  <span>Broker Licensing Applications Queue</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Review professional records, ID credentials, and TZS 10,000 application fee receipts to grant official Verified Broker licensing.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">Total Submitted: {brokerApplications.length}</span>
              </div>
            </div>

            {/* Broker Application State Subdivisions */}
            <div className="flex flex-wrap items-center gap-2 pb-2">
              {[
                { filterValue: 'all' as const, label: 'All Applications', count: brokerApplications.length, activeColor: 'bg-indigo-600 text-white border-indigo-500/20' },
                { filterValue: 'pending' as const, label: 'Pending Approvals', count: brokerApplications.filter(app => app.status === 'pending').length, activeColor: 'bg-amber-600 text-white border-amber-500/20' },
                { filterValue: 'approved' as const, label: 'Approved Brokers', count: brokerApplications.filter(app => app.status === 'approved').length, activeColor: 'bg-emerald-600 text-white border-emerald-500/20' },
                { filterValue: 'rejected' as const, label: 'Rejected Applications', count: brokerApplications.filter(app => app.status === 'rejected').length, activeColor: 'bg-rose-600 text-white border-rose-500/20' }
              ].map(subDiv => {
                const isActive = brokerFilter === subDiv.filterValue;
                return (
                  <button
                    key={subDiv.filterValue}
                    onClick={() => setBrokerFilter(subDiv.filterValue)}
                    className={`px-3 py-1.5 rounded-lg font-sans text-[11px] font-bold tracking-wide transition-all border cursor-pointer ${
                      isActive 
                        ? `${subDiv.activeColor} shadow-md` 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{subDiv.label}</span>
                    <span className="ml-1.5 px-1.5 py-0.2 bg-black/30 rounded-full font-mono text-[10px]">{subDiv.count}</span>
                  </button>
                );
              })}
            </div>

            {brokerApplications.filter(app => brokerFilter === 'all' || app.status === brokerFilter).length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs font-mono border border-dashed border-slate-800 rounded-2xl bg-slate-950/10">
                No broker license applications match the selected filtered group.
              </div>
            ) : (
              <div className="space-y-5">
                {brokerApplications.filter(app => brokerFilter === 'all' || app.status === brokerFilter).map((app) => (
                  <div 
                    key={app.id} 
                    className={`p-5 rounded-2xl border transition-all ${
                      app.status === 'pending' 
                        ? 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50' 
                        : app.status === 'approved' 
                          ? 'border-emerald-500/20 bg-emerald-500/5' 
                          : 'border-rose-500/10 bg-rose-500/5'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row gap-5 justify-between">
                      {/* Left: Applicant Details */}
                      <div className="space-y-3 flex-1 font-sans">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-extrabold text-white">{app.fullName}</h4>
                          <span className={`text-[9px] uppercase font-mono font-bold tracking-widest px-2.5 py-0.5 rounded-full ${
                            app.status === 'pending'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : app.status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-500 border border-rose-500/20'
                          }`}>
                            {app.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 font-mono">
                          <div>ID Document: <span className="text-white hover:underline cursor-pointer font-bold">{app.nationalId}</span></div>
                          {app.location && (
                            <div>Location: <span className="text-emerald-400 font-bold">{app.location}</span></div>
                          )}
                          <div>Phone Number: <a href={`tel:${app.phoneNumber}`} className="text-indigo-400 hover:underline">{app.phoneNumber}</a></div>
                          <div>Email: <a href={`mailto:${app.email}`} className="text-indigo-400 hover:underline">{app.email}</a></div>
                          <div>Submitted At: <span className="text-slate-400">{new Date(app.submittedAt).toLocaleString()}</span></div>
                        </div>

                        <div className="border-t border-white/5 pt-2 mt-2">
                          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-black block mb-1">Experience & Services Detail:</span>
                          <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-950/30 p-3 rounded-xl border border-white/5 whitespace-pre-wrap">
                            {app.experience}
                          </p>
                        </div>

                        {app.reviewedAt && (
                          <div className="text-[10px] text-slate-500 font-mono mt-1 uppercase">
                            Reviewed At: {new Date(app.reviewedAt).toLocaleString()}
                          </div>
                        )}
                        {app.notes && (
                          <div className="mt-2 text-xs bg-rose-500/5 p-2.5 rounded-lg border border-rose-500/10 text-rose-350">
                            <strong>CEO Rejection Feedback Notes:</strong> {app.notes}
                          </div>
                        )}
                      </div>

                      {/* Right: Receipt Verification & Actions */}
                      <div className="flex flex-col justify-between w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-white/5 pt-4 lg:pt-0 lg:pl-5 space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400 font-mono uppercase text-[10px]">Verify TZS 10,000 Fee</span>
                            <span className="text-emerald-400 font-bold">TZS 10,000 Paid</span>
                          </div>

                          <div className="bg-slate-950 p-2 rounded-xl border border-white/5 flex items-center justify-between gap-2">
                            <div className="font-mono text-[10px]">
                              <p className="text-slate-500">PROVIDER / REF NO:</p>
                              <p className="text-white font-extrabold">{app.paymentNumber}</p>
                              <p className="text-slate-400 font-sans text-[9px] mt-0.5">{app.paymentMethod}</p>
                            </div>
                            {app.screenshot && (
                              <a 
                                href={app.screenshot} 
                                target="_blank" 
                                rel="noreferrer"
                                className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 hover:border-emerald-400/50 block relative group flex-shrink-0 cursor-zoom-in"
                              >
                                <img src={app.screenshot} alt="Screenshot" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </a>
                            )}
                          </div>
                        </div>

                        {app.status === 'pending' && (
                          <div className="space-y-2 pt-2">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-widest block font-sans">Rejection Feedback Notes (optional):</label>
                              <input 
                                type="text"
                                value={brokerRejectionReasons[app.id] || ''}
                                onChange={(e) => setBrokerRejectionReasons({
                                  ...brokerRejectionReasons,
                                  [app.id]: e.target.value
                                })}
                                placeholder="e.g. invalid transaction ID / NIDA doc"
                                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg p-2 text-[11px] text-white placeholder-slate-650"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => handleReviewBrokerApplication(app.id, 'rejected')}
                                className="w-full py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase text-[10px] tracking-wider rounded-xl transition-all cursor-pointer text-center"
                              >
                                Disapprove
                              </button>
                              <button
                                onClick={() => handleReviewBrokerApplication(app.id, 'approved')}
                                className="w-full py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase text-[10px] tracking-wider rounded-xl transition-all cursor-pointer text-center"
                              >
                                Approve Broker
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 5. HOMEPAGE HERO BANNER & COPY EDITORIAL AUTHORITY */}
      {activeSubTab === 'content' && (
        <section id="ceo-hero-editor-section" className="space-y-8 animate-fadeIn">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-indigo-950/70 via-slate-900/80 to-purple-950/40 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin" />
                <span>CEO Editorial Authority</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Homepage Hero Banner & Headline Editor
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Kama Mkurugenzi Mtendaji (CEO), una udhibiti kamili wa kubadilisha maandishi yote ya ukurasa wa mwanzo (Hero Banner) ikiwemo nembo ya juu, kichwa kikuu cha habari, na maelezo ya kina wakati wowote unapotaka.
              </p>
            </div>
          </div>

          {/* Toast Notification */}
          {heroSavedToast && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-sm font-bold flex items-center justify-between shadow-lg animate-bounce">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span>Mabadiliko yamehifadhiwa kikamilifu! Ukurasa wa mwanzo sasa unaonyesha maandishi haya mapya moja kwa moja.</span>
              </div>
              <button 
                onClick={onBack}
                className="text-xs bg-emerald-500 text-slate-950 font-black px-3 py-1.5 rounded-lg hover:bg-emerald-400 transition-all cursor-pointer"
              >
                Tazama Homepage →
              </button>
            </div>
          )}

          {/* Live Interactive Preview Box */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-400" />
                Uhakiki wa Moja kwa Moja (Live Homepage Preview)
              </span>
              <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Inabadilika mara moja unapoandika
              </span>
            </div>

            <div className="relative rounded-[32px] overflow-hidden bg-gradient-to-r from-indigo-950/70 to-slate-900/80 text-white p-6 sm:p-10 border border-white/10 shadow-2xl backdrop-blur-3xl">
              <div className="absolute top-0 right-0 w-[280px] h-[280px] bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute bottom-0 left-10 w-[180px] h-[180px] bg-rose-500/10 rounded-full blur-[60px] pointer-events-none" />
              
              <div className="relative z-10 max-w-2xl space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest leading-none border border-white/10 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  <span>{heroForm.badge || 'Discover Exquisite Escapes'}</span>
                </div>
                <h1 className="font-display font-medium text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight leading-tight">
                  {(() => {
                    const title = heroForm.title || DEFAULT_HERO_CONTENT.title;
                    const accent = heroForm.accentWord;
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
                  })()}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg">
                  {heroForm.description || DEFAULT_HERO_CONTENT.description}
                </p>
              </div>
            </div>
          </div>

          {/* Form Configuration Inputs */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
              <span>Rekebisha Maandishi ya Hero Banner (Hero Banner Content Controls)</span>
            </h3>

            {/* Field 1: Super-Title / Badge */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                <span>1. Super-Title / Badge Tag (Nembo ya Juu)</span>
                <span className="text-[10px] text-slate-500 font-mono font-normal">Mfano: Discover Exquisite Escapes</span>
              </label>
              <input
                type="text"
                value={heroForm.badge}
                onChange={(e) => setHeroForm({ ...heroForm, badge: e.target.value })}
                placeholder="e.g. Discover Exquisite Escapes"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-3 text-sm text-white placeholder-slate-600 outline-none transition-all shadow-inner"
              />
              {/* Quick suggestions */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-500 font-mono">Mapendekezo ya haraka:</span>
                {[
                  "Discover Exquisite Escapes",
                  "Gundua Hifadhi za Kifahari",
                  "Exclusive Sanctuary Living",
                  "Makazi ya Kisasa Tanzania"
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setHeroForm({ ...heroForm, badge: preset })}
                    className="text-[10px] bg-slate-800/80 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-200 border border-slate-700/60 px-2 py-0.5 rounded-lg transition-all cursor-pointer"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Field 2: Main Headline / Title */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                <span>2. Main Headline (Kichwa Kikuu cha Habari - H1)</span>
                <span className="text-[10px] text-slate-500 font-mono font-normal">Mfano: Pata hifadhi katika usanifu wa kipekee.</span>
              </label>
              <input
                type="text"
                value={heroForm.title}
                onChange={(e) => setHeroForm({ ...heroForm, title: e.target.value })}
                placeholder="e.g. Pata hifadhi katika usanifu wa kipekee."
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-3 text-sm text-white placeholder-slate-600 outline-none transition-all shadow-inner font-medium"
              />
              {/* Quick suggestions */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-500 font-mono">Mapendekezo ya haraka:</span>
                {[
                  { label: "Swahili (Default)", text: "Pata hifadhi katika usanifu wa kipekee.", accent: "usanifu wa kipekee" },
                  { label: "English", text: "Discover sanctuary in extraordinary architecture.", accent: "extraordinary architecture" },
                  { label: "Luxury Living", text: "Makazi ya kifahari yaliyoundwa kwa ubora wa juu.", accent: "ubora wa juu" },
                  { label: "Karibu Tanzania", text: "Karibu kwenye makazi bora ya kisasa Tanzania.", accent: "makazi bora" }
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setHeroForm({ ...heroForm, title: item.text, accentWord: item.accent })}
                    className="text-[10px] bg-slate-800/80 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-200 border border-slate-700/60 px-2 py-0.5 rounded-lg transition-all cursor-pointer"
                  >
                    + {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Field 3: Highlighted Accent Phrase */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                <span>3. Highlighted Accent Phrase (Maneno ya Kung'aa / Glow Effect)</span>
                <span className="text-[10px] text-indigo-400 font-mono font-normal">Hiari (Optional)</span>
              </label>
              <input
                type="text"
                value={heroForm.accentWord || ''}
                onChange={(e) => setHeroForm({ ...heroForm, accentWord: e.target.value })}
                placeholder="e.g. usanifu wa kipekee"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-3 text-sm text-white placeholder-slate-600 outline-none transition-all shadow-inner"
              />
              <p className="text-[11px] text-slate-400">
                Maneno yaliyoandikwa hapa yatapata rangi angavu ya kipekee (<span className="text-indigo-300 font-semibold">violet-cyan glow</span>) ndani ya kichwa kikuu.
              </p>
            </div>

            {/* Field 4: Description Paragraph */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  4. Description Paragraph (Maelezo ya Kina ya Sehemu ya Mbele)
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {heroForm.description.length} characters
                </span>
              </div>
              <textarea
                rows={4}
                value={heroForm.description}
                onChange={(e) => setHeroForm({ ...heroForm, description: e.target.value })}
                placeholder="e.g. Maajabu ya usanifu yaliyochaguliwa kwa umakini mkubwa..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-3 text-sm text-white placeholder-slate-600 outline-none transition-all shadow-inner leading-relaxed resize-y"
              />
              {/* Quick suggestions */}
              <div className="space-y-2 pt-1">
                <span className="text-[10px] text-slate-500 font-mono block">Machaguo ya Haraka (Templates):</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setHeroForm({
                      ...heroForm,
                      description: "Maajabu ya usanifu yaliyochaguliwa kwa umakini mkubwa yakiwa na nakshi safi za kioo, miundo thabiti na ya kisasa, na nafasi tulivu zilizoundwa kwa ajili ya kumbukumbu za kudumu."
                    })}
                    className="text-left text-[11px] bg-slate-950 p-2.5 rounded-xl border border-slate-800 hover:border-indigo-500/50 text-slate-300 hover:text-white transition-all cursor-pointer"
                  >
                    <span className="font-bold text-indigo-400 block mb-1">Swahili Original (Chaguo-msingi):</span>
                    <span className="line-clamp-2">Maajabu ya usanifu yaliyochaguliwa kwa umakini mkubwa yakiwa na nakshi safi za kioo, miundo thabiti na ya kisasa...</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeroForm({
                      ...heroForm,
                      description: "Carefully curated architectural marvels featuring pristine glass finishes, bold modern designs, and serene spaces crafted for lasting memories."
                    })}
                    className="text-left text-[11px] bg-slate-950 p-2.5 rounded-xl border border-slate-800 hover:border-indigo-500/50 text-slate-300 hover:text-white transition-all cursor-pointer"
                  >
                    <span className="font-bold text-indigo-400 block mb-1">English Translation:</span>
                    <span className="line-clamp-2">Carefully curated architectural marvels featuring pristine glass finishes, bold modern designs, and serene spaces...</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Notice toast if video uploaded */}
            {ceoVideoNotice && (
              <div className="p-3 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 text-xs font-bold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{ceoVideoNotice}</span>
                </div>
                <button 
                  onClick={() => setCeoVideoNotice(null)} 
                  className="text-slate-400 hover:text-white"
                >
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Field 5 & 6: Video Drag & Drop, URL & 5-Hour Cycle Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
              <div className="space-y-2">
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={ceoFileInputRef}
                  accept="video/mp4,video/webm,video/ogg,video/quicktime,video/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleProcessVideoFileInCEO(e.target.files[0]);
                    }
                  }}
                />

                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                  <span>5. Video ya Hero (Buruta Faili / Pakia / URL)</span>
                  <UploadCloud className="w-3.5 h-3.5 text-indigo-400" />
                </label>

                {/* Drag and Drop Zone */}
                <div 
                  onClick={() => ceoFileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleProcessVideoFileInCEO(e.dataTransfer.files[0]);
                    }
                  }}
                  className="p-5 rounded-2xl border-2 border-dashed border-indigo-500/50 hover:border-indigo-400 bg-slate-950/80 hover:bg-slate-950 flex flex-col items-center justify-center text-center cursor-pointer transition-all group shadow-inner"
                >
                  <UploadCloud className="w-8 h-8 text-indigo-400 group-hover:scale-110 mb-2 transition-transform" />
                  <span className="text-xs font-bold text-white mb-0.5">
                    Buruta video mpya hapa au Bonyeza kupakia
                  </span>
                  <span className="text-[11px] text-slate-400">
                    (MP4, WebM, MOV • Inahifadhiwa kwenye kivinjari)
                  </span>

                  {heroForm.videoFileName && (
                    <div className="mt-2.5 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-xs text-indigo-300">
                      <Film className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
                      <span className="font-semibold truncate max-w-[180px]">{heroForm.videoFileName}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResetCustomVideoInCEO();
                        }}
                        className="ml-1 p-0.5 text-slate-400 hover:text-white"
                        title="Ondoa video uliyopakia na urejeshe ya asili"
                      >
                        <Trash2 className="w-3 h-3 text-rose-400" />
                      </button>
                    </div>
                  )}
                </div>

                {/* CEO Video Actions: Tazama / Cheza Video Sasa & Rejesha */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handlePlayVideoNowInCEO}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95"
                    title="Tazama video na uanze mzunguko sasa hivi"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Tazama / Cheza Video Sasa</span>
                  </button>

                  {heroForm.isCustomUpload && (
                    <button
                      type="button"
                      onClick={handleResetCustomVideoInCEO}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3 text-slate-400" />
                      <span>Rejesha Video Asili</span>
                    </button>
                  )}
                </div>

                <div className="space-y-1 pt-1">
                  <span className="text-[10px] text-slate-500 font-mono">Au weka URL ya moja kwa moja ya video:</span>
                  <input
                    type="text"
                    value={heroForm.videoUrl || ''}
                    onChange={(e) => setHeroForm({ ...heroForm, videoUrl: e.target.value })}
                    placeholder="https://example.com/video.mp4"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2.5 text-xs text-white placeholder-slate-600 outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                  <span>6. Muda wa Mzunguko (Cycle Hours, Chaguo-msingi: 5)</span>
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    min="0.005"
                    step="0.5"
                    value={heroForm.cycleIntervalHours ?? 5}
                    onChange={(e) => setHeroForm({ ...heroForm, cycleIntervalHours: parseFloat(e.target.value) || 5 })}
                    className="w-24 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2.5 text-sm text-white outline-none font-mono font-bold"
                  />
                  <span className="text-xs text-slate-300">masaa (5 hours)</span>

                  {/* Quick presets and test */}
                  <button
                    type="button"
                    onClick={() => setHeroForm({ ...heroForm, cycleIntervalHours: 5 })}
                    className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition-all cursor-pointer"
                  >
                    5 hrs (Kawaida)
                  </button>
                  <button
                    type="button"
                    onClick={handleSimulate10sCycleInCEO}
                    className="text-[11px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-3 py-1.5 rounded-lg border border-amber-500/40 transition-all cursor-pointer font-bold active:scale-95 flex items-center gap-1"
                    title="Jaribio la sekunde 10 kwa ajili ya kuthibitisha mzunguko mara moja"
                  >
                    <span>⚡ Jaribu Mzunguko (10s)</span>
                  </button>
                </div>

                {/* Live cycle countdown badge */}
                {heroForm.videoEnabled !== false && ceoRemainingTimeText && (
                  <div className="p-3 rounded-xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-between text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                      <span>Hali ya Mzunguko:</span>
                    </div>
                    <span className="font-mono text-indigo-200 font-bold">
                      Video itarudi kiotomatiki baada ya: <strong className="text-white">{ceoRemainingTimeText}</strong>
                    </span>
                  </div>
                )}

                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Video inacheza kiotomatiki na inaondolewa mara moja ikimalizika ili kuonyesha maandishi kwa masaa 5, kisha video inarudi tena na kucheza kiotomatiki mfululizo bila kuhitaji kubofya.
                </p>
              </div>
            </div>

            {/* Field 7: Video Enabled Switch */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div>
                <span className="text-xs font-bold text-white block">Wezesha Mzunguko wa Video (Video Cycle Mode)</span>
                <span className="text-[11px] text-slate-400">Video inacheza mara moja, kisha inaonyesha maandishi kwa masaa 5, na kurudia mfululizo.</span>
              </div>
              <button
                type="button"
                onClick={() => setHeroForm({ ...heroForm, videoEnabled: heroForm.videoEnabled === false ? true : false })}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  heroForm.videoEnabled !== false 
                    ? 'bg-emerald-500 text-slate-950 font-black' 
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {heroForm.videoEnabled !== false ? 'Washa (Active)' : 'Zima (Disabled)'}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleResetHero}
                className="flex items-center gap-2 py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                <span>Rejesha Maandishi Asili (Reset to Default)</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onBack}
                  className="py-3 px-5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Tazama Homepage
                </button>
                <button
                  type="button"
                  onClick={handleSaveHero}
                  className="flex items-center gap-2 py-3 px-7 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Hifadhi Mabadiliko (Save Live)</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. MODAL: WHO SENT TO WHO - DETAILED INQUIRY ROUTING & RELATIONSHIP INSPECTOR */}
      {selectedRequestForDetail && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
          onClick={() => setSelectedRequestForDetail(null)}
          id="who-sent-to-who-modal-backdrop"
        >
          <div 
            className="bg-slate-900 border border-indigo-500/40 rounded-[32px] p-6 sm:p-8 max-w-3xl w-full shadow-2xl shadow-indigo-950/60 relative overflow-hidden my-auto max-h-[92vh] flex flex-col text-slate-100"
            onClick={(e) => e.stopPropagation()}
            id="who-sent-to-who-modal"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <Activity className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white">Inquiry Routing: Who Sent To Who</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      Relationship Inspector
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live connection between client inquirer (Who Sent) and sanctuary property owner (To Who)
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedRequestForDetail(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Close Window"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Meta Row: Doc ID, Status, Created Date */}
            <div className="py-3 px-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl my-4 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 uppercase font-black">DOC ID:</span>
                <span className="font-mono text-indigo-300 font-bold select-all">{selectedRequestForDetail.documentId}</span>
                <button
                  onClick={() => handleCopyText(selectedRequestForDetail.documentId, `modal-${selectedRequestForDetail.documentId}`)}
                  className="text-slate-500 hover:text-white transition-colors cursor-pointer"
                  title="Copy Document ID"
                >
                  {copiedFieldId === `modal-${selectedRequestForDetail.documentId}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 uppercase font-black">Type:</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  {selectedRequestForDetail.requestType}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 uppercase font-black">Status:</span>
                {(() => {
                  const meta = getStatusColor(selectedRequestForDetail.status);
                  return (
                    <span className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 border rounded-full font-black uppercase tracking-wider ${meta.bg}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                      <span>{meta.text}</span>
                    </span>
                  );
                })()}
              </div>

              <div className="text-[10px] text-slate-400 font-mono">
                Submitted: {(() => {
                  try {
                    return new Date(selectedRequestForDetail.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
                  } catch {
                    return selectedRequestForDetail.createdAt;
                  }
                })()}
              </div>
            </div>

            {/* VISUAL ARROW ROUTING BRIDGE */}
            <div className="p-4 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-amber-950/40 border border-indigo-500/20 rounded-2xl mb-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                {/* 1. SENDER */}
                <div className="flex items-center gap-2.5 bg-slate-900/80 border border-indigo-500/30 p-2.5 rounded-xl w-full sm:w-auto">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center font-black text-indigo-300 text-sm shrink-0">
                    {selectedRequestForDetail.fullName.charAt(0)}
                  </div>
                  <div className="text-left min-w-0">
                    <span className="text-[9px] text-indigo-400 font-black uppercase tracking-widest block">WHO SENT (Submitter)</span>
                    <p className="text-xs font-bold text-white truncate">{selectedRequestForDetail.fullName}</p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">UID: {selectedRequestForDetail.userId}</p>
                  </div>
                </div>

                {/* 2. ARROW CONNECTOR */}
                <div className="flex flex-col items-center justify-center px-2">
                  <div className="flex items-center gap-1.5 text-cyan-400 text-[10px] font-black uppercase tracking-widest">
                    <span>Inquiry Sent</span>
                    <ArrowRight className="w-4 h-4 animate-pulse" />
                  </div>
                  <span className="text-[9px] text-slate-400 max-w-[150px] truncate mt-0.5">
                    {selectedRequestForDetail.associatedHouse?.title || 'Sanctuary Listing'}
                  </span>
                </div>

                {/* 3. RECIPIENT */}
                <div className="flex items-center gap-2.5 bg-slate-900/80 border border-amber-500/30 p-2.5 rounded-xl w-full sm:w-auto">
                  <div className="w-9 h-9 rounded-xl bg-amber-600/30 border border-amber-500/40 flex items-center justify-center font-black text-amber-300 text-sm shrink-0">
                    {selectedRequestForDetail.associatedOwner?.fullName?.charAt(0) || selectedRequestForDetail.currentHolder?.charAt(0) || 'H'}
                  </div>
                  <div className="text-left min-w-0">
                    <span className="text-[9px] text-amber-400 font-black uppercase tracking-widest block">TO WHO (Recipient Host)</span>
                    <p className="text-xs font-bold text-white truncate">
                      {selectedRequestForDetail.associatedOwner?.fullName || selectedRequestForDetail.currentHolder || 'Property Host'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">
                      OID: {selectedRequestForDetail.ownerId || selectedRequestForDetail.associatedOwner?.ownerId || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* TWO-COLUMN DEEP RELATIONSHIP DETAIL BODY */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto pr-1">
              {/* LEFT CARD: WHO SENT (Submitter Client Profile) */}
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-3">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-[10px] uppercase font-black tracking-widest text-indigo-400 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-400" /> WHO SENT (Submitter Profile)
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Client Account</span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-white">{selectedRequestForDetail.fullName}</h4>
                    <p className="text-[10px] text-slate-400 font-mono">User ID: <span className="text-indigo-300 select-all">{selectedRequestForDetail.userId}</span></p>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300">
                    {selectedRequestForDetail.phone && (
                      <div className="flex items-center justify-between bg-slate-900/60 p-2 rounded-xl border border-slate-800/80">
                        <span className="flex items-center gap-1.5 text-slate-400 text-xs">
                          <Phone className="w-3.5 h-3.5 text-indigo-400" /> Phone:
                        </span>
                        <a href={`tel:${selectedRequestForDetail.phone}`} className="font-mono text-white font-bold hover:text-indigo-400 transition-colors select-all">
                          {selectedRequestForDetail.phone}
                        </a>
                      </div>
                    )}

                    {selectedRequestForDetail.email && (
                      <div className="flex items-center justify-between bg-slate-900/60 p-2 rounded-xl border border-slate-800/80">
                        <span className="flex items-center gap-1.5 text-slate-400 text-xs">
                          <Mail className="w-3.5 h-3.5 text-indigo-400" /> Email:
                        </span>
                        <a href={`mailto:${selectedRequestForDetail.email}`} className="font-mono text-white font-bold hover:text-indigo-400 transition-colors select-all truncate max-w-[180px]">
                          {selectedRequestForDetail.email}
                        </a>
                      </div>
                    )}

                    {selectedRequestForDetail.moveInDate && (
                      <div className="flex items-center justify-between bg-slate-900/60 p-2 rounded-xl border border-slate-800/80">
                        <span className="flex items-center gap-1.5 text-slate-400 text-xs">
                          <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Move-In Date:
                        </span>
                        <span className="font-mono text-emerald-400 font-bold">
                          {selectedRequestForDetail.moveInDate}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Client Remarks / Message Bubble */}
                  <div className="p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-xl space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 block">
                      Inquiry Message & Requirements:
                    </span>
                    <p className="text-xs text-slate-200 leading-relaxed italic">
                      "{selectedRequestForDetail.messages || 'Interested in reserving this sanctuary stay and arranging viewings.'}"
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleStartDirectChat(
                    selectedRequestForDetail.fullName,
                    'Client',
                    `Hello ${selectedRequestForDetail.fullName}, CEO Office here regarding your stay inquiry on ${selectedRequestForDetail.associatedHouse?.title || 'our sanctuary property'}.`
                  )}
                  className="w-full py-2 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-200 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Send Message to Sender (HQ Comms)</span>
                </button>
              </div>

              {/* RIGHT CARD: TO WHO (Recipient Host & Property) */}
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-3">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-[10px] uppercase font-black tracking-widest text-amber-400 flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 text-amber-400" /> TO WHO (Recipient Host)
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Property Mmiliki</span>
                  </div>

                  {/* Host profile cardlet */}
                  <div className="flex items-center gap-3 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                    {selectedRequestForDetail.associatedOwner?.profileImage ? (
                      <img
                        src={selectedRequestForDetail.associatedOwner.profileImage}
                        alt="Host"
                        className="w-11 h-11 rounded-xl object-cover border border-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-amber-600/30 border border-amber-500/40 flex items-center justify-center font-black text-amber-300 text-sm shrink-0">
                        {(selectedRequestForDetail.associatedOwner?.fullName || selectedRequestForDetail.currentHolder || 'H').charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-white truncate">
                          {selectedRequestForDetail.associatedOwner?.fullName || selectedRequestForDetail.currentHolder || 'Property Host'}
                        </p>
                        <span className="text-[10px] text-amber-400 font-bold">⭐ {selectedRequestForDetail.associatedOwner?.rating || 4.95}</span>
                      </div>
                      <p className="text-[10px] text-amber-400 font-mono truncate">
                        Owner ID: {selectedRequestForDetail.ownerId || selectedRequestForDetail.associatedOwner?.ownerId || 'Unassigned'}
                      </p>
                      {selectedRequestForDetail.associatedOwner?.phone && (
                        <p className="text-[10px] text-slate-400 font-mono truncate">{selectedRequestForDetail.associatedOwner.phone}</p>
                      )}
                    </div>
                  </div>

                  {/* Destination Property Cardlet */}
                  {selectedRequestForDetail.associatedHouse ? (
                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center gap-3">
                      {selectedRequestForDetail.associatedHouse.images?.[0] && (
                        <img
                          src={selectedRequestForDetail.associatedHouse.images[0]}
                          alt={selectedRequestForDetail.associatedHouse.title}
                          className="w-14 h-14 object-cover rounded-xl shrink-0 border border-slate-700"
                        />
                      )}
                      <div className="min-w-0">
                        <span className="text-[9px] text-emerald-400 uppercase font-black">Destination Sanctuary</span>
                        <p className="text-xs font-bold text-white truncate">{selectedRequestForDetail.associatedHouse.title}</p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-0.5 mt-0.5">
                          <MapPin className="w-3 h-3 text-rose-500" /> {selectedRequestForDetail.associatedHouse.location}
                        </p>
                        <p className="text-[10px] text-indigo-400 font-mono font-bold mt-0.5">
                          TSh {selectedRequestForDetail.associatedHouse.amount?.toLocaleString()} / month
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-400">
                      <span className="text-[9px] text-slate-500 uppercase font-black block">Property ID</span>
                      <span className="font-mono text-white font-bold">{selectedRequestForDetail.propertyId || 'General Sanctuary Inquiries'}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => {
                      const hostName = selectedRequestForDetail.associatedOwner?.fullName || selectedRequestForDetail.currentHolder;
                      if (hostName) {
                        setOwnerSearchQuery(hostName);
                        setActiveSubTab('owners');
                        setSelectedRequestForDetail(null);
                        const el = document.getElementById('ceo-main-subtab-container');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all text-center cursor-pointer"
                  >
                    View in Owners Registry
                  </button>

                  <button
                    onClick={() => handleStartDirectChat(
                      selectedRequestForDetail.associatedOwner?.fullName || selectedRequestForDetail.currentHolder || 'Host',
                      'Host',
                      `Hello, CEO Office here regarding stay inquiry #${selectedRequestForDetail.documentId} on ${selectedRequestForDetail.associatedHouse?.title || 'your sanctuary'}.`
                    )}
                    className="py-2 px-3 rounded-xl bg-amber-600/20 hover:bg-amber-600/40 border border-amber-500/30 text-amber-200 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    title="Chat with Host"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                    <span>Chat Host</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer: Status Decisions & Dismiss */}
            <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-2">
                <span>Change Decision Status:</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleModalUpdateStatus('upcoming')}
                  disabled={selectedRequestForDetail.status === 'upcoming' || selectedRequestForDetail.status === 'pending'}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                >
                  Reset to Pending
                </button>

                <button
                  onClick={() => handleModalUpdateStatus('rejected')}
                  disabled={selectedRequestForDetail.status === 'rejected'}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-950/40 hover:bg-rose-900/40 border border-rose-900/40 text-rose-300 hover:text-rose-200 transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                >
                  Reject Inquiry
                </button>

                <button
                  onClick={() => handleModalUpdateStatus('approved')}
                  disabled={selectedRequestForDetail.status === 'approved' || selectedRequestForDetail.status === 'reserved & confirmed'}
                  className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer shadow-lg shadow-emerald-900/30 disabled:opacity-30 disabled:pointer-events-none active:scale-95"
                >
                  Approve Stay
                </button>

                <button
                  onClick={() => setSelectedRequestForDetail(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
