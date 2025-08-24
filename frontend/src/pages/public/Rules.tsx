import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

import { FaClock, FaVolumeDown, FaUtensils, FaShower, FaBan, FaUsers, FaShieldAlt, FaHeart, FaHome } from 'react-icons/fa';
import api from '../../api/config';
import SEO from '../../components/SEO';

const Rules = () => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const defaultMainRules = [
    {
      icon: FaClock,
      title: 'Quiet Hours',
      time: '10:00 PM - 7:00 AM',
      description: 'Please keep noise to a minimum during these hours to respect other guests.',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: FaVolumeDown,
      title: 'Common Areas',
      time: 'Always',
      description: 'Keep common areas clean and tidy. Clean up after yourself in kitchen and lounge areas.',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: FaUtensils,
      title: 'Kitchen Rules',
      time: 'Daily',
      description: 'Label your food, clean dishes immediately after use, and respect shared appliances.',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: FaShower,
      title: 'Bathroom Etiquette',
      time: 'Always',
      description: 'Keep bathrooms clean, limit shower time during peak hours, and clean hair from drains.',
      color: 'from-teal-500 to-teal-600'
    }
  ];

  const defaultAdditionalSections = [
    {
      icon: FaShieldAlt,
      title: 'Security & Safety',
      color: 'from-indigo-500 to-indigo-600',
      rules: [
        'Always lock your room and use provided lockers',
        'Do not share access codes or keys with others',
        'Report suspicious activities immediately to staff',
        'Follow fire safety procedures and know emergency exits'
      ]
    },
    {
      icon: FaBan,
      title: 'Prohibited Items & Activities',
      color: 'from-red-500 to-red-600',
      rules: [
        'No smoking inside the building',
        'No alcohol consumption in common areas',
        'No loud music or parties',
        'No pets allowed',
        'No illegal substances'
      ]
    },
    {
      icon: FaUsers,
      title: 'Guest Policy',
      color: 'from-orange-500 to-orange-600',
      rules: [
        'Guests must be registered at reception',
        'Maximum 2 guests per room at any time',
        'Guests must leave by 11:00 PM on weekdays',
        'Residents are responsible for their guests\' behavior'
      ]
    },
    {
      icon: FaHeart,
      title: 'Community Guidelines',
      color: 'from-pink-500 to-pink-600',
      rules: [
        'Respect cultural and personal differences',
        'Be considerate of others\' study and sleep schedules',
        'Participate in community activities when possible',
        'Help maintain a friendly and inclusive environment'
      ]
    }
  ];

  useEffect(() => {
    fetchRulesContent();
  }, []);

  const fetchRulesContent = async () => {
    try {
      setLoading(true);
      const response = await api.get('/public/content/rules');
      setContent(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching rules content:', error);
      setError('Failed to load rules content');
    } finally {
      setLoading(false);
    }
  };

  // Parse HTML content to rules structure
  const parseHTMLToRules = (htmlContent) => {
    if (!htmlContent) return { mainRules: defaultMainRules, additionalSections: defaultAdditionalSections };
    
    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      
      const mainRules = [];
      const additionalSections = [];
      
      // Parse main rules
      const ruleItems = tempDiv.querySelectorAll('.rule-item');
      const iconMap = {
        'Quiet Hours': { icon: FaClock, color: 'from-purple-500 to-purple-600' },
        'Common Areas': { icon: FaVolumeDown, color: 'from-blue-500 to-blue-600' },
        'Kitchen Rules': { icon: FaUtensils, color: 'from-green-500 to-green-600' },
        'Bathroom Etiquette': { icon: FaShower, color: 'from-teal-500 to-teal-600' }
      };
      
      // If no structured rules found, try to parse h2/h3 headings directly
      if (ruleItems.length === 0) {
        const headings = tempDiv.querySelectorAll('h2, h3');
        headings.forEach((heading, index) => {
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
          
          const title = heading.textContent.replace(/[🕐🔇🍴🚿🚫👥🛡️❤️]/g, '').trim();
          
          // Skip the main title (House Rules)
          if (!title.includes('House Rules') && !title.includes('Rules & Guidelines')) {
            // Check if this looks like a main rule or additional section
            if (index < 4 && content) {
              // Treat as main rule
              const iconInfo = iconMap[title] || { icon: FaHome, color: 'from-gray-500 to-gray-600' };
              mainRules.push({
                icon: iconInfo.icon,
                title: title,
                time: 'Always',
                description: content,
                color: iconInfo.color
              });
            } else if (listItems.length > 0) {
              // Treat as additional section
              const sectionIconMap = {
                'Security & Safety': { icon: FaShieldAlt, color: 'from-indigo-500 to-indigo-600' },
                'Prohibited Items & Activities': { icon: FaBan, color: 'from-red-500 to-red-600' },
                'Guest Policy': { icon: FaUsers, color: 'from-orange-500 to-orange-600' },
                'Community Guidelines': { icon: FaHeart, color: 'from-pink-500 to-pink-600' }
              };
              
              const iconInfo = sectionIconMap[title] || { icon: FaHome, color: 'from-gray-500 to-gray-600' };
              additionalSections.push({
                icon: iconInfo.icon,
                title: title,
                color: iconInfo.color,
                rules: listItems
              });
            }
          }
        });
      } else {
        // Original parsing logic for structured content
        ruleItems.forEach(item => {
          const title = item.querySelector('.rule-title')?.textContent.trim() || '';
          const time = item.querySelector('.rule-time')?.textContent.trim() || '';
          const description = item.querySelector('.rule-description')?.textContent.trim() || '';
          
          const iconInfo = iconMap[title] || { icon: FaHome, color: 'from-gray-500 to-gray-600' };
          
          mainRules.push({
            icon: iconInfo.icon,
            title,
            time,
            description,
            color: iconInfo.color
          });
        });
      }
      
      // Parse additional sections (only if not already parsed from headings)
      if (additionalSections.length === 0) {
        const sectionItems = tempDiv.querySelectorAll('.section-item');
        const sectionIconMap = {
          'Security & Safety': { icon: FaShieldAlt, color: 'from-indigo-500 to-indigo-600' },
          'Prohibited Items & Activities': { icon: FaBan, color: 'from-red-500 to-red-600' },
          'Guest Policy': { icon: FaUsers, color: 'from-orange-500 to-orange-600' },
          'Community Guidelines': { icon: FaHeart, color: 'from-pink-500 to-pink-600' }
        };
        
        sectionItems.forEach(section => {
          const title = section.querySelector('.section-title')?.textContent.trim() || '';
          const rulesList = section.querySelectorAll('.section-rule');
          const rules = Array.from(rulesList).map(rule => rule.textContent.trim());
          
          const iconInfo = sectionIconMap[title] || { icon: FaHome, color: 'from-gray-500 to-gray-600' };
          
          additionalSections.push({
            icon: iconInfo.icon,
            title,
            color: iconInfo.color,
            rules
          });
        });
      }
      
      return {
        mainRules: mainRules.length > 0 ? mainRules : defaultMainRules,
        additionalSections: additionalSections.length > 0 ? additionalSections : defaultAdditionalSections
      };
    } catch (parseError) {
      console.error('Error parsing rules content:', parseError);
      return { mainRules: defaultMainRules, additionalSections: defaultAdditionalSections };
    }
  };

  // Get rules data from content or use defaults
  const getRulesData = () => {
    if (content && content.content) {
      return parseHTMLToRules(content.content);
    }
    return { mainRules: defaultMainRules, additionalSections: defaultAdditionalSections };
  };

  const { mainRules, additionalSections } = getRulesData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <SEO
        title="Hostel Rules and Policies"
        description="Read the hostel rules and policies designed to ensure a safe, respectful, and productive living environment for all residents."
        path="/rules"
      />
      {/* Header */}
      <div className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              House Rules & Guidelines
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Creating a comfortable and respectful living environment for everyone
            </p>
            {error && (
              <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
                {error} - Showing default content
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Main Rules */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Essential Rules
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {mainRules.map((rule, index) => {
              const IconComponent = rule.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                >
                  <div className={`h-2 bg-gradient-to-r ${rule.color}`}></div>
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className={`p-3 rounded-lg bg-gradient-to-r ${rule.color} text-white mr-4`}>
                        <IconComponent className="text-xl" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{rule.title}</h3>
                        <p className="text-sm text-gray-500">{rule.time}</p>
                      </div>
                    </div>
                    <p className="text-gray-600 leading-relaxed">{rule.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Additional Sections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Detailed Guidelines
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {additionalSections.map((section, index) => {
              const IconComponent = section.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                >
                  <div className={`h-3 bg-gradient-to-r ${section.color}`}></div>
                  <div className="p-6">
                    <div className="flex items-center mb-6">
                      <div className={`p-3 rounded-lg bg-gradient-to-r ${section.color} text-white mr-4`}>
                        <IconComponent className="text-xl" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">{section.title}</h3>
                    </div>
                    <ul className="space-y-3">
                      {section.rules.map((rule, ruleIndex) => (
                        <li key={ruleIndex} className="flex items-start">
                          <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <span className="text-gray-600 leading-relaxed">{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Footer Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-center mb-4">
              <FaHeart className="text-red-500 text-2xl mr-2" />
              <h3 className="text-2xl font-semibold text-gray-900">Thank You!</h3>
            </div>
            <p className="text-gray-600 text-lg leading-relaxed max-w-2xl mx-auto">
              By following these guidelines, you help create a welcoming and comfortable environment 
              for all residents. If you have any questions or concerns, please don't hesitate to 
              contact our staff.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Rules;