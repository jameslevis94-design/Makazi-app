import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  ShieldCheck,
  Mail,
  Phone,
  Lock,
  Shield,
  Trash2,
  Sun,
  Moon,
  Monitor,
  Type,
  Globe,
  Palette,
  Bell,
  Volume2,
  Smartphone,
  Eye,
  EyeOff,
  Database,
  Key,
  CreditCard,
  History,
  Sparkles,
  Clock,
  Calendar,
  RefreshCw,
  Sliders,
  Mic,
  VolumeX,
  Tv,
  Accessibility,
  Info,
  LogOut,
  RotateCcw,
  Search,
  ChevronRight,
  ChevronDown,
  Check,
  Settings,
  Activity,
  FileText,
  HelpCircle,
  Heart,
  Camera,
  Laptop,
  Wifi,
  Bluetooth,
  Share2,
  AlertTriangle,
  FileCheck,
  Languages
} from 'lucide-react';

interface SettingProps {
  onBack?: () => void;
  onNavigate?: (tab: 'home' | 'search' | 'inbox' | 'profile' | 'settings' | 'ceo') => void;
  onLogout?: () => void;
  onDeleteAccount?: () => void;
  currentUser?: {
    id?: string;
    email: string;
    name: string;
    username?: string;
    avatar?: string;
    location?: string;
    phone?: string;
    role?: 'explorer' | 'owner';
  };
  onUpdateUser?: (updated: any) => Promise<void>;
}

export default function Setting({ onBack, onNavigate, onLogout, onDeleteAccount, currentUser, onUpdateUser }: SettingProps) {
  // 1. STATE DECLARATIONS FOR INTERACTIVE CONTROLS
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('account');
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Account State
  const [profile, setProfile] = useState({
    name: currentUser?.name || 'James Levis',
    username: currentUser?.username || 'jameslevis94',
    email: currentUser?.email || 'jameslevis94@gmail.com',
    phone: currentUser?.phone || '+1 (555) 234-5678',
    avatar: currentUser?.avatar || '',
  });
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [is2FAEnabled, setIs2FAEnabled] = useState(true);

  // Appearance State
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large' | 'xlarge'>('medium');
  const [language, setLanguage] = useState<'en' | 'sw' | 'fr' | 'es'>('en');
  const [accentColor, setAccentColor] = useState<'blue' | 'purple' | 'emerald' | 'indigo' | 'rose'>('indigo');

  // Notifications State
  const [notifications, setNotifications] = useState({
    push: true,
    email: true,
    sms: false,
    sound: true,
    vibration: true,
    preview: true,
  });

  // Privacy State
  const [privacy, setPrivacy] = useState({
    profilePublic: true,
    biometricLogin: false,
    dataBackup: true,
    autoSync: true,
    locationSharing: false,
  });

  // AI Assistant State
  const [aiSettings, setAiSettings] = useState({
    name: 'Makazi AI',
    voice: 'alloy',
    speed: 1.0,
    language: 'en-US',
    style: 'balanced',
    voiceActivation: true,
    wakeWord: 'Hey Makazi',
    offlineMode: false,
  });

  // Connected Devices
  const [devices, setDevices] = useState([
    { id: 'dev-1', name: 'iPhone 15 Pro Max', type: 'mobile', active: true, location: 'London, UK' },
    { id: 'dev-2', name: 'MacBook Pro 16"', type: 'laptop', active: false, location: 'London, UK' },
    { id: 'dev-3', name: 'iPad Pro 12.9"', type: 'tablet', active: false, location: 'Manchester, UK' },
  ]);

  // Accessibility States
  const [accessibility, setAccessibility] = useState({
    highContrast: false,
    screenReader: false,
    textScaling: 100,
    motionReduction: false,
    voiceControl: false,
  });

  // Billing State
  const [paymentMethods, setPaymentMethods] = useState([
    { id: 'pm-1', brand: 'visa', last4: '4242', exp: '12/28', default: true },
    { id: 'pm-2', brand: 'mastercard', last4: '8812', exp: '04/27', default: false },
  ]);

  // Utility to show beautiful popup notifications
  const triggerToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setShowToast({ message, type });
    setTimeout(() => {
      setShowToast(null);
    }, 3000);
  };

  const playFeedback = () => {
    // Elegant light tactile audio effect fallback
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch (e) {
      // AudioContext blocks/fails gracefully
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    playFeedback();
    try {
      const updatedUser = {
        ...currentUser,
        name: profile.name.trim(),
        username: profile.username.trim(),
        email: profile.email.trim(),
        phone: profile.phone.trim(),
      };
      if (onUpdateUser) {
        await onUpdateUser(updatedUser);
      } else {
        localStorage.setItem('makazi_user', JSON.stringify(updatedUser));
      }
      triggerToast('Account profile successfully updated', 'success');
    } catch (err: any) {
      triggerToast(`Update failed: ${err.message || err}`, 'error');
    }
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    playFeedback();
    if (passwords.new !== passwords.confirm) {
      triggerToast('New passwords do not match', 'error');
      return;
    }
    triggerToast('Password changed successfully', 'success');
    setPasswords({ current: '', new: '', confirm: '' });
  };

  const handleDeleteAccount = () => {
    playFeedback();
    setShowDeleteModal(true);
    setDeleteConfirmationText('');
  };

  const executeAccountDeletion = async () => {
    try {
      setIsDeleting(true);
      playFeedback();

      // 1. Clear all user data from localStorage:
      // bookings, broker sheets, active conversations, user profile, favorites, etc.
      localStorage.removeItem('makazi_user');
      localStorage.removeItem('makazi_bookings');
      localStorage.removeItem('makazi_conversations');
      localStorage.removeItem('makazi_broker_applications');
      localStorage.removeItem('makazi_upgrade_requests');
      localStorage.removeItem('makazi_favorites');
      localStorage.removeItem('makazi_payment_accounts');
      localStorage.removeItem('makazi_deactivated_owners');

      // 2. Remove user from makazi_users registry if exists
      const usersStr = localStorage.getItem('makazi_users');
      if (usersStr) {
        try {
          const usersList = JSON.parse(usersStr);
          const filtered = usersList.filter((u: any) => 
            u.email !== currentUser?.email && u.id !== currentUser?.id
          );
          localStorage.setItem('makazi_users', JSON.stringify(filtered));
        } catch (e) {}
      }

      // 3. Clear Appwrite session if possible
      try {
        await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
      } catch (e) {}

      triggerToast('Account and all associated records permanently deleted.', 'success');
      setShowDeleteModal(false);

      // 4. Trigger parent app handler
      setTimeout(() => {
        if (onDeleteAccount) {
          onDeleteAccount();
        } else if (onLogout) {
          onLogout();
        } else {
          window.location.reload();
        }
      }, 700);
    } catch (err: any) {
      triggerToast('Error during deletion: ' + (err?.message || 'Unknown error'), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetSettings = () => {
    playFeedback();
    setProfile({
      name: currentUser?.name || 'James Levis',
      username: currentUser?.username || 'jameslevis94',
      email: currentUser?.email || 'jameslevis94@gmail.com',
      phone: currentUser?.phone || '+1 (555) 234-5678',
      avatar: currentUser?.avatar || '',
    });
    setTheme('dark');
    setFontSize('medium');
    setLanguage('en');
    setAccentColor('indigo');
    setNotifications({
      push: true,
      email: true,
      sms: false,
      sound: true,
      vibration: true,
      preview: true,
    });
    setPrivacy({
      profilePublic: true,
      biometricLogin: false,
      dataBackup: true,
      autoSync: true,
      locationSharing: false,
    });
    triggerToast('All preferences successfully restored to default', 'info');
  };

  // CATEGORY LISTING WITH ASSOCIATED FIELDS & METADATA
  const categories = useMemo(() => [
    { id: 'account', label: 'Account', desc: 'Personal details and credentials', icon: User },
    { id: 'appearance', label: 'Appearance', desc: 'Themes, styling, and colors', icon: Palette },
    { id: 'notifications', label: 'Notifications', desc: 'Alerts and sound channels', icon: Bell },
    { id: 'privacy', label: 'Privacy & Security', desc: 'Shield, 2FA, and permissions', icon: Shield },
    { id: 'billing', label: 'Subscription', desc: 'Plans, billing, and invoices', icon: CreditCard },
    { id: 'preferences', label: 'Preferences', desc: 'Time zones, sync, and storage', icon: Sliders },
    { id: 'ai', label: 'AI Settings', desc: 'Assistant personality and voices', icon: Sparkles },
    { id: 'devices', label: 'Devices', desc: 'Active connections and hardware', icon: Smartphone },
    { id: 'accessibility', label: 'Accessibility', desc: 'Text scale and contrast modes', icon: Accessibility },
    { id: 'about', label: 'About', desc: 'App version and guidelines', icon: Info },
    { id: 'actions', label: 'Critical Actions', desc: 'Log out or factory reset', icon: RotateCcw }
  ], []);

  // Filter categories or content options based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;
    return categories.filter(cat => 
      cat.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.desc.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, categories]);

  // Color theme generator helper
  const accentClasses = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20 focus:border-blue-500 focus:ring-blue-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20 focus:border-purple-500 focus:ring-purple-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 focus:border-emerald-500 focus:ring-emerald-500/20',
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20 focus:border-indigo-500 focus:ring-indigo-500/20',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20',
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 text-slate-100 font-sans" id="premium-settings-workspace">
      
      {/* Dynamic Popups */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl ${
              showToast.type === 'success' ? 'bg-emerald-950/95 border-emerald-500/30 text-emerald-300' :
              showToast.type === 'error' ? 'bg-rose-950/95 border-rose-500/30 text-rose-300' :
              'bg-indigo-950/95 border-indigo-500/30 text-indigo-300'
            }`}
          >
            <div className={`w-2 h-2 rounded-full animate-ping ${
              showToast.type === 'success' ? 'bg-emerald-400' : showToast.type === 'error' ? 'bg-rose-400' : 'bg-indigo-400'
            }`} />
            <span className="text-xs font-semibold">{showToast.message}</span>
          </motion.div>
        )}

        {/* PERMANENT ACCOUNT DELETION CONFIRMATION MODAL */}
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              className="bg-slate-950 border border-rose-500/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-left shadow-2xl space-y-6 relative overflow-hidden"
            >
              {/* Warning top accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-red-600 to-amber-500" />

              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-white">Permanently Delete Account?</h3>
                  <p className="text-xs text-rose-300/90 font-medium">
                    This action is permanent and completely irreversible.
                  </p>
                </div>
              </div>

              {/* Specific deletion details */}
              <div className="bg-rose-950/20 border border-rose-500/20 rounded-2xl p-4 space-y-2 text-xs text-slate-300">
                <p className="font-bold text-rose-300 text-xs uppercase tracking-wider">
                  The following data will be permanently wiped:
                </p>
                <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                  <li><span className="font-semibold text-white">All stay bookings</span> and reservation records</li>
                  <li><span className="font-semibold text-white">All broker application sheets</span> and host upgrade requests</li>
                  <li><span className="font-semibold text-white">All active conversations</span> and chat messages</li>
                  <li><span className="font-semibold text-white">Account profile credentials</span> and stored sessions</li>
                </ul>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 block">
                  To confirm permanent deletion, type <span className="text-rose-400 font-mono font-bold select-all">DELETE</span> below:
                </label>
                <input
                  type="text"
                  placeholder="Type DELETE to confirm"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30 font-mono"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeAccountDeletion}
                  disabled={deleteConfirmationText.trim() !== 'DELETE' || isDeleting}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:hover:bg-rose-600 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-950/40"
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Deleting Account...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      Permanently Delete
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Header Area */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-indigo-300 tracking-tight flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-indigo-400 animate-spin-slow" /> SYSTEM CONFIGURATION
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Manage your credentials, subscription tiers, hardware links, and real-time preferences.
          </p>
        </div>

        {/* Global Action Shortcut Tabs */}
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={() => { playFeedback(); onBack(); }}
              className="px-4 py-2 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold transition-all hover:text-white"
            >
              Go Back
            </button>
          )}
          <button
            onClick={handleResetSettings}
            className="px-4 py-2 bg-slate-900/40 hover:bg-slate-800/80 border border-slate-800/50 hover:border-indigo-500/30 rounded-xl text-xs text-slate-400 hover:text-indigo-300 font-semibold transition-all flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Restore Defaults
          </button>
        </div>
      </div>

      {/* Global Live Filter Search Input */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
        <input
          type="text"
          placeholder="Search all settings preferences (e.g. Password, Theme, Biometric, Assistant...)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3.5 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 rounded-2xl text-xs sm:text-sm outline-none transition-all placeholder-slate-600 font-medium text-slate-200 shadow-inner"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-white font-mono"
          >
            Clear
          </button>
        )}
      </div>

      {/* Dual Panel Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* SIDEBAR NAVIGATION (LEFT 4 COLS) */}
        <div className="lg:col-span-4 space-y-2 lg:sticky lg:top-6">
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-3xl p-4 space-y-1.5 backdrop-blur-md">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-3.5 mb-2 flex items-center justify-between">
              <span>Settings Categories</span>
              <span className="bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded text-[8px] font-mono border border-indigo-500/10">
                {filteredCategories.length} Categories
              </span>
            </h2>

            {filteredCategories.map((category) => {
              const IconComp = category.icon;
              const isActive = activeCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => { playFeedback(); setActiveCategory(category.id); }}
                  className={`w-full flex items-center gap-3.5 p-3 rounded-2xl text-left transition-all ${
                    isActive
                      ? 'bg-indigo-650 text-white shadow-lg shadow-indigo-950/30 scale-[1.01] border-l-4 border-indigo-400'
                      : 'hover:bg-slate-900/60 text-slate-400 hover:text-slate-100 border border-transparent'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${
                    isActive ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'
                  }`}>
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold leading-none">{category.label}</p>
                    <p className="text-[9px] text-slate-500 truncate mt-1 leading-none group-hover:text-slate-400">
                      {category.desc}
                    </p>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${isActive ? 'translate-x-0.5 opacity-100' : 'opacity-40'}`} />
                </button>
              );
            })}

            {filteredCategories.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                <AlertTriangle className="w-8 h-8 text-amber-500/40 mx-auto mb-2" />
                <p className="text-xs font-bold">No settings found</p>
                <p className="text-[10px] text-slate-600 mt-1">Try searching with other keywords</p>
              </div>
            )}
          </div>
        </div>

        {/* DETAILS WORKSPACE PANEL (RIGHT 8 COLS) */}
        <div className="lg:col-span-8 bg-slate-950/35 border border-slate-800/60 rounded-3xl p-6 min-h-[500px] backdrop-blur-md">
          <AnimatePresence mode="wait">
            
            {/* 1. ACCOUNT PANEL */}
            {activeCategory === 'account' && (
              <motion.div
                key="account"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
                  <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">Account Configurations</h3>
                    <p className="text-[10px] text-slate-400">Synchronize names, virtual broker statuses, and active profiles.</p>
                  </div>
                </div>

                {/* Profile Section Form */}
                <form onSubmit={handleProfileSave} className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-900/30 p-4 rounded-2xl border border-slate-800/50">
                    <div className="relative shrink-0 group">
                      <div className="w-16 h-16 rounded-full bg-indigo-650 border-2 border-indigo-500/30 text-indigo-300 font-black flex items-center justify-center text-xl uppercase shadow-md overflow-hidden">
                        {profile.name.charAt(0)}
                      </div>
                      <button
                        type="button"
                        onClick={() => triggerToast('Avatar customization is locked in current preview mode', 'info')}
                        className="absolute bottom-0 right-0 p-1.5 bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-full text-slate-400 hover:text-white shadow-lg cursor-pointer transition-all"
                      >
                        <Camera className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="text-center sm:text-left">
                      <h4 className="text-xs font-black text-white">{profile.name}</h4>
                      <p className="text-[10px] text-indigo-300 font-mono mt-0.5">@{profile.username}</p>
                      <p className="text-[9px] text-slate-500 mt-1 uppercase tracking-wider">Premium Landlord / Active Broker</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Full Name</label>
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        className="w-full p-3 bg-slate-950/50 border border-slate-800/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 rounded-xl text-xs outline-none text-slate-100"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Username</label>
                      <input
                        type="text"
                        value={profile.username}
                        onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                        className="w-full p-3 bg-slate-950/50 border border-slate-800/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 rounded-xl text-xs outline-none text-slate-100 font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Email Address</label>
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        className="w-full p-3 bg-slate-950/50 border border-slate-800/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 rounded-xl text-xs outline-none text-slate-100"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Phone Number</label>
                      <input
                        type="text"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        className="w-full p-3 bg-slate-950/50 border border-slate-800/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 rounded-xl text-xs outline-none text-slate-100 font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-[0.99] cursor-pointer"
                  >
                    Save Changes
                  </button>
                </form>

                {/* Password / Auth Section */}
                <div className="pt-6 border-t border-slate-800/60 space-y-4">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-indigo-400" />
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-300">Change Password Security</h4>
                  </div>

                  <form onSubmit={handlePasswordReset} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="password"
                      placeholder="Current Password"
                      value={passwords.current}
                      onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                      className="p-3 bg-slate-950/50 border border-slate-800/80 focus:border-indigo-500 rounded-xl text-xs outline-none text-slate-100"
                      required
                    />
                    <input
                      type="password"
                      placeholder="New Password"
                      value={passwords.new}
                      onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                      className="p-3 bg-slate-950/50 border border-slate-800/80 focus:border-indigo-500 rounded-xl text-xs outline-none text-slate-100"
                      required
                    />
                    <div className="flex gap-2">
                      <input
                        type="password"
                        placeholder="Confirm"
                        value={passwords.confirm}
                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                        className="flex-1 p-3 bg-slate-950/50 border border-slate-800/80 focus:border-indigo-500 rounded-xl text-xs outline-none text-slate-100"
                        required
                      />
                      <button
                        type="submit"
                        className="px-4 bg-slate-900 border border-slate-800 hover:border-indigo-500 text-slate-200 text-xs font-bold rounded-xl hover:text-white transition-all cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>
                  </form>
                </div>

                {/* Account Security Toggles */}
                <div className="pt-6 border-t border-slate-800/60 space-y-3.5">
                  <div className="flex justify-between items-center p-3.5 bg-slate-900/30 rounded-2xl border border-slate-800/50">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">Two-Factor Authentication (2FA)</span>
                      <span className="text-[9px] text-slate-500">Add an extra layers of protection using SMS / Auth apps.</span>
                    </div>
                    <button
                      onClick={() => { playFeedback(); setIs2FAEnabled(!is2FAEnabled); triggerToast(`Two-factor authorization is now ${!is2FAEnabled ? 'Enabled' : 'Disabled'}`); }}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-all ${
                        is2FAEnabled ? 'bg-indigo-600' : 'bg-slate-800 border border-slate-700'
                      }`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-lg transform transition-transform ${is2FAEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="flex justify-between items-center p-3.5 bg-rose-500/5 rounded-2xl border border-rose-500/10">
                    <div>
                      <span className="text-xs font-bold text-rose-300 block">Permanently Delete Account</span>
                      <span className="text-[9px] text-rose-500">Delete all bookings, broker sheets, and active conversations.</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white text-[10px] font-black uppercase tracking-wider rounded-xl border border-rose-500/20 hover:border-transparent transition-all cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 2. APPEARANCE PANEL */}
            {activeCategory === 'appearance' && (
              <motion.div
                key="appearance"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
                  <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">Appearance Styling</h3>
                    <p className="text-[10px] text-slate-400">Manage dark/light visual modes, accent layers, and font scales.</p>
                  </div>
                </div>

                {/* Dark / Light / System Theme */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Select Theme Preset</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'light', label: 'Light Mode', icon: Sun },
                      { id: 'dark', label: 'Dark Mode', icon: Moon },
                      { id: 'system', label: 'System Default', icon: Monitor }
                    ].map((item) => {
                      const Icon = item.icon;
                      const active = theme === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => { playFeedback(); setTheme(item.id as any); triggerToast(`Theme updated to ${item.label}`); }}
                          className={`p-4 rounded-2xl text-center border transition-all cursor-pointer flex flex-col items-center gap-2 ${
                            active
                              ? 'bg-indigo-500/10 border-indigo-500 text-indigo-300'
                              : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-[10px] font-black uppercase tracking-wider">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Accent Color selection */}
                <div className="space-y-3 pt-4 border-t border-slate-800/50">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">App Accent Palette</label>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { id: 'indigo', name: 'Royal Indigo', color: 'bg-indigo-500' },
                      { id: 'blue', name: 'Ocean Blue', color: 'bg-blue-500' },
                      { id: 'purple', name: 'Cyber Purple', color: 'bg-purple-500' },
                      { id: 'emerald', name: 'Emerald Forest', color: 'bg-emerald-500' },
                      { id: 'rose', name: 'Warm Crimson', color: 'bg-rose-500' }
                    ].map((c) => {
                      const selected = accentColor === c.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => { playFeedback(); setAccentColor(c.id as any); triggerToast(`Accent color shifted to ${c.name}`); }}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all ${
                            selected
                              ? 'border-white/30 text-white bg-white/5'
                              : 'border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span className={`w-3.5 h-3.5 rounded-full ${c.color}`} />
                          {c.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Font Scaling selector */}
                <div className="space-y-3 pt-4 border-t border-slate-800/50">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Typography Scale</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'small', label: '12px Small' },
                      { id: 'medium', label: '14px Normal' },
                      { id: 'large', label: '16px Large' },
                      { id: 'xlarge', label: '18px Extra' }
                    ].map((item) => {
                      const selected = fontSize === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => { playFeedback(); setFontSize(item.id as any); }}
                          className={`p-3 rounded-xl border text-[10px] font-semibold text-center transition-all cursor-pointer ${
                            selected
                              ? 'bg-indigo-650 text-white border-indigo-500'
                              : 'bg-slate-900/30 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Default Language Selector */}
                <div className="space-y-3 pt-4 border-t border-slate-800/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Languages className="w-4 h-4 text-slate-400" />
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">System Localization Language</label>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'en', label: 'English (US)' },
                      { id: 'sw', label: 'Kiswahili (TZ)' },
                      { id: 'fr', label: 'Français (FR)' },
                      { id: 'es', label: 'Español (ES)' }
                    ].map((langObj) => {
                      const selected = language === langObj.id;
                      return (
                        <button
                          key={langObj.id}
                          onClick={() => { playFeedback(); setLanguage(langObj.id as any); triggerToast(`Language changed to ${langObj.label}`); }}
                          className={`p-3 rounded-xl border text-[10px] font-bold text-center transition-all cursor-pointer ${
                            selected
                              ? 'bg-indigo-500/10 border-indigo-500 text-indigo-300'
                              : 'bg-slate-900/30 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {langObj.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* 3. NOTIFICATIONS PANEL */}
            {activeCategory === 'notifications' && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
                  <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">Alert Preferences</h3>
                    <p className="text-[10px] text-slate-400">Choose how and when you receive message responses and book listings.</p>
                  </div>
                </div>

                {/* Dynamic Switch Board */}
                <div className="space-y-3.5">
                  {[
                    { id: 'push', label: 'Push Notifications', desc: 'Recieve instant alerts on your active workstation desktop.' },
                    { id: 'email', label: 'Email Notifications', desc: 'Weekly booking metrics and brokerage listings.' },
                    { id: 'sms', label: 'SMS Notifications', desc: 'Secure alerts for payment checkouts and active contracts.' },
                    { id: 'sound', label: 'Notification Sounds', desc: 'Play tactile alert rings on messaging.' },
                    { id: 'vibration', label: 'Tactile Vibrations', desc: 'Enable vibration indicators on supported portable screens.' },
                    { id: 'preview', label: 'Message Previews', desc: 'Include details and sender avatars in banner alerts.' }
                  ].map((item) => {
                    const checked = (notifications as any)[item.id];
                    return (
                      <div key={item.id} className="flex justify-between items-center p-3.5 bg-slate-900/40 rounded-2xl border border-slate-800/80 text-left">
                        <div className="pr-4">
                          <span className="text-xs font-bold text-slate-200 block">{item.label}</span>
                          <span className="text-[9px] text-slate-500 leading-none">{item.desc}</span>
                        </div>
                        <button
                          onClick={() => {
                            playFeedback();
                            setNotifications({ ...notifications, [item.id]: !checked });
                            triggerToast(`${item.label} ${!checked ? 'Activated' : 'Muted'}`);
                          }}
                          className={`w-11 h-6 flex items-center rounded-full p-1 transition-all shrink-0 cursor-pointer ${
                            checked ? 'bg-indigo-600' : 'bg-slate-800 border border-slate-700'
                          }`}
                        >
                          <div className={`bg-white w-4 h-4 rounded-full shadow-lg transform transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* 4. PRIVACY & SECURITY PANEL */}
            {activeCategory === 'privacy' && (
              <motion.div
                key="privacy"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
                  <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">Privacy & Security</h3>
                    <p className="text-[10px] text-slate-400">Manage sensitive profile sharing data and active biometric connections.</p>
                  </div>
                </div>

                {/* Privacy Options */}
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center p-3.5 bg-slate-900/40 rounded-2xl border border-slate-800/80 text-left">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">Public Broker Profile</span>
                      <span className="text-[9px] text-slate-500">Allow other brokers to search your profile and list metrics in active stays.</span>
                    </div>
                    <button
                      onClick={() => { playFeedback(); setPrivacy({ ...privacy, profilePublic: !privacy.profilePublic }); }}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-all shrink-0 ${
                        privacy.profilePublic ? 'bg-indigo-600' : 'bg-slate-800 border border-slate-700'
                      }`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-lg transform transition-transform ${privacy.profilePublic ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="flex justify-between items-center p-3.5 bg-slate-900/40 rounded-2xl border border-slate-800/80 text-left">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">Biometric Fingerprint/Face ID</span>
                      <span className="text-[9px] text-slate-500">Unlock details immediately using biometric scanning technologies.</span>
                    </div>
                    <button
                      onClick={() => { playFeedback(); setPrivacy({ ...privacy, biometricLogin: !privacy.biometricLogin }); triggerToast(`Biometric auth ${!privacy.biometricLogin ? 'activated' : 'deactivated'}`); }}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-all shrink-0 ${
                        privacy.biometricLogin ? 'bg-indigo-600' : 'bg-slate-800 border border-slate-700'
                      }`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-lg transform transition-transform ${privacy.biometricLogin ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="flex justify-between items-center p-3.5 bg-slate-900/40 rounded-2xl border border-slate-800/80 text-left">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">Cloud Data Backup</span>
                      <span className="text-[9px] text-slate-500">Automatically sync stay bookings and conversation charts with Cloud.</span>
                    </div>
                    <button
                      onClick={() => { playFeedback(); setPrivacy({ ...privacy, dataBackup: !privacy.dataBackup }); }}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-all shrink-0 ${
                        privacy.dataBackup ? 'bg-indigo-600' : 'bg-slate-800 border border-slate-700'
                      }`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-lg transform transition-transform ${privacy.dataBackup ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="flex justify-between items-center p-3.5 bg-slate-900/40 rounded-2xl border border-slate-800/80 text-left">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">Real-time GPS Location sharing</span>
                      <span className="text-[9px] text-slate-500">Share active coordinates for nearby apartment matches.</span>
                    </div>
                    <button
                      onClick={() => { playFeedback(); setPrivacy({ ...privacy, locationSharing: !privacy.locationSharing }); }}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-all shrink-0 ${
                        privacy.locationSharing ? 'bg-indigo-600' : 'bg-slate-800 border border-slate-700'
                      }`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-lg transform transition-transform ${privacy.locationSharing ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>

                {/* Sensitive Download Operations */}
                <div className="pt-6 border-t border-slate-800/50 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 bg-slate-900/30 rounded-2xl border border-slate-800/60 text-left">
                    <span className="text-xs font-bold text-slate-200 block">Download Profile History</span>
                    <p className="text-[9px] text-slate-500 mt-1 mb-3">Obtain a zipped JSON log containing all active chat metrics, receipts, and listings.</p>
                    <button
                      type="button"
                      onClick={() => { playFeedback(); triggerToast('Packaging historical files for download...', 'info'); }}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 text-[10px] font-bold uppercase rounded-lg transition-all cursor-pointer"
                    >
                      Download ZIP
                    </button>
                  </div>

                  <div className="p-4 bg-slate-900/30 rounded-2xl border border-slate-800/60 text-left">
                    <span className="text-xs font-bold text-slate-200 block">Cloud Server Synchronization</span>
                    <p className="text-[9px] text-slate-500 mt-1 mb-3">Force local offline stay history to compile into server databases immediately.</p>
                    <button
                      type="button"
                      onClick={() => { playFeedback(); triggerToast('Databases compiled successfully!', 'success'); }}
                      className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 text-[10px] font-bold uppercase rounded-lg transition-all cursor-pointer"
                    >
                      Sync Now
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 5. SUBSCRIPTION & BILLING PANEL */}
            {activeCategory === 'billing' && (
              <motion.div
                key="billing"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
                  <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">Billing & Subscriptions</h3>
                    <p className="text-[10px] text-slate-400">Modify active premium plans, view payment methods, and check historical invoices.</p>
                  </div>
                </div>

                {/* Plan Tier Display */}
                <div className="p-5 bg-gradient-to-br from-indigo-900/40 to-slate-950/90 rounded-[2rem] border border-indigo-500/20 relative overflow-hidden text-left">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                  <span className="px-2.5 py-1 bg-indigo-500 text-white font-black uppercase tracking-widest text-[8px] rounded-lg border border-indigo-400/20">
                    Active Plan
                  </span>
                  <h4 className="text-xl font-black text-white tracking-tight mt-3">Enterprise Pro Broker</h4>
                  <p className="text-[10px] text-indigo-300 mt-1 font-medium">Automatic billing cycles update on July 24, 2026 ($29.00 / month)</p>

                  <div className="mt-5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => { playFeedback(); triggerToast('Brokers can contact Enterprise desks to change plans', 'info'); }}
                      className="px-4 py-2.5 bg-white hover:bg-slate-150 text-slate-950 text-xs font-black uppercase rounded-xl transition-all cursor-pointer"
                    >
                      Upgrade Plan
                    </button>
                    <button
                      type="button"
                      onClick={() => { playFeedback(); triggerToast('Auto-renew successfully toggled off'); }}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 hover:border-slate-700 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer"
                    >
                      Disable Auto-Renew
                    </button>
                  </div>
                </div>

                {/* Saved Cards */}
                <div className="pt-4 border-t border-slate-800/50 space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Saved Payment Methods</label>
                  <div className="space-y-2">
                    {paymentMethods.map((pm) => (
                      <div key={pm.id} className="flex justify-between items-center p-3.5 bg-slate-900/30 rounded-2xl border border-slate-800/80 text-left">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-6 bg-slate-950 rounded border border-slate-800 flex items-center justify-center font-bold text-[10px] uppercase font-mono tracking-widest text-slate-400">
                            {pm.brand}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-200 block">•••• •••• •••• {pm.last4}</span>
                            <span className="text-[9px] text-slate-500 leading-none">Expires: {pm.exp}</span>
                          </div>
                        </div>
                        {pm.default ? (
                          <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[8px] font-bold uppercase tracking-wider border border-indigo-500/20">
                            Primary
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              playFeedback();
                              setPaymentMethods(paymentMethods.map(p => ({ ...p, default: p.id === pm.id })));
                              triggerToast('Primary billing card updated');
                            }}
                            className="text-[9px] text-slate-400 hover:text-white font-bold uppercase tracking-wider"
                          >
                            Set Default
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fake Invoice History */}
                <div className="pt-4 border-t border-slate-800/50 space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Recent Broker Receipts</label>
                  <div className="space-y-2.5 font-mono text-xs">
                    {[
                      { code: 'INV-48201', date: '2026-06-01', amount: '$29.00', status: 'Paid' },
                      { code: 'INV-47123', date: '2026-05-01', amount: '$29.00', status: 'Paid' },
                      { code: 'INV-46091', date: '2026-04-01', amount: '$15.00', status: 'Paid' }
                    ].map((inv) => (
                      <div key={inv.code} className="flex justify-between items-center p-2.5 bg-slate-950/20 border border-slate-850/50 rounded-xl">
                        <div className="text-left">
                          <span className="text-slate-300 block font-bold text-[11px]">{inv.code}</span>
                          <span className="text-[9px] text-slate-500">{inv.date}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px]">
                          <span className="text-slate-200">{inv.amount}</span>
                          <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/10 text-[9px]">
                            {inv.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* 6. APP PREFERENCES PANEL */}
            {activeCategory === 'preferences' && (
              <motion.div
                key="preferences"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
                  <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">System Preferences</h3>
                    <p className="text-[10px] text-slate-400">Configure default routes, active local sync limits, and date layouts.</p>
                  </div>
                </div>

                <div className="space-y-4 text-left">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Default Landing Homepage</label>
                    <select className="w-full p-3 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none">
                      <option value="home">Property Dashboard Listings</option>
                      <option value="search">Search & Filter Grid</option>
                      <option value="inbox">Chat Conversation threads</option>
                      <option value="profile">Broker Account Spotlight</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Time Zone Preset</label>
                      <select className="w-full p-3 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none font-mono">
                        <option value="london">London GMT (UTC +0)</option>
                        <option value="ny">New York EST (UTC -5)</option>
                        <option value="tokyo">Tokyo JST (UTC +9)</option>
                        <option value="dar">Dar es Salaam EAT (UTC +3)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Date Layout Format</label>
                      <select className="w-full p-3 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none font-mono">
                        <option value="YYYY-MM-DD">YYYY-MM-DD (2026-06-28)</option>
                        <option value="DD-MM-YYYY">DD-MM-YYYY (28-06-2026)</option>
                        <option value="MM-DD-YYYY">MM-DD-YYYY (06-28-2026)</option>
                      </select>
                    </div>
                  </div>

                  {/* Cache & Local Storage stats */}
                  <div className="pt-6 border-t border-slate-800/50 space-y-3.5">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Cache and Storage Management</h4>
                    <div className="p-4 bg-slate-900/30 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">Offline Broker Assets</span>
                        <p className="text-[10px] text-slate-500 mt-1">Stays cache, map coordinates, and loaded avatars: <strong className="text-slate-300 font-mono">14.8 MB</strong> used.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { playFeedback(); triggerToast('Offline file caches cleared successfully', 'success'); }}
                        className="px-4 py-2 bg-slate-950 border border-slate-800 hover:border-rose-500/35 hover:text-rose-400 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                      >
                        Clear Cache
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 7. AI SETTINGS PANEL */}
            {activeCategory === 'ai' && (
              <motion.div
                key="ai"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
                  <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">Makazi AI Assistant</h3>
                    <p className="text-[10px] text-slate-400">Configure response presets, virtual assistant voice synthesis, and offline wake parameters.</p>
                  </div>
                </div>

                <div className="space-y-4 text-left">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">AI Assistant Custom Name</label>
                      <input
                        type="text"
                        value={aiSettings.name}
                        onChange={(e) => setAiSettings({ ...aiSettings, name: e.target.value })}
                        className="w-full p-3 bg-slate-950/50 border border-slate-800 rounded-xl text-xs outline-none text-slate-100 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Wake-Up Keyword Trigger</label>
                      <input
                        type="text"
                        value={aiSettings.wakeWord}
                        onChange={(e) => setAiSettings({ ...aiSettings, wakeWord: e.target.value })}
                        className="w-full p-3 bg-slate-950/50 border border-slate-800 rounded-xl text-xs outline-none text-slate-100 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Voice Synthesis Preset</label>
                      <select
                        value={aiSettings.voice}
                        onChange={(e) => setAiSettings({ ...aiSettings, voice: e.target.value })}
                        className="w-full p-3 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none"
                      >
                        <option value="alloy">Alloy (Balanced & Warm)</option>
                        <option value="echo">Echo (Realistic Mono)</option>
                        <option value="fable">Fable (Creative Display)</option>
                        <option value="nova">Nova (Bright Soprano)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Response Style Profile</label>
                      <select
                        value={aiSettings.style}
                        onChange={(e) => setAiSettings({ ...aiSettings, style: e.target.value })}
                        className="w-full p-3 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none"
                      >
                        <option value="balanced">Balanced Conversational</option>
                        <option value="concise">Concise Technical Summaries</option>
                        <option value="creative">Creative Marketing Pitch</option>
                      </select>
                    </div>
                  </div>

                  {/* Speech speed slider */}
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <span>Voice Playback Speed</span>
                      <span className="font-mono text-indigo-400">{aiSettings.speed}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={aiSettings.speed}
                      onChange={(e) => setAiSettings({ ...aiSettings, speed: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  {/* AI Toggles */}
                  <div className="pt-4 border-t border-slate-800/50 space-y-3">
                    <div className="flex justify-between items-center p-3 bg-slate-900/30 rounded-xl border border-slate-850">
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">Voice Activation (Hands-Free)</span>
                        <span className="text-[9px] text-slate-500">Listen continuously for your customized wake keyword trigger.</span>
                      </div>
                      <button
                        onClick={() => { playFeedback(); setAiSettings({ ...aiSettings, voiceActivation: !aiSettings.voiceActivation }); }}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-all shrink-0 ${
                          aiSettings.voiceActivation ? 'bg-indigo-650' : 'bg-slate-800'
                        }`}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-lg transform transition-transform ${aiSettings.voiceActivation ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-slate-900/30 rounded-xl border border-slate-850">
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">Offline On-Device NLU</span>
                        <span className="text-[9px] text-slate-500">Respond using localized light models when internet routes fail.</span>
                      </div>
                      <button
                        onClick={() => { playFeedback(); setAiSettings({ ...aiSettings, offlineMode: !aiSettings.offlineMode }); }}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-all shrink-0 ${
                          aiSettings.offlineMode ? 'bg-indigo-650' : 'bg-slate-800'
                        }`}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-lg transform transition-transform ${aiSettings.offlineMode ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 8. CONNECTED DEVICES */}
            {activeCategory === 'devices' && (
              <motion.div
                key="devices"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
                  <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">Hardware & Devices</h3>
                    <p className="text-[10px] text-slate-400">View and manage authorized hardware endpoints logged into this account.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {devices.map((dev) => (
                    <div key={dev.id} className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800 flex items-center justify-between gap-4 text-left">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-slate-950 rounded-xl text-slate-400 border border-slate-850">
                          {dev.type === 'mobile' ? <Smartphone className="w-5 h-5" /> :
                           dev.type === 'laptop' ? <Laptop className="w-5 h-5" /> :
                           <Tv className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-200">{dev.name}</span>
                            {dev.active && (
                              <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 rounded text-[8px] font-black uppercase tracking-wider animate-pulse">
                                Active Now
                              </span>
                            )}
                          </div>
                          <p className="text-[9px] text-slate-500 mt-1 font-mono">Location Match: {dev.location}</p>
                        </div>
                      </div>

                      {!dev.active && (
                        <button
                          type="button"
                          onClick={() => {
                            playFeedback();
                            setDevices(devices.filter(d => d.id !== dev.id));
                            triggerToast(`Revoked auth tokens for ${dev.name}`);
                          }}
                          className="px-3 py-1.5 bg-slate-950 hover:bg-rose-950/20 border border-slate-850 hover:border-rose-500/20 text-slate-400 hover:text-rose-400 text-[10px] font-bold uppercase rounded-xl transition-all cursor-pointer"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Hardware Connection Modes */}
                <div className="pt-6 border-t border-slate-800/50 grid grid-cols-2 gap-3">
                  {[
                    { label: 'Wi-Fi Connection', active: true, desc: 'Sync properties on Local Lan.', icon: Wifi },
                    { label: 'Bluetooth Link', active: false, desc: 'Near field pairing for locks.', icon: Bluetooth }
                  ].map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <div key={idx} className="p-3.5 bg-slate-900/20 rounded-2xl border border-slate-850 text-left">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Icon className={`w-4 h-4 ${item.active ? 'text-indigo-400' : 'text-slate-500'}`} />
                          <span className="text-xs font-bold text-slate-200">{item.label}</span>
                        </div>
                        <p className="text-[9px] text-slate-500 leading-none">{item.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* 9. ACCESSIBILITY */}
            {activeCategory === 'accessibility' && (
              <motion.div
                key="accessibility"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
                  <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
                    <Accessibility className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">Accessibility Tools</h3>
                    <p className="text-[10px] text-slate-400">Enhance stay exploration using custom visual scales and keyboard overlays.</p>
                  </div>
                </div>

                <div className="space-y-3.5 text-left">
                  <div className="flex justify-between items-center p-3.5 bg-slate-900/40 rounded-2xl border border-slate-800/80">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">High Contrast Interface Mode</span>
                      <span className="text-[9px] text-slate-500">Dark background elements shifting to absolute black for clarity.</span>
                    </div>
                    <button
                      onClick={() => { playFeedback(); setAccessibility({ ...accessibility, highContrast: !accessibility.highContrast }); }}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-all shrink-0 ${
                        accessibility.highContrast ? 'bg-indigo-650' : 'bg-slate-800'
                      }`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-lg transform transition-transform ${accessibility.highContrast ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="flex justify-between items-center p-3.5 bg-slate-900/40 rounded-2xl border border-slate-800/80">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">Screen Reader Narrations</span>
                      <span className="text-[9px] text-slate-500">Read system notifications and broker listing details aloud.</span>
                    </div>
                    <button
                      onClick={() => { playFeedback(); setAccessibility({ ...accessibility, screenReader: !accessibility.screenReader }); }}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-all shrink-0 ${
                        accessibility.screenReader ? 'bg-indigo-650' : 'bg-slate-800'
                      }`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-lg transform transition-transform ${accessibility.screenReader ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="flex justify-between items-center p-3.5 bg-slate-900/40 rounded-2xl border border-slate-800/80">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">Motion and Animation Reduction</span>
                      <span className="text-[9px] text-slate-500">Minimize sliding transitions and complex visual calculations.</span>
                    </div>
                    <button
                      onClick={() => { playFeedback(); setAccessibility({ ...accessibility, motionReduction: !accessibility.motionReduction }); }}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-all shrink-0 ${
                        accessibility.motionReduction ? 'bg-indigo-650' : 'bg-slate-800'
                      }`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-lg transform transition-transform ${accessibility.motionReduction ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Text scale factor */}
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <span>Desktop Text Scaling Factor</span>
                      <span className="font-mono text-indigo-400">{accessibility.textScaling}%</span>
                    </div>
                    <input
                      type="range"
                      min="80"
                      max="150"
                      step="5"
                      value={accessibility.textScaling}
                      onChange={(e) => setAccessibility({ ...accessibility, textScaling: parseInt(e.target.value) })}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* 10. ABOUT PANEL */}
            {activeCategory === 'about' && (
              <motion.div
                key="about"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6 text-left"
              >
                <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
                  <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">About Makazi Suite</h3>
                    <p className="text-[10px] text-slate-400">View app versions, guidelines, licensing agreements, and support structures.</p>
                  </div>
                </div>

                {/* Dynamic App Version Detail Card */}
                <div className="p-4 bg-slate-900/30 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <span className="text-xs font-black text-white block">Makazi Core Brokerage Engine</span>
                    <span className="text-[10px] text-slate-500">Version: <strong className="text-indigo-400 font-mono">v4.12.0-Alpha</strong> build.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { playFeedback(); triggerToast('You are running the latest premium version!', 'success'); }}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/25 text-[10px] text-slate-300 hover:text-white font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    Check for Updates
                  </button>
                </div>

                {/* Sub links listing */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                  {[
                    { title: 'Privacy & Security Policy', desc: 'Secure encryption parameters.', icon: FileCheck },
                    { title: 'User Terms & Conditions', desc: 'Active guidelines for verified brokers.', icon: FileText },
                    { title: 'Contact Support Helpdesk', desc: 'Reach our enterprise teams.', icon: HelpCircle },
                    { title: 'Rate Makazi Application', desc: 'Let us know how we did.', icon: Heart }
                  ].map((link, idx) => {
                    const LinkIcon = link.icon;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => { playFeedback(); triggerToast(`Opening "${link.title}" portal`); }}
                        className="p-3.5 bg-slate-900/20 hover:bg-slate-900/55 rounded-2xl border border-slate-850 hover:border-slate-800 flex items-center gap-3.5 text-left transition-all cursor-pointer"
                      >
                        <div className="p-2 rounded-xl bg-slate-950 text-slate-400">
                          <LinkIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-200 block">{link.title}</span>
                          <span className="text-[9px] text-slate-500 mt-0.5 leading-none">{link.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* 11. CRITICAL ACTIONS */}
            {activeCategory === 'actions' && (
              <motion.div
                key="actions"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6 text-left"
              >
                <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
                  <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-rose-300">Critical Account Actions</h3>
                    <p className="text-[10px] text-rose-500">Terminate sessions, restart brokerage panels, or purge local database storage.</p>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">Terminate Account Session</span>
                      <span className="text-[9px] text-slate-500 leading-none">Disconnect this device and log out securely.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { playFeedback(); if (onLogout) onLogout(); }}
                      className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400 rounded-xl text-[10px] font-black uppercase border border-rose-500/20 hover:border-transparent transition-all cursor-pointer"
                    >
                      Log Out
                    </button>
                  </div>

                  <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">Sign Out From All Registered Devices</span>
                      <span className="text-[9px] text-slate-500 leading-none">Force terminate credentials and invalidate tokens on other devices.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { playFeedback(); triggerToast('Successfully logged out from all active devices', 'info'); }}
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer"
                    >
                      Sign Out All
                    </button>
                  </div>

                  <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">Soft App Restart</span>
                      <span className="text-[9px] text-slate-500 leading-none">Reset the visual UI cache without losing active booking logs.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { playFeedback(); triggerToast('Soft resetting visual workspace...', 'info'); setTimeout(() => window.location.reload(), 1200); }}
                      className="px-3.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white border border-indigo-500/20 hover:border-transparent rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer"
                    >
                      Restart App
                    </button>
                  </div>

                  <div className="p-4 bg-rose-950/25 rounded-2xl border border-rose-500/15 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-rose-300 block">Factory Hard Reset</span>
                      <span className="text-[9px] text-rose-500 leading-none">Wipe profile data, clear invoice histories, delete all bookings, and revert everything.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { playFeedback(); handleDeleteAccount(); }}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer"
                    >
                      Factory Reset
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
