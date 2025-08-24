import React from 'react';
import { 
          FaWifi, 
          FaCar, 
          FaUtensils, 
          FaShieldAlt, 
          FaDumbbell, 
          FaBook, 
          FaTv, 
          FaSnowflake, 
          FaStar, 
          FaArrowRight } from 'react-icons/fa';

const Amenities = () => {
  const amenities = [
    {
      icon: FaWifi,
      title: 'High-Speed WiFi',
      description: 'Complimentary high-speed internet throughout the hostel',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      features: ['100+ Mbps Speed', 'No Data Limits', '24/7 Support']
    },
    {
      icon: FaCar,
      title: 'Free Parking',
      description: 'Secure parking space available for residents',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      features: ['CCTV Monitored', 'Covered Parking', 'Easy Access']
    },
    {
      icon: FaUtensils,
      title: 'Shared Kitchen',
      description: 'Fully equipped kitchen with modern appliances',
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50',
      features: ['Modern Appliances', 'Spacious Design', 'Clean & Hygienic']
    },
    {
      icon: FaShieldAlt,
      title: '24/7 Security',
      description: 'Round-the-clock security with CCTV monitoring',
      color: 'from-red-500 to-pink-500',
      bgColor: 'bg-red-50',
      features: ['CCTV Surveillance', 'Security Guards', 'Access Control']
    },
    {
      icon: FaBook,
      title: 'Study Areas',
      description: 'Quiet study rooms and common areas for learning',
      color: 'from-indigo-500 to-blue-500',
      bgColor: 'bg-indigo-50',
      features: ['Silent Zones', 'High-Speed WiFi', 'Comfortable Seating']
    },
    {
      icon: FaTv,
      title: 'Entertainment',
      description: 'Common room with TV and gaming facilities',
      color: 'from-pink-500 to-rose-500',
      bgColor: 'bg-pink-50',
      features: ['Smart TV', 'Gaming Console', 'Movie Nights']
    },
  ];

  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background with gradient and floating elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5QzkyQUMiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>
      </div>

      {/* CSS Floating decorative elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-10 blur-xl animate-float-slow" />
      <div className="absolute top-40 right-20 w-32 h-32 bg-gradient-to-r from-pink-400 to-orange-500 rounded-full opacity-10 blur-xl animate-float-delayed" />
      <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-gradient-to-r from-green-400 to-cyan-500 rounded-full opacity-10 blur-xl animate-float" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in-up">

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
              World-Class
            </span>
            <br />
            <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              Amenities
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Experience comfort and convenience with our comprehensive range of facilities designed to make your stay memorable and productive.
          </p>
        </div>

        {/* Amenities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 animate-stagger-in">
          {amenities.map((amenity, index) => {
            const IconComponent = amenity.icon;
            return (
              <div
                key={index}
                className="group relative animate-fade-in-up hover:animate-lift"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Glass card */}
                <div className="relative bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-500 overflow-hidden">
                  {/* Gradient overlay on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${amenity.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-2xl`} />
                  
                  {/* Icon container */}
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className={`w-16 h-16 bg-gradient-to-br ${amenity.color} rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                      <IconComponent className="text-2xl text-white" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                      {amenity.title}
                    </h3>
                    
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      {amenity.description}
                    </p>
                    
                    {/* Features list */}
                    <div className="space-y-2 w-full">
                      {amenity.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center text-sm text-gray-500">
                          <div className="w-1.5 h-1.5 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full mr-2" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Amenities;