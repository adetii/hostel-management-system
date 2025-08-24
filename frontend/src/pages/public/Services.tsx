import React, { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { 
  FaUtensils, FaTshirt, FaWifi, FaShieldAlt, FaBus, FaGraduationCap, 
  FaHeartbeat, FaClock, FaCheckCircle, FaStar, FaArrowRight, FaPlay,
  FaUsers, FaHome, FaLaptop, FaGamepad, FaBook, FaDumbbell,
  FaCar, FaCamera, FaMusic, FaPhone, FaEnvelope, FaMapMarkerAlt,
  FaCalendarAlt, FaHeart, FaAward, FaThumbsUp, FaLightbulb
} from 'react-icons/fa';
import { IconType } from 'react-icons';
import SEO from '../../components/SEO';


const Services = () => {
  const [activeService, setActiveService] = useState(null);
  const [activeCategory, setActiveCategory] = useState('essential');
  const heroRef = useRef(null);
  const isHeroInView = useInView(heroRef, { once: true });

  const serviceCategories = [
    { id: 'essential', label: 'Essential Services', icon: FaHome },
    { id: 'academic', label: 'Academic Support', icon: FaGraduationCap },
    { id: 'lifestyle', label: 'Lifestyle & Recreation', icon: FaGamepad },
  ];

  const services = {
    essential: [
      {
        icon: FaWifi,
        title: 'High-Speed Internet',
        description: 'Lightning-fast fiber optic connection for seamless online experience',
        features: ['24/7 Wifi access'],
        price: 'Included in hostel fee',
        color: 'from-blue-500 to-blue-600',
        bgColor: 'bg-blue-50',
        users: '500+ students'
      },
      {
        icon: FaShieldAlt,
        title: '24/7 Security',
        description: 'Advanced security system ensuring your safety around the clock',
        features: ['CCTV monitoring', 'Emergency response'],
        price: 'Included in hostel fee',
        color: 'from-green-500 to-green-600',
        bgColor: 'bg-green-50',
        users: '100% coverage'
      },
      {
        icon: FaClock,
        title: 'Housekeeping',
        description: 'Professional cleaning services maintaining pristine living conditions',
        features: ['Daily cleaning', 'Maintenance'],
        price: 'Included in hostel fee',
        color: 'from-purple-500 to-purple-600',
        bgColor: 'bg-purple-50',
      },
    ],
    academic: [
      {
        icon: FaBook,
        title: 'Study Spaces',
        description: 'Dedicated quiet zones and collaborative study areas',
        features: ['24/7 study rooms', 'Group discussion areas', 'Silent zones', 'Printing services'],
        price: 'Included in hostel fee',
        color: 'from-indigo-500 to-indigo-600',
        bgColor: 'bg-indigo-50',
      },
    ],
    lifestyle: [
      {
        icon: FaGamepad,
        title: 'Recreation',
        description: 'Entertainment and recreational facilities for relaxation',
        features: ['Game room', 'TV room'],
        price: 'Included in hostel fee',
        color: 'from-pink-500 to-pink-600',
        bgColor: 'bg-pink-50',
      }
    ]
  };

  const bookingProcess = [
    {
      step: 1,
      title: 'Explore Services',
      description: 'Browse our comprehensive service catalog and find what you need',
      icon: FaLightbulb,
      color: 'from-blue-500 to-blue-600'
    },
    {
      step: 2,
      title: 'Check Availability',
      description: 'Verify service availability and schedule preferences',
      icon: FaCalendarAlt,
      color: 'from-green-500 to-green-600'
    },
    {
      step: 3,
      title: 'Select Package',
      description: 'Choose the service package that best fits your needs',
      icon: FaHeart,
      color: 'from-purple-500 to-purple-600'
    },
    {
      step: 4,
      title: 'Secure Payment',
      description: 'Complete your booking with our secure payment system',
      icon: FaShieldAlt,
      color: 'from-orange-500 to-orange-600'
    },
    {
      step: 5,
      title: 'Enjoy Service',
      description: 'Start enjoying your selected services immediately',
      icon: FaThumbsUp,
      color: 'from-pink-500 to-pink-600'
    }
  ];

  const stats = [
    { number: '10+', label: 'Services Available', icon: FaAward },
    { number: '500+', label: 'Happy Students', icon: FaUsers },
    { number: '24/7', label: 'Support Available', icon: FaClock },
    { number: '4.8/5', label: 'Average Rating', icon: FaStar }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      rotate: [0, 5, -5, 0],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          variants={floatingVariants}
          animate="animate"
          className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full opacity-20 blur-xl"
        />
        <motion.div
          variants={floatingVariants}
          animate="animate"
          style={{ animationDelay: '2s' }}
          className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-green-200 to-blue-200 rounded-full opacity-20 blur-xl"
        />
        <motion.div
          variants={floatingVariants}
          animate="animate"
          style={{ animationDelay: '4s' }}
          className="absolute bottom-20 left-1/4 w-40 h-40 bg-gradient-to-r from-purple-200 to-pink-200 rounded-full opacity-20 blur-xl"
        />
      </div>

      {/* Enhanced Hero Section */}
      <section ref={heroRef} className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 opacity-90" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20" />
        </div>
        
        <div className="container-custom relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center text-white"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={isHeroInView ? { scale: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-6"
            >
              <FaAward className="text-3xl" />
            </motion.div>
            
            <h1 className="text-5xl md:text-6xl font-heading font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Quality Student Services
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-8">
              Everything you need for a comfortable, successful, and enjoyable student life
            </p>
            
            {/* Stats Row */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate={isHeroInView ? "visible" : "hidden"}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
            >
              {stats.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    className="text-center"
                  >
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full mb-3">
                      <IconComponent className="text-xl" />
                    </div>
                    <div className="text-2xl font-bold">{stat.number}</div>
                    <div className="text-blue-100 text-sm">{stat.label}</div>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Service Categories */}
      <section className="py-16 relative">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-heading font-bold text-gray-900 mb-4">
              Comprehensive Service Categories
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              From essential services to premium amenities, we've got everything covered
            </p>
          </motion.div>

          {/* Category Tabs */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {serviceCategories.map((category) => {
              const IconComponent = category.icon;
              return (
                <motion.button
                  key={category.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex items-center px-6 py-3 rounded-2xl font-semibold transition-all duration-300 ${
                    activeCategory === category.id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <IconComponent className="mr-2" />
                  {category.label}
                </motion.button>
              );
            })}
          </div>

          {/* Services Grid */}
          <motion.div
            key={activeCategory}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {services[activeCategory as keyof typeof services].map((service: {
              icon: IconType;
              bgColor: string;
              color: string;
              title: string;
              description: string;
              features: string[];
              price: string;
            }, index: number) => {
              const IconComponent = service.icon;
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, y: -5 }}
                  onHoverStart={() => setActiveService(index as any)}
                  onHoverEnd={() => setActiveService(null)}
                  className="group cursor-pointer"
                >
                  <div className={`relative overflow-hidden rounded-3xl ${service.bgColor} p-8 h-full transition-all duration-500 hover:shadow-2xl border border-white/50 backdrop-blur-sm`}>
                    {/* Animated background gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${service.color} opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />
                    
                    {/* Floating icon background */}
                    <motion.div
                      animate={activeService === index ? { scale: 1.2, rotate: 360 } : { scale: 1, rotate: 0 }}
                      transition={{ duration: 0.6 }}
                      className={`absolute top-6 right-6 w-8 h-8 bg-gradient-to-r ${service.color} rounded-full opacity-20`}
                    />
                    
                    <div className="relative z-10">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className={`w-16 h-16 ${service.bgColor} rounded-2xl flex items-center justify-center mb-6 group-hover:shadow-lg transition-all duration-300 border border-white/50`}
                      >
                        <IconComponent className={`text-2xl text-${service.color.split('-')[1]}-600 group-hover:scale-110 transition-transform duration-300`} />
                      </motion.div>
                      
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                        {service.title}
                      </h3>
                      <p className="text-gray-600 mb-4 group-hover:text-gray-700 transition-colors duration-300">
                        {service.description}
                      </p>

                      {/* Features */}
                      <ul className="space-y-2 mb-6">
                        {service.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center text-sm text-gray-600">
                            <FaCheckCircle className="text-green-500 mr-2 text-xs" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      
                      {/* Price */}
                      <div className="flex items-center justify-between">
                        <span className={`font-bold text-lg text-${service.color.split('-')[1]}-600`}>
                          {service.price}
                        </span>
                        <motion.div
                          whileHover={{ x: 5 }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        >
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Enhanced Booking Process */}
      <section className="py-20 bg-white/50 backdrop-blur-sm relative">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-heading font-bold text-gray-900 mb-4">
              Simple Booking Process
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Get started with our services in just 5 easy steps
            </p>
          </motion.div>

          <div className="max-w-6xl mx-auto">
            <div className="relative">
              {/* Animated Progress Line */}
              <div className="absolute top-16 left-0 w-full h-1 bg-gray-200 hidden lg:block rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: '100%' }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                  viewport={{ once: true }}
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                />
              </div>

              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8"
              >
                {bookingProcess.map((step, index) => {
                  const IconComponent = step.icon;
                  return (
                    <motion.div
                      key={index}
                      variants={itemVariants}
                      whileHover={{ scale: 1.05, y: -10 }}
                      className="text-center relative group"
                    >
                      <div className="relative">
                        <motion.div
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                          className={`w-20 h-20 bg-gradient-to-r ${step.color} text-white rounded-full flex items-center justify-center mx-auto mb-6 relative z-10 shadow-lg group-hover:shadow-2xl transition-shadow duration-300`}
                        >
                          <div className="text-2xl font-bold">{step.step}</div>
                          <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                        </motion.div>
                        
                        {/* Step Icon */}
                        <div className={`absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r ${step.color} rounded-full flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                          <IconComponent className="text-white text-sm" />
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                        {step.title}
                      </h3>
                      <p className="text-gray-600 text-sm group-hover:text-gray-700 transition-colors duration-300">
                        {step.description}
                      </p>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20" />
        
        <div className="container-custom relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center text-white"
          >
            <SEO
              title="Services and Amenities"
              description="Discover Elite Hostel’s services and amenities including high-speed internet, security, study areas, and more to support your student life."
              path="/services"
            />
            <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Ready to Experience Hostel Life?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Join hundreds of satisfied students who chose our comprehensive services for their academic journey
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    // Open in new tab instead of redirecting current page
                    window.open(`${import.meta.env.VITE_MANAGEMENT_SYSTEM_URL}/register`, '_blank');
                  }}
                  className="bg-white text-blue-600 font-bold py-4 px-8 rounded-2xl hover:bg-gray-100 transition-all duration-300 flex items-center shadow-lg hover:shadow-xl"
                >
                  <FaPlay className="mr-3" />
                  Get Started Today
                </motion.button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Services;