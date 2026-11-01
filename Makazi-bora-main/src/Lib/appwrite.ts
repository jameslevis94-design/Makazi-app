import { Client, Databases, Storage } from 'appwrite';
import { House, Host } from '../types';

export const APPWRITE_DEFAULTS = {
  url: 'https://nyc.cloud.appwrite.io/v1',
  projectId: '69d7d4ce001583341412',
  databaseId: '69db7f1a001d26b55432',
  postCollectionId: '69db7f1a001d26b552323',
  userCollectionId: '69db7f1a001d26b84579',
  requestsCollectionId: '69db7f1a001d26b4328898',
  ownerCollectionId: '69db7f1a001d26e73643764',
  storageId: '69dd5c2c001d8a43dd4c',
};

// Initialize Appwrite Client with robust types bypass for environment
const envSource = (import.meta as any).env || {};

const client = new Client();
client
  .setEndpoint(envSource.VITE_APPWRITE_URL || APPWRITE_DEFAULTS.url)
  .setProject(envSource.VITE_APPWRITE_PROJECT_ID || APPWRITE_DEFAULTS.projectId);

export const databases = new Databases(client);
export const storage = new Storage(client);

/**
 * Resolves an Appwrite file ID (from storage) to its public preview/view URL.
 * Handles existing full URL strings as-is.
 */
export function getAppwriteImageUrl(fileId: string, customStorageId?: string): string {
  if (!fileId) return '';
  
  // Standard full-length URLs are returned directly
  if (fileId.startsWith('http://') || fileId.startsWith('https://') || fileId.startsWith('data:')) {
    return fileId;
  }
  
  const currentStorageId = customStorageId || envSource.VITE_APPWRITE_STORAGE_ID || APPWRITE_DEFAULTS.storageId;
  const endpoint = envSource.VITE_APPWRITE_URL || APPWRITE_DEFAULTS.url;
  const projectId = envSource.VITE_APPWRITE_PROJECT_ID || APPWRITE_DEFAULTS.projectId;
  
  // Return the official Appwrite storage view file endpoint
  return `${endpoint}/storage/buckets/${currentStorageId}/files/${fileId}/view?project=${projectId}`;
}

/**
 * Fetches stays/posts from the Appwrite database through our Express server proxy
 * and maps them to our internal House format.
 */
export async function fetchHousesFromAppwrite(): Promise<House[]> {
  console.log('Fetching Appwrite entries through server API proxy...');
  const res = await fetch('/api/appwrite/houses');
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const detailMsg = errorData.details ? ` (${errorData.details})` : '';
    throw new Error(errorData.error || `Server responded with status ${res.status}${detailMsg}`);
  }

  const response = await res.json();
  
  if (!response || !response.documents) {
    throw new Error('Failed to retrieve list of posts from Appwrite proxy response');
  }

  // Fetch owners to match their database profile images
  let dbOwners: any[] = [];
  try {
    dbOwners = await fetchOwnersFromAppwrite();
  } catch (err) {
    console.warn('Failed to fetch owners during house fetch:', err);
  }

  return response.documents.map((doc: any) => {
    // 1. Process images (resolving imagesurl, imageshack, imagesid)
    let imagesList: string[] = [];
    if (doc.imagesurl) {
      imagesList.push(getAppwriteImageUrl(doc.imagesurl));
    }
    if (doc.imageshack) {
      imagesList.push(getAppwriteImageUrl(doc.imageshack));
    }
    if (doc.imagesid) {
      if (doc.imagesid.includes(',')) {
        const parts = doc.imagesid.split(',');
        parts.forEach((p: string) => {
          if (p.trim() && p.trim() !== 'img-custom-id') {
            imagesList.push(getAppwriteImageUrl(p.trim()));
          }
        });
      } else if (doc.imagesid !== 'img-custom-id') {
        imagesList.push(getAppwriteImageUrl(doc.imagesid));
      }
    }
    
    // Fallback luxury images in case no images are defined or resolved
    if (imagesList.length === 0) {
      imagesList = [
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'
      ];
    }
    
    // 2. Map accommodation details with multiple field redundancy protectors matching exact Appwrite Columns
    const description = doc.text || "Breathtaking premium sanctuary integrated directly via high-efficacy cloud databases.";
    const title = doc.housetype || "Appwrite Luxury Residence";
    const amount = Number(doc.amount || 280);
    const rating = 4.94;
    const location = doc.location || "Secret Coastal Escape";
    const dateRange = doc.date ? new Date(doc.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + " - Complete" : "Jul 10 - 17";
    const beds = 3;
    const baths = 2.5;
    const maxGuests = 6;
    const propertyStatus = doc.listingType || doc.propertyStatus || (Number(doc.amount || 0) > 10000000 ? "For Sale" : "For Rent");
    const size = doc.size || "";
    const createdAt = doc.date || doc.$createdAt || new Date().toISOString();
    const userid = doc.userid || "";

    // 3. Map features/amenities list
    const features = ['Appwrite Active Sync', 'Spectacular Horizon', 'Pristine Architecture', 'Premium Comforts'];

    // 4. Map superhost details from "creator"
    const creatorName = doc.creator || "Elena Makazi";
    let avatarUrl = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&h=120&q=80"; // default fallback

    // Attempt to find matching owner in dbOwners
    const matchedDbOwner = dbOwners.find((o: any) => {
      const name = o.fullName || o.creator || o.ownerName || '';
      return name.toLowerCase().trim() === creatorName.toLowerCase().trim();
    });

    if (matchedDbOwner) {
      const avatarId = matchedDbOwner.imageurl || matchedDbOwner.imagesurl || matchedDbOwner.avatar;
      if (avatarId) {
        avatarUrl = getAppwriteImageUrl(avatarId);
      }
    }

    const host: Host = {
      name: creatorName,
      avatar: avatarUrl,
      rating: matchedDbOwner?.rating || 4.95
    };

    return {
      id: doc.$id || doc.postid || `appwrite-${Math.random().toString(36).substr(2, 9)}`,
      title,
      description,
      images: imagesList,
      location,
      dateRange,
      amount,
      rating,
      beds,
      baths,
      maxGuests,
      host,
      features,
      propertyStatus,
      size,
      createdAt,
      userid,
      reviews: [
        { 
          author: "Verified Adventurer", 
          text: "Excellent check-in process. The app synced directly with Appwrite databases immediately on page refresh.", 
          rating: 5 
        }
      ]
    };
  });
}

/**
 * Sends/saves a new stay record to Appwrite database through our Express server proxy.
 */
export async function createDemoHouseInAppwrite(houseData: Partial<House>): Promise<any> {
  // Build payload using ONLY exact schema columns listed:
  // users, creator, text, location, ownerId, imagesurl, amount, imageshack, date, imagesid, housetype, contctid, postid, userid
  
  // Package images correctly:
  // 1st goes to imagesurl
  // 2nd and subsequent go to imagesid joined by comma (since imageshack is not an attribute in this schema)
  const images = houseData.images || [];
  const imagesurlVal = images[0] || "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80";
  
  let imagesidVal = "img-custom-id";
  if (images.length > 1) {
    imagesidVal = images.slice(1).join(',');
  }

  const payload = {
    creator: houseData.host?.name || "Elena Makazi",
    text: houseData.description || "Breathtaking premium sanctuary integrated directly via high-efficacy cloud databases.",
    location: houseData.location || "Secret Coastal Escape",
    ownerId: "own-123",
    imagesurl: imagesurlVal,
    amount: Number(houseData.amount || 320), // Amount column type in Appwrite is standard numeric (integer/double)
    date: houseData.createdAt || new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }),
    imagesid: imagesidVal,
    housetype: houseData.title || "Appwrite Luxury Residence",
    contctid: "contact-id-123",
    postid: houseData.id || `post-${Math.random().toString(36).substr(2, 9)}`,
    userid: (houseData as any).userid || "1",
    size: houseData.size || "",
    listingType: houseData.propertyStatus || "For Rent"
  };

  const res = await fetch('/api/appwrite/houses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const detailMsg = errorData.details ? ` (${errorData.details})` : '';
    throw new Error(errorData.error || `Server responded with status ${res.status}${detailMsg}`);
  }

  return await res.json();
}

/**
 * Uploads a file (base64 or native File) to Appwrite Storage using direct client-side SDK with a custom proxy server fallback.
 */
export async function uploadFileToAppwrite(
  filename: string,
  fileType: string,
  base64: string,
  rawFile?: File
): Promise<{ success: boolean; fileId: string; fileUrl: string }> {
  const currentStorageId = envSource.VITE_APPWRITE_STORAGE_ID || APPWRITE_DEFAULTS.storageId;
  const endpoint = envSource.VITE_APPWRITE_URL || APPWRITE_DEFAULTS.url;
  const projectId = envSource.VITE_APPWRITE_PROJECT_ID || APPWRITE_DEFAULTS.projectId;

  // 1. ALWAYS prefer direct client-side SDK upload when running in browser and rawFile is provided!
  if (rawFile && typeof window !== 'undefined') {
    try {
      console.log(`[Appwrite SDK Upload] Direct client-side upload of ${filename} to bucket ${currentStorageId}...`);
      const response = await storage.createFile(
        currentStorageId,
        'unique()',
        rawFile
      );
      const fileId = response.$id;
      const fileUrl = `${endpoint}/storage/buckets/${currentStorageId}/files/${fileId}/view?project=${projectId}`;
      console.log(`[Appwrite SDK Success] Direct file uploaded successfully. URL: ${fileUrl}`);
      return {
        success: true,
        fileId,
        fileUrl
      };
    } catch (sdkError: any) {
      console.warn('[Direct SDK Upload failed, falling back to server proxy]:', sdkError);
    }
  }

  // 2. Fallback: Upload through Express custom server proxy
  console.log(`[Server Proxy Flow] Uploading file ${filename} of type ${fileType} through proxy API...`);
  const res = await fetch('/api/appwrite/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ filename, fileType, base64 })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const detailMsg = errorData.details ? `: ${errorData.details}` : '';
    throw new Error(errorData.error ? `${errorData.error}${detailMsg}` : `File upload failed with status ${res.status}${detailMsg}`);
  }

  return await res.json();
}

/**
 * Fetches user profile from Appwrite.
 */
export async function fetchUserProfile(userId: string): Promise<any> {
  const res = await fetch(`/api/appwrite/user/${userId}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Profile load failed`);
  }
  return await res.json();
}

/**
 * Persists user profile to Appwrite User Collection.
 */
export async function updateUserProfile(userId: string, data: { name: string; avatar: string; email: string; location?: string }): Promise<any> {
  const res = await fetch(`/api/appwrite/user/${userId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Profile save failed`);
  }
  return await res.json();
}

/**
 * Saves a booking request to Appwrite DB requests collection.
 */
export async function saveBookingToAppwrite(booking: {
  userId?: string;
  fullName: string;
  phoneNumber: string;
  startDate: string; // Move-In Date
  preferredDetails: string;
  houseId: string;
  houseTitle: string;
  guests: number;
  status: string;
  [key: string]: any;
}): Promise<any> {
  const res = await fetch('/api/appwrite/bookings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(booking)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Booking save failed`);
  }
  return await res.json();
}

/**
 * Fetches all booking/requests from the requests collection via server proxy.
 */
export async function fetchRequestsFromAppwrite(email?: string): Promise<any[]> {
  const headers: Record<string, string> = {};
  if (email) {
    headers['X-User-Email'] = email;
  }
  const res = await fetch('/api/appwrite/requests', { headers });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.error || `Failed to fetch requests (Status ${res.status})`;
    const err: any = new Error(message);
    err.details = errorData.details;
    err.code = errorData.code || res.status;
    err.type = errorData.type || 'appwrite_error';
    err.collectionId = errorData.collectionId;
    err.databaseId = errorData.databaseId;
    throw err;
  }
  const data = await res.json();
  return data.documents || [];
}

export const fetchBookingsFromAppwrite = fetchRequestsFromAppwrite;

/**
 * Updates a booking's status in Appwrite requests collection via server proxy.
 */
export async function updateBookingStatusInAppwrite(documentId: string, status: string, email?: string): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (email) {
    headers['X-User-Email'] = email;
  }
  const res = await fetch(`/api/appwrite/bookings/${documentId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to update booking status`);
  }
  return await res.json();
}

/**
 * Fetches owners from the Appwrite owners collection via custom server proxy.
 */
export async function fetchOwnersFromAppwrite(email?: string): Promise<any[]> {
  console.log('Fetching Appwrite owners through server API proxy...');
  const headers: Record<string, string> = {};
  if (email) {
    headers['X-User-Email'] = email;
  }
  const res = await fetch('/api/appwrite/owners', { headers });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.error || `Failed to fetch owners (Status ${res.status})`;
    const err: any = new Error(message);
    err.details = errorData.details;
    err.code = errorData.code || res.status;
    err.type = errorData.type || 'appwrite_error';
    err.collectionId = errorData.collectionId;
    err.databaseId = errorData.databaseId;
    throw err;
  }
  const data = await res.json();
  return data.documents || [];
}

/**
 * Saves or updates an owner (mmiliki) in the Appwrite owner collection (69db7f1a001d26e73643764).
 */
export async function saveOwnerToAppwrite(ownerData: {
  fullName: string;
  phone?: string;
  email?: string;
  location?: string;
  houseType?: string;
  imageurl?: string;
  accountId?: string;
  ownerId?: string;
  ownerName?: string;
  creator?: string;
  text?: string;
  postId?: string;
}): Promise<any> {
  console.log('[saveOwnerToAppwrite] Persisting owner to database collection 69db7f1a001d26e73643764:', ownerData.fullName);
  const res = await fetch('/api/appwrite/owners', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(ownerData)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.warn('[saveOwnerToAppwrite] Server error saving owner:', errorData);
    throw new Error(errorData.error || `Failed to save owner to database (Status ${res.status})`);
  }

  return await res.json();
}

/**
 * Deletes a house post from Appwrite via server proxy.
 */
export async function deleteHouseInAppwrite(documentId: string): Promise<any> {
  console.log(`Deleting house post ${documentId} through Appwrite proxy...`);
  const res = await fetch(`/api/appwrite/houses/${documentId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to delete house post ${documentId}`);
  }
  return await res.json();
}

/**
 * Updates a house post in Appwrite via server proxy.
 */
export async function updateHouseInAppwrite(documentId: string, houseData: Partial<House>): Promise<any> {
  console.log(`Updating house post ${documentId} through Appwrite proxy...`);
  
  const payload: any = {};
  if (houseData.title) payload.housetype = houseData.title;
  if (houseData.description) payload.text = houseData.description;
  if (houseData.location) payload.location = houseData.location;
  if (houseData.amount !== undefined) payload.amount = Number(houseData.amount);
  
  if (houseData.images && houseData.images.length > 0) {
    payload.imagesurl = houseData.images[0];
    if (houseData.images.length > 1) {
      payload.imagesid = houseData.images.slice(1).join(',');
    } else {
      payload.imagesid = "img-custom-id";
    }
  }

  const res = await fetch(`/api/appwrite/houses/${documentId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to update house post ${documentId}`);
  }
  return await res.json();
}

