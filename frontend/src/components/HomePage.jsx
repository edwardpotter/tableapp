import { useState, useEffect } from 'react';
import { Power, Minimize2 } from 'lucide-react';
import axios from 'axios';
import PropertyPicker from './PropertyPicker';

function HomePage() {
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [lastActivatedProperty, setLastActivatedProperty] = useState(null);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [showFlattenModal, setShowFlattenModal] = useState(false);
  const [countdown, setCountdown] = useState(120);
  const [countdownSeconds, setCountdownSeconds] = useState(120);
  const [activationError, setActivationError] = useState(null);

  // Load configuration on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await axios.get('/api/config');
        setCountdownSeconds(response.data.countdownSeconds);
        setCountdown(response.data.countdownSeconds);
      } catch (error) {
        console.error('Error loading config:', error);
        setCountdownSeconds(120);
        setCountdown(120);
      }
    };
    loadConfig();
  }, []);

  const handlePropertySelect = (property) => {
    setSelectedProperty(property);
    console.log('Selected property:', property);
  };

  const handleActivateTable = async () => {
    if (!selectedProperty) return;

    setActivationError(null);
    setShowActivationModal(true);
    setCountdown(countdownSeconds);

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

      console.log('Activation response:', response.data);
    } catch (error) {
      console.error('Error activating table:', error);
      setActivationError(error.response?.data?.message || error.message || 'Failed to activate table');
    }
  };

  const handleFlattenTable = async () => {
    setActivationError(null);
    setShowFlattenModal(true);
    setCountdown(countdownSeconds);

    try {
      const requestBody = {
        objectPath: "/Game/CBRE_MC/PinTable/PinTable_Cesium_Mockup.PinTable_Cesium_Mockup:PersistentLevel.BP_CameraRig_C_UAID_047C16D0FB2829DF01_1089232868",
        functionName: "RemoteWebCommand",
        parameters: {
          JSONParams: JSON.stringify({
            uecmd: "ShowUnrealPreset",
            parameters: {
              routeURL: "https://marketcanvas.cbre.com/v1/embeddable-widget/presentations/d2fe7cc3-fc00-4ad6-b0a8-282cd7e5559b?slide=0",
              presetName: "intro",
              queries: {
                boundsSQL: "",
                propertiesSQL: "",
                pointsSQL: "",
                focusPropertySQL: "",
                floorsSQL: ""
              },
              pageContent: {
                middle: "https://marketcanvas.cbre.com/embeddable-widget/presentations/d2fe7cc3-fc00-4ad6-b0a8-282cd7e5559b?slide=0&tvmode=on"
              },
              view: "2d",
              NPRMode: false
            }
          })
        }
      };

      console.log('Sending flatten table request');
      
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
    } catch (error) {
      console.error('Error flattening table:', error);
      setActivationError(error.response?.data?.message || error.message || 'Failed to flatten table');
    }
  };

  // Countdown timer effect for activation modal
  useEffect(() => {
    if (showActivationModal && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (showActivationModal && countdown === 0) {
      // Timer completed - close modal and mark property as activated
      setLastActivatedProperty(selectedProperty);
      setShowActivationModal(false);
      setCountdown(countdownSeconds);
      setActivationError(null);
    }
  }, [showActivationModal, countdown, selectedProperty, countdownSeconds]);

  // Countdown timer effect for flatten modal
  useEffect(() => {
    if (showFlattenModal && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (showFlattenModal && countdown === 0) {
      // Timer completed - close modal, deselect property, and return to home
      setShowFlattenModal(false);
      setCountdown(countdownSeconds);
      setActivationError(null);
      setSelectedProperty(null);
      setLastActivatedProperty(null);
    }
  }, [showFlattenModal, countdown, countdownSeconds]);

  // Check if current property can be activated
  const canActivate = selectedProperty && 
    (!lastActivatedProperty || lastActivatedProperty.canvas_pid !== selectedProperty.canvas_pid);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Welcome to the Table Control Application</h1>
      <p className="text-gray-600 mb-8">Select a property to get started</p>
      
      <PropertyPicker onPropertySelect={handlePropertySelect} />

      {/* Action Buttons */}
      <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
        {/* Activate Table Button */}
        {selectedProperty && (
          <button
            onClick={handleActivateTable}
            disabled={!canActivate}
            className={`flex items-center justify-center space-x-2 px-8 py-4 rounded-lg text-lg font-semibold transition-all ${
              canActivate
                ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Power className="w-6 h-6" />
            <span>Activate Table</span>
          </button>
        )}

        {/* Flatten Table Button */}
        <button
          onClick={handleFlattenTable}
          className="flex items-center justify-center space-x-2 px-8 py-4 rounded-lg text-lg font-semibold transition-all bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl"
        >
          <Minimize2 className="w-6 h-6" />
          <span>Flatten Table</span>
        </button>
      </div>

      {selectedProperty && !canActivate && (
        <p className="text-center text-sm text-gray-500 mt-2">
          Table already activated for this property. Select a different property to activate again.
        </p>
      )}

      {/* Activation Modal with Countdown */}
      {showActivationModal && selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
            <div className="text-center">
              <div className="mb-6">
                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
                  activationError ? 'bg-red-100' : 'bg-green-100'
                }`}>
                  <Power className={`w-8 h-8 ${activationError ? 'text-red-600' : 'text-green-600'}`} />
                </div>
              </div>
              
              <h3 className={`text-2xl font-bold mb-4 ${activationError ? 'text-red-900' : 'text-gray-900'}`}>
                {activationError ? 'Activation Error' : 'Command Sent'}
              </h3>
              
              <div className="mb-6">
                <p className="text-gray-700 mb-2">Property ID:</p>
                <p className="text-lg font-mono font-semibold text-blue-600 break-all">
                  {selectedProperty.canvas_pid}
                </p>
              </div>

              {activationError && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm text-red-800">{activationError}</p>
                </div>
              )}

              <div className="mb-6">
                <div className={`text-6xl font-bold mb-2 ${activationError ? 'text-red-600' : 'text-green-600'}`}>
                  {countdown}
                </div>
                <p className="text-gray-600">
                  {countdown === 1 ? 'second' : 'seconds'} remaining
                </p>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-2 transition-all duration-1000 ease-linear ${
                    activationError ? 'bg-red-600' : 'bg-green-600'
                  }`}
                  style={{ width: `${((countdownSeconds - countdown) / countdownSeconds) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Flatten Modal with Countdown */}
      {showFlattenModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
            <div className="text-center">
              <div className="mb-6">
                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
                  activationError ? 'bg-red-100' : 'bg-blue-100'
                }`}>
                  <Minimize2 className={`w-8 h-8 ${activationError ? 'text-red-600' : 'text-blue-600'}`} />
                </div>
              </div>
              
              <h3 className={`text-2xl font-bold mb-4 ${activationError ? 'text-red-900' : 'text-gray-900'}`}>
                {activationError ? 'Flatten Error' : 'Flattening Table...'}
              </h3>

              {activationError && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm text-red-800">{activationError}</p>
                </div>
              )}

              <div className="mb-6">
                <div className={`text-6xl font-bold mb-2 ${activationError ? 'text-red-600' : 'text-blue-600'}`}>
                  {countdown}
                </div>
                <p className="text-gray-600">
                  {countdown === 1 ? 'second' : 'seconds'} remaining
                </p>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-2 transition-all duration-1000 ease-linear ${
                    activationError ? 'bg-red-600' : 'bg-blue-600'
                  }`}
                  style={{ width: `${((countdownSeconds - countdown) / countdownSeconds) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;