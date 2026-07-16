import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './CompareModal.css';

// ============================================
// COMPARE MODAL COMPONENT
// Side-by-side property comparison
// ============================================

const CompareModal = ({ 
  compareList = [], 
  onClose, 
  onRemoveFromCompare,
  onSelectRoom 
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (compareList.length === 0) return null;

  // Get all unique features from all properties
  const getAllFeatures = () => {
    const featuresSet = new Set();
    compareList.forEach(room => {
      if (room.amenities && Array.isArray(room.amenities)) {
        room.amenities.forEach(f => featuresSet.add(f));
      }
    });
    return ['Type', 'Price', 'Location', 'District', 'Verified', ...Array.from(featuresSet)];
  };

  const features = getAllFeatures();

  // Get feature value for a room
  const getFeatureValue = (room, feature) => {
    switch(feature) {
      case 'Type':
        return room.roomType || 'N/A';
      case 'Price':
        return `₹${(room.price || 0).toLocaleString()}/mo`;
      case 'Location':
        return room.location || 'N/A';
      case 'District':
        return room.district || 'N/A';
      case 'Verified':
        return room.isVerified ? '✅ Yes' : '❌ No';
      default:
        if (room.amenities && Array.isArray(room.amenities)) {
          return room.amenities.includes(feature) ? '✅' : '❌';
        }
        return 'N/A';
    }
  };

  // Check if value is "better" for highlighting
  const isBetterValue = (room, feature, index) => {
    if (feature === 'Price') {
      const prices = compareList.map(r => r.price || 0);
      const minPrice = Math.min(...prices);
      return (room.price || 0) === minPrice;
    }
    if (feature === 'Verified') {
      return room.isVerified === true;
    }
    return false;
  };

  // Animation variants
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 50 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 25 }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95, 
      y: 30,
      transition: { duration: 0.2 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, delay: 0.1 }
    }
  };

  return (
    <motion.div
      className="compare-modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="compare-modal-container"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="compare-modal-header">
          <div className="header-left">
            <h2>⚖️ Compare Properties</h2>
            <span className="compare-count">{compareList.length} properties selected</span>
          </div>
          
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="compare-tabs">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Overview
          </button>
          <button 
            className={`tab-btn ${activeTab === 'features' ? 'active' : ''}`}
            onClick={() => setActiveTab('features')}
          >
            🏷️ Features
          </button>
          <button 
            className={`tab-btn ${activeTab === 'contact' ? 'active' : ''}`}
            onClick={() => setActiveTab('contact')}
          >
            📞 Contact All
          </button>
        </div>

        {/* Content Area */}
        <div className="compare-content">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                className="overview-tab"
                variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0 }}
              >
                <div className="compare-cards-grid">
                  {compareList.map((room, index) => (
                    <motion.div
                      key={room.id}
                      className="compare-property-card"
                      variants={cardVariants}
                    >
                      {/* Card Image */}
                      <div className="card-image">
                        <img 
                          src={room.imageURL || 'https://placehold.co/400x250/1a1a2e/D4AF37?text=No+Image'} 
                          alt={room.title}
                        />
                        <div className="card-remove" onClick={() => onRemoveFromCompare(room)}>
                          ✕ Remove
                        </div>
                        <span className="card-type-badge">{room.roomType}</span>
                        {room.isVerified && (
                          <span className="card-verified-badge">✓ Verified</span>
                        )}
                      </div>

                      {/* Card Info */}
                      <div className="card-info">
                        <h3 className="card-title">{room.title}</h3>
                        <p className="card-location">📍 {room.location}{room.district ? `, ${room.district}` : ''}</p>
                        
                        <div className="card-price">
                          ₹{room.price?.toLocaleString()}
                          <span>/month</span>
                        </div>

                        {/* Quick Stats */}
                        <div className="card-stats">
                          <div className="stat">
                            <span className="stat-value">❤️</span>
                            <span className="stat-label">{room.likes || 0}</span>
                          </div>
                          <div className="stat">
                            <span className="stat-value">👁️</span>
                            <span className="stat-label">{Math.floor(Math.random() * 500) + 100}</span>
                          </div>
                          <div className="stat">
                            <span className="stat-value">⭐</span>
                            <span className="stat-label">{(4 + Math.random()).toFixed(1)}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="card-actions">
                          <button 
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              onSelectRoom(room);
                              onClose();
                            }}
                          >
                            View Details →
                          </button>
                          <a 
                            href={`tel:${room.phone}`}
                            className="btn btn-outline btn-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            📞 Call
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Add More Slot */}
                {compareList.length < 3 && (
                  <div className="add-more-slot" onClick={onClose}>
                    <span className="add-icon">+</span>
                    <span>Add another property to compare</span>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'features' && (
              <motion.div
                key="features"
                className="features-tab"
                variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0 }}
              >
                <div className="features-table-wrapper">
                  <table className="features-comparison-table">
                    <thead>
                      <tr>
                        <th className="feature-label-header">Feature</th>
                        {compareList.map((room) => (
                          <th key={room.id} className="property-header">
                            <div className="header-property-name">
                              {room.title.length > 20 ? room.title.substring(0, 20) + '...' : room.title}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {features.map((feature, idx) => (
                        <tr key={feature} className={idx % 2 === 0 ? 'even' : 'odd'}>
                          <td className="feature-label">
                            {feature === 'Price' && '💰 '}
                            {feature === 'Location' && '📍 '}
                            {feature === 'Type' && '🏠 '}
                            {feature === 'Verified' && '✅ '}
                            {feature}
                          </td>
                          {compareList.map((room, index) => {
                            const value = getFeatureValue(room, feature);
                            const isBetter = isBetterValue(room, feature, index);
                            
                            return (
                              <td 
                                key={`${room.id}-${feature}`} 
                                className={`feature-value ${isBetter ? 'best' : ''}`}
                              >
                                {value}
                                {isBetter && <span className="best-indicator">★ Best</span>}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'contact' && (
              <motion.div
                key="contact"
                className="contact-tab"
                variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0 }}
              >
                <div className="contact-all-container">
                  <div className="contact-info">
                    <h3>Contact All Property Owners</h3>
                    <p>You can contact all {compareList.length} property owners at once or individually.</p>
                  </div>

                  <div className="contact-cards-list">
                    {compareList.map((room) => (
                      <div key={room.id} className="contact-card-item">
                        <div className="contact-property-info">
                          <img 
                            src={room.imageURL || 'https://placehold.co/80x60/1a1a2e/D4AF37?text=Img'} 
                            alt={room.title}
                            className="contact-thumb"
                          />
                          <div className="contact-details">
                            <h4>{room.title}</h4>
                            <p>{room.location}{room.district ? `, ${room.district}` : ''}</p>
                            <span className="contact-price">₹{room.price?.toLocaleString()}/mo</span>
                          </div>
                        </div>
                        
                        <div className="contact-buttons">
                          <a href={`tel:${room.phone}`} className="btn btn-primary btn-sm">
                            📞 Call
                          </a>
                          <a 
                            href={`https://wa.me/91${room.phone}?text=Hi, I'm interested in your property: ${room.title}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-whatsapp btn-sm"
                          >
                            💬 WhatsApp
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bulk Action */}
                  <div className="bulk-contact-action">
                    <p>Or send inquiry to all at once:</p>
                    <button className="btn btn-primary btn-lg bulk-inquiry-btn">
                      📧 Send Inquiry to All ({compareList.length})
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="compare-modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>
            Close Comparison
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CompareModal;
