"use client"

import { Room } from "@/types/room"
import { X, Users } from "lucide-react"

interface RoomSidebarProps {
  rooms: Room[]
  activeRoomId: string
  onRoomSelect: (id: string) => void
  isOpen: boolean
  onClose: () => void
}

export default function RoomSidebar({
  rooms,
  activeRoomId,
  onRoomSelect,
  isOpen,
  onClose,
}: RoomSidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:relative z-50 md:z-auto
          top-0 left-0 h-full
          w-[320px] md:w-[350px]
          bg-black border-r border-zinc-800
          flex flex-col
          transition-transform duration-200
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold">Messages</h2>
          <button
            onClick={onClose}
            className="md:hidden p-1 hover:bg-zinc-800 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* Room list */}
        <div className="flex-1 overflow-y-auto">
          {rooms.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-zinc-500 text-sm">
              No rooms joined yet
            </div>
          ) : (
            rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => onRoomSelect(room.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 transition-colors text-left
                  ${room.id === activeRoomId ? "bg-zinc-800/80" : "hover:bg-zinc-900"}
                `}
              >
                {/* Room avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {room.imageUrl ? (
                    <img
                      src={room.imageUrl}
                      alt={room.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-base font-bold text-white">
                      {room.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Room info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{room.name}</p>
                  <div className="flex items-center gap-1 text-xs text-zinc-400">
                    <Users size={12} />
                    <span>{room.members?.length || 0} members</span>
                  </div>
                </div>

                {/* Active indicator */}
                {room.id === activeRoomId && (
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                )}
              </button>
            ))
          )}
        </div>
      </aside>
    </>
  )
}
