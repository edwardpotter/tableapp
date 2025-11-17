import { Settings, Moon, Sun } from 'lucide-react';

function Header({ onAdminClick, activeTab, onTabChange, theme, onThemeToggle, scriptsEnabled }) {
  return (
    <header className={`sticky top-0 z-50 shadow-sm border-b ${
      theme === 'dark'
        ? 'bg-gray-900 border-gray-700'
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between px-6 py-4">
        <nav className="flex space-x-8">
          <button
            onClick={() => onTabChange('home')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'home'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : theme === 'dark'
                ? 'text-gray-300 hover:text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Home
          </button>
          {scriptsEnabled && (
            <button
              onClick={() => onTabChange('scripts')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'scripts'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : theme === 'dark'
                  ? 'text-gray-300 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Scripts
            </button>
          )}
          {activeTab === 'admin' && (
            <button
              onClick={() => onTabChange('admin')}
              className="px-4 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600"
            >
              Admin
            </button>
          )}
        </nav>
        
        <div className="flex items-center space-x-2">
          {/* Theme Toggle Button */}
          <button
            onClick={onThemeToggle}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
          </button>

          {/* Admin Settings Button */}
          <button
            onClick={onAdminClick}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            aria-label="Admin settings"
          >
            <Settings size={24} />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;