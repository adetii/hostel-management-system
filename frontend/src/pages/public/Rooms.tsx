import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  UsersIcon,
  BedIcon,
  ShieldIcon,
  GraduationCapIcon,
  EyeIcon,
  WifiIcon
} from '@/components/ui/InlineIcons';
import ImageGallery from '@/components/public/ImageGallery';
import 'react-image-gallery/styles/css/image-gallery.css';
import SEO from '../../components/SEO';

function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showGallery, setShowGallery] = useState(false); // Add state for gallery

  // Move mockRooms definition before fetchRooms
  const mockRooms = [
    {
      id: 1,
      type: '1-in-a-room',
      name: 'Single',
      price: 5500,
      capacity: 1,
      amenities: ['WiFi', 'Study Desk', 'Wardrobe', 'Private Bathroom'],
      images: [
        {
          original: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
          thumbnail: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
        },
        {
          original: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
          thumbnail: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
        }
      ],
      description: 'Perfect for students who value privacy and quiet study time. Features a comfortable single bed, spacious study area, and modern amenities.'
    },
    {
      id: 2,
      type: '2-in-a-room',
      name: 'Double',
      price: 4000,
      capacity: 2,
      amenities: ['WiFi', 'Study Desk', 'Wardrobe', 'Private Bathroom'],
      images: [
        {
          original: 'https://images.unsplash.com/photo-1631049552240-59c37f38802b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
          thumbnail: 'https://images.unsplash.com/photo-1631049552240-59c37f38802b?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
        }
      ],
      description: 'Great for students who enjoy companionship. Share with a carefully matched roommate in a comfortable, well-designed space.'
    },
    {
      id: 3,
      type: '3-in-a-room',
      name: 'Triple',
      price: 3000,
      capacity: 3,
      amenities: ['WiFi', 'Study Desk', 'Wardrobe', 'Private Bathroom'],
      images: [
        {
          original: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
          thumbnail: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
        }
      ],
      description: 'Budget-friendly option perfect for students who want to build lasting friendships while saving on accommodation costs.'
    },

    {
      id: 4,
      type: '4-in-a-room',
      name: 'Deluxe',
      price: 2310,
      capacity: 4, // fix: was 3
      amenities: ['WiFi', 'Study Desk', 'Wardrobe', 'Shared Bathroom'],
      images: [
        {
          original: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
          thumbnail: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
        }
      ],
      description: 'Budget-friendly option perfect for students who want to build lasting friendships while saving on accommodation costs.'
    }
  ];

  const filteredRooms = filter === 'all' ? mockRooms : mockRooms.filter(room => room.type === filter);

  const amenityIcons = {
    'WiFi': WifiIcon,
    'Study Desk': BedIcon,
    'Wardrobe': BedIcon,
    'Private Bathroom': BedIcon,
    'Shared Bathroom': BedIcon,
  };

  return (
    <div className="pt-20 bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -150, 0],
            y: [0, 100, 0],
            rotate: [360, 180, 0]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl"
        />
      </div>
      <SEO
          title="Rooms"
          description="Discover Elite Hostel’s Rooms including high-speed internet, security, study areas, and more to support your student life."
          path="/rooms"
        />
      {/* Enhanced Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background with Parallax Effect */}
        <motion.div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1555854877-bab0e564b8d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 via-purple-900/70 to-blue-900/80" />
        </motion.div>
        
        <div className="container mx-auto px-4 py-24 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center text-white"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-block mb-6"
            >
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
              Our Rooms & Facilities
            </h1>
            
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-8 leading-relaxed">
              Discover comfortable, modern accommodations designed for student life
            </p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap justify-center gap-6 text-sm"
            >
              {[
                { icon: ShieldIcon, text: 'Trusted by 500+ Students' },
                { icon: GraduationCapIcon, text: '98% Satisfaction Rate' },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center space-x-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 border border-white/20"
                >
                  <item.icon className="text-blue-300" />
                  <span className="text-white">{item.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {['all', '1-in-a-room', '2-in-a-room', '3-in-a-room', '4-in-a-room'].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-6 py-3 rounded-full font-medium transition-all duration-200 ${
                  filter === type
                    ? 'bg-primary-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type === 'all' ? 'All Rooms' : `${type.charAt(0).toUpperCase() + type.slice(1)}`}
              </button>
            ))}
          </div>

          {/* Redesigned Rooms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredRooms.map((room, index) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group cursor-pointer"
                onClick={() => setSelectedRoom(room)}
              >
                {/* Redesigned Room Card */}
                <div className="relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
                  {/* Image Section with Gradient Overlay */}
                  <div className="relative overflow-hidden h-72">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
                    <img
                      src={room.images[0]?.original || room.images[0]}
                      alt={room.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    
                    {/* Price Badge */}
                    <div className="absolute top-4 left-4 z-20">
                      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                        GH₵{room.price}/sem
                      </div>
                    </div>
                    
                    {/* Available Badge */}
                    <div className="absolute top-4 right-4 z-20">
                      <div className="bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1 rounded-full text-sm font-medium shadow-md">
                        {room.available || 'Available'}
                      </div>
                    </div>
                    
                    {/* Bottom Overlay Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                      <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors duration-300">
                        {room.name}
                      </h3>
                      <div className="flex items-center space-x-4 text-white/90 text-sm">
                        <div className="flex items-center space-x-1">
                          <UsersIcon className="text-blue-300" />
                          <span>{room.capacity} person{room.capacity > 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <BedIcon className="text-purple-300" />
                          <span>{room.size || 'Standard'}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-600/80 to-purple-600/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-30 flex items-center justify-center">
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-white text-blue-600 px-6 py-3 rounded-full font-bold flex items-center space-x-2 shadow-xl"
                      >
                        <EyeIcon />
                        <span>View Details</span>
                      </motion.button>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-6 space-y-4">
                    {/* Description */}
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                      {room.description}
                    </p>

                    {/* Amenities */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-gray-800">Amenities</h4>
                      <div className="flex flex-wrap gap-2">
                        {room.amenities.slice(0, 3).map((amenity) => {
                          const Icon = amenityIcons[amenity] || BedIcon;
                          return (
                            <div key={amenity} className="flex items-center space-x-1 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 px-3 py-1 rounded-full text-xs text-gray-700">
                              <Icon className="text-blue-500 text-xs" />
                              <span className="font-medium">{amenity}</span>
                            </div>
                          );
                        })}
                        {room.amenities.length > 3 && (
                          <div className="flex items-center justify-center bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-500 font-medium">
                            +{room.amenities.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Area */}
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="text-xs text-gray-500">
                            {room.type.replace('-', ' ').toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Room Details Modal */}
      {selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-heading font-bold text-gray-900">
                  {selectedRoom.name}
                </h2>
                <button
                  onClick={() => setSelectedRoom(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  {selectedRoom.images && selectedRoom.images.length > 0 && (
                    <>
                      <div className="h-64 bg-gray-100 rounded-md overflow-hidden">
                        <img
                          src={selectedRoom.images[0]?.original || selectedRoom.images[0]}
                          alt={selectedRoom.name}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => setShowGallery(true)}
                        />
                      </div>
                      {showGallery && (
                        <ImageGallery
                          images={selectedRoom.images}
                          onClose={() => setShowGallery(false)}
                        />
                      )}
                    </>
                  )}
                </div>

                <div>
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Room Details</h3>
                    <div className="space-y-2 text-gray-600">
                      <p><strong>Capacity:</strong> {selectedRoom.capacity} person{selectedRoom.capacity > 1 ? 's' : ''}</p>
                      <p><strong>Available:</strong> {selectedRoom.available} rooms</p>
                      <p><strong>Price:</strong> <span className="text-primary-600 font-bold">GH₵{selectedRoom.price}/semester</span></p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Description</h3>
                    <p className="text-gray-600">{selectedRoom.description}</p>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Amenities</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedRoom.amenities.map((amenity) => {
                        const Icon = amenityIcons[amenity] || BedIcon;
                        return (
                          <div key={amenity} className="flex items-center space-x-2 text-gray-600">
                            <Icon className="text-primary-600" />
                            <span>{amenity}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Rooms;