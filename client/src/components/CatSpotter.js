// CatSpotter.js
import React, { useState, useEffect } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || 'pk.eyJ1IjoiY29kZWxpZiIsImEiOiJjbTU0MXhjYzUwZG9lMm1yM3d3cHlhdDd0In0.bMk6QA-PoSH9spl-qxGM_w';

// Campus bounding box corners [lng, lat]
const campusBounds = [
  [77.37131841222863, 28.629504764974202], // SW
  [77.37376408745079, 28.630534307585875], // NE
];

export default function CatSpotter() {
  const { handleAuthError, isAuthError } = useAuth();

  // State: sightings array, loading, error
  const [sightings, setSightings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // For controlling the top header's look (optional)
  const [isCompact, setIsCompact] = useState(false);

  // Map viewState (center near campus, with a default zoom that’s not too large)
  const [viewState, setViewState] = useState({
    longitude: 77.3725,
    latitude: 28.6300,
    zoom: 18,
  });

  // Panning/zoom bounding
  const handleViewStateChange = (evt) => {
    const vs = { ...evt.viewState };
    // campus bounds
    const [minLng, minLat] = campusBounds[0];
    const [maxLng, maxLat] = campusBounds[1];

    // 1) Clamp zoom
    if (vs.zoom < 18) vs.zoom = 18;  // don't let them zoom out below ~15
    if (vs.zoom > 20) vs.zoom = 20;  // or in too close beyond ~20

    // 2) Clamp longitude
    if (vs.longitude < minLng) vs.longitude = minLng;
    if (vs.longitude > maxLng) vs.longitude = maxLng;
    // 3) Clamp latitude
    if (vs.latitude < minLat) vs.latitude = minLat;
    if (vs.latitude > maxLat) vs.latitude = maxLat;

    setViewState(vs);
  };

  // For popups
  const [selectedSighting, setSelectedSighting] = useState(null);
  const [newMarker, setNewMarker] = useState(null);

  // For new sighting form
  const [catName, setCatName] = useState('');
  const [description, setDescription] = useState('');

  // ----------------------------------------
  // 1) Fetch all sightings on mount
  // ----------------------------------------
  useEffect(() => {
    fetchSightings();
    // Example: track scrolling to shrink/grow the title bar
    const handleScroll = () => {
      setIsCompact(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
    // eslint-disable-next-line
  }, []);

  const fetchSightings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/cats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errData = await response.json();
        if (isAuthError(errData)) {
          handleAuthError();
          return;
        }
        throw new Error(errData.message || 'Failed to fetch cat sightings');
      }
      const data = await response.json();
      setSightings(data.sightings || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ----------------------------------------
  // 2) Handle map clicks: set up new marker
  // ----------------------------------------
  const handleMapClick = (event) => {
    const { lng, lat } = event.lngLat;
    setSelectedSighting(null); // close any existing popup
    setNewMarker({ longitude: lng, latitude: lat });
    // reset form
    setCatName('');
    setDescription('');
  };

  // ----------------------------------------
  // 3) Submit new sighting
  // ----------------------------------------
  const handleCreateSighting = async (e) => {
    e.preventDefault();
    if (!catName.trim() || !newMarker) {
      setError('Please enter a cat name and click on the map location.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/cats`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          catName,
          description,
          location: {
            coordinates: [newMarker.longitude, newMarker.latitude],
          },
        }),
      });
      if (!response.ok) {
        const errData = await response.json();
        if (isAuthError(errData)) {
          handleAuthError();
          return;
        }
        throw new Error(errData.message || 'Failed to create cat sighting');
      }
      // Refresh sightings, close new marker popup
      await fetchSightings();
      setNewMarker(null);
      setCatName('');
      setDescription('');
    } catch (err) {
      setError(err.message);
    }
  };

  // ----------------------------------------
  // 4) Render
  // ----------------------------------------
  // We replicate the typical page layout you have: a fixed header, then the main content.
  // The map is full-height behind/under the header (like LostAndFound).
  // The side menu is presumably in your Layout, so we just handle the top bar + map.
  // If you want a different style for the top bar, adjust classes accordingly.
  const headerClasses = `
    fixed top-0 left-0 right-0 z-20
    transition-all duration-300 ease-out
    border-b border-white/5 backdrop-blur-sm
    ${isCompact ? 'py-4 bg-[#0B0F1A]/60 border-opacity-100' : 'py-8 bg-transparent border-opacity-0'}
  `;
  const titleClasses = `
    font-bold text-center gradient-text
    transition-all duration-300 ease-out
    ${isCompact ? 'text-2xl' : 'text-3xl'}
  `;

  return (
    <div className="relative min-h-screen">
      {/* Title bar */}
      <div className={headerClasses}>
        <h2 className={titleClasses}>Cat Spotter</h2>
      </div>

      {/* Error or loading indicators (overlaying the map) */}
      {error && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white py-2 px-4 rounded-md">
          {error}
        </div>
      )}
      {isLoading && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900/80 text-gray-200 px-3 py-1.5 rounded-lg">
          Loading...
        </div>
      )}

      {/* The map is placed below the header. Make sure to add top padding so it doesn't hide behind the bar. */}
      <div className={`${isCompact ? 'pt-20' : 'pt-28'} w-full h-full relative`}>
        <Map
          {...viewState}
          onMove={handleViewStateChange}
          onClick={handleMapClick}
          style={{ width: '100%', height: 'calc(100vh - 7rem)' }}
          mapStyle="mapbox://styles/codelif/cm56ogt9600fx01sffjwe0p0n/draft"
          mapboxAccessToken={MAPBOX_TOKEN}
          // Additional safety if you want:
          minZoom={18}
          maxZoom={20}
        >
          {/* Navigation controls (zoom in/out, compass) */}
          <NavigationControl position="top-left" />

          {/* Existing sightings */}
          {sightings.map((s) => (
            <Marker
              key={s._id}
              longitude={s.location.coordinates[0]}
              latitude={s.location.coordinates[1]}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation(); // don't also trigger map click
                setSelectedSighting(s);
                setNewMarker(null);
              }}
            >
              <img
                src="https://img.icons8.com/emoji/48/cat-face.png"
                alt="Cat Marker"
                style={{ width: 24, height: 24, cursor: 'pointer' }}
              />
            </Marker>
          ))}

          {/* Popup: existing sighting */}
          {selectedSighting && (
            <Popup
              longitude={selectedSighting.location.coordinates[0]}
              latitude={selectedSighting.location.coordinates[1]}
              closeOnClick={true}
              onClose={() => setSelectedSighting(null)}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold">{selectedSighting.catName}</h3>
                <button
                  onClick={() => setSelectedSighting(null)}
                  className="text-gray-400 hover:text-white ml-2"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              {selectedSighting.description && (
                <p className="text-sm mb-2">{selectedSighting.description}</p>
              )}
              <p className="text-xs text-gray-400">
                Reported by: {selectedSighting?.reportedBy?.name || 'Unknown'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(selectedSighting.createdAt).toLocaleString()}
              </p>
            </Popup>
          )}

          {/* Popup: new marker form */}
          {newMarker && (
            <Popup
              longitude={newMarker.longitude}
              latitude={newMarker.latitude}
              closeOnClick={false}
              onClose={() => setNewMarker(null)}
              className=""
            >
              <form onSubmit={handleCreateSighting} className="space-y-3">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Cat Name
                    </label>
                    <button
                      onClick={() => setNewMarker(null)}
                      className="text-gray-400 hover:text-white ml-2"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    className="input-field w-full"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="e.g. Ginger"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    className="input-field w-full min-h-[60px]"
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Orange cat near hostel"
                  />
                </div>
                <button
                  type="submit"
                  className="btn-primary w-full"
                >
                  Submit
                </button>
              </form>
            </Popup>
          )}
        </Map>
      </div>
    </div>
  );
}
