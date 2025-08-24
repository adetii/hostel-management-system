import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaBars, FaTimes, FaPhone, FaEnvelope, FaUser, FaUserPlus } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Set scrolled state for background change
      setIsScrolled(currentScrollY > 50);
      
      // Handle navbar visibility based on scroll direction
      if (currentScrollY < 10) {
        // Always show navbar at the top
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down - hide navbar
        setIsVisible(false);
        setIsOpen(false); // Close mobile menu when hiding
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up - show navbar
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Rooms', path: '/rooms' },
    { name: 'About', path: '/about' },
    { name: 'Services', path: '/services' },
    { name: 'Contact', path: '/contact' },
  ];

  const VITE_MANAGEMENT_SYSTEM_URL = import.meta.env.VITE_MANAGEMENT_SYSTEM_URL;

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ 
        y: isVisible ? 0 : -100,
        opacity: isVisible ? 1 : 0
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'nav-glass shadow-xl border-b border-white/10' 
          : 'bg-white/70 backdrop-blur-lg border-b border-white/20'
      }`}
    >
      {/* Main navigation */}
      <div className="container-limited">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link 
              to="/" 
              className="text-2xl font-bold text-gradient hover:scale-105 transition-transform duration-200"
            >
              Elite Hostel
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link, index) => (
              <motion.div
                key={link.name}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={link.path}
                  className={`nav-link ${
                    location.pathname === link.path
                      ? 'active text-primary-600'
                      : 'text-gray-700'
                  }`}
                >
                  {link.name}
                </Link>
              </motion.div>
            ))}
            
            {/* Auth buttons */}
            <motion.div 
              className="flex items-center space-x-3 ml-6 pl-6 border-l border-gray-200"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <motion.a
                href={`${VITE_MANAGEMENT_SYSTEM_URL}/login`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost flex items-center space-x-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaUser className="w-4 h-4" />
                <span>Login</span>
              </motion.a>
              <motion.a
                href={`${VITE_MANAGEMENT_SYSTEM_URL}/register`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary flex items-center space-x-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaUserPlus className="w-4 h-4" />
                <span>Register</span>
              </motion.a>
            </motion.div>
          </div>

          {/* Mobile menu button */}
          <motion.button
            className="lg:hidden p-2 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-gray-700 hover:text-primary-600 hover:bg-white/30 transition-all duration-200"
            onClick={() => setIsOpen(!isOpen)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FaTimes size={20} />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FaBars size={20} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="lg:hidden bg-white/95 backdrop-blur-md border-t border-white/20 shadow-lg"
          >
            <div className="container-limited py-6">
              <div className="flex flex-col space-y-1">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      to={link.path}
                      className={`block px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                        location.pathname === link.path
                          ? 'bg-primary-50 text-primary-600 shadow-sm'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600'
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      {link.name}
                    </Link>
                  </motion.div>
                ))}
                
                {/* Mobile auth buttons */}
                <motion.div 
                  className="flex flex-col space-y-3 pt-6 mt-6 border-t border-gray-200"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <motion.a
                    href={`${VITE_MANAGEMENT_SYSTEM_URL}/login`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline flex items-center justify-center space-x-2"
                    onClick={() => setIsOpen(false)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FaUser className="w-4 h-4" />
                    <span>Login</span>
                  </motion.a>
                  <motion.a
                     href={`${VITE_MANAGEMENT_SYSTEM_URL}/register`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary flex items-center justify-center space-x-2"
                    onClick={() => setIsOpen(false)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FaUserPlus className="w-4 h-4" />
                    <span>Register Now</span>
                  </motion.a>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;