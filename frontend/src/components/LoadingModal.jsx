import { Loader2 } from 'lucide-react';

function LoadingModal({ message = 'Loading...', theme = 'light' }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`rounded-lg p-8 max-w-sm w-full mx-4 shadow-xl ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className={`text-lg font-medium ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoadingModal;