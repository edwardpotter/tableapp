import { useState, useEffect } from 'react';
import axios from 'axios';
import { Delete } from 'lucide-react';

function AdminModal({ isOpen, onClose, onAuthenticated, theme }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [codeLength, setCodeLength] = useState(4);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch expected code length from backend
  useEffect(() => {
    const fetchCodeLength = async () => {
      try {
        const response = await axios.get('/api/admin/code-length');
        setCodeLength(response.data.length || 4);
      } catch (err) {
        console.error('Error fetching code length:', err);
        setCodeLength(4); // Default to 4 if fetch fails
      }
    };
    
    if (isOpen) {
      fetchCodeLength();
    }
  }, [isOpen]);

  // Auto-submit when code reaches required length
  useEffect(() => {
    if (code.length === codeLength && !isSubmitting) {
      handleSubmit();
    }
  }, [code, codeLength]);

  // Keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      // Number keys (0-9)
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleNumberClick(e.key);
      }
      // Backspace
      else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      }
      // Escape to close
      else if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
      // Enter to submit (if code complete)
      else if (e.key === 'Enter' && code.length === codeLength) {
        e.preventDefault();
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, code, codeLength]);

  const handleNumberClick = (num) => {
    if (code.length < codeLength) {
      setCode(code + num);
      setError('');
    }
  };

  const handleBackspace = () => {
    setCode(code.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setCode('');
    setError('');
  };

  const handleSubmit = async () => {
    if (code.length !== codeLength) {
      setError(`Please enter a ${codeLength}-digit code`);
      return;
    }

    if (isSubmitting) return; // Prevent double submission
    
    setIsSubmitting(true);

    try {
      const response = await axios.post('/api/admin/authenticate', { code });
      if (response.data.success) {
        setCode('');
        setError('');
        onAuthenticated();
      }
    } catch (err) {
      setError('Nice try, but wrong. If you need help, please find Alex Ern.');
      setCode('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCode('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  const keypadNumbers = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'back']
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`rounded-lg shadow-xl max-w-md w-full mx-4 ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="p-6">
          <h2 className={`text-2xl font-bold mb-4 text-center ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Administrator Access
          </h2>
          
          {/* Display Area */}
          <div className={`mb-6 p-4 border-2 rounded-lg text-center ${
            error 
              ? 'border-red-500' 
              : theme === 'dark'
              ? 'border-gray-600'
              : 'border-gray-300'
          }`}>
            <div className="flex justify-center gap-2">
              {Array.from({ length: codeLength }).map((_, i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full ${
                    i < code.length
                      ? 'bg-blue-600'
                      : theme === 'dark'
                      ? 'bg-gray-600'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 text-center">{error}</p>
            </div>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {keypadNumbers.map((row, rowIndex) => (
              row.map((key, colIndex) => {
                if (key === '') {
                  return <div key={`${rowIndex}-${colIndex}`} />;
                }
                if (key === 'back') {
                  return (
                    <button
                      key={`${rowIndex}-${colIndex}`}
                      onClick={handleBackspace}
                      disabled={isSubmitting}
                      className={`p-4 rounded-lg font-semibold text-lg transition-colors disabled:opacity-50 ${
                        theme === 'dark'
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-red-500 text-white hover:bg-red-600'
                      }`}
                    >
                      <Delete className="w-6 h-6 mx-auto" />
                    </button>
                  );
                }
                return (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => handleNumberClick(key)}
                    disabled={isSubmitting}
                    className={`p-4 rounded-lg font-semibold text-2xl transition-colors disabled:opacity-50 ${
                      theme === 'dark'
                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {key}
                  </button>
                );
              })
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleClear}
              disabled={isSubmitting}
              className={`flex-1 px-4 py-3 rounded-lg transition-colors disabled:opacity-50 ${
                theme === 'dark'
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Clear
            </button>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className={`flex-1 px-4 py-3 rounded-lg transition-colors disabled:opacity-50 ${
                theme === 'dark'
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={code.length !== codeLength || isSubmitting}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Checking...' : 'Submit'}
            </button>
          </div>
          
          {/* Keyboard hint */}
          <p className={`text-xs text-center mt-3 ${
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          }`}>
            Tip: You can also use your keyboard
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminModal;