/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { INITIAL_HOUSES, INITIAL_BOOKINGS, INITIAL_CONVERSATIONS } from './data';
import { House, Booking, Conversation, Message, HeroContent, DEFAULT_HERO_CONTENT } from './types';
import { getStoredVideo } from './lib/videoStorage';
import HomeView from './components/HomeView';
import InboxView from './components/InboxView';
import ProfileView from './components/ProfileView';
import AuthView from './components/AuthView';
import Setting from './components/Setting';
import CEODashboard from './components/CEODashboard';
import BookingModal from './components/BookingModal';
import ViewDetailsModal from './components/ViewDetailsModal';
import PostingModal from './components/PostingModal';
import MakaziLogo from './components/MakaziLogo';
import SearchView from './components/SearchView';
import OwnerProfileModal from './components/OwnerProfileModal';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, Mail, User, Search, Tent, Sparkles, Heart, Database, Check, AlertCircle, RefreshCw, PlusCircle, ExternalLink, Settings, Shield, Home } from 'lucide-react';
import { fetchHousesFromAppwrite, createDemoHouseInAppwrite, APPWRITE_DEFAULTS, fetchUserProfile, updateUserProfile, saveBookingToAppwrite, deleteHouseInAppwrite, updateHouseInAppwrite, fetchOwnersFromAppwrite, getAppwriteImageUrl } from './lib/appwrite';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'inbox' | 'profile' | 'settings' | 'ceo'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [houses, setHouses] = useState<House[]>(INITIAL_HOUSES);

  const [deletedHouseIds, setDeletedHouseIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('makazi_deleted_houses');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [editedHouses, setEditedHouses] = useState<Record<string, Partial<House>>>(() => {
    try {
      const saved = localStorage.getItem('makazi_edited_houses');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const processedHouses = React.useMemo(() => {
    const active = houses.filter((h) => !deletedHouseIds.includes(h.id));
    return active.map((h) => {
      if (editedHouses[h.id]) {
        return { ...h, ...editedHouses[h.id] };
      }
      return h;
    });
  }, [houses, deletedHouseIds, editedHouses]);

  const [bookings, setBookings] = useState<Booking[]>(() => {
    try {
      const saved = localStorage.getItem('makazi_bookings');
      return saved ? JSON.parse(saved) : INITIAL_BOOKINGS;
    } catch {
      return INITIAL_BOOKINGS;
    }
  });
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('makazi_favorites');
      return saved ? JSON.parse(saved) : ['h1', 'h3'];
    } catch {
      return ['h1', 'h3'];
    }
  }); // Default saved item IDs
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem('makazi_conversations');
      return saved ? JSON.parse(saved) : INITIAL_CONVERSATIONS;
    } catch {
      return INITIAL_CONVERSATIONS;
    }
  });

  useEffect(() => {
    localStorage.setItem('makazi_conversations', JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem('makazi_bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('makazi_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Homepage Hero Banner Content (Customizable by CEO)
  const [heroContent, setHeroContent] = useState<HeroContent>(() => {
    try {
      const saved = localStorage.getItem('makazi_hero_content');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_HERO_CONTENT;
  });

  // Check if a dragged & dropped video is stored in IndexedDB and restore it
  useEffect(() => {
    let activeObjUrl = '';
    getStoredVideo().then((record) => {
      if (record && record.blob) {
        activeObjUrl = URL.createObjectURL(record.blob);
        setHeroContent((prev) => ({
          ...prev,
          videoUrl: activeObjUrl,
          videoFileName: record.name,
          videoFileSize: record.size,
          isCustomUpload: true,
        }));
      }
    }).catch(() => {});

    return () => {
      if (activeObjUrl) {
        URL.revokeObjectURL(activeObjUrl);
      }
    };
  }, []);

  const handleUpdateHeroContent = (updated: HeroContent) => {
    setHeroContent(updated);
    try {
      localStorage.setItem('makazi_hero_content', JSON.stringify(updated));
    } catch {}
  };


  // User Profile configuration state
  const [user, setUser] = useState({
    id: "james-levis-1",
    name: "James Levis",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80",
    location: "London, UK",
    email: "jameslevis94@gmail.com",
    username: "jameslevis1",
    phone: "+44 7700 900077",
    role: "explorer" as 'explorer' | 'owner'
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const loggedOut = localStorage.getItem('makazi_logged_out');
      if (loggedOut === 'true') return false;
      const saved = localStorage.getItem('makazi_user');
      if (!saved) {
        localStorage.setItem('makazi_user', JSON.stringify({
          id: "james-levis-1",
          name: "James Levis",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80",
          location: "London, UK",
          email: "jameslevis94@gmail.com",
          username: "jameslevis1",
          phone: "+44 7700 900077",
          role: "explorer"
        }));
      }
      return true;
    }
    return true;
  });

  const [isPostingModalOpen, setIsPostingModalOpen] = useState(false);

  // Appwrite owners cache and active profile modal state
  const [appwriteOwners, setAppwriteOwners] = useState<any[]>([]);
  const [selectedOwnerForProfile, setSelectedOwnerForProfile] = useState<any | null>(null);

  useEffect(() => {
    const fetchAndSetOwners = async () => {
      try {
        const dbOwners = await fetchOwnersFromAppwrite();
        if (dbOwners && dbOwners.length > 0) {
          setAppwriteOwners(dbOwners);
        }
      } catch (err) {
        console.warn('Failed to load owners on mount in App.tsx:', err);
      }
    };
    fetchAndSetOwners();
  }, []);

  // Synchronize house host avatars once database owners list is successfully loaded
  useEffect(() => {
    if (appwriteOwners.length === 0 || houses.length === 0) return;

    let hasChanges = false;
    const updatedHouses = houses.map(house => {
      const creatorName = house.host?.name || '';
      const matchedDbOwner = appwriteOwners.find(o => {
        const name = o.fullName || o.creator || o.ownerName || '';
        return name.toLowerCase().trim() === creatorName.toLowerCase().trim();
      });

      if (matchedDbOwner) {
        const avatarId = matchedDbOwner.imageurl || matchedDbOwner.imagesurl || matchedDbOwner.avatar;
        if (avatarId) {
          const expectedUrl = getAppwriteImageUrl(avatarId);
          if (house.host?.avatar !== expectedUrl) {
            hasChanges = true;
            return {
              ...house,
              host: {
                ...house.host,
                avatar: expectedUrl
              }
            };
          }
        }
      }
      return house;
    });

    if (hasChanges) {
      setHouses(updatedHouses);
    }
  }, [appwriteOwners, houses]);

  // Load user profile from Local Storage or Appwrite database collections
  useEffect(() => {
    let activeId = user?.id || 'james-levis-1';
    const savedUser = localStorage.getItem('makazi_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        if (parsed.id) {
          activeId = parsed.id;
        }
      } catch (e) {}
    }

    const loadRemoteProfile = async (targetId: string) => {
      try {
        const dbUser = await fetchUserProfile(targetId);
        if (dbUser && (dbUser.imagesurl || dbUser.avatar || dbUser.name)) {
          const parsed = {
            id: targetId,
            name: dbUser.name || "James Levis",
            avatar: dbUser.imagesurl || dbUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(dbUser.name || "James Levis")}`,
            location: dbUser.bio || dbUser.location || "London, UK",
            email: dbUser.email || dbUser.emailurl || "jameslevis94@gmail.com",
            username: dbUser.username || "jameslevis1",
            phone: dbUser.phonenumber || dbUser.phone || "+44 7700 900077",
            role: dbUser.role || "explorer"
          };
          setUser((prev: any) => {
            const merged = {
              ...prev,
              ...parsed,
              subscription: prev.subscription || (dbUser.subscription as any) || 'none',
              subscriptionStatus: prev.subscriptionStatus || (dbUser.subscriptionStatus as any) || 'none',
              pendingSubscriptionPlan: prev.pendingSubscriptionPlan,
              pendingTransactionNumber: prev.pendingTransactionNumber,
              pendingScreenshot: prev.pendingScreenshot,
              pendingSubmittedAt: prev.pendingSubmittedAt,
            };
            localStorage.setItem('makazi_user', JSON.stringify(merged));
            return merged;
          });
        }
      } catch (err: any) {
        console.log('Appwrite profile sync skipped or fallback triggered: ' + err.message);
      }
    };
    if (isAuthenticated) {
      loadRemoteProfile(activeId);
    }
  }, [isAuthenticated]);

  const handleUpdateUserProfile = async (updatedData: Partial<typeof user>) => {
    setUser((prev: any) => {
      const merged = { ...prev, ...updatedData };
      try {
        localStorage.setItem('makazi_user', JSON.stringify(merged));
      } catch (e) {
        console.error('Local storage save error:', e);
      }
      return merged;
    });
    try {
      const activeId = (updatedData as any)?.id || user.id || 'james-levis-1';
      await updateUserProfile(activeId, {
        name: updatedData.name || user.name,
        avatar: updatedData.avatar || user.avatar,
        email: updatedData.email || user.email,
        location: updatedData.location || user.location,
        phone: (updatedData as any).phone || (user as any).phone,
        role: updatedData.role || user.role,
        username: updatedData.username || user.username
      } as any);
      console.log('Successfully saved profile record to Appwrite User Collection.');
    } catch (err: any) {
      console.error('Appwrite profile write exception (persisted locally):', err);
    }
  };

  const handleAuthSuccess = (authenticatedUser: typeof user) => {
    setUser(authenticatedUser);
    localStorage.setItem('makazi_user', JSON.stringify(authenticatedUser));
    localStorage.removeItem('makazi_logged_out');
    setIsAuthenticated(true);
    setActiveTab('home');
  };

  const handleLogout = () => {
    localStorage.removeItem('makazi_user');
    localStorage.setItem('makazi_logged_out', 'true');
    setUser({
      id: "james-levis-1",
      name: "James Levis",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80",
      location: "London, UK",
      email: "jameslevis94@gmail.com",
      username: "jameslevis1",
      phone: "+44 7700 900077",
      role: "explorer"
    });
    setIsAuthenticated(false);
  };

  const handleDeleteAccount = () => {
    // 1. Wipe all local state for bookings, conversations, broker applications, and user session
    localStorage.removeItem('makazi_user');
    localStorage.removeItem('makazi_bookings');
    localStorage.removeItem('makazi_conversations');
    localStorage.removeItem('makazi_broker_applications');
    localStorage.removeItem('makazi_upgrade_requests');
    localStorage.removeItem('makazi_favorites');
    localStorage.removeItem('makazi_payment_accounts');
    localStorage.removeItem('makazi_deactivated_owners');

    // 2. Clear in-memory state
    setBookings([]);
    setConversations([]);
    setFavorites([]);
    setUser({
      id: "guest-user",
      name: "Guest Explorer",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80",
      location: "Not set",
      email: "",
      username: "guest",
      phone: "",
      role: "explorer"
    });
    setIsAuthenticated(false);
    setActiveTab('home');
  };

  const handleDeleteHouse = async (houseId: string) => {
    setHouses((prev) => prev.filter((h) => h.id !== houseId));
    setDeletedHouseIds((prev) => {
      const next = prev.includes(houseId) ? prev : [...prev, houseId];
      try {
        localStorage.setItem('makazi_deleted_houses', JSON.stringify(next));
      } catch (e) {
        console.error("Local storage error:", e);
      }
      return next;
    });
    setBookings((prev) => prev.filter((b) => b.house.id !== houseId));
    setFavorites((prev) => prev.filter((id) => id !== houseId));
    try {
      await deleteHouseInAppwrite(houseId);
    } catch (err) {
      console.warn("Appwrite deletion failed, handled locally:", err);
    }
  };

  const handleEditHouse = async (houseId: string, updatedFields: Partial<House>) => {
    setHouses((prev) =>
      prev.map((h) => (h.id === houseId ? { ...h, ...updatedFields } : h))
    );
    setEditedHouses((prev) => {
      const next = {
        ...prev,
        [houseId]: {
          ...(prev[houseId] || {}),
          ...updatedFields,
        },
      };
      try {
        localStorage.setItem('makazi_edited_houses', JSON.stringify(next));
      } catch (e) {
        console.error("Local storage error:", e);
      }
      return next;
    });
    setBookings((prev) =>
      prev.map((b) =>
        b.house.id === houseId
          ? { ...b, house: { ...b.house, ...updatedFields } }
          : b
      )
    );
    try {
      await updateHouseInAppwrite(houseId, updatedFields);
    } catch (err) {
      console.warn("Appwrite edit failed, saved locally:", err);
    }
  };

  // Appwrite Sync state
  const [appwriteStatus, setAppwriteStatus] = useState<'loading' | 'connected' | 'error' | 'local'>('loading');
  const [appwriteMessage, setAppwriteMessage] = useState<string>('');
  const [isSeeding, setIsSeeding] = useState(false);
  const [showDeveloperPanel, setShowDeveloperPanel] = useState(false);

  const syncWithAppwrite = async () => {
    setAppwriteStatus('loading');
    setAppwriteMessage('Connecting to Appwrite database...');
    try {
      const appwriteHouses = await fetchHousesFromAppwrite();
      if (appwriteHouses && appwriteHouses.length > 0) {
        setHouses(appwriteHouses);
        setAppwriteStatus('connected');
        setAppwriteMessage(`Successfully synced ${appwriteHouses.length} luxury stay(s) from your Appwrite database!`);
      } else {
        setHouses(INITIAL_HOUSES);
        setAppwriteStatus('local');
        setAppwriteMessage('Connected successfully, but post collection is currently empty. Showing offline premium stays as placeholder.');
      }
    } catch (err: any) {
      console.error('Appwrite syncer error:', err);
      setHouses(INITIAL_HOUSES);
      setAppwriteStatus('error');
      setAppwriteMessage(
        err?.message || 
        'Could not read documents from Appwrite. Database collection might be unconfigured resource or offline. Using local layout stays.'
      );
    }
  };

  useEffect(() => {
    syncWithAppwrite();
  }, []);

  const handleSeedDemoToAppwrite = async () => {
    setIsSeeding(true);
    setAppwriteMessage('Posting a new luxury design stay to your Appwrite DB...');
    try {
      const demoStay: Partial<House> = {
        title: "The Glass Obsidian Cliffside",
        description: "Enveloped in majestic scenery, this avant-garde architectural masterpiece projects outward over cliff shorelines. Fully integrated luxury, massive sliding glass panes, and state-of-the-art smart systems.",
        images: [
          "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80"
        ],
        location: "Zion, Utah",
        dateRange: "Aug 12 - 19",
        amount: 450,
        rating: 4.96,
        beds: 3,
        baths: 3,
        maxGuests: 6,
        features: ["Cliff Projection", "Premium Smart Home", "Private Heliport", "Infinity Wellness Tub"],
        host: {
          name: "James Maker",
          avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80",
          rating: 4.92
        }
      };
      await createDemoHouseInAppwrite(demoStay);
      setAppwriteMessage('Awesome! Successfully created staying document in Appwrite collection!');
      await syncWithAppwrite();
    } catch (err: any) {
      console.error('Seed demo stay failed:', err);
      alert(`Could not write document to Appwrite: ${err.message || err}. Make sure to enable Document Writing permissions in your Appwrite Collection!`);
      setAppwriteMessage(`Seed failed: ${err.message || err}. Please configure appropriate database collections schema attribute keys.`);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleCreateSanctuary = async (postData: Partial<House>) => {
    setAppwriteStatus('loading');
    setAppwriteMessage('Uploading premium sanctuary listing direct to Appwrite...');
    try {
      const fullPostData = {
        ...postData,
        userid: user.id || "1",
        host: {
          name: user.name || "Elena Makazi",
          avatar: user.avatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&h=120&q=80",
          rating: 4.95
        }
      };
      await createDemoHouseInAppwrite(fullPostData);
      setAppwriteMessage('Splendid! Successfully posted your custom modern stay to Appwrite!');
      await syncWithAppwrite();
    } catch (err: any) {
      console.error('Live property creation failed:', err);
      alert(`Could not publish post to Appwrite database: ${err.message || err}.`);
      setAppwriteStatus('error');
      setAppwriteMessage(`Listing post error: ${err.message || err}`);
    }
  };

  const handleViewOwnerProfile = (ownerName: string) => {
    // 1. Search in Appwrite database owners first
    const matchedDbOwner = appwriteOwners.find(o => {
      const name = o.fullName || o.creator || o.ownerName || '';
      return name.toLowerCase().trim() === ownerName.toLowerCase().trim();
    });

    if (matchedDbOwner) {
      const name = matchedDbOwner.fullName || matchedDbOwner.creator || matchedDbOwner.ownerName || ownerName;
      setSelectedOwnerForProfile({
        name,
        avatar: matchedDbOwner.imageurl ? getAppwriteImageUrl(matchedDbOwner.imageurl) : '',
        email: matchedDbOwner.email || `${name.toLowerCase().replace(/\s+/g, '')}@makazi-dbowner.com`,
        phone: matchedDbOwner.phone || matchedDbOwner.phoneNumber || '+255 712 000 000',
        location: matchedDbOwner.location || 'Tanzania',
        username: matchedDbOwner.ownerId ? `@${matchedDbOwner.ownerId}` : `@${name.toLowerCase().replace(/\s+/g, '_')}`,
        isDatabaseOwner: true,
        bio: matchedDbOwner.bio || 'Verified Makazi Premium Host and property manager.',
        rating: 4.9
      });
      return;
    }

    // 2. Search in active houses hosts as fallback
    const matchedHouse = houses.find(h => h.host?.name?.toLowerCase().trim() === ownerName.toLowerCase().trim());
    if (matchedHouse) {
      setSelectedOwnerForProfile({
        name: ownerName,
        avatar: matchedHouse.host.avatar,
        email: `${ownerName.toLowerCase().replace(/\s+/g, '')}@makazi-host.com`,
        phone: ownerName === 'Elena Rostova' ? '+1 (310) 555-0192' : 
               ownerName === 'Hans Keller' ? '+41 27 966 8200' : 
               ownerName === 'Kenji Sato' ? '+81 75 321 0041' : '+255 754 990 120',
        location: matchedHouse.location.split(',')[0] || 'Tanzania',
        username: `@${ownerName.toLowerCase().replace(/\s+/g, '_')}`,
        isDatabaseOwner: false,
        bio: 'Superhost • Highly rated premium Stay Advisor on Makazi platform.',
        rating: matchedHouse.host.rating || 4.8
      });
      return;
    }

    // 3. Complete fallback for any other cases
    setSelectedOwnerForProfile({
      name: ownerName,
      avatar: '',
      email: `${ownerName.toLowerCase().replace(/\s+/g, '')}@makazi-partner.org`,
      phone: '+255 712 110 339',
      location: 'Tanzania',
      username: `@${ownerName.toLowerCase().replace(/\s+/g, '_')}`,
      isDatabaseOwner: false,
      bio: 'Verified Professional Agent on Makazi network.',
      rating: 4.7
    });
  };

  // Active Modals state
  const [selectedHouseForBooking, setSelectedHouseForBooking] = useState<House | null>(null);
  const [selectedHouseForDetails, setSelectedHouseForDetails] = useState<House | null>(null);

  // Toggle single house as favorite
  const handleToggleFavorite = (houseId: string) => {
    setFavorites((prev) =>
      prev.includes(houseId) ? prev.filter((id) => id !== houseId) : [...prev, houseId]
    );
  };

  // Create booking handler
  const handleCreateBooking = async (bookingData: Omit<Booking, 'id' | 'totalPrice'>) => {
    const totalPrice = 0; // Free / inquiry submission

    const newBooking: Booking = {
      ...bookingData,
      id: `booking-${Date.now()}`,
      totalPrice
    };

    setBookings((prev) => [newBooking, ...prev]);

    // Send a message from host instantly confirming and welcoming
    const userName = bookingData.fullName || user.name || "James Levis";
    const hostMsg: Message = {
      id: `msg-${Date.now()}-welcome`,
      sender: 'host',
      text: `Hello ${userName}! I've received your booking request for ${bookingData.house.title} in ${bookingData.house.location} with preferred move-in date of ${bookingData.startDate}. I will review your preferences ("${bookingData.preferredDetails || 'None'}") and follow up with you directly. Welcome to Makazi!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Find if conversation exists for this property, else construct new one
    const existingConv = conversations.find((c) => c.house.id === bookingData.house.id);
    if (existingConv) {
      const updatedMessages = [...existingConv.messages, hostMsg];
      setConversations((prev) =>
        prev.map((c) =>
          c.id === existingConv.id
            ? { ...c, messages: updatedMessages, lastMessage: hostMsg.text, lastUpdated: 'Just now' }
            : c
        )
      );
    } else {
      const newConv: Conversation = {
        id: `conv-${Date.now()}`,
        house: bookingData.house,
        lastMessage: hostMsg.text,
        lastUpdated: 'Just now',
        messages: [hostMsg]
      };
      setConversations((prev) => [newConv, ...prev]);
    }

    // Persist booking to Appwrite requests collection via background helper
    try {
      await saveBookingToAppwrite({
        userId: user.id || "james-levis-1",
        fullName: bookingData.fullName || user.name,
        phoneNumber: bookingData.phoneNumber || user.phone || "+44 7700 900077",
        startDate: bookingData.startDate, // Replaces Move-In Date
        preferredDetails: bookingData.preferredDetails || "",
        houseId: bookingData.house.id,
        houseTitle: bookingData.house.title,
        guests: bookingData.guests,
        status: "upcoming",
        // Extended Appwrite 24-Column Metadata Mapping
        emailId: user.email || "jameslevis94@gmail.com",
        houseHostName: bookingData.house.host.name || "Owner",
        accountId: user.id || "james-levis-1",
        applicantName: bookingData.fullName || user.name,
        ownerId: bookingData.house.host.name ? bookingData.house.host.name.toLowerCase().replace(/\s+/g, '-') : "general-owner",
        receiverId: bookingData.house.host.name ? bookingData.house.host.name.toLowerCase().replace(/\s+/g, '-') : "general-owner"
      });
      console.log('Appwrite requests database updated successfully with booking details.');
    } catch (dbErr: any) {
      console.error('Appwrite database registration error (continuing with local state fallback):', dbErr);
    }
  };

  // Cancel dynamic booking with animation delay
  const handleCancelBooking = (bookingId: string) => {
    setBookings((prev) => prev.filter((b) => b.id !== bookingId));
  };

  // Launch chat support directly from stays profile
  const handleSwitchToInboxWithHost = (house: House) => {
    const existingConv = conversations.find((c) => c.house.id === house.id);
    if (existingConv) {
      setActiveTab('inbox');
    } else {
      const newConv: Conversation = {
        id: `conv-${Date.now()}`,
        house,
        lastMessage: `Hello James! Thanks for reaching out. How can I assist you with your stay at ${house.title}?`,
        lastUpdated: 'Just now',
        messages: [
          {
            id: `msg-${Date.now()}`,
            sender: 'host',
            text: `Hello James! Thanks for reaching out. How can I assist you with your stay at ${house.title}?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveTab('inbox');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 selection:bg-indigo-600 selection:text-white flex flex-col antialiased relative overflow-x-hidden pt-24 sm:pt-28">
      
      {/* Background Mesh Gradients */}
      <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-indigo-600/25 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-50px] right-[-50px] w-[600px] h-[600px] bg-rose-500/15 rounded-full blur-[140px] pointer-events-none z-0"></div>
      <div className="absolute top-[25%] right-[10%] w-[350px] h-[350px] bg-amber-400/5 rounded-full blur-[110px] pointer-events-none z-0"></div>

      {/* Top Header Bar strictly matching Frosted Glass Design - FIXED position */}
      <header id="app-top-header" className="fixed top-0 left-0 right-0 h-16 z-50 backdrop-blur-md bg-slate-900/90 border-b border-white/10 px-4 sm:px-6 lg:px-8 transition-all flex items-center">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between gap-4">
            
            {/* Logo on Left */}
            <div 
              id="app-logo-area" 
              className="flex items-center gap-3 cursor-pointer select-none"
              onClick={() => {
                setActiveTab('home');
                setSearchQuery('');
              }}
            >
              <MakaziLogo iconSize={36} />
            </div>

            {/* Header Right Actions: Search */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2 md:gap-3">
                {/* Header quick access search toggle */}
                <button
                  id="header-search-toggle"
                  onClick={() => {
                    setActiveTab('search');
                  }}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    activeTab === 'search'
                      ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                  title="Search rentals"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="text-slate-400 text-xs font-semibold bg-slate-950/40 border border-white/5 px-3 py-1.5 rounded-full">Verified Safe Zone</div>
            )}

          </div>

        </div>
      </header>



      {/* Main Container screen content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 md:pl-24 lg:pl-28 py-8 relative z-10 pb-32 md:pb-8">
        {!isAuthenticated ? (
          <AuthView onAuthSuccess={handleAuthSuccess} />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              {activeTab === 'home' && (
                <HomeView
                  houses={processedHouses}
                  searchQuery={searchQuery}
                  onBook={(h) => setSelectedHouseForBooking(h)}
                  onView={(h) => setSelectedHouseForDetails(h)}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                  onViewOwnerProfile={handleViewOwnerProfile}
                  heroContent={heroContent}
                  onUpdateHeroContent={handleUpdateHeroContent}
                  isCEO={user?.email === 'jameslevis94@gmail.com'}
                  onOpenCEODashboard={() => setActiveTab('ceo')}
                />
              )}

              {activeTab === 'search' && (
                <SearchView
                  houses={processedHouses}
                  searchQuery={searchQuery}
                  onSearchQueryChange={(query) => setSearchQuery(query)}
                  onBook={(h) => setSelectedHouseForBooking(h)}
                  onView={(h) => setSelectedHouseForDetails(h)}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                  onViewOwnerProfile={handleViewOwnerProfile}
                />
              )}

              {activeTab === 'inbox' && (
                <InboxView
                  conversations={conversations}
                  onUpdateConversations={(updated) => setConversations(updated)}
                />
              )}

              {activeTab === 'profile' && (
                <ProfileView
                  bookings={bookings}
                  favorites={favorites}
                  houses={processedHouses}
                  onDeleteHouse={handleDeleteHouse}
                  onEditHouse={handleEditHouse}
                  onToggleFavorite={handleToggleFavorite}
                  onViewHouse={(h) => setSelectedHouseForDetails(h)}
                  onCancelBooking={handleCancelBooking}
                  onSwitchToInbox={handleSwitchToInboxWithHost}
                  user={user}
                  onUpdateUser={handleUpdateUserProfile}
                  onOpenPostingModal={() => setIsPostingModalOpen(true)}
                  onLogout={handleLogout}
                  onUpdateBookings={setBookings}
                  conversations={conversations}
                  onUpdateConversations={setConversations}
                />
              )}

              {activeTab === 'settings' && (
                <Setting
                  onBack={() => setActiveTab('profile')}
                  onNavigate={(tab) => {
                    if (tab === 'ceo') {
                      if (user?.email === 'jameslevis94@gmail.com') {
                        setActiveTab('ceo');
                      } else {
                        setActiveTab('home');
                      }
                    } else {
                      setActiveTab(tab as any);
                    }
                  }}
                  onLogout={handleLogout}
                  onDeleteAccount={handleDeleteAccount}
                  currentUser={user}
                  onUpdateUser={handleUpdateUserProfile}
                />
              )}

              {activeTab === 'ceo' && (
                user?.email === 'jameslevis94@gmail.com' ? (
                  <CEODashboard
                    onBack={() => setActiveTab('profile')}
                    houses={processedHouses}
                    currentUser={user}
                    onUpdateCurrentUser={handleUpdateUserProfile}
                    conversations={conversations}
                    onUpdateConversations={setConversations}
                    bookings={bookings}
                    onUpdateBookings={setBookings}
                    onDeleteHouse={handleDeleteHouse}
                    heroContent={heroContent}
                    onUpdateHeroContent={handleUpdateHeroContent}
                  />
                ) : (
                  <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl" id="ceo-unauthorized-view">
                    <Shield className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
                    <p className="text-slate-400 text-sm mb-6">Unauthorized access to CEO Command Center detected. Only the CEO account can see this.</p>
                    <button onClick={() => setActiveTab('home')} className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-600 rounded-xl text-xs font-bold text-white cursor-pointer select-none transition-all">Go back Home</button>
                  </div>
                )
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Interactive Detail and Booking pop-ups */}
      <BookingModal
        house={selectedHouseForBooking}
        isOpen={selectedHouseForBooking !== null}
        onClose={() => setSelectedHouseForBooking(null)}
        onSubmitBooking={handleCreateBooking}
        currentUser={user}
      />

      <ViewDetailsModal
        house={selectedHouseForDetails}
        isOpen={selectedHouseForDetails !== null}
        onClose={() => setSelectedHouseForDetails(null)}
        onBookNow={(h) => setSelectedHouseForBooking(h)}
      />

      <PostingModal
        isOpen={isPostingModalOpen}
        onClose={() => setIsPostingModalOpen(false)}
        onSubmitPosting={handleCreateSanctuary}
        currentHost={{
          name: user.name,
          avatar: user.avatar,
          rating: 4.95
        }}
      />

      <OwnerProfileModal
        owner={selectedOwnerForProfile}
        isOpen={selectedOwnerForProfile !== null}
        onClose={() => setSelectedOwnerForProfile(null)}
        houses={processedHouses}
        onViewHouse={(h) => setSelectedHouseForDetails(h)}
      />

      {/* Design Footer credit lines */}
      <footer className="relative z-10 w-full h-12 px-8 md:pl-28 lg:pl-32 flex items-center justify-between bg-black/30 backdrop-blur-md border-t border-white/10 text-[10px] text-slate-500 pb-safe mb-16 md:mb-0">
        <div className="flex items-center gap-4">
          <span>Terms of Service</span>
          <span>Privacy Policy</span>
          <span>Help Center</span>
        </div>
        <div className="flex items-center gap-2 font-mono">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
          <span>System Online: 12.04.2024</span>
        </div>
      </footer>

      {/* Fixed Left Side Navigation for Tablet & Desktop Devices: Home, CEO, Profile, Inbox, Settings */}
      {isAuthenticated && (
        <aside
          id="tablet-left-navigation"
          aria-label="Tablet Left Navigation"
          className="fixed left-0 top-16 bottom-0 z-40 w-20 lg:w-24 hidden md:flex flex-col items-center justify-between py-5 bg-slate-950/95 backdrop-blur-2xl border-r border-white/10 shadow-[8px_0_30px_rgba(0,0,0,0.5)] select-none transition-all overflow-y-auto overflow-x-hidden"
        >
          {/* Main Navigation Stack */}
          <div className="w-full flex flex-col items-center gap-3 px-2">
            {/* 1. Home Tab */}
            <button
              id="tablet-nav-home"
              onClick={() => {
                setActiveTab('home');
                setSearchQuery('');
              }}
              title="Home"
              className={`w-full flex flex-col items-center justify-center py-3 px-1.5 rounded-2xl transition-all cursor-pointer select-none active:scale-95 group ${
                activeTab === 'home'
                  ? 'text-indigo-400 bg-indigo-500/15 font-bold shadow-xs border border-indigo-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Home className={`w-6 h-6 transition-transform group-hover:scale-110 ${activeTab === 'home' ? 'scale-110 text-indigo-400' : ''}`} />
              <span className="text-[11px] mt-1.5 font-semibold tracking-tight">Home</span>
            </button>

            {/* 2. CEO Tab */}
            <button
              id="tablet-nav-ceo"
              onClick={() => setActiveTab('ceo')}
              title="CEO HQ Control"
              className={`w-full flex flex-col items-center justify-center py-3 px-1.5 rounded-2xl transition-all cursor-pointer select-none active:scale-95 relative group ${
                activeTab === 'ceo'
                  ? 'text-amber-400 bg-amber-500/15 font-bold border border-amber-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-amber-400 hover:bg-amber-500/5 border border-transparent'
              }`}
            >
              <div className="relative">
                <Shield className={`w-6 h-6 transition-transform group-hover:scale-110 ${activeTab === 'ceo' ? 'scale-110 text-amber-400' : 'text-amber-500/80'}`} />
                {user?.email === 'jameslevis94@gmail.com' && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                )}
              </div>
              <span className="text-[11px] mt-1.5 font-semibold tracking-tight flex items-center gap-0.5">
                CEO
              </span>
            </button>

            {/* 3. Profile Tab */}
            <button
              id="tablet-nav-profile"
              onClick={() => setActiveTab('profile')}
              title="Profile"
              className={`w-full flex flex-col items-center justify-center py-3 px-1.5 rounded-2xl transition-all cursor-pointer select-none active:scale-95 group ${
                activeTab === 'profile'
                  ? 'text-indigo-400 bg-indigo-500/15 font-bold border border-indigo-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="relative">
                <img
                  src={user.avatar}
                  alt="Profile"
                  className={`w-6 h-6 rounded-full object-cover transition-all group-hover:scale-110 ${
                    activeTab === 'profile'
                      ? 'ring-2 ring-indigo-400 scale-110'
                      : 'border border-white/20'
                  }`}
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-[11px] mt-1.5 font-semibold tracking-tight">Profile</span>
            </button>

            {/* 4. Inbox Tab */}
            <button
              id="tablet-nav-inbox"
              onClick={() => setActiveTab('inbox')}
              title="Inbox"
              className={`w-full flex flex-col items-center justify-center py-3 px-1.5 rounded-2xl transition-all cursor-pointer select-none active:scale-95 relative group ${
                activeTab === 'inbox'
                  ? 'text-indigo-400 bg-indigo-500/15 font-bold shadow-xs border border-indigo-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="relative">
                <Mail className={`w-6 h-6 transition-transform group-hover:scale-110 ${activeTab === 'inbox' ? 'scale-110 text-indigo-400' : ''}`} />
                <span className="bg-rose-500 text-[10px] w-4 h-4 rounded-full flex items-center justify-center absolute -top-1.5 -right-2.5 text-white font-mono font-bold shadow-sm">
                  3
                </span>
              </div>
              <span className="text-[11px] mt-1.5 font-semibold tracking-tight">Inbox</span>
            </button>

            {/* 5. Settings Tab */}
            <button
              id="tablet-nav-settings"
              onClick={() => setActiveTab('settings')}
              title="Settings"
              className={`w-full flex flex-col items-center justify-center py-3 px-1.5 rounded-2xl transition-all cursor-pointer select-none active:scale-95 group ${
                activeTab === 'settings'
                  ? 'text-indigo-400 bg-indigo-500/15 font-bold shadow-xs border border-indigo-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Settings className={`w-6 h-6 transition-transform group-hover:scale-110 ${activeTab === 'settings' ? 'scale-110 text-indigo-400 rotate-45' : ''}`} />
              <span className="text-[11px] mt-1.5 font-semibold tracking-tight">Settings</span>
            </button>
          </div>

          {/* Bottom indicator */}
          <div className="flex flex-col items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500">Live</span>
          </div>
        </aside>
      )}

      {/* Fixed Mobile Bottom Navigation Bar: Home, CEO, Profile, Inbox, Settings */}
      {isAuthenticated && (
        <nav
          id="mobile-bottom-navigation"
          aria-label="Mobile Bottom Navigation"
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-slate-950/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.65)] px-2 pt-2 pb-[max(env(safe-area-inset-bottom),0.65rem)] select-none"
        >
          <div className="max-w-md mx-auto grid grid-cols-5 items-center justify-items-center gap-1">
            {/* 1. Home Tab */}
            <button
              id="mobile-bottom-nav-home"
              onClick={() => {
                setActiveTab('home');
                setSearchQuery('');
              }}
              className={`w-full flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all cursor-pointer select-none active:scale-95 ${
                activeTab === 'home'
                  ? 'text-indigo-400 bg-indigo-500/15 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Home className={`w-5 h-5 transition-transform ${activeTab === 'home' ? 'scale-110 text-indigo-400' : ''}`} />
              <span className="text-[10px] mt-1 font-semibold tracking-tight">Home</span>
            </button>

            {/* 2. CEO Tab */}
            <button
              id="mobile-bottom-nav-ceo"
              onClick={() => setActiveTab('ceo')}
              className={`w-full flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all cursor-pointer select-none active:scale-95 relative ${
                activeTab === 'ceo'
                  ? 'text-amber-400 bg-amber-500/15 font-bold border border-amber-500/30 shadow-xs'
                  : 'text-slate-400 hover:text-amber-400'
              }`}
            >
              <div className="relative">
                <Shield className={`w-5 h-5 transition-transform ${activeTab === 'ceo' ? 'scale-110 text-amber-400' : 'text-amber-500/80'}`} />
                {user?.email === 'jameslevis94@gmail.com' && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                )}
              </div>
              <span className="text-[10px] mt-1 font-semibold tracking-tight flex items-center gap-0.5">
                CEO
              </span>
            </button>

            {/* 3. Profile Tab */}
            <button
              id="mobile-bottom-nav-profile"
              onClick={() => setActiveTab('profile')}
              className={`w-full flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all cursor-pointer select-none active:scale-95 ${
                activeTab === 'profile'
                  ? 'text-indigo-400 bg-indigo-500/15 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <img
                  src={user.avatar}
                  alt="Profile"
                  className={`w-5 h-5 rounded-full object-cover transition-all ${
                    activeTab === 'profile'
                      ? 'ring-2 ring-indigo-400 scale-105'
                      : 'border border-white/20'
                  }`}
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-[10px] mt-1 font-semibold tracking-tight">Profile</span>
            </button>

            {/* 4. Inbox Tab */}
            <button
              id="mobile-bottom-nav-inbox"
              onClick={() => setActiveTab('inbox')}
              className={`w-full flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all cursor-pointer select-none active:scale-95 relative ${
                activeTab === 'inbox'
                  ? 'text-indigo-400 bg-indigo-500/15 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Mail className={`w-5 h-5 transition-transform ${activeTab === 'inbox' ? 'scale-110 text-indigo-400' : ''}`} />
                <span className="bg-rose-500 text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center absolute -top-1 -right-2 text-white font-mono font-bold shadow-sm">
                  3
                </span>
              </div>
              <span className="text-[10px] mt-1 font-semibold tracking-tight">Inbox</span>
            </button>

            {/* 5. Settings Tab */}
            <button
              id="mobile-bottom-nav-settings"
              onClick={() => setActiveTab('settings')}
              className={`w-full flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all cursor-pointer select-none active:scale-95 ${
                activeTab === 'settings'
                  ? 'text-indigo-400 bg-indigo-500/15 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Settings className={`w-5 h-5 transition-transform ${activeTab === 'settings' ? 'scale-110 text-indigo-400 rotate-45' : ''}`} />
              <span className="text-[10px] mt-1 font-semibold tracking-tight">Settings</span>
            </button>
          </div>
        </nav>
      )}

    </div>
  );
}
