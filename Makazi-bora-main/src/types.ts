export interface Host {
  name: string;
  avatar: string;
  rating: number;
}

export interface Review {
  author: string;
  text: string;
  rating: number;
}

export interface House {
  id: string;
  title: string;
  description: string;
  images: string[];
  location: string;
  dateRange: string;
  amount: number;
  host: Host;
  features: string[];
  reviews: Review[];
  rating: number;
  beds: number;
  baths: number;
  maxGuests: number;
  boosted?: boolean;
  featured?: boolean;
  adVideoUrl?: string;
  adAudioUrl?: string;
  propertyStatus?: 'For Sale' | 'For Rent';
  size?: string;
  createdAt?: string;
}

export interface Booking {
  id: string;
  house: House;
  startDate: string; // Used for Move-In Date
  endDate: string;   // Not used on form, can be set to "Flexible" or identical to startDate
  guests: number;
  totalPrice: number;
  status: 'upcoming' | 'completed' | 'cancelled';
  fullName?: string;
  phoneNumber?: string;
  preferredDetails?: string;
  paymentMethod?: string;
  paymentReceiptUrl?: string;
  paymentStatus?: 'Unpaid' | 'Pending' | 'Approved' | 'Rejected';
  paymentNumber?: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'host' | 'ceo';
  text: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  house: House;
  lastMessage: string;
  lastUpdated: string;
  messages: Message[];
}

export const CEO_EMAILS = ['jameslevis94@gmail.com'];

export interface AppwriteOwnerProfile {
  documentId: string;
  ownerId: string;
  fullName: string;
  email?: string;
  phone?: string;
  profileImage?: string;
  location?: string;
  rating?: number;
  bio?: string;
  role?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  rawDoc?: any;
}

export interface AppwriteUserRequest {
  documentId: string;
  userId: string;
  ownerId?: string;
  status: string;
  requestType: string;
  createdAt: string;
  fullName?: string;
  phone?: string;
  email?: string;
  messages?: string;
  propertyId?: string;
  moveInDate?: string;
  currentHolder?: string;
  rawDoc?: any;
}

export interface HeroContent {
  badge: string;
  title: string;
  description: string;
  accentWord?: string;
  videoUrl?: string;
  videoEnabled?: boolean;
  cycleIntervalHours?: number;
  autoPlayVideo?: boolean;
  videoFileName?: string;
  videoFileSize?: number;
  isCustomUpload?: boolean;
}

export const DEFAULT_HERO_CONTENT: HeroContent = {
  badge: "Discover Exquisite Escapes",
  title: "Pata hifadhi katika usanifu wa kipekee.",
  description: "Maajabu ya usanifu yaliyochaguliwa kwa umakini mkubwa yakiwa na nakshi safi za kioo, miundo thabiti na ya kisasa, na nafasi tulivu zilizoundwa kwa ajili ya kumbukumbu za kudumu.",
  accentWord: "usanifu wa kipekee",
  videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  videoEnabled: true,
  cycleIntervalHours: 5,
  autoPlayVideo: true
};

