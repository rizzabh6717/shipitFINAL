import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { Package, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_ENDPOINTS } from '../config/api';

const RoleSelection: React.FC = () => {
  const { account } = useWallet();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<'sender' | 'driver' | null>(null);

  const checkUserAndRedirect = async (role: 'sender' | 'driver') => {
    if (!account) {
      toast.error('Please connect your wallet first');
      return;
    }

    setLoading(role);

    try {
      // Check if user exists by wallet address
      const response = await fetch(`${API_ENDPOINTS.auth}/user/${account}`);
      const data = await response.json();

      if (data.success && data.userExists) {
        // User exists, redirect to appropriate dashboard
        toast.success(`Welcome back! Redirecting to ${data.role} dashboard...`);
        setTimeout(() => {
          navigate(`/dashboard/${data.role}`);
        }, 1500);
      } else {
        // User does not exist, redirect to registration
        navigate(`/register/${role}`);
      }
    } catch (error) {
      console.error('Error checking user:', error);
      // Backend not available, redirect to registration
      toast.error('Backend not available. Redirecting to registration...');
      navigate(`/register/${role}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Choose Your Role
          </h1>
          <p className="text-gray-400 text-lg">
            Select how you want to use ShipIT platform
          </p>
          {account && (
            <p className="text-gray-500 text-sm mt-2">
              Connected: {account.slice(0, 6)}...{account.slice(-4)}
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Sender Card */}
          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 hover:border-blue-500 transition-colors">
            <div className="text-center">
              <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Sender</h2>
              <p className="text-gray-400 mb-6">
                Send packages and parcels to destinations. Create delivery requests and track your shipments.
              </p>
              <ul className="text-gray-300 text-sm space-y-2 mb-8">
                <li>• Create delivery requests</li>
                <li>• Track package status</li>
                <li>• Manage pickup locations</li>
                <li>• Release funds on delivery</li>
              </ul>
              <button
                onClick={() => checkUserAndRedirect('sender')}
                disabled={loading === 'sender'}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-medium py-3 px-6 rounded-md transition-colors"
              >
                {loading === 'sender' ? 'Checking...' : 'Continue as Sender'}
              </button>
            </div>
          </div>

          {/* Driver Card */}
          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 hover:border-green-500 transition-colors">
            <div className="text-center">
              <div className="bg-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Driver</h2>
              <p className="text-gray-400 mb-6">
                Deliver packages and earn money. Accept delivery jobs and provide proof of delivery.
              </p>
              <ul className="text-gray-300 text-sm space-y-2 mb-8">
                <li>• Accept delivery jobs</li>
                <li>• Earn delivery fees</li>
                <li>• Upload proof of delivery</li>
                <li>• Track earnings</li>
              </ul>
              <button
                onClick={() => checkUserAndRedirect('driver')}
                disabled={loading === 'driver'}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white font-medium py-3 px-6 rounded-md transition-colors"
              >
                {loading === 'driver' ? 'Checking...' : 'Continue as Driver'}
              </button>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            Your role will be verified using your connected wallet address
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
