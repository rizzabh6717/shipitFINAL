import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer } from 'react-leaflet';
import { Package, MapPin, DollarSign, Calendar, Truck, ExternalLink, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';

interface ParcelData {
  fromAddress: string;
  toAddress: string;
  itemDescription: string;
  itemValue: number;
  size: 'small' | 'medium' | 'large';
  weight: number;
  pickupDate: string;
  pickupTime: string;
  specialInstructions: string;
}

const CreateParcel: React.FC = () => {
  const { account, createDelivery, isConnected } = useWallet();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [deliveryId, setDeliveryId] = useState<string | null>(null);
  const [parcelData, setParcelData] = useState<ParcelData>({
    fromAddress: '',
    toAddress: '',
    itemDescription: '',
    itemValue: 0,
    size: 'medium',
    weight: 0,
    pickupDate: '',
    pickupTime: '',
    specialInstructions: ''
  });

  const [estimatedFee, setEstimatedFee] = useState(0);

  const sizeOptions = [
    { value: 'small', label: 'Small', description: 'Up to 30cm x 30cm x 30cm', basePrice: 80 },
    { value: 'medium', label: 'Medium', description: 'Up to 60cm x 60cm x 60cm', basePrice: 200 },
    { value: 'large', label: 'Large', description: 'Up to 120cm x 120cm x 120cm', basePrice: 400 }
  ];

  const calculateFee = () => {
    const sizeMultiplier = sizeOptions.find(s => s.value === parcelData.size)?.basePrice || 200;
    const weightMultiplier = Math.max(1, parcelData.weight * 0.5);
    const valueMultiplier = Math.max(1, parcelData.itemValue * 0.001);
    const estimated = sizeMultiplier * weightMultiplier * valueMultiplier;
    setEstimatedFee(Math.round(estimated));
  };

  React.useEffect(() => {
    calculateFee();
  }, [parcelData.size, parcelData.weight, parcelData.itemValue]);

  const handleInputChange = (field: keyof ParcelData, value: string | number) => {
    setParcelData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!account || !isConnected) {
      alert('Please connect your wallet first.');
      return;
    }

    if (!parcelData.fromAddress || !parcelData.toAddress || !parcelData.itemDescription) {
      alert('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    
    try {
      console.log('Creating delivery on blockchain...');
      
      // Create delivery on smart contract
      const result = await createDelivery(
        parcelData.fromAddress,
        parcelData.toAddress,
        parcelData.itemDescription,
        parcelData.itemValue,
        estimatedFee
      );

      console.log('Blockchain transaction successful:', result);
      
      setTransactionHash(result.transactionHash);
      setDeliveryId(result.deliveryId);

      // Store additional data in backend database
      const { size, ...restOfParcelData } = parcelData;
      const backendData = {
        ...restOfParcelData,
        sizeTier: size.charAt(0).toUpperCase() + size.slice(1),
        senderAddress: account,
        feeInINR: estimatedFee,
        escrowAmountInAVAX: result.escrowAmount,
        transactionHash: result.transactionHash,
        deliveryId: result.deliveryId,
        status: 'pending'
      };

      try {
        const response = await fetch('http://localhost:5001/api/parcels', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(backendData),
        });

        if (!response.ok) {
          console.warn('Backend storage failed, but blockchain transaction succeeded');
          console.warn('Backend might not be running. Start with: cd backend && npm run dev');
        } else {
          console.log('Parcel data stored in backend successfully');
        }
      } catch (backendError) {
        console.warn('Backend storage failed:', backendError);
        console.warn('Make sure backend is running on http://localhost:5001');
        // Don't throw here as the blockchain transaction succeeded
      }

      // Move to success step
      setStep(5);
      
    } catch (error: any) {
      console.error('Failed to create delivery:', error);
      
      let errorMessage = 'Failed to create delivery. ';
      if (error.message.includes('insufficient funds')) {
        errorMessage += 'Insufficient AVAX balance for transaction.';
      } else if (error.message.includes('user rejected')) {
        errorMessage += 'Transaction was rejected.';
      } else {
        errorMessage += error.message || 'Please try again.';
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Pickup & Delivery Locations</h2>
              <p className="text-gray-400">Enter the pickup and delivery addresses</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <MapPin className="h-4 w-4 inline mr-2 text-green-400" />
                  Pickup Address
                </label>
                <input
                  type="text"
                  value={parcelData.fromAddress}
                  onChange={(e) => handleInputChange('fromAddress', e.target.value)}
                  placeholder="Enter pickup address (e.g., Mumbai, Maharashtra)"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <MapPin className="h-4 w-4 inline mr-2 text-red-400" />
                  Delivery Address
                </label>
                <input
                  type="text"
                  value={parcelData.toAddress}
                  onChange={(e) => handleInputChange('toAddress', e.target.value)}
                  placeholder="Enter delivery address (e.g., Pune, Maharashtra)"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Map placeholder */}
            <div className="bg-gray-700 rounded-lg h-64 flex items-center justify-center border border-gray-600">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-400">Route will be displayed here</p>
                <p className="text-sm text-gray-500 mt-1">Interactive map with pickup and delivery points</p>
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Package Details</h2>
              <p className="text-gray-400">Describe your package and its specifications</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Item Description</label>
                <input
                  type="text"
                  value={parcelData.itemDescription}
                  onChange={(e) => handleInputChange('itemDescription', e.target.value)}
                  placeholder="What are you shipping? (e.g., Electronics, Documents, Clothes)"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Item Value (₹)</label>
                  <input
                    type="number"
                    value={parcelData.itemValue}
                    onChange={(e) => handleInputChange('itemValue', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Weight (kg)</label>
                  <input
                    type="number"
                    value={parcelData.weight}
                    onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 0)}
                    placeholder="0.0"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Package Size</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {sizeOptions.map((option) => (
                    <div
                      key={option.value}
                      onClick={() => handleInputChange('size', option.value)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        parcelData.size === option.value
                          ? 'border-blue-500 bg-blue-900/20'
                          : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                      }`}
                    >
                      <div className="text-center">
                        <Package className={`h-8 w-8 mx-auto mb-2 ${
                          parcelData.size === option.value ? 'text-blue-400' : 'text-gray-400'
                        }`} />
                        <h3 className="font-semibold text-white">{option.label}</h3>
                        <p className="text-xs text-gray-400 mt-1">{option.description}</p>
                        <p className="text-sm text-green-400 mt-2">Base: ₹{option.basePrice}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Schedule & Instructions</h2>
              <p className="text-gray-400">When should we pick up your package?</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Calendar className="h-4 w-4 inline mr-2 text-blue-400" />
                    Pickup Date
                  </label>
                  <input
                    type="date"
                    value={parcelData.pickupDate}
                    onChange={(e) => handleInputChange('pickupDate', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Pickup Time</label>
                  <select
                    value={parcelData.pickupTime}
                    onChange={(e) => handleInputChange('pickupTime', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select time window</option>
                    <option value="morning">Morning (8AM - 12PM)</option>
                    <option value="afternoon">Afternoon (12PM - 5PM)</option>
                    <option value="evening">Evening (5PM - 8PM)</option>
                    <option value="flexible">Flexible</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Special Instructions</label>
                <textarea
                  value={parcelData.specialInstructions}
                  onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                  placeholder="Any special handling instructions, access codes, or notes for the driver..."
                  rows={4}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Review & Confirm</h2>
              <p className="text-gray-400">Review your parcel details and confirm the delivery</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Parcel Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Item:</span>
                  <span className="text-white">{parcelData.itemDescription}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">From:</span>
                  <span className="text-white">{parcelData.fromAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">To:</span>
                  <span className="text-white">{parcelData.toAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Size:</span>
                  <span className="text-white capitalize">{parcelData.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Weight:</span>
                  <span className="text-white">{parcelData.weight} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Value:</span>
                  <span className="text-white">₹{parcelData.itemValue}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Pickup:</span>
                  <span className="text-white">{parcelData.pickupDate} - {parcelData.pickupTime}</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 rounded-lg p-6 border border-green-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white flex items-center">
                    <DollarSign className="h-5 w-5 mr-2 text-green-400" />
                    Estimated Delivery Fee
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">This amount will be held in escrow</p>
                </div>
                <div className="text-3xl font-bold text-green-400">₹{estimatedFee}</div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h4 className="font-semibold text-white mb-2">How it works:</h4>
              <ol className="text-sm text-gray-400 space-y-1">
                <li>1. Your payment is held securely in a smart contract</li>
                <li>2. A driver will accept and pick up your parcel</li>
                <li>3. You'll receive real-time tracking updates</li>
                <li>4. Confirm delivery to release payment to the driver</li>
              </ol>
            </div>
          </motion.div>
        );

      case 5:
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
          >
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-white" />
              </div>
            </div>
            
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Delivery Created Successfully!</h2>
              <p className="text-gray-400">Your parcel has been created and funds are secured in escrow</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Transaction Details</h3>
              
              <div className="space-y-3 text-left">
                <div className="flex justify-between">
                  <span className="text-gray-400">Delivery ID:</span>
                  <span className="text-white font-mono">#{deliveryId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Escrow Amount:</span>
                  <span className="text-green-400 font-semibold">₹{estimatedFee}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Transaction Hash:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-mono text-sm">
                      {transactionHash?.slice(0, 10)}...{transactionHash?.slice(-8)}
                    </span>
                    <a
                      href={`https://snowtrace.io/tx/${transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-700/50">
              <h4 className="font-semibold text-white mb-2">What's Next?</h4>
              <ul className="text-sm text-gray-400 space-y-1 text-left">
                <li>• Your parcel is now visible to drivers on the platform</li>
                <li>• You'll be notified when a driver accepts your delivery</li>
                <li>• Track your parcel's progress in your dashboard</li>
                <li>• Confirm delivery to release funds to the driver</li>
              </ul>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => navigate('/sender')}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => {
                  setStep(1);
                  setTransactionHash(null);
                  setDeliveryId(null);
                  setParcelData({
                    fromAddress: '',
                    toAddress: '',
                    itemDescription: '',
                    itemValue: 0,
                    size: 'medium',
                    weight: 0,
                    pickupDate: '',
                    pickupTime: '',
                    specialInstructions: ''
                  });
                }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
              >
                Create Another
              </button>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-white">Create New Parcel</h1>
            <div className="text-sm text-gray-400">Step {step} of 4</div>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 mb-8">
          {renderStep()}
        </div>

        {/* Navigation Buttons */}
        {step < 5 && (
          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={step === 1 || loading}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                step === 1 || loading
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              Previous
            </button>

            {step < 4 ? (
              <button
                onClick={handleNext}
                disabled={loading}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading || !isConnected}
                className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Creating Delivery...</span>
                  </>
                ) : (
                  <>
                    <Truck className="h-5 w-5" />
                    <span>Create Parcel & Pay Escrow</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateParcel;