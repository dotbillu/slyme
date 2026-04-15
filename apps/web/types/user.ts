export interface UserPublic {
  id: string;
  username: string | null;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  createdAt: Date;

  rooms: {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    type: string | null;
    createdAt: Date;
  }[];

  gigs: {
    id: string;
    title: string;
    description: string | null;
    imageUrls: string[];
    type: string | null;
    reward: string | null;
    date: Date | null;
    createdAt: Date;
    roomId: string | null;
  }[];
}
