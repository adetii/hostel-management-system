import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaArrowRight, FaPhone, FaCalendarAlt, FaWhatsapp, FaEnvelope, FaStar, FaUsers, FaClock, FaShieldAlt } from 'react-icons/fa';

const CTA = () => {
  const [hoveredButton, setHoveredButton] = useState(null);

  const features = [
    { icon: FaUsers, text: '500+ Happy Students' },
    { icon: FaShieldAlt, text: '24/7 Security' },
    { icon: FaClock, text: 'Instant Booking' },
    { icon: FaStar, text: '4.9/5 Rating' }
  ];

  const floatingVariants = {
    animate: {
      y: [-20, 20, -20],
      rotate: [0, 5, 0, -5, 0],
      transition: {
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  return (
    <section className="relative py-20 overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-800">
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 animate-pulse" />
        
        {/* Pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0iI2ZmZmZmZiIgZmlsbC1vcGFjaXR5PSIwLjAzIj48cG9seWdvbiBwb2ludHM9IjUwLDAgNjAsNDAgMTAwLDUwIDYwLDYwIDUwLDEwMCA0MCw2MCAwLDUwIDQwLDQwIi8+PC9nPjwvc3ZnPg==')] opacity-30" />
      </div>

      {/* Enhanced floating elements */}
      <motion.div
        variants={floatingVariants}
        animate="animate"
        className="absolute top-20 left-10 w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hidden lg:block"
      />
      <motion.div
        variants={floatingVariants}
        animate="animate"
        style={{ animationDelay: '2s' }}
        className="absolute top-40 right-20 w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 hidden lg:block"
      />
      <motion.div
        variants={floatingVariants}
        animate="animate"
        style={{ animationDelay: '4s' }}
        className="absolute bottom-20 left-1/4 w-24 h-24 bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20 hidden lg:block"
      />
      <motion.div
        variants={floatingVariants}
        animate="animate"
        style={{ animationDelay: '6s' }}
        className="absolute bottom-40 right-1/4 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hidden lg:block"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center"
        >
          {/* Badge */}
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-6 py-2 rounded-full text-sm font-medium mb-8 border border-white/30"
          >
            <div className="text-yellow-300" />
            Join Our Community
          </motion.div>

          {/* Main Heading */}
          <motion.div variants={itemVariants} className="mb-8">
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Ready to Make
              <br />
              <span className="bg-gradient-to-r from-yellow-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent">
                Elite Hostel
              </span>
              <br />
              Your New Home?
            </h2>
            <p className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto leading-relaxed">
              Join hundreds of students who have chosen Elite Hostel for their accommodation needs. 
              Book your room today and experience the difference.
            </p>
          </motion.div>

          {/* Features Grid */}
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 max-w-4xl mx-auto"
          >
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300"
                >
                  <IconComponent className="text-white text-2xl mb-2 mx-auto" />
                  <p className="text-white/90 text-sm font-medium">{feature.text}</p>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12"
          >
            <motion.a
              href="management/register"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onHoverStart={() => setHoveredButton('book')}
              onHoverEnd={() => setHoveredButton(null)}
              className="group relative bg-white text-primary-700 px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl overflow-hidden min-w-[250px] inline-block"
            >
              {/* Button background animation */}
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative z-10 flex items-center justify-center group-hover:text-white transition-colors duration-300">
                <FaCalendarAlt className="mr-3 group-hover:scale-110 transition-transform duration-300" />
                SignUp Here
                <FaArrowRight className="ml-3 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
              
              {/* Glow effect */}
              <div className="absolute inset-0 bg-white opacity-20 blur-xl group-hover:opacity-30 transition-opacity duration-300" />
            </motion.a>
          </motion.div>

          {/* Contact Info Card */}
          <motion.div
            variants={itemVariants}
            className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 max-w-4xl mx-auto"
          >
            <p className="text-white/90 mb-6 text-lg font-medium">Need help? Our team is here for you 24/7</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Phone */}
              <motion.a
                href="tel:+2335550000000"
                whileHover={{ scale: 1.02, y: -2 }}
                className="group flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <FaPhone className="text-white text-lg" />
                  </div>
                  <div className="text-left">
                    <p className="text-white/70 text-sm">Call us now</p>
                    <p className="text-white font-bold text-lg">+233 555 000 0000</p>
                  </div>
                </div>
              </motion.a>

              {/* Email */}
              <motion.a
                href="mailto:info@elitehostel.com"
                whileHover={{ scale: 1.02, y: -2 }}
                className="group flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <FaEnvelope className="text-white text-lg" />
                  </div>
                  <div className="text-left">
                    <p className="text-white/70 text-sm">Email us</p>
                    <p className="text-white font-bold text-lg">info@elitehostel.com</p>
                  </div>
                </div>
              </motion.a>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Additional decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/30 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
        <div className="absolute top-3/4 right-1/4 w-2 h-2 bg-white/30 rounded-full animate-ping" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-3/4 w-2 h-2 bg-white/30 rounded-full animate-ping" style={{ animationDelay: '5s' }} />
      </div>
    </section>
  );
};

export default CTA;