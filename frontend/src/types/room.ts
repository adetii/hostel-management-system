export interface Room {
  id?: number;
  _id?: string;
  roomNumber: string;
  type?: string;
  roomType?: string;
  capacity: number;
  status?: 'available' | 'unavailable';
  isAvailable?: boolean;
  currentOccupancy?: number;
  // Add other room properties as needed
}

export type RoomType = 'single' | 'double' | 'triple' | 'deluxe';
export type RoomStatus = 'available' | 'occupied' | 'maintenance';
export interface RoomOccupants {
  roomId: string;
  roomNumber: string;
  capacity: number;
  currentOccupancy: number;
  occupants: {
    id: string;
    full_name?: string;
    fullName?: string;
    email: string;
    level: string;
    programmeOfStudy: string;
    phoneNumber: string; // Add this property as required
  }[];
}

export interface RoomState {
  rooms: Room[];
  selectedRoom: Room | null;
  loading: boolean;
  error: string | null;
  roomOccupants: RoomOccupants | null;
}
