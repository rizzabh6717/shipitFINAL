import { ethers } from 'ethers';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Package, DollarSign, Clock, CheckCircle, Route, Filter, Truck, ExternalLink } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';

// Interfaces defining the shape of our data
interface AvailableParcel {
  id: string;
  deliveryId: string;
  from: string;
  to: string;
  item: string;
  size: 'small' | 'medium' | 'large';
  fee: number;
  distance?: number;
  pickupTime?: string;
  sender?: {
    name: string;
    rating: number;
    address: string;
  };
  transactionHash?: string;
  escrowAmount?: string;
}

interface AcceptedParcel {
  id: string;
  deliveryId: string;
  from: string;
  to: string;
  item: string;
  fee: number;
  status: 'accepted' | 'picked-up' | 'in-transit' | 'delivered';
  sender: {
    name: string;
    phone: string;
    address: string;
  };
  transactionHash?: string;
  escrowAmount?: string;
}

// Main Driver Dashboard Component
const DriverDashboard: React.FC = () => {
  const { account, getAvailableDeliveries, acceptDelivery, isConnected, contract, markAsDelivered, markAsPickedUp } = useWallet();

  // State variables for UI and data management
  const [activeTab, setActiveTab] = useState<'available' | 'accepted'>('available');
  const [sizeFilter, setSizeFilter] = useState<'all' | 'small' | 'medium' | 'large'>('all');
  const [tripConfirmed, setTripConfirmed] = useState(false);
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');

  const [availableParcels, setAvailableParcels] = useState<AvailableParcel[]>([]);
  const [acceptedParcels, setAcceptedParcels] = useState<AcceptedParcel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptingParcel, setAcceptingParcel] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Function to fetch available parcels from blockchain
  const fetchAvailableParcels = async (isInitialLoad = false) => {
    if (!isConnected) {
      setLoading(false);
      return;
    }

    if (isInitialLoad) {
      setLoading(true);
    }

    try {
      const deliveries = await getAvailableDeliveries();

      // DEBUG: Check raw data
      console.log('🔍 Raw deliveries from getAvailableDeliveries:', deliveries);
      console.log('🔍 Number of deliveries:', deliveries.length);

      // Transform blockchain data to match frontend interface
      const transformedParcels: AvailableParcel[] = deliveries
        .filter((delivery: any) => {
          // Only show deliveries if trip is confirmed and route matches
          if (!tripConfirmed) {
            console.log('Trip not confirmed yet - hiding all deliveries');
            return false; // Don't show any deliveries until trip is confirmed
          }

          if (tripConfirmed && fromLocation && toLocation) {
            const fromMatch = delivery.fromAddress.toLowerCase().includes(fromLocation.toLowerCase());
            const toMatch = delivery.toAddress.toLowerCase().includes(toLocation.toLowerCase());

            console.log(`Checking delivery: ${delivery.fromAddress} -> ${delivery.toAddress}`);
            console.log(`Your route: ${fromLocation} -> ${toLocation}`);
            console.log(`From match: ${fromMatch}, To match: ${toMatch}`);

            // Show delivery if it matches your route (both from and to should match)
            const matches = fromMatch && toMatch;
            console.log(`Delivery ${matches ? 'MATCHES' : 'DOES NOT MATCH'} your route`);
            return matches;
          }

          return false; // Don't show if trip not confirmed
        })
        .map((delivery: any) => {
          console.log('🔍 Transforming delivery:', delivery);
          return {
            id: delivery.id.toString(),
            deliveryId: delivery.id.toString(),
            from: delivery.fromAddress,
            to: delivery.toAddress,
            item: delivery.itemDescription,
            size: 'medium' as const,
            fee: Math.round(parseFloat(delivery.deliveryFee) * 3333),
            sender: {
              name: `${delivery.sender.slice(0, 6)}...${delivery.sender.slice(-4)}`,
              rating: 4.5,
              address: delivery.sender
            },
            distance: 150,
            pickupTime: 'Flexible',
            transactionHash: delivery.transactionHash,
            escrowAmount: delivery.escrowAmount
          };
        });

      console.log('🔍 Final transformedParcels:', transformedParcels);
      console.log('🔍 Setting availableParcels with:', transformedParcels.length, 'items');

      setAvailableParcels(transformedParcels);
      if (isInitialLoad) setError(null);
    } catch (err: any) {
      console.error('🔍 Error in fetchAvailableParcels:', err);
      if (isInitialLoad) {
        setError(err.message);
      } else {
        console.error("Polling for parcels failed:", err);
      }
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  // Function to fetch accepted parcels for the current driver
  const fetchAcceptedParcels = async () => {
    if (!isConnected || !account || !contract) return;

    try {
      console.log('Fetching accepted parcels for driver:', account);

      // Get ALL deliveries, not just available ones
      const deliveryCounter = await contract.deliveryCounter();
      const myAcceptedParcels = [];

      for (let i = 1; i <= deliveryCounter; i++) {
        try {
          const delivery = await contract.getDelivery(i);
          // Check if this delivery is assigned to current driver and not pending
          if (delivery.driver.toLowerCase() === account.toLowerCase() && Number(delivery.status) >= 1) {
            myAcceptedParcels.push({
              id: i,
              sender: delivery.sender,
              driver: delivery.driver,
              fromAddress: delivery.fromAddress,
              toAddress: delivery.toAddress,
              itemDescription: delivery.itemDescription,
              itemValue: delivery.itemValue.toString(),
              deliveryFee: ethers.formatEther(delivery.deliveryFee),
              escrowAmount: ethers.formatEther(delivery.escrowAmount),
              status: Number(delivery.status)
            });
          }
        } catch (error) {
          console.error(`Error fetching delivery ${i}:`, error);
        }
      }

      const transformedParcels: AcceptedParcel[] = myAcceptedParcels.map((delivery: any) => ({
        id: delivery.id.toString(),
        deliveryId: delivery.id.toString(),
        from: delivery.fromAddress,
        to: delivery.toAddress,
        item: delivery.itemDescription,
        fee: Math.round(parseFloat(delivery.deliveryFee) * 3333),
        status: delivery.status === 1 ? 'accepted' :
                delivery.status === 2 ? 'in-transit' : 'delivered',
        sender: {
          name: `${delivery.sender.slice(0, 6)}...${delivery.sender.slice(-4)}`,
          phone: '+91 XXXXX XXXXX',
          address: delivery.sender
        },
        escrowAmount: delivery.escrowAmount
      }));

      setAcceptedParcels(transformedParcels);
      console.log('Found accepted parcels:', transformedParcels);
    } catch (err: any) {
      console.error("Failed to fetch accepted parcels:", err);
    }
  };

  // Effect to fetch initial data on component mount
  useEffect(() => {
    if (isConnected) {
      fetchAvailableParcels(true);
      fetchAcceptedParcels();
    }
  }, [isConnected, account]);

  // Effect to handle polling for available parcels
  useEffect(() => {
    if (!isConnected) return;

    const intervalId = setInterval(() => {
      fetchAvailableParcels(false);
      fetchAcceptedParcels(); // Also refresh accepted parcels
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(intervalId);
  }, [isConnected]);

  // Add this new useEffect to refetch when trip is confirmed
  useEffect(() => {
    if (isConnected && tripConfirmed) {
      console.log('Trip confirmed - refetching parcels...');
      fetchAvailableParcels(true);
    }
  }, [tripConfirmed]);

  // Handler to accept a parcel
  const handleAcceptParcel = async (parcel: AvailableParcel) => {
    if (!acceptDelivery || !parcel.deliveryId) {
      alert('Unable to accept delivery. Missing delivery information.');
      return;
    }

    try {
      setAcceptingParcel(parcel.id);

      const result = await acceptDelivery(parseInt(parcel.deliveryId));

      console.log('Delivery accepted successfully:', result);

      // Create accepted parcel object
      const newAcceptedParcel: AcceptedParcel = {
        id: parcel.id,
        deliveryId: parcel.deliveryId,
        from: parcel.from,
        to: parcel.to,
        item: parcel.item,
        fee: parcel.fee,
        status: 'accepted',
        sender: {
          name: parcel.sender?.name || 'Unknown Sender',
          phone: '+91 XXXXX XXXXX',
          address: parcel.sender?.address || ''
        },
        transactionHash: result.transactionHash,
        escrowAmount: parcel.escrowAmount
      };

      // Add to accepted list and remove from available list
      setAcceptedParcels(prev => [...prev, newAcceptedParcel]);
      setAvailableParcels(prev => prev.filter(p => p.id !== parcel.id));

      // Refresh data from blockchain to keep in sync
      setTimeout(() => {
        fetchAcceptedParcels();
      }, 2000); // Wait 2 seconds for blockchain to update

      alert(`Delivery accepted successfully! Transaction: ${result.transactionHash}`);

    } catch (error: any) {
      console.error('Error accepting delivery:', error);

      let errorMessage = 'Failed to accept delivery. ';
      if (error.message.includes('user rejected')) {
        errorMessage += 'Transaction was rejected.';
      } else {
        errorMessage += error.message || 'Please try again.';
      }

      alert(errorMessage);
    } finally {
      setAcceptingParcel(null);
    }
  };

  // Handler for updating parcel status (pickup, transit, delivered)
  const handleUpdateStatus = async (parcel: AcceptedParcel, newStatus: 'picked-up' | 'in-transit' | 'delivered') => {
    try {
      setUpdatingStatus(parcel.id);

      // Call smart contract function based on status
      if (newStatus === 'delivered') {
        console.log('Calling markAsDelivered on blockchain...');
        const result = await markAsDelivered(parseInt(parcel.deliveryId));
        console.log('✅ Marked as delivered on blockchain:', result);
      } else if (newStatus === 'picked-up') {
        console.log('Calling markAsPickedUp on blockchain...');
        const result = await markAsPickedUp(parseInt(parcel.deliveryId));
        console.log('✅ Marked as picked up on blockchain:', result);
      }

      // Update local state immediately for better UX
      setAcceptedParcels(prev => prev.map(p =>
        p.id === parcel.id
          ? { ...p, status: newStatus }
          : p
      ));

      let message = '';
      switch (newStatus) {
        case 'picked-up':
          message = 'Parcel marked as picked up on blockchain!';
          break;
        case 'in-transit':
          message = 'Parcel is now in transit!';
          break;
        case 'delivered':
          message = 'Parcel marked as delivered on blockchain! Sender can now release funds.';
          break;
      }

      alert(message);

    } catch (error: any) {
      console.error('Error updating status on blockchain:', error);

      let errorMessage = 'Failed to update status on blockchain. ';
      if (error.message.includes('user rejected')) {
        errorMessage += 'Transaction was rejected.';
      } else {
        errorMessage += error.message || 'Please try again.';
      }

      alert(errorMessage);

      // Revert the status change on error
      setAcceptedParcels(prev => prev.map(p =>
        p.id === parcel.id
          ? { ...p, status: parcel.status }
          : p
      ));
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Handler for confirming or clearing the trip route
  const handleConfirmTrip = () => {
    console.log('handleConfirmTrip called, current state:', { tripConfirmed, fromLocation, toLocation });

    if (tripConfirmed) {
      // Clear Route action
      console.log('Clearing route...');
      setTripConfirmed(false);
      setFromLocation('');
      setToLocation('');
      fetchAvailableParcels(true);
    } else {
      // Confirm Trip action
      console.log('Confirming trip...');
      if (fromLocation && toLocation) {
        console.log('Setting tripConfirmed to true');
        setTripConfirmed(true);
        fetchAvailableParcels(true);
      } else {
        console.log('Missing fromLocation or toLocation');
      }
    }
  };

  // Filter available parcels based on size filter
  const filteredParcels = availableParcels.filter(parcel => {
    return sizeFilter === 'all' || parcel.size === sizeFilter;
  });

  // Helper functions for dynamic styling
  const getSizeColor = (size: string) => {
    switch (size) {
      case 'small': return 'text-green-400 bg-green-900/20 border-green-700';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20 border-yellow-700';
      case 'large': return 'text-red-400 bg-red-900/20 border-red-700';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'text-blue-400 bg-blue-900/20 border-blue-700';
      case 'picked-up': return 'text-purple-400 bg-purple-900/20 border-purple-700';
      case 'in-transit': return 'text-orange-400 bg-orange-900/20 border-orange-700';
      case 'delivered': return 'text-green-400 bg-green-900/20 border-green-700';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-700';
    }
  };

  // JSX for the component
  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Driver Dashboard</h1>
          <p className="text-gray-400 mt-2">Find deliveries along your route and manage accepted parcels</p>
        </div>

        {/* Trip Route Input */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Route className="h-5 w-5 mr-2 text-blue-400" />
            Your Trip Route
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Starting Point</label>
              <input
                type="text"
                placeholder="e.g., 'Mumbai'"
                value={fromLocation}
                onChange={(e) => setFromLocation(e.target.value)}
                className="w-full p-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={tripConfirmed}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Destination</label>
              <input
                type="text"
                placeholder="e.g., 'Delhi'"
                value={toLocation}
                onChange={(e) => setToLocation(e.target.value)}
                className="w-full p-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={tripConfirmed}
              />
            </div>
            <div className="md:col-span-1">
              <button
                onClick={handleConfirmTrip}
                className={`w-full text-white font-bold py-2 px-4 rounded-lg transition-colors ${
                  tripConfirmed
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {tripConfirmed ? 'Clear Route' : 'Confirm Trip'}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg mb-6">
          <button
            onClick={() => setActiveTab('available')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
              activeTab === 'available'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            Available Parcels ({filteredParcels.length})
          </button>
          <button
            onClick={() => setActiveTab('accepted')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
              activeTab === 'accepted'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            Accepted Parcels ({acceptedParcels.length})
          </button>
        </div>

        {/* Available Parcels Tab */}
        {activeTab === 'available' && (
          <div>
            {/* Filters */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-400">Filter by size:</span>
              </div>
              <select
                value={sizeFilter}
                onChange={(e) => setSizeFilter(e.target.value as any)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Sizes</option>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>

            {/* Available Parcels List */}
            {loading && (
              <div className="col-span-full text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading available parcels...</p>
              </div>
            )}
            {error && (
              <div className="col-span-full text-center py-12 bg-red-900/20 rounded-lg border border-red-700">
                <p className="text-red-400">Error: {error}</p>
                <button
                  onClick={() => fetchAvailableParcels(true)}
                  className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            )}
            {!loading && !error && !isConnected && (
              <div className="col-span-full text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
                <Package className="mx-auto h-12 w-12 text-gray-500" />
                <h3 className="mt-2 text-lg font-medium text-white">Connect Your Wallet</h3>
                <p className="mt-1 text-sm text-gray-400">Connect your wallet to view available deliveries</p>
              </div>
            )}
            {!loading && !error && isConnected && filteredParcels.length === 0 && (
              <div className="col-span-full text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
                <Package className="mx-auto h-12 w-12 text-gray-500" />
                <h3 className="mt-2 text-lg font-medium text-white">No Available Parcels</h3>
                <p className="mt-1 text-sm text-gray-400">
                  {tripConfirmed ? "No parcels match your current route." : "Set your route and confirm trip to see available parcels."}
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {!loading && !error && isConnected && filteredParcels.map((parcel, index) => (
                <motion.div
                  key={parcel.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors duration-200"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-white">{parcel.item}</h3>
                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-full border ${getSizeColor(parcel.size)}`}
                    >
                      {parcel.size.charAt(0).toUpperCase() + parcel.size.slice(1)}
                    </span>
                  </div>

                  <div className="space-y-3 text-sm text-gray-300">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-3 text-gray-400" />
                      <span>
                        <span className="font-semibold text-gray-100">From:</span> {parcel.from}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-3 text-gray-400" />
                      <span>
                        <span className="font-semibold text-gray-100">To:</span> {parcel.to}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-3 text-gray-400" />
                      <span>
                        <span className="font-semibold text-gray-100">Fee:</span> ₹{parcel.fee}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-3 text-gray-400" />
                      <span>
                        <span className="font-semibold text-gray-100">Pickup:</span> {parcel.pickupTime}
                      </span>
                    </div>
                  </div>

                  {/* Blockchain Details */}
                  <div className="mt-4 p-3 bg-gray-700/50 rounded-lg">
                    <div className="text-xs text-gray-400 space-y-1">
                      <div>Delivery ID: #{parcel.deliveryId}</div>
                      <div>Escrow: {parcel.escrowAmount} AVAX</div>
                      <div>Sender: {parcel.sender?.address.slice(0, 10)}...{parcel.sender?.address.slice(-6)}</div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mr-3">
                        <span className="text-sm font-bold text-white">{parcel.sender?.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{parcel.sender?.name}</p>
                        <p className="text-xs text-gray-400">Rating: {parcel.sender?.rating} ★</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAcceptParcel(parcel)}
                      disabled={acceptingParcel === parcel.id}
                      className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center"
                    >
                      {acceptingParcel === parcel.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Accepting...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Accept
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Accepted Parcels Tab */}
        {activeTab === 'accepted' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {acceptedParcels.length > 0 ? (
              acceptedParcels.map((parcel, index) => (
                <motion.div
                  key={parcel.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-800 rounded-lg p-6 border border-gray-700"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-white">{parcel.item}</h3>
                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(parcel.status)}`}
                    >
                      {parcel.status.charAt(0).toUpperCase() + parcel.status.slice(1)}
                    </span>
                  </div>
                  <div className="space-y-3 text-sm text-gray-300 mb-6">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-3 text-gray-400" />
                      <span>
                        <span className="font-semibold text-gray-100">From:</span> {parcel.from}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-3 text-gray-400" />
                      <span>
                        <span className="font-semibold text-gray-100">To:</span> {parcel.to}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-3 text-gray-400" />
                      <span>
                        <span className="font-semibold text-gray-100">Fee:</span> ₹{parcel.fee}
                      </span>
                    </div>
                  </div>

                  {/* Blockchain Details */}
                  <div className="mb-4 p-3 bg-gray-700/50 rounded-lg">
                    <div className="text-xs text-gray-400 space-y-1">
                      <div>Delivery ID: #{parcel.deliveryId}</div>
                      <div>Escrow: {parcel.escrowAmount} AVAX</div>
                      {parcel.transactionHash && (
                        <div className="flex items-center">
                          <span className="mr-2">Transaction:</span>
                          <a
                            href={`https://testnet.snowtrace.io/tx/${parcel.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 flex items-center"
                          >
                            <span className="mr-1">{parcel.transactionHash.slice(0, 8)}...{parcel.transactionHash.slice(-6)}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-gray-700 pt-4">
                    <h4 className="text-md font-semibold text-white mb-2">Sender Information</h4>
                    <p className="text-sm text-gray-300">Address: {parcel.sender.address.slice(0, 10)}...{parcel.sender.address.slice(-8)}</p>
                    <p className="text-sm text-gray-300">Phone: {parcel.sender.phone}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 flex space-x-3">
                    {parcel.status === 'accepted' && (
                      <button
                        onClick={() => handleUpdateStatus(parcel, 'picked-up')}
                        disabled={updatingStatus === parcel.id}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center"
                      >
                        {updatingStatus === parcel.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Updating...
                          </>
                        ) : (
                          <>
                            <Truck className="h-4 w-4 mr-2" />
                            Mark as Picked
                          </>
                        )}
                      </button>
                    )}
                    {parcel.status === 'picked-up' && (
                      <button
                        onClick={() => handleUpdateStatus(parcel, 'delivered')}
                        disabled={updatingStatus === parcel.id}
                        className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center"
                      >
                        {updatingStatus === parcel.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Updating...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Parcel Delivered
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
                <Package className="mx-auto h-12 w-12 text-gray-500" />
                <h3 className="mt-2 text-lg font-medium text-white">No Accepted Parcels</h3>
                <p className="mt-1 text-sm text-gray-400">You haven't accepted any deliveries yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;
