import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/layout/Navbar';
import Footer from './components/public/Footer';
import ScrollToTop from './components/public/ScrollToTop';
import ScrollToTopOnRouteChange from './components/public/ScrollToTopOnRouteChange';
import Home from './pages/public/Home';
import Rooms from './pages/public/Rooms';
import About from './pages/public/About';
import Services from './pages/public/Services';
import Contact from './pages/public/Contact';
import Terms from './pages/public/Terms';
import Privacy from './pages/public/Privacy';
import Rules from './pages/public/Rules';
import FAQ from './pages/public/FAQ';
import './App.css';

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <div className="min-h-screen flex flex-col">
        <ScrollToTopOnRouteChange />
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/rules" element={<Rules />} />
            <Route path="/faq" element={<FAQ />} />
          </Routes>
        </main>
        <Footer />
        <ScrollToTop />
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;
