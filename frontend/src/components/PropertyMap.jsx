import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// You'll need to set your Mapbox access token
const MAPBOX_TOKEN = 'pk.eyJ1IjoiamVlcHR4IiwiYSI6ImNtaG1sa21yOTJiZXQyanB5dWhwdzR3ZG8ifQ.IYOf3_tj6wlNDP1Q4WVJJQ';

function PropertyMap({ latitude, longitude }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!latitude || !longitude) return;

    // Initialize map only once
    if (!mapRef.current) {
      mapboxgl.accessToken = MAPBOX_TOKEN;
      
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
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

  return (
    <div 
      ref={mapContainerRef} 
      className="w-full h-full rounded-lg overflow-hidden"
      style={{ minHeight: '200px' }}
    />
  );
}

export default PropertyMap;