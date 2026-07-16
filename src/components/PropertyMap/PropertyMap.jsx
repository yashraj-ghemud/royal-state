import { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './PropertyMap.css';

// ============================================
// PROPERTY MAP COMPONENT
// Real Interactive Map with Leaflet.js
// Dark theme matching Royal Stay design
// ============================================

// Fix Leaflet default icon issue with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icon for properties
const createCustomIcon = (isSelected = false, price = 0) => {
  const color = isSelected ? '#D4AF37' : '#667eea';
  const size = isSelected ? [40, 50] : [32, 40];
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="marker-pin ${isSelected ? 'selected' : ''}" style="--marker-color: ${color};">
        <svg width="${size[0]}" height="${size[1]}" viewBox="0 0 40 52" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 0C8.95 0 0 8.95 0 20C0 35 20 52 20 52C20 52 40 35 40 20C40 8.95 31.05 0 20 0Z" fill="${color}" stroke="white" stroke-width="2"/>
          ${isSelected ? `<text x="20" y="25" text-anchor="middle" fill="white" font-size="10" font-weight="bold">₹${(price/1000).toFixed(0)}K</text>` : `<circle cx="20" cy="18" r="7" fill="white"/>`}
        </svg>
        <div class="marker-pulse"></div>
      </div>
    `,
    iconSize: size,
    iconAnchor: [size[0] / 2, size[1]],
    popupAnchor: [0, -size[1]],
  });
};

// Maharashtra coordinates (center of state)
const MAHARASHTRA_CENTER = [19.7515, 79.6270];
const DEFAULT_ZOOM = 7;

// District coordinates for geocoding (approximate centers)
const DISTRICT_COORDS = {
  'Mumbai City': [18.9387, 72.8353],
  'Mumbai Suburban': [19.1732, 72.8551],
  'Pune': [18.5204, 73.8567],
  'Nagpur': [21.1458, 78.9925],
  'Thane': [19.2183, 72.9781],
  'Nashik': [19.9975, 73.7898],
  'Aurangabad': [19.8762, 75.3433],
  'Solapur': [17.6599, 75.9064],
  'Amravati': [20.9297, 77.7770],
  'Kolhapur': [16.7050, 74.2433],
  'Sangli': [16.8522, 74.5852],
  'Jalgaon': [21.0031, 75.5691],
  'Satara': [17.6868, 74.0079],
  'Parbhani': [19.2700, 76.7811],
  'Latur': [18.4087, 76.5604],
  'Dhule': [20.8866, 74.7757],
  'Ahmednagar': [19.0948, 74.7380],
  'Chandrapur': [19.9612, 79.2961],
  'Jalna': [19.8504, 75.8842],
  'Akola': [20.7008, 77.0082],
  'Osmanabad': [18.0583, 76.0436],
  'Nanded': [19.1383, 77.3219],
  'Ratnagiri': [16.9891, 73.2944],
  'Gondia': [21.4543, 80.1797],
  'Beed': [19.9286, 75.7767],
  'Hingoli': [19.7306, 77.1487],
  'Wardha': [20.7454, 78.6022],
  'Washim': [20.6587, 77.1287],
  'Yavatmal': [20.3934, 78.1264],
  'Buldhana': [20.5298, 76.1808],
  'Bhandara': [21.1667, 79.6500],
  'Nandurbar': [21.3707, 74.3058],
  'Gadchiroli': [19.5000, 80.2000],
  'Sindhudurg': [15.8697, 73.9670],
  'Raigad': [18.5157, 73.1723],
  'Palghar': [19.6926, 72.7654],
};

const PropertyMap = ({ 
  rooms = [], 
  selectedRoom, 
  onSelectRoom,
  className = '',
  filteredRooms = []
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const [selectedMarkerId, setSelectedMarkerId] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Use filtered rooms if provided, otherwise use all rooms
  const roomsToShow = useMemo(() => {
    const roomList = filteredRooms.length > 0 ? filteredRooms : rooms;
    
    return roomList.map(room => ({
      ...room,
      // Get coordinates from room data or fallback to district center
      coords: room.coordinates || 
               DISTRICT_COORDS[room.district] || 
               [
                 MAHARASHTRA_CENTER[0] + (Math.random() - 0.5) * 3, 
                 MAHARASHTRA_CENTER[1] + (Math.random() - 0.5) * 3
               ]
    }));
  }, [rooms, filteredRooms]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Create map instance
    const map = L.map(mapRef.current, {
      center: MAHARASHTRA_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      touchZoom: true,
    });

    // Add dark tile layer (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // Create markers layer group
    markersLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    setMapLoaded(true);

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when rooms change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !mapLoaded) return;

    // Clear existing markers
    markersLayerRef.current.clearLayers();

    // Add markers for each room
    roomsToShow.forEach((room) => {
      const isSelected = selectedRoom?.id === room.id || selectedMarkerId === room.id;
      
      const marker = L.marker(room.coords, {
        icon: createCustomIcon(isSelected, room.price),
        title: room.title,
      });

      // Create popup content
      const popupContent = `
        <div class="map-popup">
          <div class="popup-image">
            <img src="${room.imageURL || 'https://placehold.co/200x120/1a1a2e/D4AF37?text=No+Image'}" alt="${room.title || 'Property'}" />
            <span class="popup-type">${room.roomType || 'Property'}</span>
            ${room.isVerified ? '<span class="popup-verified-badge">✓ Verified</span>' : ''}
          </div>
          <div class="popup-content">
            <h4 class="popup-title">${room.title || 'Untitled Property'}</h4>
            <p class="popup-location">📍 ${room.location || ''}${room.district ? ', ' + room.district : ''}</p>
            <p class="popup-price">₹${(room.price || 0).toLocaleString()}<span>/month</span></p>
          </div>
          <button class="popup-btn" data-room-id="${room.id}">
            View Details →
          </button>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 280,
        minWidth: 240,
        className: 'custom-popup',
        closeButton: true,
      });

      // Handle popup open
      marker.on('popupopen', () => {
        setSelectedMarkerId(room.id);
        
        // Attach click handler to button inside popup
        setTimeout(() => {
          const btn = document.querySelector(`.popup-btn[data-room-id="${room.id}"]`);
          if (btn) {
            btn.onclick = () => {
              if (onSelectRoom) onSelectRoom(room);
              marker.closePopup();
            };
          }
        }, 100);
      });

      // Handle marker click
      marker.on('click', () => {
        setSelectedMarkerId(room.id);
      });

      markersLayerRef.current.addLayer(marker);
    });

    // Fit bounds to show all markers if we have rooms
    if (roomsToShow.length > 0) {
      try {
        const bounds = L.latLngBounds(roomsToShow.map(r => r.coords));
        if (bounds.isValid()) {
          mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
        }
      } catch (e) {
        console.warn('Could not fit map bounds:', e);
      }
    } else {
      // Reset to Maharashtra center if no rooms
      mapInstanceRef.current.setView(MAHARASHTRA_CENTER, DEFAULT_ZOOM);
    }
  }, [roomsToShow, mapLoaded, selectedRoom, onSelectRoom, selectedMarkerId]);

  // Pan to selected room when it changes externally
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedRoom) return;
    
    const roomCoords = selectedRoom.coordinates || 
                       DISTRICT_COORDS[selectedRoom.district] || 
                       MAHARASHTRA_CENTER;
    
    mapInstanceRef.current.flyTo(roomCoords, 14, {
      duration: 1.5,
      easeLinearity: 0.25,
    });
  }, [selectedRoom]);

  // Control handlers
  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(MAHARASHTRA_CENTER, DEFAULT_ZOOM);
    }
  };

  const handleFitAll = () => {
    if (mapInstanceRef.current && roomsToShow.length > 0) {
      try {
        const bounds = L.latLngBounds(roomsToShow.map(r => r.coords));
        if (bounds.isValid()) {
          mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
        }
      } catch (e) {
        console.warn('Could not fit bounds:', e);
      }
    }
  };

  return (
    <div className={`property-map-wrapper ${className}`}>
      {/* Map Header */}
      <div className="map-header">
        <div className="map-info">
          <span className="map-count">
            🗺️ Showing <strong>{roomsToShow.length}</strong> properties on map
          </span>
        </div>
        <div className="map-controls">
          <button 
            className="map-control-btn"
            onClick={handleResetView}
            title="Reset View to Maharashtra"
          >
            🔄 Reset
          </button>
          <button 
            className="map-control-btn"
            onClick={handleFitAll}
            title="Fit all properties on screen"
          >
            🎯 Fit All
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div 
        ref={mapRef} 
        className={`property-map ${mapLoaded ? 'loaded' : 'loading'}`}
      >
        {!mapLoaded && (
          <div className="map-loading">
            <div className="map-loading-spinner"></div>
            <p>Loading interactive map...</p>
          </div>
        )}
      </div>

      {/* Map Legend */}
      <div className="map-legend">
        <div className="legend-item">
          <span className="legend-marker active"></span>
          <span>Selected</span>
        </div>
        <div className="legend-item">
          <span className="legend-marker normal"></span>
          <span>Available</span>
        </div>
      </div>

      {/* Map Tips */}
      <div className="map-tips">
        <span>💡 Click markers for details • Scroll to zoom • Drag to pan</span>
      </div>
    </div>
  );
};

export default PropertyMap;
