import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaAward, 
  FaUsers, 
  FaHeart, 
  FaGlobe,
  FaShieldAlt,
  FaGraduationCap,
  FaMapMarkerAlt,
  FaClock,
  FaStar,
  FaQuoteLeft,
  FaLinkedin,
  FaTwitter,
  FaEnvelope,
  FaPhone,
  FaBuilding,
  FaLeaf,
  FaTrophy,
  FaHandshake,
  FaLightbulb,
  FaRocket,
  FaCheck,
  FaTimes
} from 'react-icons/fa';
import SEO from '../../components/SEO';

function About() {
  const [activeTab, setActiveTab] = useState('story');
  const [selectedTeamMember, setSelectedTeamMember] = useState(null);

  const values = [
    {
      icon: FaHeart,
      title: 'Student-Centered',
      description: 'Everything we do is focused on creating the best possible experience for our students',
      color: 'from-red-500 to-pink-500',
    },
    {
      icon: FaUsers,
      title: 'Community',
      description: 'Building lasting friendships and connections that extend beyond your stay',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: FaAward,
      title: 'Excellence',
      description: 'Maintaining the highest standards in accommodation, services, and support',
      color: 'from-yellow-500 to-orange-500',
    },
    {
      icon: FaGlobe,
      title: 'Diversity',
      description: 'Celebrating and embracing students from all backgrounds and cultures',
      color: 'from-green-500 to-emerald-500',
    }
  ];

  const team = [
    {
      name: 'Fynn',
      position: 'General Manager',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      bio: '15+ years in student accommodation management with a passion for creating exceptional living experiences.',
      email: 'fynn@elitehostel.com',
      specialties: ['Operations Management', 'Student Services', 'Strategic Planning'],
      quote: 'Every student deserves a home where they can thrive and grow.'
    },
    {
      name: 'Michael Addo',
      position: 'Student Services Director',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      bio: 'Dedicated to enhancing student life and wellbeing through innovative programs and personalized support.',
      email: 'michael.addo@elitehostel.com',
      specialties: ['Student Wellbeing', 'Program Development', 'Crisis Management'],
      quote: 'Supporting students in their journey is not just a job, it\'s a calling.'
    },
    {
      name: 'Evans Osei',
      position: 'Community Coordinator',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      bio: 'Creating engaging programs and events that bring our diverse community together and foster lasting friendships.',
      email: 'evans.osei@elitehostel.com',
      specialties: ['Event Planning', 'Community Building', 'Cultural Programs'],
      quote: 'The best memories are made when we come together as a community.'
    },
    {
      name: 'Adeti Elorm',
      position: 'Facilities Manager',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      bio: 'Ensuring safe, comfortable, and sustainable living environments through proactive maintenance and innovation.',
      email: 'adeti.elorm@elitehostel.com',
      specialties: ['Facility Management', 'Sustainability', 'Safety Protocols'],
      quote: 'A well-maintained space is the foundation of a great living experience.'
    }
  ];

  const achievements = [
    { number: '500+', label: 'Happy Students', icon: FaUsers },
    { number: '15+', label: 'Years of Excellence', icon: FaClock },
    { number: '98%', label: 'Satisfaction Rate', icon: FaStar },
    { number: '24/7', label: 'Support Available', icon: FaShieldAlt },
    { number: '100%', label: 'Safety Record', icon: FaAward }
  ];

  // Animation variants
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

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: 0.3
      }
    }
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
              About Elite Hostel
            </h1>
            
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-8 leading-relaxed">
              Creating exceptional student living experiences since 2008, where every student finds their home away from home
            </p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap justify-center gap-6 text-sm"
            >
              {[
                { icon: FaShieldAlt, text: 'Trusted by 500+ Students' },
                { icon: FaGraduationCap, text: '98% Satisfaction Rate' },
                { icon: FaMapMarkerAlt, text: 'Prime Campus Location' }
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

      {/* Enhanced Stats Section */}
      <section className="py-20 relative z-10">
        <div className="container mx-auto px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6"
          >
            {achievements.map((achievement, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -10, scale: 1.05 }}
                className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 text-center shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300"
              >
                <achievement.icon className="text-3xl text-blue-600 mx-auto mb-3" />
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {achievement.number}
                </div>
                <div className="text-sm text-gray-600">
                  {achievement.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Enhanced Tabbed Content Section */}
      <section className="py-20 relative z-10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20"
          >
            {/* Tab Navigation */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              {[
                { key: 'story', label: 'Our Story', icon: FaLightbulb },
                { key: 'mission', label: 'Mission & Vision', icon: FaRocket },
                { key: 'values', label: 'Our Values', icon: FaHeart }
              ].map((tab) => (
                <motion.button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-medium transition-all duration-300 ${
                    activeTab === tab.key
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-white/50 text-gray-700 hover:bg-white/80 border border-gray-200'
                  }`}
                >
                  <tab.icon className="text-sm" />
                  <span>{tab.label}</span>
                </motion.button>
              ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === 'story' && (
                <motion.div
                  key="story"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
                >
                  <div>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                      Our Story
                    </h2>
                    <div className="space-y-6 text-gray-600 leading-relaxed">
                      <p className="text-lg">
                        Founded in 2008, Elite Hostel began with a simple yet powerful mission: to provide students with more than just a place to sleep. We wanted to create a true home away from home where students could thrive academically, socially, and personally.
                      </p>
                      <p className="text-lg">
                        Over the years, we've grown from a small 50-room facility to a comprehensive student housing community serving over 500 students from around the world. Our commitment to excellence has earned us recognition as one of the premier student accommodations in the region.
                      </p>
                      <p className="text-lg">
                        Today, we continue to innovate and improve, always keeping our students' needs at the heart of everything we do. From state-of-the-art facilities to personalized support services, we're dedicated to helping every student succeed.
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <motion.img
                      whileHover={{ scale: 1.05 }}
                      src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                      alt="Our Hostel Building"
                      className="rounded-2xl shadow-2xl"
                    />
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 }}
                      className="absolute -bottom-6 -right-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl"
                    >
                      <div className="text-center">
                        <div className="text-3xl font-bold">15+</div>
                        <div className="text-sm">Years of Excellence</div>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'mission' && (
                <motion.div
                  key="mission"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                  className="text-center max-w-4xl mx-auto"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <motion.div
                      whileHover={{ y: -10 }}
                      className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100"
                    >
                      <FaRocket className="text-4xl text-blue-600 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
                      <p className="text-gray-600 leading-relaxed">
                        To provide exceptional student accommodation that fosters academic success, personal growth, and lifelong friendships through innovative facilities, comprehensive support services, and a vibrant community environment.
                      </p>
                    </motion.div>
                    <motion.div
                      whileHover={{ y: -10 }}
                      className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100"
                    >
                      <FaLightbulb className="text-4xl text-purple-600 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
                      <p className="text-gray-600 leading-relaxed">
                        To be the leading student accommodation provider, recognized globally for our commitment to excellence, innovation, and student success, creating communities where every student can achieve their full potential.
                      </p>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'values' && (
                <motion.div
                  key="values"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
                >
                  {values.map((value, index) => {
                    const IconComponent = value.icon;
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -10, scale: 1.05 }}
                        className="text-center group"
                      >
                        <motion.div
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                          className={`w-20 h-20 bg-gradient-to-r ${value.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow`}
                        >
                          <IconComponent className="text-2xl text-white" />
                        </motion.div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">
                          {value.title}
                        </h3>
                        <p className="text-gray-600 mb-3 leading-relaxed">
                          {value.description}
                        </p>
                        <div className="text-sm font-semibold text-blue-600">
                          {value.stats}
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Team Section */}
      <section className="py-20 relative z-10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Meet Our Team
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The dedicated professionals who make your experience exceptional
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {team.map((member, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -10 }}
                className="group cursor-pointer"
                onClick={() => setSelectedTeamMember(member)}
              >
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 text-center shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300">
                  <div className="relative mb-6">
                    <motion.img
                      whileHover={{ scale: 1.1 }}
                      src={member.image}
                      alt={member.name}
                      className="w-24 h-24 rounded-full mx-auto object-cover shadow-lg"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {member.name}
                  </h3>
                  <p className="text-blue-600 font-semibold mb-3">
                    {member.position}
                  </p>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {member.bio}
                  </p>
                  <div className="flex justify-center space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      className="bg-blue-100 text-blue-600 p-2 rounded-full hover:bg-blue-200 transition-colors"
                    >
                      <FaEnvelope className="text-sm" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Enhanced Location Section */}
      <section className="py-20 relative z-10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Perfectly positioned for student life and academic success
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/20">
                <SEO
                  title="About"
                  description="Learn about Elite Hostel’s mission, team, and commitment to providing secure, student-friendly accommodation near Koforidua Technical University."
                  path="/about"
                />
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  University Area Location
                </h3>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Located just off the university grounds, our hostel is close to campus, libraries, restaurants, and entertainment. You’re only a short walk away from everything you need.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { icon: FaGraduationCap, text: '10-minute walk to main campus' },
                    { icon: FaBuilding, text: 'Shopping within walking distance' },
                    { icon: FaShieldAlt, text: 'Safe, well-lit neighborhood' },
                    { icon: FaClock, text: '24/7 campus security' },
                    { icon: FaHeart, text: 'Vibrant student community' }
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className="flex items-center space-x-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-3 border border-blue-100"
                    >
                      <item.icon className="text-blue-600" />
                      <span className="text-gray-700">{item.text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-4 shadow-xl border border-white/20">
                <div className="h-96 rounded-xl overflow-hidden">
                  <iframe
                    src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&q=3P6J+V4,Koforidua&zoom=15`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Elite Hostel Location"
                    sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
                  />
                </div>             
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Team Member Modal */}
      <AnimatePresence>
        {selectedTeamMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
            onClick={() => setSelectedTeamMember(null)}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="bg-white/95 backdrop-blur-xl rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center space-x-4">
                    <img
                      src={selectedTeamMember.image}
                      alt={selectedTeamMember.name}
                      className="w-20 h-20 rounded-full object-cover shadow-lg"
                    />
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {selectedTeamMember.name}
                      </h3>
                      <p className="text-blue-600 font-semibold">
                        {selectedTeamMember.position}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    onClick={() => setSelectedTeamMember(null)}
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    className="bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors"
                  >
                    <FaTimes className="text-gray-600" />
                  </motion.button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">About</h4>
                    <p className="text-gray-600 leading-relaxed">{selectedTeamMember.bio}</p>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Specialties</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTeamMember.specialties.map((specialty, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
                    <FaQuoteLeft className="text-2xl text-blue-600 mb-3" />
                    <p className="text-gray-700 italic leading-relaxed">
                      "{selectedTeamMember.quote}"
                    </p>
                  </div>

                  <div className="flex justify-center space-x-4">
                    <motion.a
                      href={`mailto:${selectedTeamMember.email}`}
                      whileHover={{ scale: 1.1 }}
                      className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-colors"
                    >
                      <FaEnvelope />
                    </motion.a>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default About;