import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaUsers, FaBed, FaTrophy, FaHeart, FaStar, FaGraduationCap } from 'react-icons/fa';

const Stats = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  const stats = [
    { 
      number: 500, 
      label: 'Happy Students', 
      suffix: '+',
      icon: FaUsers,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      description: 'Students call us home'
    },
    { 
      number: 150, 
      label: 'Comfortable Rooms', 
      suffix: '+',
      icon: FaBed,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      description: 'Modern & spacious'
    },
    { 
      number: 15, 
      label: 'Years of Excellence', 
      suffix: '+',
      icon: FaTrophy,
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-50',
      description: 'Trusted experience'
    },
    { 
      number: 98, 
      label: 'Satisfaction Rate', 
      suffix: '%',
      icon: FaHeart,
      color: 'from-pink-500 to-red-500',
      bgColor: 'bg-pink-50',
      description: 'Student approved'
    },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const CountUp = ({ end, duration = 2000, suffix = '' }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
      if (!isVisible) return;

      let startTime;
      const animate = (currentTime) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);
        
        // Easing function for smoother animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        setCount(Math.floor(easeOutQuart * end));

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }, [isVisible, end, duration]);

    return (
      <motion.span 
        className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent"
        initial={{ scale: 0.5 }}
        animate={isVisible ? { scale: 1 } : { scale: 0.5 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {count}{suffix}
      </motion.span>
    );
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 50,
      scale: 0.8
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  const floatingVariants = {
    animate: {
      y: [-5, 5, -5],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <section ref={sectionRef} className="relative py-20 overflow-hidden">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0iI2U1ZTdlYiIgZmlsbC1vcGFjaXR5PSIwLjMiPjxwb2x5Z29uIHBvaW50cz0iNTAsMCA2MCw0MCAxMDAsNTAgNjAsNjAgNTAsMTAwIDQwLDYwIDAsNTAgNDAsNDAiLz48L2c+PC9zdmc+')] opacity-20"></div>
      </div>

      {/* Floating decorative elements */}
      <motion.div 
        variants={floatingVariants}
        animate="animate"
        className="absolute top-20 left-10 w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-10 blur-xl"
      />
      <motion.div 
        variants={floatingVariants}
        animate="animate"
        style={{ animationDelay: '2s' }}
        className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-pink-400 to-orange-500 rounded-full opacity-10 blur-xl"
      />
      <motion.div 
        variants={floatingVariants}
        animate="animate"
        style={{ animationDelay: '1s' }}
        className="absolute bottom-20 left-1/3 w-20 h-20 bg-gradient-to-r from-green-400 to-cyan-500 rounded-full opacity-10 blur-xl"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
         
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
              Trusted by
            </span>
            <br />
            <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              KTU Students
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
            Join thousands of students who have made our hostel their home away from home.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ 
                  y: -10,
                  transition: { duration: 0.3 }
                }}
                className="group relative"
              >
                {/* Glass card */}
                <div className="relative bg-white/70 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-500 overflow-hidden">
                  {/* Gradient overlay on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-3xl`} />
                  
                  {/* Content */}
                  <div className="relative z-10 text-center">
                    {/* Icon */}
                    <motion.div
                      whileHover={{ 
                        scale: 1.1,
                        rotate: 5,
                        transition: { duration: 0.3 }
                      }}
                      className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg mb-6 mx-auto`}
                    >
                      <IconComponent className="text-2xl text-white" />
                      
                      {/* Glow effect */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500`} />
                    </motion.div>
                    
                    {/* Number */}
                    <div className="mb-3">
                      <CountUp end={stat.number} suffix={stat.suffix} />
                    </div>
                    
                    {/* Label */}
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-gray-800 transition-colors">
                      {stat.label}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {stat.description}
                    </p>
                  </div>
                  
                  {/* Decorative corner */}
                  <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${stat.color} opacity-5 rounded-bl-3xl`} />
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center mt-16"
        >
          <div className="inline-flex items-center gap-2 text-gray-600">
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Stats;