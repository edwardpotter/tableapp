import { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, Activity, MapPin, Clock, Calendar } from 'lucide-react';
import axios from 'axios';
import LoadingModal from './LoadingModal';

function AdminPage({ theme }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [refreshResult, setRefreshResult] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [dateRange, setDateRange] = useState('all');
  const [recentLogs, setRecentLogs] = useState([]);
  const [showRecentLogs, setShowRecentLogs] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const params = {};
      
      if (dateRange !== 'all') {
        const now = new Date();
        const startDate = new Date();
        
        switch (dateRange) {
          case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setDate(now.getDate() - 30);
            break;
        }
        
        params.start_date = startDate.toISOString();
        params.end_date = now.toISOString();
      }

      const response = await axios.get('/api/usage/analytics', { params });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const fetchRecentLogs = async () => {
    try {
      const response = await axios.get('/api/usage/recent', {
        params: { limit: 100 }
      });
      setRecentLogs(response.data);
      setShowRecentLogs(true);
    } catch (error) {
      console.error('Error fetching recent logs:', error);
    }
  };

  const handleRefreshClick = () => {
    setShowConfirm(true);
  };

  const handleConfirmRefresh = async () => {
    setShowConfirm(false);
    setIsRefreshing(true);
    setRefreshResult(null);

    try {
      const response = await axios.post('/api/admin/refresh');
      setRefreshResult({
        success: true,
        message: response.data.message,
        recordsProcessed: response.data.recordsProcessed,
      });
      fetchAnalytics();
    } catch (error) {
      setRefreshResult({
        success: false,
        message: error.response?.data?.message || 'Failed to refresh data',
        error: error.response?.data?.error || error.message,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCancelRefresh = () => {
    setShowConfirm(false);
  };

  const handleCloseResult = () => {
    setRefreshResult(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatEventType = (eventType) => {
    return eventType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className={`min-h-screen p-8 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        <h1 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Administration
        </h1>
        <p className={`mb-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          Manage property data and view usage analytics
        </p>

        {/* Data Management Section */}
        <div className={`rounded-lg shadow-md p-6 mb-8 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}>
          <h2 className={`text-xl font-semibold mb-4 flex items-center ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            <RefreshCw className="w-5 h-5 mr-2" />
            Data Management
          </h2>
          <p className={`mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Refresh property data from the CARTO API to ensure the latest information is available.
          </p>
          <button
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
          >
            <RefreshCw className={`w-5 h-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>

        {/* Analytics Section */}
        <div className={`rounded-lg shadow-md p-6 mb-8 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-semibold flex items-center ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              <TrendingUp className="w-5 h-5 mr-2" />
              Usage Analytics
            </h2>
            <div className="flex items-center space-x-2">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
              <button
                onClick={fetchAnalytics}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {loadingAnalytics ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : analytics ? (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`rounded-lg p-4 ${
                  theme === 'dark' ? 'bg-blue-900 bg-opacity-30' : 'bg-blue-50'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Total Events
                    </span>
                    <Activity className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className={`text-2xl font-bold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {analytics.summary.total_events}
                  </div>
                </div>
                <div className={`rounded-lg p-4 ${
                  theme === 'dark' ? 'bg-green-900 bg-opacity-30' : 'bg-green-50'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Table Activations
                    </span>
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div className={`text-2xl font-bold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {analytics.summary.total_activations}
                  </div>
                </div>
                <div className={`rounded-lg p-4 ${
                  theme === 'dark' ? 'bg-purple-900 bg-opacity-30' : 'bg-purple-50'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Unique Properties
                    </span>
                    <MapPin className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className={`text-2xl font-bold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {analytics.summary.unique_properties_activated}
                  </div>
                </div>
              </div>

              {/* Events by Type */}
              <div>
                <h3 className={`text-lg font-semibold mb-3 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Events by Type
                </h3>
                <div className="space-y-2">
                  {analytics.eventsByType.map((event, index) => (
                    <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <span className={`font-medium ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {formatEventType(event.event_type)}
                      </span>
                      <span className={`text-lg font-bold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {event.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Properties */}
              {analytics.topProperties.length > 0 && (
                <div>
                  <h3 className={`text-lg font-semibold mb-3 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Most Activated Properties
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}>
                        <tr>
                          <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Address
                          </th>
                          <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Submarket
                          </th>
                          <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Class
                          </th>
                          <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Activations
                          </th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${
                        theme === 'dark' ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'
                      }`}>
                        {analytics.topProperties.map((property, index) => (
                          <tr key={index} className={theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                            <td className={`px-4 py-3 text-sm ${
                              theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                            }`}>
                              {property.primary_address}
                            </td>
                            <td className={`px-4 py-3 text-sm ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {property.canvas_submarket}
                            </td>
                            <td className={`px-4 py-3 text-sm ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {property.property_class}
                            </td>
                            <td className={`px-4 py-3 text-sm font-semibold ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>
                              {property.activation_count}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Activity by Hour */}
              {analytics.activityByHour.length > 0 && (
                <div>
                  <h3 className={`text-lg font-semibold mb-3 flex items-center ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    <Clock className="w-5 h-5 mr-2" />
                    Activity by Hour of Day
                  </h3>
                  <div className="grid grid-cols-12 gap-2">
                    {Array.from({ length: 24 }, (_, i) => {
                      const hourData = analytics.activityByHour.find(h => parseInt(h.hour) === i);
                      const count = hourData ? parseInt(hourData.event_count) : 0;
                      const maxCount = Math.max(...analytics.activityByHour.map(h => parseInt(h.event_count)));
                      const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                      
                      return (
                        <div key={i} className="flex flex-col items-center">
                          <div className="w-full h-24 flex items-end">
                            <div
                              className={`w-full rounded-t transition-all ${
                                theme === 'dark' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-500 hover:bg-blue-600'
                              }`}
                              style={{ height: `${height}%` }}
                              title={`${i}:00 - ${count} events`}
                            />
                          </div>
                          <span className={`text-xs mt-1 ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {i}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent Activity Button */}
              <div className="flex justify-center pt-4">
                <button
                  onClick={fetchRecentLogs}
                  className={`px-6 py-3 rounded-lg transition-colors flex items-center ${
                    theme === 'dark'
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  View Recent Activity Log
                </button>
              </div>
            </div>
          ) : (
            <p className={`text-center py-8 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              No analytics data available
            </p>
          )}
        </div>
      </div>

      {/* Modals - they remain with light backgrounds for clarity */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Confirm Data Refresh</h3>
            <p className="text-gray-600 mb-6">
              This will fetch the latest property data from the CARTO API and update the database.
              This operation may take a few moments.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleCancelRefresh}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRefresh}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {refreshResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3
              className={`text-xl font-semibold mb-4 ${
                refreshResult.success ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {refreshResult.success ? 'Success!' : 'Error'}
            </h3>
            <p className="text-gray-700 mb-2">{refreshResult.message}</p>
            {refreshResult.success && refreshResult.recordsProcessed && (
              <p className="text-gray-600 mb-4">
                Processed {refreshResult.recordsProcessed} records
              </p>
            )}
            {!refreshResult.success && refreshResult.error && (
              <p className="text-sm text-red-600 mb-4 bg-red-50 p-3 rounded">
                {refreshResult.error}
              </p>
            )}
            <button
              onClick={handleCloseResult}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showRecentLogs && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Recent Activity Log</h3>
              <button
                onClick={() => setShowRecentLogs(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Event Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Property
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Submarket
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {formatEventType(log.event_type)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {log.primary_address || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {log.canvas_submarket || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {isRefreshing && <LoadingModal message="Refreshing data from CARTO API..." theme={theme} />}
    </div>
  );
}

export default AdminPage;