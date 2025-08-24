import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaFacebook, 
  FaTwitter, 
  FaInstagram, 
  FaLinkedin, 
  FaPhone, 
  FaEnvelope, 
  FaMapMarkerAlt,
  FaArrowUp,
  FaHeart,
  FaShieldAlt,
  FaClock,
  FaWifi
} from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'Quick Links',
      links: [
        { name: 'Home', href: '/' },
        { name: 'Rooms & Facilities', href: '/rooms' },
        { name: 'About Us', href: '/about' },
        { name: 'Services', href: '/services' },
        { name: 'Contact', href: '/contact' }
      ]
    },
    {
      title: 'Services',
      links: [
        { name: 'Student Accommodation', href: '/services#accommodation' },
        { name: 'Study Areas', href: '/services#study' },
        { name: 'Security Services', href: '/services#security' },
        { name: 'Housekeeping', href: '/services#housekeeping' },
      ]
    },
    {
      title: 'Policies',
      links: [
        { name: 'Terms & Conditions', href: '/terms' },
        { name: 'Privacy Policy', href: '/privacy' },
        { name: 'House Rules', href: '/rules' },
        { name: 'FAQ', href: '/faq' }
      ]
    }
  ];

  const socialLinks = [
    { 
      icon: FaFacebook, 
      href: '#', 
      color: 'hover:text-blue-500',
      bgColor: 'hover:bg-blue-500/10',
      name: 'Facebook'
    },
    { 
      icon: FaTwitter, 
      href: '#', 
      color: 'hover:text-blue-400',
      bgColor: 'hover:bg-blue-400/10',
      name: 'Twitter'
    },
    { 
      icon: FaInstagram, 
      href: '#', 
      color: 'hover:text-pink-500',
      bgColor: 'hover:bg-pink-500/10',
      name: 'Instagram'
    }
  ];

  return (
    <footer className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, 0]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 right-20 w-32 h-32 bg-primary-500/5 rounded-full backdrop-blur-sm"
        />
        <motion.div
          animate={{
            y: [0, 15, 0],
            rotate: [0, -3, 0]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute bottom-32 left-20 w-24 h-24 bg-secondary-500/5 rounded-full backdrop-blur-sm"
        />
      </div>

      {/* Main Footer Content */}
      <div className="relative container-limited section-padding">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-2 space-y-6"
          >
            <div>
              <h3 className="text-3xl font-bold text-gradient bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent mb-4">
                Elite Hostel
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Your home away from home. We provide comfortable, safe, and affordable accommodation for students with modern amenities and a vibrant community atmosphere.
              </p>
            </div>
            
            {/* Contact Info */}
            <div className="space-y-4">
              <h4 className="font-semibold text-white mb-3">Contact Information</h4>
              <div className="space-y-3">
                <motion.div 
                  whileHover={{ x: 5 }}
                  className="flex items-center text-gray-300 group cursor-pointer"
                >
                  <div className="w-10 h-10 bg-primary-500/10 rounded-lg flex items-center justify-center mr-3 group-hover:bg-primary-500/20 transition-colors">
                    <FaMapMarkerAlt className="text-primary-400" />
                  </div>
                  <span className="text-sm group-hover:text-white transition-colors">Rasta Down, University District</span>
                </motion.div>
                <motion.a
                  href="tel:+233555000000"
                  whileHover={{ x: 5 }}
                  className="flex items-center text-gray-300 group cursor-pointer"
                >
                  <div className="w-10 h-10 bg-primary-500/10 rounded-lg flex items-center justify-center mr-3 group-hover:bg-primary-500/20 transition-colors">
                    <FaPhone className="text-primary-400" />
                  </div>
                  <span className="text-sm group-hover:text-white transition-colors">+233 555 000 0000</span>
                </motion.a>
                <motion.a
                  href="mailto:info@elitehostel.com"
                  whileHover={{ x: 5 }}
                  className="flex items-center text-gray-300 group cursor-pointer"
                >
                  <div className="w-10 h-10 bg-primary-500/10 rounded-lg flex items-center justify-center mr-3 group-hover:bg-primary-500/20 transition-colors">
                    <FaEnvelope className="text-primary-400" />
                  </div>
                  <span className="text-sm group-hover:text-white transition-colors">info@elitehostel.com</span>
                </motion.a>
              </div>
            </div>            
          </motion.div>

          {/* Footer Sections */}
          {footerSections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className="space-y-4"
            >
              <h4 className="text-lg font-semibold text-white relative">
                {section.title}
                <div className="absolute -bottom-2 left-0 w-8 h-0.5 bg-gradient-to-r from-primary-400 to-secondary-400 rounded-full" />
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      onClick={() => {
                        // Scroll to top when link is clicked
                        setTimeout(() => {
                          window.scrollTo({
                            top: 0,
                            left: 0,
                            behavior: 'smooth'
                          });
                        }, 100);
                      }}
                      className="text-gray-300 hover:text-primary-400 transition-all duration-200 text-sm flex items-center group"
                    >
                      <span className="w-0 group-hover:w-2 h-0.5 bg-primary-400 mr-0 group-hover:mr-2 transition-all duration-200 rounded-full" />
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="relative border-t border-gray-700/50 bg-gray-900/50">
        <div className="container-limited py-8">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 text-center lg:text-left"
            >
              <p className="text-gray-400 text-sm">
                © {currentYear} Elite Hostel. All rights reserved.
              </p>
            </motion.div>
            
            {/* Social Links */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex items-center space-x-4"
            >
              <span className="text-gray-400 text-sm hidden sm:block">Follow us:</span>
              <div className="flex space-x-3">
                {socialLinks.map((social, index) => {
                  const IconComponent = social.icon;
                  return (
                    <motion.a
                      key={index}
                      href={social.href}
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className={`w-10 h-10 bg-gray-800/50 rounded-lg flex items-center justify-center text-gray-400 ${social.color} ${social.bgColor} transition-all duration-200 border border-gray-700/50 hover:border-gray-600`}
                      title={social.name}
                    >
                      <IconComponent className="w-4 h-4" />
                    </motion.a>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;