import { useState, useEffect } from 'react';
import Header from './components/Header';
import HomePage from './components/HomePage';
import AdminPage from './components/AdminPage';
import AdminModal from './components/AdminModal';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [theme, setTheme] = useState('light');

  // Load theme preference from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
    }
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
    setActiveTab(tab);
  };

  const handleThemeToggle = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
      <Header
        onAdminClick={handleAdminClick}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        theme={theme}
        onThemeToggle={handleThemeToggle}
      />
      
      {activeTab === 'home' ? (
        <HomePage theme={theme} />
      ) : (
        <AdminPage theme={theme} />
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