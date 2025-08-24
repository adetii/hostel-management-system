import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronDown, FaChevronUp, FaQuestionCircle, FaSearch, FaBookOpen, FaCog, FaHeadset } from 'react-icons/fa';
import api from '../../api/config';
import SEO from '../../components/SEO';

function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Default FAQ data as fallback
  const defaultFaqs = [
    {
      category: 'Booking & Reservations',
      icon: FaBookOpen,
      color: 'from-blue-500 to-blue-600',
      questions: [
        {
          question: 'How do I make a reservation?',
          answer: 'You can make a reservation through our website, by calling us directly, or visiting our reception. Online bookings are available 24/7 and offer instant confirmation with secure payment processing.'
        },
        {
          question: 'What is your cancellation policy?',
          answer: 'Free cancellation up to 24 hours before check-in. Cancellations within 24 hours may incur a one-night charge. No-shows will be charged the full amount. Refunds are processed within 5-7 business days.'
        }
      ]
    }
  ];

  useEffect(() => {
    fetchFAQContent();
  }, []);

  const fetchFAQContent = async () => {
    try {
      setLoading(true);
      const response = await api.get('/public/content/faq');
      setContent(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching FAQ content:', error);
      setError('Failed to load FAQ content');
    } finally {
      setLoading(false);
    }
  };

  // Parse HTML content to FAQ structure
  // Parse HTML content to FAQ structure
  const parseHTMLToFAQ = (htmlContent) => {
    if (!htmlContent) return defaultFaqs;
    
    try {
      // Create a temporary div to parse HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      
      const categories = [];
      let categoryElements = tempDiv.querySelectorAll('.faq-category');
      
      // If no .faq-category found, try to parse h2/h3 elements directly
      if (categoryElements.length === 0) {
        const headings = tempDiv.querySelectorAll('h2, h3');
        headings.forEach((heading, index) => {
          const category = {
            category: heading.textContent.replace(/[📚🏠🛡️]/g, '').trim(),
            icon: index === 0 ? FaBookOpen : index === 1 ? FaCog : FaHeadset,
            color: index === 0 ? 'from-blue-500 to-blue-600' : index === 1 ? 'from-green-500 to-green-600' : 'from-purple-500 to-purple-600',
            questions: []
          };
          
          // Look for questions after this heading
          let nextElement = heading.nextElementSibling;
          while (nextElement && !nextElement.matches('h2, h3')) {
            if (nextElement.tagName === 'H4') {
              const questionTitle = nextElement.textContent.trim();
              const answerElement = nextElement.nextElementSibling;
              if (answerElement && answerElement.tagName === 'P') {
                category.questions.push({
                  question: questionTitle,
                  answer: answerElement.textContent.trim()
                });
              }
            }
            nextElement = nextElement.nextElementSibling;
          }
          
          if (category.questions.length > 0) {
            categories.push(category);
          }
        });
      } else {
        // Original parsing logic for .faq-category
        categoryElements.forEach((categoryEl, index) => {
          const titleEl = categoryEl.querySelector('h3');
          const questionElements = categoryEl.querySelectorAll('.faq-item');
          
          if (titleEl && questionElements.length > 0) {
            const category = {
              category: titleEl.textContent.replace(/[📚🏠🛡️]/g, '').trim(),
              icon: index === 0 ? FaBookOpen : index === 1 ? FaCog : FaHeadset,
              color: index === 0 ? 'from-blue-500 to-blue-600' : index === 1 ? 'from-green-500 to-green-600' : 'from-purple-500 to-purple-600',
              questions: []
            };
            
            questionElements.forEach(questionEl => {
              const questionTitle = questionEl.querySelector('h4');
              const questionAnswer = questionEl.querySelector('p');
              
              if (questionTitle && questionAnswer) {
                category.questions.push({
                  question: questionTitle.textContent.trim(),
                  answer: questionAnswer.textContent.trim()
                });
              }
            });
            
            if (category.questions.length > 0) {
              categories.push(category);
            }
          }
        });
      }
      
      return categories.length > 0 ? categories : defaultFaqs;
    } catch (error) {
      console.error('Error parsing FAQ content:', error);
      return defaultFaqs;
    }
  };

  const faqs = content ? parseHTMLToFAQ(content.content) : defaultFaqs;

  const filteredFAQs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(
      faq => 
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  const toggleFAQ = (categoryIndex, questionIndex) => {
    const index = `${categoryIndex}-${questionIndex}`;
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 text-white py-24 overflow-hidden">
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
              <FaQuestionCircle className="text-3xl" />
            </div>
            <h1 className="text-5xl md:text-6xl font-heading font-bold mb-6 leading-tight">
              {content?.title || 'Frequently Asked Questions'}
            </h1>
            <p className="text-xl md:text-2xl text-indigo-100 max-w-3xl mx-auto leading-relaxed">
              Find answers to common questions about our hostel services and facilities
            </p>
            
            {error && (
              <div className="mt-6 bg-red-500/20 border border-red-500/30 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-red-100">{error}</p>
                <button 
                  onClick={fetchFAQContent}
                  className="mt-2 text-sm underline hover:no-underline"
                >
                  Try again
                </button>
              </div>
            )}
             <SEO
                  title="FAQ"
                  description="Learn about Elite Hostel’s frequently asked questions and answers."
                  path="/faq"
                />
            {/* Search Bar */}
            <div className="relative max-w-md mx-auto mt-8">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search FAQs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-20">
        <div className="container-custom max-w-6xl">
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600">No FAQs found matching your search.</p>
            </div>
          ) : (
            filteredFAQs.map((category, categoryIndex) => {
              const IconComponent = category.icon;
              return (
                <motion.div
                  key={categoryIndex}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
                  viewport={{ once: true }}
                  className="mb-12"
                >
                  <div className="flex items-center gap-4 mb-8">
                    <div className={`w-12 h-12 bg-gradient-to-br ${category.color} rounded-xl flex items-center justify-center`}>
                      <IconComponent className="text-xl text-white" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                      {category.category}
                    </h2>
                  </div>
                  
                  <div className="space-y-4">
                    {category.questions.map((faq, questionIndex) => {
                      const isOpen = openIndex === `${categoryIndex}-${questionIndex}`;
                      return (
                        <motion.div
                          key={questionIndex}
                          className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
                        >
                          <button
                            onClick={() => toggleFAQ(categoryIndex, questionIndex)}
                            className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
                          >
                            <span className="font-semibold text-gray-900 pr-4">
                              {faq.question}
                            </span>
                            <div className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                              <FaChevronDown className="text-gray-500" />
                            </div>
                          </button>
                          
                          <AnimatePresence>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                              >
                                <div className="px-6 pb-4 text-gray-700 leading-relaxed border-t border-gray-100">
                                  <div className="pt-4">
                                    {faq.answer}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-700">
        <div className="container-custom text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-white"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Still have questions?</h2>
            <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
              Can't find the answer you're looking for? Our friendly team is here to help you 24/7.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/contact" className="btn-secondary bg-white text-indigo-600 hover:bg-gray-100">
                Contact Support
              </a>
              <a href="tel:+15551234567" className="btn-outline border-white text-white hover:bg-white hover:text-indigo-600">
                Call Us Now
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default FAQ;