import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaPlay, FaArrowRight, FaMapMarkerAlt, FaStar, FaUsers } from 'react-icons/fa';

const Hero = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState({});
  const [isPlaying] = useState(true);
  const heroRef = useRef(null);
  
  const heroImages = [
    {
      url: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80",
      alt: "University Hostel Exterior",
      title: "Modern Living Spaces",
      subtitle: "Designed for Student Success"
    },
    {
      url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80",
      alt: "Modern Student Room",
      title: "Comfortable Rooms",
      subtitle: "Your Home Away From Home"
    },
    {
      url: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80",
      alt: "Student Common Area",
      title: "Community Spaces",
      subtitle: "Connect & Study Together"
    },
    {
      url: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80",
      alt: "Study Environment",
      title: "Study-Focused Environment",
      subtitle: "Academic Excellence Guaranteed"
    }
  ];

  // Preload images
  useEffect(() => {
    heroImages.forEach((image, index) => {
      const img = new Image();
      img.onload = () => {
        setImagesLoaded(prev => ({ ...prev, [index]: true }));
      };
      img.src = image.url;
    });
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === heroImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [heroImages.length, isPlaying]);

  const currentImage = heroImages[currentImageIndex];

  // Build responsive URLs from Unsplash by replacing the width/quality query
  const buildSrc = (url, w, q = 70) =>
    url
      .replace(/([?&])w=\d+/i, `$1w=${w}`)
      .replace(/([?&])q=\d+/i, `$1q=${q}`);

  const src640 = buildSrc(currentImage.url, 640);
  const src1280 = buildSrc(currentImage.url, 1280);
  const src1920 = buildSrc(currentImage.url, 1920);

  return (
    <section ref={heroRef} className="relative h-screen flex items-center overflow-hidden bg-gray-900">
      {/* Background Images with CSS Animation */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0">
          {imagesLoaded[currentImageIndex] && (
            <img
              key={currentImageIndex}
              src={src1280}
              srcSet={`${src640} 640w, ${src1280} 1280w, ${src1920} 1920w`}
              sizes="(max-width: 640px) 640px, (max-width: 1280px) 1280px, 1920px"
              alt={currentImage.alt}
              width="1920"
              height="1080"
              className="w-full h-full object-cover animate-hero-zoom"
              loading="eager"
              fetchpriority="high"
              decoding="async"
            />
          )}
        </div>
        
        {/* Enhanced Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30 z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10"></div>
      </div>

      {/* CSS Floating Elements */}
      <div className="absolute inset-0 z-15 pointer-events-none">
        <div className="absolute top-20 right-20 w-16 h-16 bg-primary-500/15 rounded-full backdrop-blur-sm border border-white/10 animate-float-slow" />
        <div className="absolute bottom-32 right-32 w-12 h-12 bg-secondary-500/15 rounded-full backdrop-blur-sm border border-white/10 animate-float-delayed" />
      </div>

      {/* Main Content */}
      <div className="relative z-20 text-white container-limited w-full animate-fade-in-up">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8 animate-slide-in-left">
            {/* Dynamic Title */}
            <div className="space-y-4">
              <h1 className="text-responsive-xl font-heading font-bold leading-tight animate-fade-in-scale">
                <span className="text-white">Your Perfect</span>
                <br />
                <span className="text-gradient bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
                  {currentImage.title}
                </span>
              </h1>
              
              <p className="text-responsive-md text-gray-200 font-medium animate-fade-in-up-delayed">
                {currentImage.subtitle}
              </p>
            </div>
            
            {/* Marquee Text */}
            <div className="text-lg text-gray-300 leading-relaxed max-w-lg overflow-hidden">
              <div className="relative">
                <div className="whitespace-nowrap animate-marquee">
                  Experience premium student accommodation with modern amenities, 24/7 security, and a vibrant community atmosphere.
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up-delayed">
              <Link to="/rooms">
                <button className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center space-x-2 transition-all duration-300 shadow-lg hover:shadow-xl text-sm hover:scale-105">
                  <span>Explore Rooms</span>
                  <FaArrowRight className="w-3 h-3" />
                </button>
              </Link>
            </div>
          </div>

          {/* Right Content */}
          <div className="hidden lg:block space-y-6 animate-slide-in-right">
            {/* Content can be added here if needed */}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 right-8 text-white z-20 hidden md:block animate-fade-in-delayed">
        <div className="flex flex-col items-center space-y-2">
          <span className="text-sm text-gray-300">Scroll to explore</span>
          <div className="w-5 h-8 border-2 border-white/40 rounded-full flex justify-center backdrop-blur-sm">
            <div className="w-1 h-2 bg-white rounded-full mt-1 animate-scroll-indicator" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;