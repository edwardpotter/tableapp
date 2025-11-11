import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Get Mapbox token from environment variable
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

function PropertyMap({ latitude, longitude, theme }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!latitude || !longitude) return;

    // Determine map style based on theme
    const mapStyle = theme === 'dark' 
      ? 'mapbox://styles/mapbox/dark-v11' 
      : 'mapbox://styles/mapbox/streets-v12';

    // Initialize map only once
    if (!mapRef.current) {
      mapboxgl.accessToken = MAPBOX_TOKEN;
      
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: mapStyle,
        center: [longitude, latitude],
        zoom: 14,
        attributionControl: false
      });

      // Add navigation controls (zoom buttons)
      mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Add marker
      markerRef.current = new mapboxgl.Marker({ color: '#2563eb' })
        .setLngLat([longitude, latitude])
        .addTo(mapRef.current);
    } else {
      // Update existing map
      mapRef.current.setCenter([longitude, latitude]);
      markerRef.current.setLngLat([longitude, latitude]);
    }

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [latitude, longitude]);

  // Handle theme changes
  useEffect(() => {
    if (mapRef.current) {
      const mapStyle = theme === 'dark' 
        ? 'mapbox://styles/mapbox/dark-v11' 
        : 'mapbox://styles/mapbox/streets-v12';
      mapRef.current.setStyle(mapStyle);
    }
  }, [theme]);

  return (
    <div 
      ref={mapContainerRef} 
      className="w-full h-full rounded-lg overflow-hidden"
      style={{ minHeight: '200px' }}
    />
  );
}

export default PropertyMap;