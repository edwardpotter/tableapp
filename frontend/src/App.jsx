import { useState, useEffect } from 'react';
import Header from './components/Header';
import HomePage from './components/HomePage';
import ScriptsPage from './components/ScriptsPage';
import AdminPage from './components/AdminPage';
import AdminModal from './components/AdminModal';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [theme, setTheme] = useState('light');
  const [scriptsEnabled, setScriptsEnabled] = useState(false);

  // Load theme preference from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
    }
    
    // Fetch config for scriptsEnabled
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config');
        const data = await response.json();
        setScriptsEnabled(data.scriptsEnabled || false);
      } catch (error) {
        console.error('Error fetching config:', error);
      }
    };
    fetchConfig();
  }, []);

  // Save theme preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleAdminClick = () => {
    if (activeTab === 'admin') {
      // If already on admin page, go back to home
      setActiveTab('home');
    } else {
      // Show authentication modal
      setShowAdminModal(true);
    }
  };

  const handleAdminAuthenticated = () => {
    setShowAdminModal(false);
    setActiveTab('admin');
  };

  const handleCloseAdminModal = () => {
    setShowAdminModal(false);
  };

  const handleTabChange = (tab) => {
    // If scripts tab is disabled and user tries to access it, go home
    if (tab === 'scripts' && !scriptsEnabled) {
      setActiveTab('home');
      return;
    }
    setActiveTab(tab);
  };

  const handleThemeToggle = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const handleConfigChange = (configKey, newValue) => {
    if (configKey === 'scriptsEnabled') {
      setScriptsEnabled(newValue);
      // If scripts are disabled and user is on scripts tab, go to home
      if (!newValue && activeTab === 'scripts') {
        setActiveTab('home');
      }
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
      <Header
        onAdminClick={handleAdminClick}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        theme={theme}
        onThemeToggle={handleThemeToggle}
        scriptsEnabled={scriptsEnabled}
      />
      
      {activeTab === 'home' ? (
        <HomePage theme={theme} />
      ) : activeTab === 'scripts' && scriptsEnabled ? (
        <ScriptsPage theme={theme} />
      ) : activeTab === 'admin' ? (
        <AdminPage theme={theme} onConfigChange={handleConfigChange} />
      ) : (
        <HomePage theme={theme} />
      )}

      <AdminModal
        isOpen={showAdminModal}
        onClose={handleCloseAdminModal}
        onAuthenticated={handleAdminAuthenticated}
        theme={theme}
      />
    </div>
  );
}

export default App;