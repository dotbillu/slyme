export interface Gig {
  id: string;
  title: string;
  description: string | null;
  latitude: number;
  longitude: number;
  date: string | null;
  reward: string | null;
  gigTime: string | null;
  expiresAt: string | null;
  createdAt: string;
  creatorId: string;
  roomId: string | null;
  type: string | null;
  imageUrls: string[];
  createdBy?: {
    id: string;
    username: string | null;
    name: string | null;
    avatarUrl: string | null;
  };
}

export interface CreateGigPayload {
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  date?: string;
  reward?: string;
  gigTime?: string;
  expiresAt?: string;
  type?: string;
  imageUrls?: string[];
  roomId?: string;
}

export interface UpdateGigPayload {
  title?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  date?: string;
  reward?: string;
  gigTime?: string;
  expiresAt?: string;
  type?: string;
  imageUrls?: string[];
}

export const GIG_TYPES = [
  "Delivery",
  "Cleaning",
  "Moving",
  "Tutoring",
  "Pet Care",
  "Repair",
  "Photography",
  "Event Help",
  "Tech Support",
  "Other",
] as const;
