import { useState, useEffect } from 'react';
import PropertyPicker from './PropertyPicker';
import axios from 'axios';
import { Upload, ArrowDownNarrowWide, Globe } from 'lucide-react';

function HomePage({ theme }) {
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [lastActivatedProperty, setLastActivatedProperty] = useState(null);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [countdownConfig, setCountdownConfig] = useState({ seconds: 120 });
  const [operationType, setOperationType] = useState(null); // 'activate' or 'flatten'
  const [countdownError, setCountdownError] = useState(null);
  
  // HTML Content section state
  const [showHtmlPanel, setShowHtmlPanel] = useState(false);
  const [htmlUrl, setHtmlUrl] = useState('https://picsum.photos/1920');
  const [showMarketCanvas2, setShowMarketCanvas2] = useState(false);

  useEffect(() => {
    // Fetch countdown configuration and HTML panel setting
    const fetchConfig = async () => {
      try {
        const response = await axios.get('/api/config');
        setCountdownConfig({ seconds: response.data.countdownSeconds });
        setShowHtmlPanel(response.data.showHtmlPanel || false);
        setShowMarketCanvas2(response.data.showMarketCanvas2 || false);
      } catch (error) {
        console.error('Error fetching config:', error);
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    let timer;
    if (showCountdown && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (showCountdown && countdown === 0) {
      handleCountdownComplete();
    }
    return () => clearTimeout(timer);
  }, [showCountdown, countdown]);

  const logUsage = async (eventType, property = null, metadata = {}) => {
    try {
      await axios.post('/api/usage/log', {
        event_type: eventType,
        canvas_pid: property?.canvas_pid || null,
        primary_address: property?.primary_address || null,
        canvas_submarket: property?.canvas_submarket || null,
        property_class: property?.property_class || null,
        metadata: metadata
      });
    } catch (error) {
      console.error('Error logging usage:', error);
      // Don't throw - logging failures shouldn't break the main flow
    }
  };

  const handleActivateTable = async () => {
    if (!selectedProperty) return;

    setOperationType('activate');
    setCountdownError(null);
    setShowCountdown(true);
    setCountdown(countdownConfig.seconds);

    try {
      // Prepare the PUT request with the canvas_pid
      const canvasPid = selectedProperty.canvas_pid;
      const latitude = selectedProperty.latitude || 38.905172;
      const longitude = selectedProperty.longitude || -77.0046697;
      
      const requestBody = {
        objectPath: "/Game/CBRE_MC/PinTable/PinTable_Cesium_Mockup.PinTable_Cesium_Mockup:PersistentLevel.BP_CameraRig_C_UAID_047C16D0FB2829DF01_1089232868",
        functionName: "RemoteWebCommand",
        parameters: {
          JSONParams: JSON.stringify({
            uecmd: "ShowUnrealPreset",
            parameters: {
              routeURL: `https://marketcanvas.cbre.com/v1/properties/${canvasPid}/overview/map`,
              presetName: "properties_overview_map",
              queries: {
                boundsSQL: "",
                propertiesSQL: `SELECT PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.canvas_pid, PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.canvas_primary_address, PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.geom, PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.floor, PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.floor_height, PROD_CANVAS_DB.DATA.CANVAS_PROPERTIES.stories, PROD_CANVAS_DB.DATA.CANVAS_PROPERTIES.latitude, PROD_CANVAS_DB.DATA.CANVAS_PROPERTIES.longitude, PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.ed_max_height, PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.total_avail_floorspace, PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.block_contiguous_size, PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.floors, PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.spacetypename, PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.occupancy, PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.rentlow_s, PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.renthigh_s, PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.rent_type, PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.leasing_company, PROD_CANVAS_DB.DATA.CANVAS_PROPERTIES.property_type FROM PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK LEFT JOIN PROD_CANVAS_DB.DATA.CANVAS_PROPERTIES ON (PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.canvas_pid = PROD_CANVAS_DB.DATA.CANVAS_PROPERTIES.canvas_pid) WHERE (1 = 1) AND (PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.canvas_pid = '${canvasPid}') ORDER BY PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.floor DESC`,
                pointsSQL: "",
                focusPropertySQL: "",
                floorsSQL: ""
              },
              pageContent: {
                left: `https://marketcanvas.cbre.com/embeddable-widget/properties/${canvasPid}/overview/map?tvmode=on`,
                right: `https://marketcanvas.cbre.com/embeddable-widget/properties/${canvasPid}/overview/photos?tvmode=on`
              },
              view: "3d",
              NPRMode: false,
              viewState: {
                latitude: latitude,
                longitude: longitude,
                zoom: 15,
                pitch: 0,
                bearing: 0,
                minZoom: 0,
                maxZoom: 15
              }
            }
          })
        }
      };

      console.log('Sending activation request for property:', canvasPid, 'at location:', latitude, longitude);
      
      // Make the PUT request to Unreal Engine
      const response = await axios.put(
        'https://experience-center-room-dc-srv1.cbre.com/remote/object/call',
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Activation response:', response.data);

      // If Market Canvas 2.0 is enabled, trigger the presentation
      if (showMarketCanvas2) {
        console.log('Market Canvas 2.0 is enabled, triggering presentation...');
        try {
          const mc2Response = await axios.post('/api/marketcanvas2/present', {
            propertyId: canvasPid
          });
          console.log('Market Canvas 2.0 presentation response:', mc2Response.data);
        } catch (mc2Error) {
          console.error('Error triggering Market Canvas 2.0 presentation:', mc2Error);
          // Don't fail the main activation if MC2 fails
        }
      }

      // Log successful activation
      await logUsage('table_activate', selectedProperty, {
        preset: 'properties_overview_map',
        marketCanvas2Enabled: showMarketCanvas2
      });

      // Mark as last activated property
      setLastActivatedProperty(selectedProperty);
    } catch (error) {
      console.error('Error activating table:', error);
      setCountdownError(error.response?.data?.message || error.message || 'Failed to activate table');
      
      // Show error in countdown modal for 5 seconds
      setCountdown(5);
    }
  };

  const handleFlattenTable = async () => {
    setOperationType('flatten');
    setCountdownError(null);
    setShowCountdown(true);
    setCountdown(countdownConfig.seconds);

    try {
      const requestBody = {
        objectPath: "/Game/CBRE_MC/PinTable/PinTable_Cesium_Mockup.PinTable_Cesium_Mockup:PersistentLevel.BP_CameraRig_C_UAID_047C16D0FB2829DF01_1089232868",
        functionName: "RemoteWebCommand",
        parameters: {
          JSONParams: JSON.stringify({
            uecmd: "ShowUnrealPreset",
            parameters: {
              presetName: "intro",
              view: "2d"
            }
          })
        }
      };

      console.log('Sending flatten request');

      // Make the PUT request
      const response = await axios.put(
        'https://experience-center-room-dc-srv1.cbre.com/remote/object/call',
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Flatten response:', response.data);

      // No logging for flatten (as per requirements)
    } catch (error) {
      console.error('Error flattening table:', error);
      setCountdownError(error.message || 'Failed to flatten table');
      
      // Show error in countdown modal for 5 seconds
      setCountdown(5);
    }
  };

  const handleDisplayHtmlPage = async () => {
    if (!htmlUrl) {
      alert('Please enter a URL');
      return;
    }

    setOperationType('html');
    setCountdownError(null);
    setShowCountdown(true);
    setCountdown(countdownConfig.seconds);

    try {
      const requestBody = {
        objectPath: "/Game/CBRE_MC/PinTable/PinTable_Cesium_Mockup.PinTable_Cesium_Mockup:PersistentLevel.BP_CameraRig_C_UAID_047C16D0FB2829DF01_1089232868",
        functionName: "RemoteWebCommand",
        parameters: {
          JSONParams: JSON.stringify({
            uecmd: "ShowUnrealPreset",
            parameters: {
              routeURL: "",
              presetName: "media",
              queries: {
                boundsSQL: "",
                propertiesSQL: "",
                pointsSQL: "",
                focusPropertySQL: "",
                floorsSQL: ""
              },
              pageContent: {
                middle: htmlUrl
              },
              view: "2d",
              NPRMode: false
            }
          })
        }
      };

      console.log('Sending display HTML page request for URL:', htmlUrl);

      // Make the PUT request
      const response = await axios.put(
        'https://experience-center-room-dc-srv1.cbre.com/remote/object/call',
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Display HTML page response:', response.data);

      // No logging for HTML display (similar to flatten)
    } catch (error) {
      console.error('Error displaying HTML page:', error);
      setCountdownError(error.message || 'Failed to display HTML page');
      
      // Show error in countdown modal for 5 seconds
      setCountdown(5);
    }
  };

  const handleCountdownComplete = () => {
    setShowCountdown(false);
    setCountdown(0);
    
    // If flatten operation, clear the selected property
    if (operationType === 'flatten' && !countdownError) {
      setSelectedProperty(null);
      setLastActivatedProperty(null);
    }
    
    // HTML display doesn't need any cleanup
    
    setOperationType(null);
    setCountdownError(null);
  };

  const isActivateDisabled =
    !selectedProperty ||
    (lastActivatedProperty?.canvas_pid === selectedProperty?.canvas_pid);

  // Calculate progress percentage for progress bar
  const progressPercentage = countdownConfig.seconds > 0
    ? ((countdownConfig.seconds - countdown) / countdownConfig.seconds) * 100
    : 0;

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h1 className={`text-4xl font-bold mb-3 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Experience Center Table Control
          </h1>
          <p className={`text-lg ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Select content to display on the kinetic table
          </p>
        </div>

        {/* Property Picker */}
        <div className="mb-8">
          <PropertyPicker
            selectedProperty={selectedProperty}
            onSelectProperty={setSelectedProperty}
            theme={theme}
            onActivateTable={handleActivateTable}
            onFlattenTable={handleFlattenTable}
            isActivateDisabled={isActivateDisabled}
          />
        </div>

        {/* Show Web Content Section - Only shown if SHOW_HTML_PANEL is TRUE */}
        {showHtmlPanel && (
          <div className={`rounded-lg shadow-md p-6 mb-8 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h2 className={`text-2xl font-semibold mb-3 flex items-center ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Show Web Content
            </h2>
            <p className={`mb-4 text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Display web-based content flat on table
            </p>
            <div>
              <label
                htmlFor="url-input"
                className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Web Address
              </label>
              <input
                id="url-input"
                type="text"
                value={htmlUrl}
                onChange={(e) => setHtmlUrl(e.target.value)}
                placeholder="Enter URL..."
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
              />
            </div>
            <div className="flex justify-center mt-6">
              <button
                onClick={handleDisplayHtmlPage}
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-lg rounded-lg transition-all hover:shadow-lg flex items-center justify-center"
              >
                <Globe className="w-5 h-5 mr-2" />
                Display Content
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className={`rounded-lg shadow-md p-6 max-w-2xl mx-auto ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}>
          <h2 className={`text-xl font-semibold mb-3 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Usage Guide
          </h2>
          <ol className={`list-decimal list-inside space-y-2 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>
            <li>Search for and select a property from the picker above</li>
            <li>Click "Activate Table" to display the property on the interactive table</li>
            <li>Click "Flatten Table" to return to CBRE logo on table</li>
            <li>Select a different property to activate it on the table...</li>
          </ol>
        </div>
      </div>

      {/* Countdown Modal */}
      {showCountdown && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-8 max-w-md w-full mx-4 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            {countdownError ? (
              <>
                <h3 className="text-2xl font-bold text-red-600 mb-4 text-center">Error</h3>
                <p className={`text-center mb-6 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {countdownError}
                </p>
                <div className="flex justify-center">
                  <div className="text-6xl font-bold text-red-600">{countdown}</div>
                </div>
              </>
            ) : (
              <>
                <h3
                  className={`text-2xl font-bold mb-4 text-center ${
                    operationType === 'activate' 
                      ? 'text-green-600' 
                      : operationType === 'flatten' 
                      ? 'text-blue-600' 
                      : 'text-indigo-600'
                  }`}
                >
                  {operationType === 'activate' 
                    ? 'Activating Table' 
                    : operationType === 'flatten' 
                    ? 'Flattening Table'
                    : 'Displaying HTML Content'}
                </h3>
                {operationType === 'activate' && selectedProperty && (
                  <div className="mb-6 text-center">
                    <p className={`font-medium ${
                      theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      {selectedProperty.primary_address}
                    </p>
                  </div>
                )}
                {operationType === 'flatten' && (
                  <p className={`text-center mb-6 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Resetting table to CBRE logo...
                  </p>
                )}
                {operationType === 'html' && (
                  <p className={`text-center mb-6 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Loading: {htmlUrl}
                  </p>
                )}
                <div className="flex justify-center mb-4">
                  <div
                    className={`text-6xl font-bold ${
                      operationType === 'activate' 
                        ? 'text-green-600' 
                        : operationType === 'flatten' 
                        ? 'text-blue-600' 
                        : 'text-indigo-600'
                    }`}
                  >
                    {countdown}
                  </div>
                </div>
                <div className={`w-full rounded-full h-3 overflow-hidden ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  <div
                    className={`h-full transition-all duration-1000 ${
                      operationType === 'activate' 
                        ? 'bg-green-600' 
                        : operationType === 'flatten' 
                        ? 'bg-blue-600' 
                        : 'bg-indigo-600'
                    }`}
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <p className={`text-sm text-center mt-4 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Please wait for table to be ready for next command...
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;