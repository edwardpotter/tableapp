import { useState } from 'react';
import { Settings } from 'lucide-react';

function Header({ onAdminClick, activeTab, onTabChange }) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        <nav className="flex space-x-8">
          <button
            onClick={() => onTabChange('home')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'home'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Home
          </button>
          {activeTab === 'admin' && (
            <button
              onClick={() => onTabChange('admin')}
              className="px-4 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600"
            >
              Admin
            </button>
          )}
        </nav>
        
        <button
          onClick={onAdminClick}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Admin settings"
        >
          <Settings size={24} />
        </button>
      </div>
    </header>
  );
}

export default Header;