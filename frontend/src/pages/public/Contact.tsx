// Replace Framer Motion imports with:
import React, { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  FaPhone, FaEnvelope, FaMapMarkerAlt, FaWhatsapp, FaClock, 
  FaFacebook, FaInstagram, FaTwitter, FaCheckCircle, FaExclamationTriangle,
  FaUser, FaTag, FaComment, FaPaperPlane, FaGlobe, FaHeadset,
  FaCalendarAlt, FaShieldAlt, FaStar, FaHeart
} from 'react-icons/fa';
import axios from 'axios';
import api from '../../api/config';
import { publicApi } from '../../api/config';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import SEO from '../../components/SEO';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    inquiryType: 'general'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [_formError, setFormError] = useState('');
  const [_apiLoading, setApiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('contact');
  const [hoveredCard, setHoveredCard] = useState(null);
  
  const formRef = useRef(null);
  const isFormInView = useInView(formRef, { once: true });

  const contactInfo = [
    {
      icon: FaPhone,
      title: 'Phone Support',
      details: '+233 555 000 0000',
      subtitle: 'Available 24/7',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      description: 'Call us anytime for immediate assistance'
    },
    {
      icon: FaEnvelope,
      title: 'Email Support',
      details: 'info@elitehostel.com',
      subtitle: 'Response within 2 hours',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      description: 'Send detailed inquiries via email'
    },
    {
      icon: FaMapMarkerAlt,
      title: 'Visit Us',
      details: 'Rasta Down, University District',
      subtitle: 'Prime location',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      description: 'Located in the heart of campus area'
    },
    {
      icon: FaWhatsapp,
      title: 'WhatsApp',
      details: '+233 550 000 0000',
      subtitle: 'Instant messaging',
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      description: 'Quick support via WhatsApp'
    }
  ];

  const inquiryTypes = [
    { value: 'general', label: 'General Inquiry', icon: FaGlobe },
    { value: 'booking', label: 'Room Booking', icon: FaCalendarAlt },
    { value: 'maintenance', label: 'Maintenance Request', icon: FaShieldAlt },
    { value: 'complaint', label: 'Complaint', icon: FaExclamationTriangle },
    { value: 'suggestion', label: 'Suggestion', icon: FaHeart }
  ];


  const stats = [
    { number: '< 2hrs', label: 'Response Time', icon: FaClock },
    { number: '24/7', label: 'Support Available', icon: FaHeadset },
    { number: '98%', label: 'Satisfaction Rate', icon: FaStar },
    { number: '500+', label: 'Happy Students', icon: FaHeart }
  ];

  const handleInputChange = (e: { target: { name: any; value: any; }; }) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const { error, loading: apiLoading, executeWithErrorHandling } = useErrorHandler();

  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    setLoading(true);
    setFormError('');
    setSuccess(false);
    
    const result = await executeWithErrorHandling(async () => {
      // Use the root (non-tabbed) API for public contact
      const response = await publicApi.post('/public/contact', {
        name: formData.name || '',
        email: formData.email || '',
        phone: formData.phone || '',
        subject: formData.subject || '',
        inquiryType: formData.inquiryType || 'general',
        message: formData.message || ''
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    });
 
    if (result.success) {
      // Show success toast
      toast.success('Message sent successfully!', {
      });
      
      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        inquiryType: 'general'
      });
    } else {
      // Show error toast
      toast.error('Failed to send message. Please try again.', {
      });
    }

    setLoading(false);
  };

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
        <SEO
              title="Contact"
              description="Discover Elite Hostel’s contacts services."
              path="/contact"
            />
      {/* Enhanced Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 opacity-90" />
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20" />
        </div>
        
        <div className="container-custom relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center text-white"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-6"
            >
              <FaEnvelope className="text-3xl" />
            </motion.div>
            
            <h1 className="text-5xl md:text-6xl font-heading font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Get in Touch
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-8">
              We're here to help with any questions about our hostel and services
            </p>
            
            {/* Stats Row */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
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

      {/* Enhanced Contact Information */}
      <section className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="container-custom">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
          >
            {contactInfo.map((info, index) => {
              const IconComponent = info.icon;
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05, y: -10 }}
                  onHoverStart={() => setHoveredCard(index as any)}
                  onHoverEnd={() => setHoveredCard(null)}
                  className="group cursor-pointer"
                >
                  <div className={`relative overflow-hidden rounded-2xl ${info.bgColor} p-6 h-full transition-all duration-500 hover:shadow-2xl border border-white/50 backdrop-blur-sm`}>
                    {/* Animated background gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${info.color} opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />
                    
                    {/* Floating icon background */}
                    <motion.div
                      animate={hoveredCard === index ? { scale: 1.2, rotate: 360 } : { scale: 1, rotate: 0 }}
                      transition={{ duration: 0.6 }}
                      className={`absolute top-4 right-4 w-8 h-8 bg-gradient-to-r ${info.color} rounded-full opacity-20`}
                    />
                    
                    <div className="relative z-10">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className={`w-16 h-16 ${info.bgColor} rounded-2xl flex items-center justify-center mb-4 group-hover:shadow-lg transition-all duration-300 border border-white/50`}
                      >
                        <IconComponent className={`text-2xl ${info.iconColor} group-hover:scale-110 transition-transform duration-300`} />
                      </motion.div>
                      
                      <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">
                        {info.title}
                      </h3>
                      <p className={`${info.iconColor} font-semibold mb-1 group-hover:text-blue-600 transition-colors duration-300`}>
                        {info.details}
                      </p>
                      <p className="text-gray-500 text-sm mb-2">
                        {info.subtitle}
                      </p>
                      <p className="text-gray-600 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {info.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Enhanced Contact Form and Information */}
      <section className="py-20 relative">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Enhanced Contact Form */}
            <motion.div
              ref={formRef}
              initial={{ opacity: 0, x: -50 }}
              animate={isFormInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="lg:col-span-2"
            >
              <div className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-sm p-8 shadow-2xl border border-white/50">
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 opacity-50" />
                
                <div className="relative z-10">
                  <div className="flex items-center mb-8">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4">
                      <FaPaperPlane className="text-white text-xl" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-heading font-bold text-gray-900">
                        Send us a Message
                      </h2>
                      <p className="text-gray-600">We'll get back to you within 2 hours</p>
                    </div>
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isFormInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.1 }}
                      >
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          <FaUser className="inline mr-2 text-blue-500" />
                          Full Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="w-full p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/80 backdrop-blur-sm hover:shadow-md"
                          placeholder="Your full name"
                        />
                      </motion.div>
                      
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isFormInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.2 }}
                      >
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          <FaEnvelope className="inline mr-2 text-blue-500" />
                          Email Address
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="w-full p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/80 backdrop-blur-sm hover:shadow-md"
                          placeholder="your.email@example.com"
                        />
                      </motion.div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isFormInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.3 }}
                      >
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          <FaPhone className="inline mr-2 text-blue-500" />
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/80 backdrop-blur-sm hover:shadow-md"
                          placeholder="0201111111"
                        />
                      </motion.div>
                      
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isFormInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.4 }}
                      >
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Inquiry Type
                        </label>
                        <select
                          name="inquiryType"
                          value={formData.inquiryType}
                          onChange={handleInputChange}
                          required
                          className="w-full p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/80 backdrop-blur-sm hover:shadow-md"
                        >
                          {inquiryTypes.map((type) => {
                            const IconComponent = type.icon;
                            return (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            );
                          })}
                        </select>
                      </motion.div>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={isFormInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ duration: 0.6, delay: 0.5 }}
                    >
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        <FaTag className="inline mr-2 text-blue-500" />
                        Subject
                      </label>
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                        className="w-full p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/80 backdrop-blur-sm hover:shadow-md"
                        placeholder="Brief subject of your message"
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={isFormInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ duration: 0.6, delay: 0.6 }}
                    >
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        <FaComment className="inline mr-2 text-blue-500" />
                        Message
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        rows={6}
                        className="w-full p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/80 backdrop-blur-sm hover:shadow-md resize-none"
                        placeholder="Please provide details about your inquiry..."
                      />
                    </motion.div>
                    
                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={isFormInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ duration: 0.6, delay: 0.7 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 px-8 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                      ) : (
                        <>
                          <FaPaperPlane className="text-lg" />
                          <span className="text-lg">Send Message</span>
                        </>
                      )}
                    </motion.button>
                  </form>
                </div>
              </div>
            </motion.div>

            {/* Enhanced Sidebar Information */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="space-y-6"
            >              
              {/* Enhanced Office Hours */}
              <div className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-sm p-6 shadow-xl border border-white/50">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-50" />
                
                <div className="relative z-10">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4">
                      <FaClock className="text-white text-xl" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Office Hours</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {[
                      { days: 'Monday - Friday', hours: '8:00 AM - 8:00 PM', highlight: false },
                      { days: 'Saturday', hours: '9:00 AM - 6:00 PM', highlight: false },
                      { days: 'Sunday', hours: '10:00 AM - 4:00 PM', highlight: false },
                      { days: 'Emergency Support', hours: '24/7 Available', highlight: true }
                    ].map((schedule, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className={`flex justify-between items-center p-3 rounded-xl ${
                          schedule.highlight 
                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200' 
                            : 'bg-gray-50 hover:bg-gray-100'
                        } transition-colors duration-200`}
                      >
                        <span className={`font-medium ${
                          schedule.highlight ? 'text-green-700' : 'text-gray-700'
                        }`}>
                          {schedule.days}
                        </span>
                        <span className={`font-semibold ${
                          schedule.highlight ? 'text-green-600' : 'text-gray-900'
                        }`}>
                          {schedule.hours}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;