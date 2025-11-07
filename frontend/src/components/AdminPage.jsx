import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import axios from 'axios';
import LoadingModal from './LoadingModal';

function AdminPage() {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState(null);

  const handleRefreshClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmRefresh = async () => {
    setShowConfirmModal(false);
    setIsRefreshing(true);
    setRefreshResult(null);

    try {
      const response = await axios.post('/api/admin/refresh');
      setRefreshResult({
        success: true,
        message: response.data.message,
        recordsProcessed: response.data.recordsProcessed
      });
    } catch (error) {
      setRefreshResult({
        success: false,
        message: error.response?.data?.message || 'Failed to refresh data',
        error: error.response?.data?.error || error.message
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCancelRefresh = () => {
    setShowConfirmModal(false);
  };

  const handleCloseResult = () => {
    setRefreshResult(null);
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Data Management</h2>
        
        <button
          onClick={handleRefreshClick}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Confirm Data Refresh</h3>
            <p className="text-gray-600 mb-6">
              This will fetch the latest property data from the external API and replace all existing properties in the database. Do you want to continue?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelRefresh}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRefresh}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Modal */}
      {isRefreshing && <LoadingModal message="Refreshing data..." />}

      {/* Result Modal */}
      {refreshResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className={`text-lg font-semibold mb-4 ${refreshResult.success ? 'text-green-600' : 'text-red-600'}`}>
              {refreshResult.success ? 'Success' : 'Error'}
            </h3>
            <p className="text-gray-800 mb-2">{refreshResult.message}</p>
            {refreshResult.success && refreshResult.recordsProcessed !== undefined && (
              <p className="text-gray-600 text-sm mb-4">
                Processed {refreshResult.recordsProcessed} property records.
              </p>
            )}
            {!refreshResult.success && refreshResult.error && (
              <p className="text-red-600 text-sm mb-4">
                Error: {refreshResult.error}
              </p>
            )}
            <div className="flex justify-end">
              <button
                onClick={handleCloseResult}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;