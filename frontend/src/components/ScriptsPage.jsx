import { useState, useEffect } from 'react';
import { 
  Play, Plus, Edit2, Trash2, Save, X, 
  ChevronLeft, ChevronRight, Building, Globe,
  ArrowUp, ArrowDown, Pause
} from 'lucide-react';
import axios from 'axios';
import PropertyPicker from './PropertyPicker';

function ScriptsPage({ theme }) {
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingScript, setEditingScript] = useState(null);
  const [playingScript, setPlayingScript] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [countdownConfig, setCountdownConfig] = useState({ seconds: 120 });
  const [countdownError, setCountdownError] = useState(null);
  const [showMarketCanvas2, setShowMarketCanvas2] = useState(false);
  
  // Editor state
  const [scriptName, setScriptName] = useState('');
  const [scriptDescription, setScriptDescription] = useState('');
  const [scriptSteps, setScriptSteps] = useState([]);
  const [showAddStep, setShowAddStep] = useState(false);
  const [newStepType, setNewStepType] = useState('property');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [webUrl, setWebUrl] = useState('https://');
  const [webUrlError, setWebUrlError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchScripts();
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

  const fetchConfig = async () => {
    try {
      const response = await axios.get('/api/config');
      setCountdownConfig({ seconds: response.data.countdownSeconds });
      setShowMarketCanvas2(response.data.showMarketCanvas2 || false);
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  const fetchScripts = async () => {
    try {
      const response = await axios.get('/api/scripts');
      setScripts(response.data);
    } catch (error) {
      console.error('Error fetching scripts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingScript(null);
    setScriptName('');
    setScriptDescription('');
    setScriptSteps([]);
    setShowEditor(true);
  };

  const handleEdit = async (script) => {
    try {
      const response = await axios.get(`/api/scripts/${script.id}`);
      setEditingScript(response.data);
      setScriptName(response.data.name);
      setScriptDescription(response.data.description || '');
      setScriptSteps(response.data.steps || []);
      setShowEditor(true);
    } catch (error) {
      console.error('Error loading script:', error);
    }
  };

  const handleDelete = async (scriptId) => {
    try {
      await axios.delete(`/api/scripts/${scriptId}`);
      fetchScripts();
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting script:', error);
    }
  };

  const handleAddStep = () => {
    if (newStepType === 'property' && selectedProperty) {
      setScriptSteps([...scriptSteps, {
        step_type: 'property',
        canvas_pid: selectedProperty.canvas_pid,
        primary_address: selectedProperty.primary_address,
        canvas_submarket: selectedProperty.canvas_submarket,
        property_class: selectedProperty.property_class,
        latitude: selectedProperty.latitude,
        longitude: selectedProperty.longitude
      }]);
      setSelectedProperty(null);
      setShowAddStep(false);
    } else if (newStepType === 'web_content' && webUrl) {
      // Validate URL
      const urlPattern = /^https?:\/\/.+\..+/;
      if (!urlPattern.test(webUrl)) {
        setWebUrlError('Please enter a valid URL (e.g., https://example.com)');
        return;
      }
      
      setScriptSteps([...scriptSteps, {
        step_type: 'web_content',
        web_url: webUrl
      }]);
      setWebUrl('https://');
      setWebUrlError('');
      setShowAddStep(false);
    }
  };

  const handleRemoveStep = (index) => {
    setScriptSteps(scriptSteps.filter((_, i) => i !== index));
  };

  const handleMoveStep = (index, direction) => {
    const newSteps = [...scriptSteps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    setScriptSteps(newSteps);
  };

  const handleSaveScript = async () => {
    if (!scriptName || scriptSteps.length === 0) {
      alert('Please provide a name and at least one step');
      return;
    }

    try {
      const scriptData = {
        name: scriptName,
        description: scriptDescription,
        steps: scriptSteps
      };

      if (editingScript) {
        await axios.put(`/api/scripts/${editingScript.id}`, scriptData);
      } else {
        await axios.post('/api/scripts', scriptData);
      }

      setShowEditor(false);
      fetchScripts();
    } catch (error) {
      console.error('Error saving script:', error);
      alert('Failed to save script');
    }
  };

  const handlePlayScript = async (script) => {
    try {
      const response = await axios.get(`/api/scripts/${script.id}`);
      setPlayingScript(response.data);
      setCurrentStepIndex(0);
      await executeStep(response.data.steps[0]);
    } catch (error) {
      console.error('Error loading script:', error);
    }
  };

  const handleNextStep = async () => {
    if (!playingScript || currentStepIndex >= playingScript.steps.length - 1) return;
    const nextIndex = currentStepIndex + 1;
    setCurrentStepIndex(nextIndex);
    await executeStep(playingScript.steps[nextIndex]);
  };

  const handlePreviousStep = async () => {
    if (!playingScript || currentStepIndex <= 0) return;
    const prevIndex = currentStepIndex - 1;
    setCurrentStepIndex(prevIndex);
    await executeStep(playingScript.steps[prevIndex]);
  };

  const handleStopPlayback = () => {
    setPlayingScript(null);
    setCurrentStepIndex(0);
  };

  const executeStep = async (step) => {
    setCountdownError(null);
    setShowCountdown(true);
    setCountdown(countdownConfig.seconds);

    try {
      if (step.step_type === 'property') {
        await executePropertyStep(step);
      } else if (step.step_type === 'web_content') {
        await executeWebContentStep(step);
      }
    } catch (error) {
      console.error('Error executing step:', error);
      setCountdownError(error.message || 'Failed to execute step');
      setCountdown(5);
    }
  };

  const executePropertyStep = async (step) => {
    const requestBody = {
      objectPath: "/Game/CBRE_MC/PinTable/PinTable_Cesium_Mockup.PinTable_Cesium_Mockup:PersistentLevel.BP_CameraRig_C_UAID_047C16D0FB2829DF01_1089232868",
      functionName: "RemoteWebCommand",
      parameters: {
        JSONParams: JSON.stringify({
          uecmd: "ShowUnrealPreset",
          parameters: {
            routeURL: `https://marketcanvas.cbre.com/v1/properties/${step.canvas_pid}/overview/map`,
            presetName: "properties_overview_map",
            queries: {
              boundsSQL: "",
              propertiesSQL: `SELECT PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.canvas_pid, PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.canvas_primary_address, PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.geom, PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.floor, PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.floor_height, PROD_CANVAS_DB.DATA.CANVAS_PROPERTIES.stories, PROD_CANVAS_DB.DATA.CANVAS_PROPERTIES.latitude, PROD_CANVAS_DB.DATA.CANVAS_PROPERTIES.longitude, PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.ed_max_height, PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.total_avail_floorspace, PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.block_contiguous_size, PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.floors, PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.spacetypename, PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.occupancy, PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.rentlow_s, PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.renthigh_s, PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.rent_type, PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.leasing_company, PROD_CANVAS_DB.DATA.CANVAS_PROPERTIES.property_type FROM PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK LEFT JOIN PROD_CANVAS_DB.DATA.CANVAS_PROPERTIES ON (PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.canvas_pid = PROD_CANVAS_DB.DATA.CANVAS_PROPERTIES.canvas_pid) WHERE (1 = 1) AND (PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.canvas_pid = '${step.canvas_pid}') ORDER BY PROD_CANVAS_DB.DATA.CANVAS_AVAILABLE_STACK.floor DESC`,
              pointsSQL: "",
              focusPropertySQL: "",
              floorsSQL: ""
            },
            pageContent: {
              left: `https://marketcanvas.cbre.com/embeddable-widget/properties/${step.canvas_pid}/overview/map?tvmode=on`,
              right: `https://marketcanvas.cbre.com/embeddable-widget/properties/${step.canvas_pid}/overview/photos?tvmode=on`
            },
            view: "3d",
            NPRMode: false,
            viewState: {
              latitude: parseFloat(step.latitude) || 38.905172,
              longitude: parseFloat(step.longitude) || -77.0046697,
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

    await axios.put(
      'https://experience-center-room-dc-srv1.cbre.com/remote/object/call',
      requestBody,
      { headers: { 'Content-Type': 'application/json' } }
    );

    // If Market Canvas 2.0 is enabled
    if (showMarketCanvas2) {
      try {
        await axios.post('/api/marketcanvas2/present', {
          propertyId: step.canvas_pid
        });
      } catch (mc2Error) {
        console.error('Error triggering Market Canvas 2.0:', mc2Error);
      }
    }
  };

  const executeWebContentStep = async (step) => {
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
              middle: step.web_url
            },
            view: "2d",
            NPRMode: false
          }
        })
      }
    };

    await axios.put(
      'https://experience-center-room-dc-srv1.cbre.com/remote/object/call',
      requestBody,
      { headers: { 'Content-Type': 'application/json' } }
    );
  };

  const handleCountdownComplete = () => {
    setShowCountdown(false);
    setCountdown(0);
    setCountdownError(null);
  };

  const progressPercentage = countdownConfig.seconds > 0
    ? ((countdownConfig.seconds - countdown) / countdownConfig.seconds) * 100
    : 0;

  if (loading) {
    return (
      <div className={`min-h-screen p-8 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Loading scripts...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-8 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Scripts
            </h1>
            <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Create and play automated presentation sequences
            </p>
          </div>
          <button
            onClick={handleCreateNew}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Script
          </button>
        </div>

        {/* Playing Script Controls */}
        {playingScript && (
          <div className={`rounded-lg shadow-md p-6 mb-8 ${
            theme === 'dark' ? 'bg-green-900 bg-opacity-30 border-2 border-green-700' : 'bg-green-50 border-2 border-green-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Playing: {playingScript.name}
                </h2>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Step {currentStepIndex + 1} of {playingScript.steps.length}
                </p>
              </div>
              <button
                onClick={handleStopPlayback}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
              >
                <Pause className="w-5 h-5 mr-2" />
                Stop
              </button>
            </div>

            {/* Current Step Display */}
            <div className={`p-4 rounded-lg mb-4 ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}>
              {playingScript.steps[currentStepIndex]?.step_type === 'property' ? (
                <div className="flex items-center">
                  <Building className="w-6 h-6 mr-3 text-blue-600" />
                  <div>
                    <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {playingScript.steps[currentStepIndex].primary_address}
                    </p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {playingScript.steps[currentStepIndex].canvas_submarket} - Class {playingScript.steps[currentStepIndex].property_class}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center">
                  <Globe className="w-6 h-6 mr-3 text-indigo-600" />
                  <div>
                    <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Web Content
                    </p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {playingScript.steps[currentStepIndex]?.web_url}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Controls */}
            <div className="flex justify-center gap-4">
              <button
                onClick={handlePreviousStep}
                disabled={currentStepIndex === 0 || showCountdown}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Previous
              </button>
              <button
                onClick={handleNextStep}
                disabled={currentStepIndex >= playingScript.steps.length - 1 || showCountdown}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          </div>
        )}

        {/* Scripts List */}
        {!showEditor && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scripts.map((script) => (
              <div
                key={script.id}
                className={`rounded-lg shadow-md p-6 ${
                  theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                }`}
              >
                <h3 className={`text-lg font-semibold mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {script.name}
                </h3>
                {script.description && (
                  <p className={`text-sm mb-4 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {script.description}
                  </p>
                )}
                <p className={`text-sm mb-4 ${
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                }`}>
                  {script.step_count} steps
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePlayScript(script)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Play
                  </button>
                  <button
                    onClick={() => handleEdit(script)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      theme === 'dark'
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(script.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Script Editor */}
        {showEditor && (
          <div className={`rounded-lg shadow-md p-6 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-2xl font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {editingScript ? 'Edit Script' : 'Create Script'}
              </h2>
              <button
                onClick={() => setShowEditor(false)}
                className={`p-2 rounded-lg ${
                  theme === 'dark'
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Script Details */}
            <div className="space-y-4 mb-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Script Name *
                </label>
                <input
                  type="text"
                  value={scriptName}
                  onChange={(e) => setScriptName(e.target.value)}
                  placeholder="My Presentation Script"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Description (optional)
                </label>
                <textarea
                  value={scriptDescription}
                  onChange={(e) => setScriptDescription(e.target.value)}
                  placeholder="Description of this script..."
                  rows={3}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>
            </div>

            {/* Steps List */}
            <div className="mb-6">
              <h3 className={`text-lg font-semibold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Steps ({scriptSteps.length})
              </h3>
              <div className="space-y-3">
                {scriptSteps.map((step, index) => (
                  <div
                    key={index}
                    className={`p-4 border rounded-lg ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1">
                        <span className={`text-sm font-medium mr-3 ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {index + 1}.
                        </span>
                        {step.step_type === 'property' ? (
                          <div className="flex items-center">
                            <Building className="w-5 h-5 mr-2 text-blue-600" />
                            <div>
                              <p className={`font-medium ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>
                                {step.primary_address}
                              </p>
                              <p className={`text-sm ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                {step.canvas_submarket} - Class {step.property_class}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <Globe className="w-5 h-5 mr-2 text-indigo-600" />
                            <div>
                              <p className={`font-medium ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>
                                Web Content
                              </p>
                              <p className={`text-sm ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                {step.web_url}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleMoveStep(index, 'up')}
                          disabled={index === 0}
                          className={`p-1 rounded ${
                            theme === 'dark'
                              ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-600 disabled:text-gray-600'
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200 disabled:text-gray-300'
                          } disabled:cursor-not-allowed`}
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMoveStep(index, 'down')}
                          disabled={index === scriptSteps.length - 1}
                          className={`p-1 rounded ${
                            theme === 'dark'
                              ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-600 disabled:text-gray-600'
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200 disabled:text-gray-300'
                          } disabled:cursor-not-allowed`}
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveStep(index)}
                          className="p-1 text-red-600 hover:text-red-700 rounded hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Step Button */}
              {!showAddStep && (
                <button
                  onClick={() => setShowAddStep(true)}
                  className={`w-full mt-4 px-4 py-3 border-2 border-dashed rounded-lg transition-colors ${
                    theme === 'dark'
                      ? 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300'
                      : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700'
                  }`}
                >
                  <Plus className="w-5 h-5 mx-auto" />
                  <span className="block mt-1">Add Step</span>
                </button>
              )}

              {/* Add Step Form */}
              {showAddStep && (
                <div className={`mt-4 p-4 border rounded-lg ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600'
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="mb-4">
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Step Type
                    </label>
                    <select
                      value={newStepType}
                      onChange={(e) => setNewStepType(e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        theme === 'dark'
                          ? 'bg-gray-600 border-gray-500 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="property">Property</option>
                      <option value="web_content">Web Content</option>
                    </select>
                  </div>

                  {newStepType === 'property' ? (
                    <PropertyPicker
                      selectedProperty={selectedProperty}
                      onSelectProperty={setSelectedProperty}
                      theme={theme}
                      hideButtons={true}
                    />
                  ) : (
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Web URL
                      </label>
                      <input
                        type="text"
                        value={webUrl}
                        onChange={(e) => {
                          setWebUrl(e.target.value);
                          setWebUrlError('');
                        }}
                        placeholder="https://example.com"
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                          webUrlError 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'focus:ring-blue-500'
                        } ${
                          theme === 'dark'
                            ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                        }`}
                      />
                      {webUrlError && (
                        <p className="text-red-600 text-sm mt-1">{webUrlError}</p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={handleAddStep}
                      disabled={
                        (newStepType === 'property' && !selectedProperty) ||
                        (newStepType === 'web_content' && webUrl.length <= 8)
                      }
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Add Step
                    </button>
                    <button
                      onClick={() => {
                        setShowAddStep(false);
                        setSelectedProperty(null);
                        setWebUrl('https://');
                        setWebUrlError('');
                      }}
                      className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                        theme === 'dark'
                          ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Save/Cancel Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleSaveScript}
                disabled={!scriptName || scriptSteps.length === 0}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Save className="w-5 h-5 mr-2" />
                Save Script
              </button>
              <button
                onClick={() => setShowEditor(false)}
                className={`flex-1 px-6 py-3 rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this script? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

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
                <h3 className="text-2xl font-bold mb-4 text-center text-blue-600">
                  Executing Step...
                </h3>
                <div className="flex justify-center mb-4">
                  <div className="text-6xl font-bold text-blue-600">
                    {countdown}
                  </div>
                </div>
                <div className={`w-full rounded-full h-3 overflow-hidden ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  <div
                    className="h-full transition-all duration-1000 bg-blue-600"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <p className={`text-sm text-center mt-4 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Please wait for table to be ready...
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ScriptsPage;