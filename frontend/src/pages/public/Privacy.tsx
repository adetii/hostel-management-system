import SEO from '../../components/SEO';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaShieldAlt, FaDatabase, FaUserShield, FaShare, FaLock, FaUserCog, FaEnvelope } from 'react-icons/fa';
import api from '../../api/config';

const Privacy = () => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Default sections as fallback
  const defaultSections = [
    {
      icon: FaDatabase,
      title: 'Information We Collect',
      content: 'We collect information you provide directly to us to ensure the best possible service experience.',
      list: [
        'Personal details when making reservations',
        'Account information for our website',
        'Communication records for customer support',
        'Newsletter subscription preferences',
        'Payment information (securely processed)'
      ]
    }
  ];

  useEffect(() => {
    fetchPrivacyContent();
  }, []);

  const fetchPrivacyContent = async () => {
    try {
      setLoading(true);
            const response = await api.get('/public/content/privacy');
      setContent(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching privacy content:', error);
      setError('Failed to load privacy content');
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
      let sectionElements = tempDiv.querySelectorAll('.privacy-section');
      
      const iconMap = {
        'Information We Collect': FaDatabase,
        'How We Use Your Information': FaUserShield,
        'Information Sharing': FaShare,
        'Data Security': FaLock,
        'Your Rights': FaUserCog
      };
      
      // If no .privacy-section found, try to parse h2/h3 elements directly
      if (sectionElements.length === 0) {
        const headings = tempDiv.querySelectorAll('h2, h3');
        headings.forEach((heading) => {
          let content = '';
          let listItems = [];
          let nextElement = heading.nextElementSibling;
          
          // Collect content until next heading
          while (nextElement && !nextElement.matches('h2, h3')) {
            if (nextElement.tagName === 'P') {
              content = nextElement.textContent.trim();
            } else if (nextElement.tagName === 'UL') {
              listItems = Array.from(nextElement.querySelectorAll('li')).map(li => li.textContent.trim());
            }
            nextElement = nextElement.nextElementSibling;
          }
          
          const title = heading.textContent.replace(/[🗄️🛡️🤝🔒⚙️]/g, '').trim();
          
          // Skip the main title
          if (!title.includes('Privacy Policy')) {
            const section = {
              icon: iconMap[title] || FaDatabase,
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
        // Original parsing logic for .privacy-section
        sectionElements.forEach(sectionEl => {
          const titleEl = sectionEl.querySelector('h3');
          const contentEl = sectionEl.querySelector('p');
          const listEl = sectionEl.querySelector('ul');
          
          if (titleEl && contentEl) {
            const title = titleEl.textContent.replace(/[🗄️🛡️🤝🔒⚙️]/g, '').trim();
            const section = {
              icon: iconMap[title] || FaDatabase,
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
      console.error('Error parsing privacy content:', error);
      return defaultSections;
    }
  };

  const sections = content ? parseHTMLToSections(content.content) : defaultSections;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <SEO
        title="Privacy Policy"
        description="Understand how Elite Hostel collects, uses, and protects your personal data in compliance with privacy regulations."
        path="/privacy"
      />
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full -translate-y-48 -translate-x-48"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/5 rounded-full translate-y-32 translate-x-32"></div>
        
        <div className="relative container-custom text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-6">
              <FaShieldAlt className="text-3xl" />
            </div>
            <h1 className="text-5xl md:text-6xl font-heading font-bold mb-6 leading-tight">
              {content?.title || 'Privacy Policy'}
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Your privacy is important to us. Learn how we collect, use, and protect your information.
            </p>
            
            {error && (
              <div className="mt-6 bg-red-500/20 border border-red-500/30 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-red-100">{error}</p>
                <button 
                  onClick={fetchPrivacyContent}
                  className="mt-2 text-sm underline hover:no-underline"
                >
                  Try again
                </button>
              </div>
            )}
            
            <div className="mt-8 text-sm text-blue-200">
              Effective date: {content?.updatedAt ? new Date(content.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
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
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
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
                        <div className="bg-blue-50 rounded-xl p-6">
                          <ul className="space-y-3">
                            {section.list?.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-3">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                <span className="text-gray-700 leading-relaxed">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
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

export default Privacy;