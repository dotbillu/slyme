export interface RoomMember {
  id: string;
  username: string | null;
  name: string | null;
  avatarUrl: string | null;
}

export interface Room {
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  type: string | null;
  imageUrl: string | null;
  createdAt: string;
  creatorId: string;
  createdBy: RoomMember;
  members: RoomMember[];
  _count?: {
    members: number;
  };
  lastMessage?: Message | null;
  unreadCount?: number;
}

export interface RoomWithMessages extends Room {
  groupMessages: Message[];
}

export interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  roomId: string;
  sender: {
    id: string;
    username: string | null;
    avatarUrl: string | null;
  };
}

export interface CreateRoomPayload {
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  type?: string;
  imageUrl?: string;
}
