import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { Coins } from 'lucide-react';
import { Truck, User, LogOut, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar: React.FC = () => {
  const { account, userRole, balance, disconnect } = useWallet();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: `/${userRole}`, current: location.pathname === `/${userRole}` },
    ...(userRole === 'sender' ? [
      { name: 'Create Parcel', href: '/create-parcel', current: location.pathname === '/create-parcel' }
    ] : [])
  ];

  const handleDisconnect = () => {
    disconnect();
    setIsUserMenuOpen(false);
  };

  return (
    <nav className="bg-gray-800/95 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3">
              <Truck className="h-8 w-8 text-blue-400" />
              <span className="text-xl font-bold text-white">ShipIT</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    item.current
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Role Badge */}
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              userRole === 'sender' 
                ? 'bg-green-900/50 text-green-300 border border-green-700' 
                : 'bg-orange-900/50 text-orange-300 border border-orange-700'
            }`}>
              {userRole?.charAt(0).toUpperCase() + userRole?.slice(1)}
            </div>

            {/* Balance Display */}
            <div className="flex items-center space-x-2 bg-gray-900/50 border border-gray-700 px-3 py-1 rounded-full">
              <Coins className="h-4 w-4 text-yellow-400" />
              <span className="text-sm font-medium text-white">
                {typeof balance === 'number' ? balance.toFixed(4) : '...'}
              </span>
              <span className="text-xs text-gray-400">AVAX</span>
            </div>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg transition-colors duration-200"
              >
                <User className="h-4 w-4 text-gray-300" />
                <span className="text-sm text-gray-300 hidden sm:block">
                  {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Account'}
                </span>
              </button>

              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-1"
                  >
                    <div className="px-4 py-2 border-b border-gray-700">
                      <p className="text-sm text-gray-400">Connected as</p>
                      <p className="text-sm font-medium text-white truncate">{account}</p>
                    </div>
                    <button
                      onClick={handleDisconnect}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center space-x-2"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Disconnect</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-700"
            >
              <div className="px-2 pt-2 pb-3 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                      item.current
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;