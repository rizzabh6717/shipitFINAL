import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Plus, Clock, CheckCircle, Truck, MapPin, User, Phone, ExternalLink, DollarSign } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';

interface Parcel {
  id: string;
  deliveryId?: string;
  from: string;
  to: string;
  item: string;
  size: 'small' | 'medium' | 'large';
  fee: number;
  status: 'pending' | 'accepted' | 'in-transit' | 'delivered';
  createdAt: Date;
  transactionHash?: string;
  escrowAmount?: string;
  fundsReleased?: boolean;
  driver?: {
    name: string;
    vehicle: string;
    phone: string;
    rating: number;
    address?: string;
  };
}

const SenderDashboard: React.FC = () => {
  const { account, getUserDeliveries, confirmDelivery, isConnected } = useWallet();
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [releasingFunds, setReleasingFunds] = useState<string | null>(null);
  const [releasedFunds, setReleasedFunds] = useState<Set<string>>(new Set()); // Track released funds locally

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-900/20 border-yellow-700';
      case 'accepted': return 'text-blue-400 bg-blue-900/20 border-blue-700';
      case 'in-transit': return 'text-purple-400 bg-purple-900/20 border-purple-700';
      case 'delivered': return 'text-green-400 bg-green-900/20 border-green-700';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'accepted': return CheckCircle;
      case 'in-transit': return Truck;
      case 'delivered': return CheckCircle;
      default: return Package;
    }
  };

  // Fetch user deliveries from blockchain
  const fetchUserDeliveries = async () => {
    if (!isConnected || !account) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const deliveries = await getUserDeliveries();
      
      // Transform blockchain data to match UI interface
      const transformedParcels: Parcel[] = deliveries
        .filter((delivery: any) => delivery && delivery.id)
        .map((delivery: any) => {
          const deliveryId = delivery.id.toString();
          const hasReleasedFunds = releasedFunds.has(deliveryId) || parseFloat(delivery.escrowAmount || '0') === 0;
          
          return {
            id: deliveryId,
            deliveryId: deliveryId,
            from: delivery.fromAddress || 'Unknown',
            to: delivery.toAddress || 'Unknown',
            item: delivery.itemDescription || 'Unknown Item',
            size: 'medium',
            fee: Math.round(parseFloat(delivery.deliveryFee || '0') * 3333),
            status: getStatusFromBlockchain(delivery.status || 0),
            createdAt: new Date(),
            transactionHash: delivery.transactionHash,
            escrowAmount: delivery.escrowAmount,
            fundsReleased: hasReleasedFunds, // Check both local state and escrow amount
            driver: delivery.driver && delivery.driver !== '0x0000000000000000000000000000000000000000' ? {
              name: `Driver ${delivery.driver.slice(0, 6)}...${delivery.driver.slice(-4)}`,
              vehicle: 'Vehicle Info',
              phone: '+91 XXXXX XXXXX',
              rating: 4.5,
              address: delivery.driver
            } : undefined
          };
        });

      setParcels(transformedParcels);
    } catch (error) {
      console.error('Error fetching user deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusFromBlockchain = (blockchainStatus: number): 'pending' | 'accepted' | 'in-transit' | 'delivered' => {
    switch (blockchainStatus) {
      case 0: return 'pending';
      case 1: return 'accepted';
      case 2: return 'in-transit';
      case 3: return 'delivered';
      default: return 'pending';
    }
  };

  const handleReleaseFunds = async (parcel: Parcel) => {
    if (!parcel.deliveryId || !confirmDelivery) {
      alert('Unable to release funds. Missing delivery information.');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to release ₹${parcel.fee} to the driver? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setReleasingFunds(parcel.id);
      
      const result = await confirmDelivery(parseInt(parcel.deliveryId));
      
      console.log('Funds released successfully:', result);
      
      // Add to released funds set to persist across refreshes
      setReleasedFunds(prev => new Set([...prev, parcel.id]));
      
      // Update parcel status locally
      setParcels(prev => prev.map(p => 
        p.id === parcel.id 
          ? { ...p, status: 'delivered' as const, fundsReleased: true }
          : p
      ));

      alert(`Funds released successfully! Transaction: ${result.transactionHash}`);
      
    } catch (error: any) {
      console.error('Error releasing funds:', error);
      
      let errorMessage = 'Failed to release funds. ';
      if (error.message.includes('Only sender can call')) {
        errorMessage += 'You are not authorized to release funds for this delivery.';
      } else if (error.message.includes('user rejected')) {
        errorMessage += 'Transaction was rejected.';
      } else if (error.message.includes('Delivery must be marked as delivered first')) {
        errorMessage += 'The delivery must be marked as delivered by the driver first.';
      } else {
        errorMessage += error.message || 'Please try again.';
      }
      
      alert(errorMessage);
    } finally {
      setReleasingFunds(null);
    }
  };

  useEffect(() => {
    fetchUserDeliveries();
  }, [account, isConnected]);

  // Refresh data every 30 seconds
  useEffect(() => {
    if (!isConnected) return;
    
    const interval = setInterval(fetchUserDeliveries, 30000);
    return () => clearInterval(interval);
  }, [isConnected, releasedFunds]); // Add releasedFunds as dependency

  const stats = {
    total: parcels.length,
    pending: parcels.filter(p => p.status === 'pending').length,
    active: parcels.filter(p => p.status === 'accepted' || p.status === 'in-transit').length,
    delivered: parcels.filter(p => p.status === 'delivered').length
  };

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Sender Dashboard</h1>
            <p className="text-gray-400 mt-2">Manage your deliveries and track packages</p>
          </div>
          <Link
            to="/create-parcel"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Create New Parcel</span>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Parcels', value: stats.total, color: 'blue' },
            { label: 'Pending', value: stats.pending, color: 'yellow' },
            { label: 'Active', value: stats.active, color: 'purple' },
            { label: 'Delivered', value: stats.delivered, color: 'green' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-800 rounded-lg p-6 border border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{stat.label}</p>
                  <p className={`text-2xl font-bold text-${stat.color}-400`}>{stat.value}</p>
                </div>
                <Package className={`h-8 w-8 text-${stat.color}-400`} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Parcels List */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">Your Parcels</h2>
              {!isConnected && (
                <p className="text-yellow-400 text-sm">Connect wallet to view your parcels</p>
              )}
            </div>
          </div>
          <div className="divide-y divide-gray-700">
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading your parcels...</p>
              </div>
            ) : !isConnected ? (
              <div className="p-12 text-center">
                <Package className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Connect Your Wallet</h3>
                <p className="text-gray-400">Connect your wallet to view and manage your parcels</p>
              </div>
            ) : parcels.length === 0 ? (
              <div className="p-12 text-center">
                <Package className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No Parcels Found</h3>
                <p className="text-gray-400 mb-4">You haven't created any parcels yet</p>
                <Link
                  to="/create-parcel"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Parcel
                </Link>
              </div>
            ) : (
              parcels.map((parcel, index) => {
              const StatusIcon = getStatusIcon(parcel.status);
              return (
                <motion.div
                  key={parcel.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 hover:bg-gray-700/50 transition-colors duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <StatusIcon className="h-5 w-5 text-gray-400" />
                        <h3 className="text-lg font-semibold text-white">{parcel.item}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(parcel.status)}`}>
                          {parcel.status.charAt(0).toUpperCase() + parcel.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center space-x-2 text-gray-300">
                          <MapPin className="h-4 w-4 text-green-400" />
                          <span className="text-sm">From: {parcel.from}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-300">
                          <MapPin className="h-4 w-4 text-red-400" />
                          <span className="text-sm">To: {parcel.to}</span>
                        </div>
                      </div>

                      {parcel.driver && (
                        <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
                          <h4 className="text-sm font-semibold text-white mb-2 flex items-center">
                            <Truck className="h-4 w-4 mr-2 text-blue-400" />
                            Driver Details
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-300">{parcel.driver.name}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Truck className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-300">{parcel.driver.vehicle}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-300">{parcel.driver.phone}</span>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center space-x-1">
                            <span className="text-yellow-400">★</span>
                            <span className="text-sm text-gray-300">{parcel.driver.rating}/5.0</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right ml-6">
                      <div className="text-2xl font-bold text-green-400">₹{parcel.fee}</div>
                      <div className="text-sm text-gray-400">
                        {parcel.createdAt.toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {parcel.size} package
                      </div>
                      
                      {/* Transaction Details */}
                      {parcel.deliveryId && (
                        <div className="mt-2 text-xs text-gray-500">
                          <div>ID: #{parcel.deliveryId}</div>
                          {parcel.transactionHash && (
                            <a
                              href={`https://testnet.snowtrace.io/tx/${parcel.transactionHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 flex items-center justify-end mt-1"
                            >
                              <span className="mr-1">View on Snowtrace</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      )}
                      
                      {/* Fund Release Button - Only show if not released */}
                      {parcel.status === 'delivered' && parcel.driver && !parcel.fundsReleased && (
                        <div className="mt-3">
                          <button
                            onClick={() => handleReleaseFunds(parcel)}
                            disabled={releasingFunds === parcel.id}
                            className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center space-x-1"
                          >
                            {releasingFunds === parcel.id ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                <span>Releasing...</span>
                              </>
                            ) : (
                              <>
                                <DollarSign className="h-3 w-3" />
                                <span>Release Funds</span>
                              </>
                            )}
                          </button>
                          <div className="text-xs text-gray-500 mt-1">
                            To: {parcel.driver.address?.slice(0, 6)}...{parcel.driver.address?.slice(-4)}
                          </div>
                        </div>
                      )}
                      
                      {/* Show funds released status */}
                      {parcel.status === 'delivered' && parcel.fundsReleased && (
                        <div className="mt-3">
                          <div className="text-xs text-green-400 font-semibold">
                            ✓ Funds Released
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            To: {parcel.driver?.address?.slice(0, 6)}...{parcel.driver?.address?.slice(-4)}
                          </div>
                        </div>
                      )}
                      
                      {/* Escrow Status */}
                      {parcel.status !== 'delivered' && (
                        <div className="mt-2 text-xs text-yellow-400">
                          Funds in Escrow
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SenderDashboard;
