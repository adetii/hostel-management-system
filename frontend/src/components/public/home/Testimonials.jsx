import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { FaQuoteLeft, FaStar, FaChevronLeft, FaChevronRight, FaUser, FaGraduationCap, FaHeart, FaThumbsUp } from 'react-icons/fa';

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [direction, setDirection] = useState(1);

  const testimonials = [
    {
      id: 1,
      name: 'Zee',
      role: 'Computer Science Student',
      university: 'Koforidua Technical University',
      rating: 5,
      color: 'from-blue-500 to-cyan-500',
      text: 'Elite hostel has been my home for the past two years. The facilities are excellent, the staff is incredibly helpful, and the community here is amazing. I\'ve made lifelong friends and the study environment has really helped me excel in my academics.',
      highlights: ['Excellent Facilities', 'Amazing Community', 'Great Study Environment']
    },
    {
      id: 2,
      name: 'Vandame Addo',
      role: 'Business Admim student',
      university: 'Koforidua Technical University',
      rating: 5,
      color: 'from-green-500 to-emerald-500',
      text: 'The location is perfect - close to campus and all the amenities I need. The security is top-notch, which gives my parents peace of mind. The common areas are great for socializing and the kitchen facilities are always clean and well-maintained.',
      highlights: ['Perfect Location', 'Top Security', 'Clean Facilities']
    },
    {
      id: 3,
      name: 'Duches Kenzie',
      role: 'Medical Student',
      university: 'Koforidua Technical University',
      rating: 5,
      color: 'from-purple-500 to-pink-500',
      text: 'As a medical student, I need a quiet place to study and Elite hostel provides exactly that. The study rooms are perfect for long study sessions, and the 24/7 access means I can study whenever I need to. Highly recommended!',
      highlights: ['Quiet Study Areas', '24/7 Access', 'Perfect for Students']
    },
    {
      id: 4,
      name: 'Micheal Addo',
      role: 'Engineering Student',
      university: 'Koforidua Technical University',
      rating: 5,
      color: 'from-orange-500 to-red-500',
      text: 'The high-speed internet is a game-changer for my online classes and projects. The maintenance team is super responsive, and any issues are resolved quickly.',
      highlights: ['High-Speed Internet', 'Responsive Maintenance']
    },
    {
      id: 5,
      name: 'Evans Osei',
      role: 'Art & Design Student',
      university: 'Koforidua Technical University',
      rating: 5,
      color: 'from-indigo-500 to-blue-500',
      text: 'The creative atmosphere here is inspiring. The common areas are beautifully designed and there\'s always something happening in the community. The staff treats us like family and the overall experience has exceeded my expectations.',
      highlights: ['Creative Atmosphere', 'Beautiful Design', 'Family-like Staff']
    }
  ];

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prevIndex) => 
        prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
      );
    }, 6000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, testimonials.length]);

  const nextTestimonial = () => {
    setDirection(1);
    setCurrentIndex((prevIndex) => 
      prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevTestimonial = () => {
    setDirection(-1);
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1
    );
  };

  const goToTestimonial = (index) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <motion.div
        key={index}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: index * 0.1, duration: 0.3 }}
      >
        <FaStar
          className={`${index < rating ? 'text-yellow-400' : 'text-gray-300'} text-lg`}
        />
      </motion.div>
    ));
  };

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8
    })
  };

  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5QzkyQUMiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTMwIDMwYzAtMTEgOS0yMCAyMC0yMHMyMCA5IDIwIDIwLTkgMjAtMjAgMjAtMjAtOS0yMC0yMHptLTIwIDBjMC0xMSA5LTIwIDIwLTIwczIwIDkgMjAgMjAtOSAyMC0yMCAyMC0yMC05LTIwLTIweiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
      </div>

      {/* Floating decorative elements */}
      <motion.div 
        variants={floatingVariants}
        animate="animate"
        className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-10 blur-xl"
      />
      <motion.div 
        variants={floatingVariants}
        animate="animate"
        style={{ animationDelay: '2s' }}
        className="absolute top-40 right-20 w-32 h-32 bg-gradient-to-r from-pink-400 to-orange-500 rounded-full opacity-10 blur-xl"
      />
      <motion.div 
        variants={floatingVariants}
        animate="animate"
        style={{ animationDelay: '4s' }}
        className="absolute bottom-20 left-1/4 w-24 h-24 bg-gradient-to-r from-green-400 to-cyan-500 rounded-full opacity-10 blur-xl"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"> 
        {/* Testimonials Carousel */}
          <div 
            className="relative max-w-5xl mx-auto mb-16"
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
          >
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                  scale: { duration: 0.4 }
                }}
                className="relative"
              >
                {/* Main testimonial card */}
                <div className="bg-white/70 backdrop-blur-lg rounded-3xl p-8 md:p-12 shadow-2xl border border-white/20 overflow-hidden">
                  {/* Background pattern */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${testimonials[currentIndex].color} opacity-5 rounded-3xl`} />
                  
                  {/* Quote decoration */}
                  <div className="absolute top-6 left-6">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${testimonials[currentIndex].color} flex items-center justify-center shadow-lg`}>
                      <FaQuoteLeft className="text-white text-xl" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="relative z-10 pt-8">
                    {/* Testimonial text */}
                    <motion.p 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-lg md:text-xl text-gray-700 leading-relaxed mb-8 italic font-medium"
                    >
                      "{testimonials[currentIndex].text}"
                    </motion.p>
                    
                    {/* Highlights */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="flex flex-wrap gap-2 mb-8 justify-center"
                    >
                      {testimonials[currentIndex].highlights.map((highlight, index) => (
                        <span 
                          key={index}
                          className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${testimonials[currentIndex].color} text-white shadow-lg`}
                        >
                          {highlight}
                        </span>
                      ))}
                    </motion.div>
                    
                    {/* Student info */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="flex flex-col md:flex-row items-center justify-center gap-6"
                    >
                      
                      {/* Info */}
                      <div className="text-center md:text-left">
                        <h4 className="text-xl font-bold text-gray-900 mb-1">
                          {testimonials[currentIndex].name}
                        </h4>
                        <p className="text-primary-600 font-semibold mb-1">
                          {testimonials[currentIndex].role}
                        </p>
                        <p className="text-gray-500 text-sm mb-3 flex items-center gap-1 justify-center md:justify-start">
                          <FaGraduationCap className="text-xs" />
                          {testimonials[currentIndex].university}
                        </p>
                        
                        {/* Rating */}
                        <div className="flex space-x-1 justify-center md:justify-start">
                          {renderStars(testimonials[currentIndex].rating)}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={prevTestimonial}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-4 shadow-xl hover:shadow-2xl transition-all duration-300 text-gray-600 hover:text-primary-600 border border-white/20"
            >
              <FaChevronLeft className="text-xl" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={nextTestimonial}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-4 shadow-xl hover:shadow-2xl transition-all duration-300 text-gray-600 hover:text-primary-600 border border-white/20"
            >
              <FaChevronRight className="text-xl" />
            </motion.button>
          </div>

          {/* Wrap carousel and dots with LayoutGroup to stabilize shared layout transitions */}
          <LayoutGroup id="testimonials">
            {/* Enhanced Dots Indicator */}
            <div className="flex justify-center mb-16 space-x-3">
              {testimonials.map((testimonial, index) => (
                <motion.button
                  key={testimonial.id}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => goToTestimonial(index)}
                  className={`relative transition-all duration-300 ${
                    index === currentIndex 
                      ? 'w-12 h-4' 
                      : 'w-4 h-4 hover:w-6'
                  }`}
                >
                  <div className={`w-full h-full rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? `bg-gradient-to-r ${testimonial.color} shadow-lg` 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`} />
                  {index === currentIndex && (
                    <motion.div 
                      layoutId="activeIndicator"
                      className={`absolute inset-0 rounded-full bg-gradient-to-r ${testimonial.color} opacity-30 blur-sm`}
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </LayoutGroup>
        </div>
      </section>
  );
};

export default Testimonials;