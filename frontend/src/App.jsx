import { useState } from 'react';
import Header from './components/Header';
import HomePage from './components/HomePage';
import AdminPage from './components/AdminPage';
import AdminModal from './components/AdminModal';
import './App.css';

function App() {
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');

  const handleAdminAuthenticated = () => {
    setIsAdminModalOpen(false);
    setCurrentPage('admin');
  };

  const handleTabChange = (tab) => {
    setCurrentPage(tab);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onAdminClick={() => setIsAdminModalOpen(true)}
        activeTab={currentPage}
        onTabChange={handleTabChange}
      />
      <main>
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'admin' && <AdminPage />}
      </main>
      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onAuthenticated={handleAdminAuthenticated}
      />
    </div>
  );
}

export default App;