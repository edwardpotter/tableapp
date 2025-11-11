import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Tag, Building, X, Upload, ArrowDownNarrowWide } from 'lucide-react';
import axios from 'axios';
import PropertyMap from './PropertyMap';

function PropertyPicker({ 
  selectedProperty, 
  onSelectProperty, 
  theme,
  onActivateTable,
  onFlattenTable,
  isActivateDisabled
}) {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubmarket, setSelectedSubmarket] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [submarkets, setSubmarkets] = useState([]);
  const [propertyClasses, setPropertyClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    fetchProperties();
    fetchSubmarkets();
    fetchPropertyClasses();
  }, []);

  useEffect(() => {
    filterProperties();
  }, [properties, searchTerm, selectedSubmarket, selectedClass]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await axios.get('/api/properties');
      setProperties(response.data);
      setFilteredProperties(response.data);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmarkets = async () => {
    try {
      const response = await axios.get('/api/properties/submarkets');
      setSubmarkets(response.data);
    } catch (error) {
      console.error('Error fetching submarkets:', error);
    }
  };

  const fetchPropertyClasses = async () => {
    try {
      const response = await axios.get('/api/properties/classes');
      setPropertyClasses(response.data);
    } catch (error) {
      console.error('Error fetching property classes:', error);
    }
  };

  const filterProperties = () => {
    let filtered = [...properties];

    if (searchTerm) {
      filtered = filtered.filter((property) =>
        property.primary_address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedSubmarket) {
      filtered = filtered.filter((property) => property.canvas_submarket === selectedSubmarket);
    }

    if (selectedClass) {
      filtered = filtered.filter((property) => property.property_class === selectedClass);
    }

    setFilteredProperties(filtered);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowDropdown(true);
  };

  const handlePropertySelect = (property) => {
    onSelectProperty(property);
    setSearchTerm('');
    setShowDropdown(false);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setShowDropdown(false);
    searchInputRef.current?.focus();
  };

  const handleClearSelection = () => {
    onSelectProperty(null);
  };

  const handleSubmarketChange = (e) => {
    setSelectedSubmarket(e.target.value);
  };

  const handleClassChange = (e) => {
    setSelectedClass(e.target.value);
  };

  if (loading) {
    return (
      <div className={`rounded-lg shadow-md p-6 ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <p className={`text-center ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Loading properties...
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg shadow-md p-6 ${
      theme === 'dark' ? 'bg-gray-800' : 'bg-white'
    }`}>
      <h2 className={`text-2xl font-semibold mb-4 ${
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      }`}>
        Select Property
      </h2>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Search Input */}
        <div className="relative" ref={dropdownRef}>
          <div className="relative">
            <Search className={`absolute left-3 top-3 w-5 h-5 ${
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            }`} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by address..."
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={() => setShowDropdown(true)}
              className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              }`}
            />
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className={`absolute right-3 top-3 ${
                  theme === 'dark'
                    ? 'text-gray-400 hover:text-gray-200'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Search Dropdown */}
          {showDropdown && searchTerm && (
            <div className={`absolute z-10 w-full mt-1 border rounded-lg shadow-lg max-h-60 overflow-y-auto ${
              theme === 'dark'
                ? 'bg-gray-700 border-gray-600'
                : 'bg-white border-gray-300'
            }`}>
              {filteredProperties.length > 0 ? (
                filteredProperties.map((property) => (
                  <div
                    key={property.id}
                    onClick={() => handlePropertySelect(property)}
                    className={`px-4 py-2 cursor-pointer border-b last:border-b-0 ${
                      theme === 'dark'
                        ? 'hover:bg-gray-600 border-gray-600'
                        : 'hover:bg-blue-50 border-gray-100'
                    }`}
                  >
                    <div className={`font-medium ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {property.primary_address}
                    </div>
                    <div className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {property.canvas_submarket} â€¢ Class {property.property_class}
                    </div>
                  </div>
                ))
              ) : (
                <div className={`px-4 py-3 text-center ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  No properties found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submarket Filter */}
        <div className="relative">
          <MapPin className={`absolute left-3 top-3 w-5 h-5 ${
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          }`} />
          <select
            value={selectedSubmarket}
            onChange={handleSubmarketChange}
            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none ${
              theme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="">All Submarkets</option>
            {submarkets.map((submarket) => (
              <option key={submarket} value={submarket}>
                {submarket}
              </option>
            ))}
          </select>
        </div>

        {/* Property Class Filter */}
        <div className="relative">
          <Tag className={`absolute left-3 top-3 w-5 h-5 ${
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          }`} />
          <select
            value={selectedClass}
            onChange={handleClassChange}
            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none ${
              theme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="">All Classes</option>
            {propertyClasses.map((propertyClass) => (
              <option key={propertyClass} value={propertyClass}>
                Class {propertyClass}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Counter */}
      <div className="mb-4">
        <p className={`text-sm ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Showing {filteredProperties.length} of {properties.length} properties
        </p>
      </div>

      {/* Selected Property Display with Map */}
      {selectedProperty && (
        <div className={`mt-6 p-4 border rounded-lg ${
          theme === 'dark'
            ? 'bg-blue-900 bg-opacity-30 border-blue-700'
            : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-start justify-between gap-4">
            {/* Property Information */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center mb-2">
                <Building className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0" />
                <h3 className={`text-lg font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Selected Property
                </h3>
              </div>
              <p className={`font-medium mb-1 ${
                theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
              }`}>
                {selectedProperty.primary_address}
              </p>
              <div className={`flex items-center text-sm mb-1 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                {selectedProperty.canvas_submarket}
              </div>
              <div className={`flex items-center text-sm mb-1 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <Tag className="w-4 h-4 mr-1 flex-shrink-0" />
                Class {selectedProperty.property_class}
              </div>
              <p className={`text-xs mt-2 ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
              }`}>
                Property ID: {selectedProperty.canvas_pid}
              </p>
            </div>

            {/* Map Container - Square 1:1 ratio */}
            <div className="flex-shrink-0" style={{ width: '200px', height: '200px' }}>
              <PropertyMap 
                latitude={parseFloat(selectedProperty.latitude)} 
                longitude={parseFloat(selectedProperty.longitude)}
                theme={theme}
              />
            </div>

            {/* Close Button */}
            <button
              onClick={handleClearSelection}
              className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title="Clear selection"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
        <button
          onClick={onActivateTable}
          disabled={isActivateDisabled}
          className={`flex items-center justify-center px-8 py-4 rounded-lg text-white font-semibold text-lg transition-all ${
            isActivateDisabled
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 hover:shadow-lg'
          }`}
        >
          <Upload className="w-6 h-6 mr-2" />
          Activate Table
        </button>

        <button
          onClick={onFlattenTable}
          className="flex items-center justify-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg rounded-lg transition-all hover:shadow-lg"
        >
          <ArrowDownNarrowWide className="w-6 h-6 mr-2" />
          Flatten Table
        </button>
      </div>
    </div>
  );
}

export default PropertyPicker;