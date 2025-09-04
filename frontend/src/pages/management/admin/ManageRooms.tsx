import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  HomeIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { AppDispatch, RootState } from '@/store';
import { fetchRooms, updateRoomStatus, updateRoom, createRoom, deleteRoom } from '@/store/slices/roomSlice';
import { Card, Button } from '@/components/management/common';
import { Room } from '@/types/room';
import { toast } from 'react-hot-toast';
import { DocumentIcon, TableCellsIcon } from '@heroicons/react/24/outline';
import ExportButton from '@/components/management/common/ExportButton';
import { exportRoomsToExcel } from '@/utils/exportUtils';
import { useLocation } from 'react-router-dom';

type RoomType = 'single' | 'double' | 'triple' | 'deluxe';
type RoomStatus = 'available' | 'unavailable';

interface NewRoomData {
  roomNumber: string;
  type: RoomType;
  capacity: number;
}

// Enhanced Room Card Component
// Update RoomCard props to include updatingStatusId
interface RoomCardProps {
  room: Room;
  onEdit: (room: Room) => void;
  onDelete: (roomId: string) => void;
  onStatusChange: (roomId: string, status: RoomStatus) => void;
  updatingStatusId: string | null; // Add this
}

// Helper to map room type to an icon component
const getRoomTypeIcon = (type?: string) => {
  switch ((type || '').toLowerCase()) {
    case 'single':
      return HomeIcon;
    case 'double':
      return BuildingOfficeIcon;
    case 'triple':
      return TableCellsIcon;
    case 'deluxe':
      return SparklesIcon;
    default:
      return HomeIcon;
  }
};

const RoomCard: React.FC<RoomCardProps> = ({ room, onEdit, onDelete, onStatusChange, updatingStatusId }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200';
      case 'unavailable': return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200';
      case 'occupied': return 'bg-yellow-100 text-yellow-800 border-yellow-200'; // read-only, no hover
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return CheckCircleIcon;
      case 'unavailable': return XCircleIcon;
      case 'occupied': return ExclamationTriangleIcon;
      default: return XCircleIcon;
    }
  };

  // Compute current occupancy from available data
  const getCurrentOccupancy = (): number | undefined => {
    if (typeof room.currentOccupancy === 'number') return room.currentOccupancy;
    const anyRoom: any = room;
    if (Array.isArray(anyRoom?.occupants)) return anyRoom.occupants.length;
    if (Array.isArray(anyRoom?.roomOccupants?.occupants)) return anyRoom.roomOccupants.occupants.length;
    return undefined;
  };

  // Derived status: occupied if fully booked, else fallback to status/isAvailable
  const computedStatus: 'available' | 'unavailable' | 'occupied' = (() => {
    const base = (room.status as any) || (room.isAvailable ? 'available' : 'unavailable');
    const capacity = typeof room.capacity === 'number' ? room.capacity : undefined;
    const occupancy = getCurrentOccupancy();
    if (typeof capacity === 'number' && typeof occupancy === 'number' && occupancy >= capacity) {
      return 'occupied';
    }
    return base === 'available' || base === 'unavailable' ? base : 'unavailable';
  })();

  const StatusIcon = getStatusIcon(computedStatus);
  const TypeIcon = getRoomTypeIcon(room.type || room.roomType);
  const statusValue = room.status || (room.isAvailable ? 'available' : 'unavailable');

  const handleStatusToggle = () => {
    // Read-only when occupied
    if (computedStatus === 'occupied') return;
    const newStatus = computedStatus === 'available' ? 'unavailable' : 'available';
    onStatusChange(room._id || String(room.id), newStatus);
  };

  const roomId = room._id || String(room.id);
  const isUpdatingStatus = updatingStatusId === roomId;
  const isReadOnly = computedStatus === 'occupied';

  return (
    <Card variant="glass" className="group transition-transform duration-200 transform-gpu will-change-transform overflow-hidden hover:scale-[1.01]">
      <div className="p-6">
        {/* Room Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <TypeIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Room {room.roomNumber}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {room.type ? room.type.charAt(0).toUpperCase() + room.type.slice(1) : room.roomType}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 opacity-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(room)}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              leftIcon={<PencilIcon className="h-4 w-4" />}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(room._id || String(room.id))}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              leftIcon={<TrashIcon className="h-4 w-4" />}
            />
          </div>
        </div>

        {/* Room Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Capacity</span>
            <div className="flex items-center space-x-1">
              <UserGroupIcon className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {room.capacity} {room.capacity === 1 ? 'person' : 'people'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
            <button
              onClick={handleStatusToggle}
              disabled={isUpdatingStatus || isReadOnly}
              className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg border-2 transition-all duration-200 ${
                isUpdatingStatus || isReadOnly
                  ? `opacity-50 cursor-not-allowed ${getStatusColor(computedStatus)}`
                  : `cursor-pointer ${getStatusColor(computedStatus)}`
              }`}
              title={
                isUpdatingStatus
                  ? 'Updating...'
                  : isReadOnly
                    ? 'Fully occupied (read-only)'
                    : `Click to make room ${computedStatus === 'available' ? 'unavailable' : 'available'}`
              }
            >
              {isUpdatingStatus ? (
                <div className="animate-spin rounded-full h-4 w-4" />
              ) : (
                <StatusIcon className="h-4 w-4" />
              )}
              <span>{computedStatus.charAt(0).toUpperCase() + computedStatus.slice(1)}</span>
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
};

// Enhanced Modal Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}></div>
        
        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

// Main ManageRooms Component
function ManageRooms() {
  const dispatch = useDispatch<AppDispatch>();
  // REMOVE 'loading' from useSelector
  const { rooms } = useSelector((state: RootState) => state.room);
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // Modal state management
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // added
  // Add: optimistic status overrides (immediate UI flip)
  const [optimisticStatus, setOptimisticStatus] = useState<Record<string, RoomStatus>>({});
  
  const [newRoomData, setNewRoomData] = useState<NewRoomData>({
    roomNumber: '',
    type: 'single',
    capacity: 1,
  });

  // Validation function
  const validateForm = (): boolean => {
    if (editingRoom) {
      return !!(editingRoom.roomNumber && editingRoom.capacity && editingRoom.capacity > 0);
    }
    return !!(newRoomData.roomNumber && newRoomData.capacity && newRoomData.capacity > 0);
  };

  // Reset function
  const resetForm = () => {
    setNewRoomData({
      roomNumber: '',
      type: 'single',
      capacity: 1,
    });
  };

  // Handler functions (single declarations only)
  const handleEditRoom = (room: Room) => {
    setEditingRoom({ ...room });
    setIsEditModalOpen(true);
  };

  const handleDeleteRoom = (roomId: string) => {
    setShowDeleteModal(roomId);
  };

  // Add handleCreateRoom in component scope
  const handleCreateRoom = async () => {
    if (!validateForm()) return;
    setIsCreating(true);
    try {
      await dispatch(createRoom(newRoomData)).unwrap();
      setIsCreateModalOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create room');
    } finally {
      setIsCreating(false);
    }
  };
  
  // FIX: Add local loading to handleUpdateRoom
  // Add handleUpdateRoom function:
  const handleUpdateRoom = async () => {
    if (editingRoom && validateForm()) {
      setIsUpdating(true);
      try {
        await dispatch(updateRoom(editingRoom));
        setIsEditModalOpen(false);
        setEditingRoom(null);
      } catch (error) {
        toast.error('Failed to update room');
      } finally {
        setIsUpdating(false);
      }
    }
  };
  
  // Update confirmDelete function:
  const confirmDelete = async () => {
    if (showDeleteModal) {
      setIsDeleting(true);
      try {
        await dispatch(deleteRoom(showDeleteModal));
        setShowDeleteModal(null);
      } catch (error) {
        toast.error('Failed to delete room');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // KEEP THIS VERSION (should be around line 345+):
  const handleStatusChange = async (roomId: string, status: RoomStatus) => {
    // Optimistic flip + immediate toast
    setUpdatingStatusId(roomId);
    setOptimisticStatus(prev => ({ ...prev, [roomId]: status }));
    toast.success(`Room status set to ${status}`);

    try {
      await dispatch(updateRoomStatus({ roomId, status })).unwrap();
      // No extra toast and no re-fetch needed here
    } catch (error: any) {
      // Revert optimistic change on failure
      setOptimisticStatus(prev => {
        const copy = { ...prev };
        delete copy[roomId];
        return copy;
      });
      toast.error(error?.message || 'Failed to update room status');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleEditInputChange = (field: keyof Room, value: string | number) => {
    if (editingRoom) {
      setEditingRoom({
        ...editingRoom,
        [field]: value
      });
    }
  };

  const handleNewRoomChange = (field: keyof NewRoomData, value: string | number) => {
    setNewRoomData({
      ...newRoomData,
      [field]: value
    });
  };

  useEffect(() => {
    const loadRooms = async () => {
      setIsLoading(true);
      try {
        await dispatch(fetchRooms()).unwrap();
      } catch (error: any) {
        toast.error(error?.message || 'Failed to load rooms');
      } finally {
        setIsLoading(false);
      }
    };
    loadRooms();
  }, [dispatch]);

  // Export handlers
  
  const handleExportAvailableRoomsExcel = () => {
    const availableRooms = filteredRooms.filter(room => {
      const status = room.status || (room.isAvailable ? 'available' : 'unavailable');
      return status === 'available';
    });
    exportRoomsToExcel(availableRooms, 'Available_Rooms_Report');
  };

  
  // Helper function to sort room numbers alphanumerically
  const sortRoomNumbers = (a: Room, b: Room) => {
    const roomA = a.roomNumber.toUpperCase();
    const roomB = b.roomNumber.toUpperCase();
    
    // Extract letter prefix and number for proper sorting
    const matchA = roomA.match(/^([A-Z]+)(\d+)$/);
    const matchB = roomB.match(/^([A-Z]+)(\d+)$/);
    
    if (matchA && matchB) {
      const [, prefixA, numA] = matchA;
      const [, prefixB, numB] = matchB;
      
      // First compare prefixes (A, B, C, etc.)
      if (prefixA !== prefixB) {
        return prefixA.localeCompare(prefixB);
      }
      
      // Then compare numbers numerically
      return parseInt(numA) - parseInt(numB);
    }
    
    // Fallback to string comparison if format doesn't match
    return roomA.localeCompare(roomB);
  };

  const roomsWithOverrides = rooms.map((room: Room) => {
    const rid = room._id || String(room.id);
    const override = optimisticStatus[rid];
    if (!override) return room;

    // Keep status and isAvailable consistent for both views
    return {
      ...room,
      status: override,
      isAvailable: override === 'available',
    } as Room;
  });

  const filteredRooms = roomsWithOverrides
    .filter((room: Room) => {
      const matchesSearch = room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const roomStatus = room.status || (room.isAvailable ? 'available' : 'unavailable');
      
      // Handle occupied filter
      if (filter === 'occupied') {
        const currentOccupancy = room.currentOccupancy || 0;
        const capacity = room.capacity || 1;
        const isOccupied = currentOccupancy >= capacity;
        return matchesSearch && isOccupied;
      }
      
      // Handle other filters
      const matchesFilter = filter === '' || roomStatus === filter;
      return matchesSearch && matchesFilter;
    })
    .sort(sortRoomNumbers);
  
  // Statistics
  const totalRooms = rooms.length;
  const availableRooms = roomsWithOverrides.filter(room => {
    const status = room.status || (room.isAvailable ? 'available' : 'unavailable');
    return status === 'available';
  }).length;
  const unavailableRooms = roomsWithOverrides.filter(room => {
    const status = room.status || (room.isAvailable ? 'available' : 'unavailable');
    return status === 'unavailable';
  }).length;
  
  // Add occupied rooms calculation
  const occupiedRooms = roomsWithOverrides.filter(room => {
    const currentOccupancy = room.currentOccupancy || 0;
    const capacity = room.capacity || 1;
    return currentOccupancy >= capacity;
  }).length;
  
  // Check if any filters are active (not default)
  const hasActiveFilters = searchTerm !== '' || filter !== '';

useEffect(() => {
  // Implement proper loading flow for fetching rooms
  const loadRooms = async () => {
    setIsLoading(true);
    try {
      await dispatch(fetchRooms()).unwrap();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load rooms');
    } finally {
      setIsLoading(false);
    }
  };
  loadRooms();
}, [dispatch]);

if (!rooms || rooms.length === 0) {
  return (
    <div className="flex items-center justify-center min-h-screen space-x-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="text-lg text-gray-700">Loading rooms...</p>
    </div>
  );
}

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Manage Rooms
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create, edit, and manage hostel rooms
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2">
          <ExportButton
            options={[
              // Show filtered option only when filters are active
              ...(hasActiveFilters ? [{
                label: 'Filtered Rooms (Excel)',
                action: handleExportAvailableRoomsExcel,
                icon: <TableCellsIcon className="w-4 h-4" />
              }] : []),
              {
                label: 'All Rooms (Excel)',
                action: () => {
                  exportRoomsToExcel(rooms, 'All_Rooms_Report');
                },
                icon: <TableCellsIcon className="w-4 h-4" />
              },
              {
                label: 'Available Rooms (Excel)',
                action: handleExportAvailableRoomsExcel,
                icon: <TableCellsIcon className="w-4 h-4" />
              }
            ]}
            className="[&>button]:bg-white [&>button]:hover:bg-white [&>button]:border-0 [&>button]:rounded-lg"
          />
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full sm:w-auto"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add New Room
          </Button>
        </div>
      </div>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card variant="glass">
          <div className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <BuildingOfficeIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Rooms</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalRooms}</p>
              </div>
            </div>
          </div>
        </Card>
        
        <Card variant="glass">
          <div className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Available</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{availableRooms}</p>
              </div>
            </div>
          </div>
        </Card>
        
        <Card variant="glass">
          <div className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <UserGroupIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Occupied</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{occupiedRooms}</p>
              </div>
            </div>
          </div>
        </Card>
        
        <Card variant="glass">
          <div className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <XCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unavailable</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{unavailableRooms}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card variant="glass">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 flex-1">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search rooms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div className="relative">
                <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none"
                >
                  <option value="">All Rooms</option>
                  <option value="available">Available</option>
                  <option value="unavailable">Unavailable</option>
                  <option value="occupied">Occupied</option>
                </select>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400"></span>
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Table
                </button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Rooms Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* In the grid view */}
          {filteredRooms.map((room: Room) => (
            <RoomCard
              key={room._id || room.id}
              room={room}
              onEdit={handleEditRoom}
              onDelete={handleDeleteRoom}
              onStatusChange={handleStatusChange}
              updatingStatusId={updatingStatusId} // Add this prop
            />
          ))}
        </div>
      ) : (
        <Card variant="glass">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-6 font-medium text-gray-500 dark:text-gray-400 text-sm">
                    Room Number
                  </th>
                  <th className="text-left py-3 px-6 font-medium text-gray-500 dark:text-gray-400 text-sm">
                    Type
                  </th>
                  <th className="text-left py-3 px-6 font-medium text-gray-500 dark:text-gray-400 text-sm">
                    Capacity
                  </th>
                  <th className="text-left py-3 px-6 font-medium text-gray-500 dark:text-gray-400 text-sm">
                    Status
                  </th>
                  <th className="text-left py-3 px-6 font-medium text-gray-500 dark:text-gray-400 text-sm">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredRooms.map((room: Room) => {
                  const rid = room._id || String(room.id);
                  const overriddenStatus = optimisticStatus[rid];
                  const baseStatus = (overriddenStatus ?? room.status) || (room.isAvailable ? 'available' : 'unavailable');
  
                  // Compute occupancy like in RoomCard
                  const getCurrentOccupancy = (): number | undefined => {
                    if (typeof (room as any).currentOccupancy === 'number') return (room as any).currentOccupancy;
                    const anyRoom: any = room;
                    if (Array.isArray(anyRoom?.occupants)) return anyRoom.occupants.length;
                    if (Array.isArray(anyRoom?.roomOccupants?.occupants)) return anyRoom.roomOccupants.occupants.length;
                    return undefined;
                  };
  
                  const capacity = typeof room.capacity === 'number' ? room.capacity : undefined;
                  const occupancy = getCurrentOccupancy();
                  const computedStatus: 'available' | 'unavailable' | 'occupied' =
                    typeof capacity === 'number' && typeof occupancy === 'number' && occupancy >= capacity
                      ? 'occupied'
                      : (baseStatus === 'available' || baseStatus === 'unavailable' ? baseStatus : 'unavailable');
  
                  const isUpdatingStatus = updatingStatusId === rid;
                  const isReadOnly = computedStatus === 'occupied';
  
                  const getStatusColor = (status: string) => {
                    switch (status) {
                      case 'available': return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200';
                      case 'unavailable': return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200';
                      case 'occupied': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                      default: return 'bg-gray-100 text-gray-800 border-gray-200';
                    }
                  };
  
                  const onToggle = () => {
                    if (isReadOnly) return;
                    const nextStatus = computedStatus === 'available' ? 'unavailable' : 'available';
                    handleStatusChange(rid, nextStatus as RoomStatus);
                  };
  
                  return (
                    <tr key={rid} className="hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors duration-200">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              Room {room.roomNumber}
                            </div>
                          </div>
                        </div>
                      </td>
  
                      <td className="py-4 px-6">
                        <span className="text-gray-900 dark:text-white">
                          {(room.type || room.roomType || '').toString().charAt(0).toUpperCase() +
                            (room.type || room.roomType || '').toString().slice(1)}
                        </span>
                      </td>
  
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-1">
                          <span className="text-gray-900 dark:text-white">
                            {room.capacity} {room.capacity === 1 ? 'person' : 'people'}
                          </span>
                        </div>
                      </td>
  
                      <td className="py-4 px-6">
                        <button
                          onClick={onToggle}
                          disabled={isUpdatingStatus || isReadOnly}
                          className={`flex items-center space-x-2 px-3 py-1.5 text-xs font-medium rounded-full border-2 transition-all duration-200 ${
                            isUpdatingStatus || isReadOnly
                              ? `opacity-50 cursor-not-allowed ${getStatusColor(computedStatus)}`
                              : `cursor-pointer ${getStatusColor(computedStatus)}`
                          }`}
                          title={
                            isUpdatingStatus
                              ? 'Updating...'
                              : isReadOnly
                                ? 'Fully occupied (read-only)'
                                : `Click to make room ${computedStatus === 'available' ? 'unavailable' : 'available'}`
                          }
                        >
                          {isUpdatingStatus ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-current inline-block" />
                          )}
                          <span>{computedStatus.charAt(0).toUpperCase() + computedStatus.slice(1)}</span>
                        </button>
                      </td>
  
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditRoom(room)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            leftIcon={<PencilIcon className="h-4 w-4" />}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRoom(rid)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            leftIcon={<TrashIcon className="h-4 w-4" />}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {filteredRooms.length === 0 && (
        <Card variant="glass">
          <div className="text-center py-12">
            <HomeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No rooms found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || filter ? 'Try adjusting your search or filter criteria.' : 'Get started by creating a new room.'}
            </p>
            {!searchTerm && !filter && (
              <div className="mt-6">
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add New Room
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Edit Room Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingRoom(null);
        }}
        title="Edit Room"
      >
        {editingRoom && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Room Number
              </label>
              <input
                type="text"
                value={editingRoom.roomNumber}
                onChange={(e) => handleEditInputChange('roomNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type
              </label>
              <select
                value={editingRoom.type || editingRoom.roomType}
                onChange={(e) => handleEditInputChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="single">Single</option>
                <option value="double">Double</option>
                <option value="triple">Triple</option>
                <option value="deluxe">Deluxe</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Capacity
              </label>
              <input
                type="number"
                value={editingRoom.capacity}
                onChange={(e) => handleEditInputChange('capacity', parseInt(e.target.value))}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                onClick={handleUpdateRoom}
                disabled={!validateForm() || isUpdating}
              >
                {isUpdating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Editing...
                  </>
                ) : (
                  'Edit Room'
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add New Room Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetForm();
        }}
        title="Add New Room"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Room Number
            </label>
            <input
              type="text"
              value={newRoomData.roomNumber}
              onChange={(e) => handleNewRoomChange('roomNumber', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="e.g., 101, A-205"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type
            </label>
            <select
              value={newRoomData.type}
              onChange={(e) => handleNewRoomChange('type', e.target.value as RoomType)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="single">Single</option>
              <option value="double">Double</option>
              <option value="triple">Triple</option>
              <option value="deluxe">Deluxe</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Capacity
            </label>
            <input
              type="number"
              value={newRoomData.capacity}
              onChange={(e) => handleNewRoomChange('capacity', parseInt(e.target.value))}
              min="1"
              max="10"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsCreateModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
          
            {/* Create Room Modal Button */}
            <Button 
              onClick={handleCreateRoom}
              disabled={!validateForm() || isCreating}
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                'Create Room'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!showDeleteModal}
        onClose={() => setShowDeleteModal(null)}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete this room? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setShowDeleteModal(null)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmDelete}
              disabled={isDeleting}
              className={`bg-red-600 text-white ${isDeleting ? 'opacity-75 cursor-not-allowed' : 'hover:bg-red-700'}`}
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                'Delete Room'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ManageRooms;
