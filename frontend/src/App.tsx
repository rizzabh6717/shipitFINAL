import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WalletProvider } from './contexts/WalletContext';
import LandingPage from './pages/LandingPage';
import SenderDashboard from './pages/SenderDashboard';
import DriverDashboard from './pages/DriverDashboard';
import CreateParcel from './pages/CreateParcel';
import Navbar from './components/Navbar';

function App() {
  return (
    <WalletProvider>
      <Router>
        <div className="min-h-screen bg-gray-900 text-white">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/sender" element={
              <>
                <Navbar />
                <SenderDashboard />
              </>
            } />
            <Route path="/driver" element={
              <>
                <Navbar />
                <DriverDashboard />
              </>
            } />
            <Route path="/create-parcel" element={
              <>
                <Navbar />
                <CreateParcel />
              </>
            } />
          </Routes>
        </div>
      </Router>
    </WalletProvider>
  );
}

export default App;