import Dexie, { type EntityTable } from 'dexie';
import { Message } from '@/types/room';

export const db = new Dexie('ChatDatabase') as Dexie & {
  messages: EntityTable<Message, 'id'>;
};

db.version(1).stores({
  messages: 'id, roomId, createdAt',
});
