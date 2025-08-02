import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';

interface AnalyticsData {
  overview: {
    totalDeliveries: number;
    completedDeliveries: number;
    pendingDeliveries: number;
    inProgressDeliveries: number;
    totalRevenue: number;
    averageDeliveryTime: number;
    deliverySuccessRate: number;
  };
  monthlyData: any[];
  topRoutes: any[];
  driverPerformance: any[];
  customerInsights: any[];
  recentDeliveries: any[];
}

const SACAnalyticsDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('all');
  const { account } = useWallet();

  useEffect(() => {
    fetchAnalyticsData();
  }, [account, timeframe]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const url = account 
        ? `http://localhost:5006/api/analytics/user/${account}?timeframe=${timeframe}`
        : `http://localhost:5006/api/analytics?timeframe=${timeframe}`;
      
      const response = await fetch(url);
      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No analytics data available</p>
      </div>
    );
  }

  const { overview, monthlyData, topRoutes, driverPerformance } = analyticsData;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">SAP Analytics Dashboard</h1>
        <p className="text-gray-600">Comprehensive delivery analytics and insights</p>
      </div>

      {/* Timeframe Selector */}
      <div className="mb-6">
        <select 
          value={timeframe} 
          onChange={(e) => setTimeframe(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Time</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="365d">Last Year</option>
        </select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Deliveries</h3>
          <p className="text-3xl font-bold text-blue-600">{overview.totalDeliveries}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold text-green-600">₹{overview.totalRevenue.toLocaleString()}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Success Rate</h3>
          <p className="text-3xl font-bold text-purple-600">{overview.deliverySuccessRate.toFixed(1)}%</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Avg Delivery Time</h3>
          <p className="text-3xl font-bold text-orange-600">{overview.averageDeliveryTime}h</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Performance Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Monthly Performance</h3>
          <div className="space-y-3">
            {monthlyData.map((month: any) => (
              <div key={month.month} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{month.month}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{month.deliveries} deliveries</span>
                  <span className="text-sm text-green-600">₹{month.revenue.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Routes */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Top Routes</h3>
          <div className="space-y-3">
            {topRoutes.slice(0, 5).map((route: any) => (
              <div key={route.route} className="flex justify-between items-center">
                <span className="text-sm text-gray-600 truncate">{route.route}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{route.count}x</span>
                  <span className="text-sm text-green-600">₹{route.revenue.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Customer Insights */}
      {analyticsData.customerInsights && analyticsData.customerInsights.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-lg font-semibold mb-4">Top Customers</h3>
          <div className="space-y-3">
            {analyticsData.customerInsights.slice(0, 5).map((customer: any) => (
              <div key={customer.customer} className="flex justify-between items-center">
                <span className="text-sm text-gray-600 truncate">{customer.customer.slice(0, 10)}...</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{customer.totalOrders} orders</span>
                  <span className="text-sm text-green-600">₹{customer.totalSpent.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Driver Performance */}
      {driverPerformance.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-lg font-semibold mb-4">Driver Performance</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deliveries</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Rate</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {driverPerformance.slice(0, 10).map((driver: any) => (
                  <tr key={driver.driver}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {driver.driver.slice(0, 10)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {driver.totalDeliveries}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₹{driver.totalRevenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {driver.completionRate.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Deliveries */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Recent Deliveries</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analyticsData.recentDeliveries.map((delivery: any) => (
                <tr key={delivery._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {delivery.deliveryId?.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {delivery.fromAddress?.slice(0, 10)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {delivery.toAddress?.slice(0, 10)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      delivery.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      delivery.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {delivery.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₹{delivery.feeInINR}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SACAnalyticsDashboard;
