import { useState, useEffect, useRef } from 'react';
import { Search, X, Building2, MapPin, Tag } from 'lucide-react';
import axios from 'axios';

function PropertyPicker({ onPropertySelect }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubmarket, setSelectedSubmarket] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [submarkets, setSubmarkets] = useState([]);
  const [propertyClasses, setPropertyClasses] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const dropdownRef = useRef(null);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        const [propertiesRes, submarketRes, classesRes] = await Promise.all([
          axios.get('/api/properties'),
          axios.get('/api/properties/submarkets'),
          axios.get('/api/properties/classes')
        ]);
        
        setProperties(propertiesRes.data);
        setFilteredProperties(propertiesRes.data);
        setSubmarkets(submarketRes.data);
        setPropertyClasses(classesRes.data);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Filter properties based on search and filters
  useEffect(() => {
    let filtered = [...properties];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(prop => 
        prop.primary_address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply submarket filter
    if (selectedSubmarket) {
      filtered = filtered.filter(prop => prop.canvas_submarket === selectedSubmarket);
    }

    // Apply class filter
    if (selectedClass) {
      filtered = filtered.filter(prop => prop.property_class === selectedClass);
    }

    setFilteredProperties(filtered);
  }, [searchTerm, selectedSubmarket, selectedClass, properties]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePropertySelect = (property) => {
    setSelectedProperty(property);
    setSearchTerm(property.primary_address || '');
    setShowDropdown(false);
    if (onPropertySelect) {
      onPropertySelect(property);
    }
  };

  const handleClearSelection = () => {
    setSelectedProperty(null);
    setSearchTerm('');
    setSelectedSubmarket('');
    setSelectedClass('');
    if (onPropertySelect) {
      onPropertySelect(null);
    }
  };

  const handleSearchFocus = () => {
    setShowDropdown(true);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
    setSelectedProperty(null);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading properties...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Select a Property</h2>

      {/* Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Submarket Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="w-4 h-4 inline mr-1" />
            Submarket
          </label>
          <select
            value={selectedSubmarket}
            onChange={(e) => setSelectedSubmarket(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Submarkets</option>
            {submarkets.map(submarket => (
              <option key={submarket} value={submarket}>
                {submarket}
              </option>
            ))}
          </select>
        </div>

        {/* Property Class Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Tag className="w-4 h-4 inline mr-1" />
            Property Class
          </label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Classes</option>
            {propertyClasses.map(propClass => (
              <option key={propClass} value={propClass}>
                Class {propClass}
              </option>
            ))}
          </select>
        </div>

        {/* Results Count */}
        <div className="flex items-end">
          <div className="text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-md w-full">
            <span className="font-semibold">{filteredProperties.length}</span> properties available
          </div>
        </div>
      </div>

      {/* Search Box */}
      <div className="relative" ref={dropdownRef}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Search className="w-4 h-4 inline mr-1" />
          Search by Address
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={handleSearchFocus}
            placeholder="Type to search addresses..."
            className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedProperty(null);
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Dropdown */}
        {showDropdown && filteredProperties.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-96 overflow-y-auto">
            {filteredProperties.map(property => (
              <button
                key={property.id}
                onClick={() => handlePropertySelect(property)}
                className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {property.primary_address}
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                      {property.canvas_submarket && (
                        <span className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {property.canvas_submarket}
                        </span>
                      )}
                      {property.property_class && (
                        <span className="flex items-center">
                          <Tag className="w-3 h-3 mr-1" />
                          Class {property.property_class}
                        </span>
                      )}
                    </div>
                  </div>
                  <Building2 className="w-5 h-5 text-gray-400 ml-2 flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        )}

        {showDropdown && filteredProperties.length === 0 && searchTerm && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4 text-center text-gray-600">
            No properties found matching your criteria
          </div>
        )}
      </div>

      {/* Selected Property Display */}
      {selectedProperty && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Selected Property</h3>
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-gray-900">
                  <span className="font-medium">Address:</span> {selectedProperty.primary_address}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Submarket:</span> {selectedProperty.canvas_submarket || 'N/A'}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Property Class:</span> Class {selectedProperty.property_class || 'N/A'}
                </p>
                <p className="text-gray-600 text-xs">
                  <span className="font-medium">Canvas PID:</span> {selectedProperty.canvas_pid}
                </p>
              </div>
            </div>
            <button
              onClick={handleClearSelection}
              className="text-gray-400 hover:text-gray-600 ml-4"
              title="Clear selection"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PropertyPicker;