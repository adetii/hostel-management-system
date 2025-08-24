import SEO from '../../components/SEO';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaFileContract, FaShieldAlt, FaCreditCard, FaUserCheck, FaExclamationTriangle, FaPhone } from 'react-icons/fa';
import api from '../../api/config';

const Terms = () => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Default sections as fallback
  const defaultSections = [
    {
      icon: FaUserCheck,
      title: 'Acceptance of Terms',
      content: 'By accessing and using our hostel services, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these terms, please do not use our services.'
    },
    {
      icon: FaFileContract,
      title: 'Booking & Reservations',
      content: 'All bookings are subject to availability and confirmation. A valid form of identification is required at check-in.',
      list: [
        'Advance payment may be required for certain bookings',
        'Cancellation policies apply as per booking terms',
        'Check-in time: 2:00 PM, Check-out time: 11:00 AM',
        'Minimum age requirement: 18 years old'
      ]
    }
  ];

  useEffect(() => {
    fetchTermsContent();
  }, []);

  const fetchTermsContent = async () => {
    try {
      setLoading(true);
              const response = await api.get('/public/content/terms');
      setContent(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching terms content:', error);
      setError('Failed to load terms content');
    } finally {
      setLoading(false);
    }
  };

  // Parse HTML content to sections structure
  const parseHTMLToSections = (htmlContent) => {
    if (!htmlContent) return defaultSections;
    
    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      
      const sections = [];
      // Try to find sections with .terms-section class first
      let sectionElements = tempDiv.querySelectorAll('.terms-section');
      
      // If no .terms-section found, try to parse h2/h3 elements directly
      if (sectionElements.length === 0) {
        const headings = tempDiv.querySelectorAll('h2, h3');
        headings.forEach((heading, index) => {
          let content = '';
          let listItems = [];
          let nextElement = heading.nextElementSibling;
          
          // Collect content until next heading
          while (nextElement && !nextElement.matches('h2, h3')) {
            if (nextElement.tagName === 'P') {
              content = nextElement.textContent.trim(); // Extract text content only
            } else if (nextElement.tagName === 'UL') {
              listItems = Array.from(nextElement.querySelectorAll('li')).map(li => li.textContent.trim());
            }
            nextElement = nextElement.nextElementSibling;
          }
          
          const title = heading.textContent.replace(/[✅📋🛡️💳⚠️]/g, '').trim();
          const iconMap = {
            'Acceptance of Terms': FaUserCheck,
            'Booking & Reservations': FaFileContract,
            'Guest Responsibilities': FaShieldAlt,
            'Payment Terms': FaCreditCard,
            'Liability & Damages': FaExclamationTriangle
          };
          
          // Skip the main title (Terms & Conditionsssss)
          if (!title.includes('Terms & Conditions')) {
            const section = {
              icon: iconMap[title] || FaFileContract,
              title: title,
              content: content || 'Content not available'
            };
            
            if (listItems.length > 0) {
              section.list = listItems;
            }
            
            sections.push(section);
          }
        });
      } else {
        // Original parsing logic for .terms-section
        const iconMap = {
          'Acceptance of Terms': FaUserCheck,
          'Booking & Reservations': FaFileContract,
          'Guest Responsibilities': FaShieldAlt,
          'Payment Terms': FaCreditCard,
          'Liability & Damages': FaExclamationTriangle
        };
        
        sectionElements.forEach(sectionEl => {
          const titleEl = sectionEl.querySelector('h3');
          const contentEl = sectionEl.querySelector('p');
          const listEl = sectionEl.querySelector('ul');
          
          if (titleEl && contentEl) {
            const title = titleEl.textContent.replace(/[✅📋🛡️💳⚠️]/g, '').trim();
            const section = {
              icon: iconMap[title] || FaFileContract,
              title: title,
              content: contentEl.textContent.trim()
            };
            
            if (listEl) {
              const listItems = Array.from(listEl.querySelectorAll('li')).map(li => li.textContent.trim());
              if (listItems.length > 0) {
                section.list = listItems;
              }
            }
            
            sections.push(section);
          }
        });
      }
      
      return sections.length > 0 ? sections : defaultSections;
    } catch (error) {
      console.error('Error parsing terms content:', error);
      return defaultSections;
    }
  };

  const sections = content ? parseHTMLToSections(content.content) : defaultSections;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <SEO
        title="Terms and Conditions"
        description="Review the terms and conditions for booking, payments, responsibilities, and policies at Elite Hostel."
        path="/terms"
      />
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-48 translate-x-48"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-32 -translate-x-32"></div>
        
        <div className="relative container-custom text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-6">
              <FaFileContract className="text-3xl" />
            </div>
            <h1 className="text-5xl md:text-6xl font-heading font-bold mb-6 leading-tight">
              {content?.title || 'Terms & Conditions'}
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 max-w-3xl mx-auto leading-relaxed">
              Please read these terms and conditions carefully before using our services
            </p>
            
            {error && (
              <div className="mt-6 bg-red-500/20 border border-red-500/30 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-red-100">{error}</p>
                <button 
                  onClick={fetchTermsContent}
                  className="mt-2 text-sm underline hover:no-underline"
                >
                  Try again
                </button>
              </div>
            )}
            
            <div className="mt-8 text-sm text-primary-200">
              Last updated: {content?.updatedAt ? new Date(content.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content Sections */}
      <section className="py-20">
        <div className="container-custom max-w-6xl">
          <div className="grid gap-8">
            {sections.map((section, index) => {
              const IconComponent = section.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <div className="p-8 md:p-10">
                    <div className="flex items-start gap-6">
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                          <IconComponent className="text-2xl text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                          {section.title}
                        </h2>
                        <p className="text-lg text-gray-700 leading-relaxed mb-6">
                          {section.content}
                        </p>
                        {section.list && (
                          <div className="bg-gray-50 rounded-xl p-6">
                            <ul className="space-y-3">
                              {section.list.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-3">
                                  <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                                  <span className="text-gray-700 leading-relaxed">{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Terms;