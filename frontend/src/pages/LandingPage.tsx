import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '../contexts/WalletContext';
import { useNavigate } from 'react-router-dom';
import { Truck, Shield, Zap, Users } from 'lucide-react';

const LandingPage: React.FC = () => {
  const { connectWallet, isConnected, setUserRole } = useWallet();
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const navigate = useNavigate();

  const handleConnectWallet = async () => {
    await connectWallet();
    setShowRoleSelection(true);
  };

  const handleRoleSelection = (role: 'sender' | 'driver') => {
    setUserRole(role);
    navigate(`/${role}`);
  };

  const features = [
    {
      icon: Shield,
      title: 'Secure Escrow',
      description: 'Smart contract holds funds until delivery confirmation'
    },
    {
      icon: Zap,
      title: 'Instant Matching',
      description: 'AI-powered route optimization for efficient deliveries'
    },
    {
      icon: Users,
      title: 'Peer-to-Peer',
      description: 'Direct connection between senders and drivers'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/public/new truck.png)',
          filter: 'brightness(0.3)'
        }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 via-gray-900/70 to-transparent" />
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-6">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-3"
          >
            <Truck className="h-8 w-8 text-blue-400" />
            <span className="text-2xl font-bold text-white">ShipIT</span>
          </motion.div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center">
          <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Hero Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
                  Decentralized
                  <span className="text-blue-400 block">Delivery</span>
                  <span className="text-gray-300">Revolution</span>
                </h1>
                <p className="text-xl text-gray-300 max-w-lg">
                  Secure peer-to-peer deliveries powered by blockchain technology. 
                  Connect directly with drivers and senders without intermediaries.
                </p>
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700"
                  >
                    <feature.icon className="h-6 w-6 text-blue-400 mb-2" />
                    <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                    <p className="text-sm text-gray-400">{feature.description}</p>
                  </motion.div>
                ))}
              </div>

              {/* CTA Button */}
              {!showRoleSelection ? (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  onClick={handleConnectWallet}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Connect Wallet & Get Started
                </motion.button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  <h3 className="text-xl font-semibold text-white">Choose your role:</h3>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleRoleSelection('sender')}
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
                    >
                      I'm a Sender
                    </button>
                    <button
                      onClick={() => handleRoleSelection('driver')}
                      className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
                    >
                      I'm a Driver
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Right Column - Stats/Info */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden lg:block space-y-8"
            >
              <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
                <h3 className="text-2xl font-bold text-white mb-6">Platform Stats</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-400">1,247</div>
                    <div className="text-gray-400">Active Drivers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400">5,832</div>
                    <div className="text-gray-400">Deliveries</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-400">99.8%</div>
                    <div className="text-gray-400">Success Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-400">24/7</div>
                    <div className="text-gray-400">Available</div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">How it Works</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white">1</div>
                    <div>
                      <div className="font-semibold text-white">Create Request</div>
                      <div className="text-sm text-gray-400">Post your delivery details</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold text-white">2</div>
                    <div>
                      <div className="font-semibold text-white">Smart Matching</div>
                      <div className="text-sm text-gray-400">AI finds the best driver</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs font-bold text-white">3</div>
                    <div>
                      <div className="font-semibold text-white">Secure Delivery</div>
                      <div className="text-sm text-gray-400">Blockchain-secured payment</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-6 text-center text-gray-400">
          <p>&copy; 2024 ShipIT. Powered by Avalanche Network.</p>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;