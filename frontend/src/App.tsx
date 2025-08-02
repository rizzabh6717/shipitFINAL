import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WalletProvider } from './contexts/WalletContext';
import { Toaster } from 'react-hot-toast';
import LandingPage from './pages/LandingPage';
import SenderDashboard from './pages/SenderDashboard';
import DriverDashboard from './pages/DriverDashboard';
import CreateParcel from './pages/CreateParcel';
import Navbar from './components/Navbar';
import RoleSelection from './components/RoleSelection';
import SenderRegistration from './components/registration/SenderRegistration';
import DriverRegistration from './components/registration/DriverRegistration';
import AnalyticsPage from './pages/AnalyticsPage';

function App() {
  return (
    <WalletProvider>
      <Router>
        <div className="min-h-screen bg-gray-900 text-white">
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#374151',
                color: '#fff',
              },
            }}
          />
          <Routes>
            {/* Landing page */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Analytics page */}
            <Route path="/analytics" element={<AnalyticsPage />} />
            
            {/* Role selection after wallet connect */}
            <Route path="/select-role" element={<RoleSelection />} />
            
            {/* Registration routes */}
            <Route path="/register/sender" element={<SenderRegistration />} />
            <Route path="/register/driver" element={<DriverRegistration />} />
            
            {/* Sender routes */}
            <Route path="/sender" element={
              <>
                <Navbar />
                <SenderDashboard />
              </>
            } />
            <Route path="/dashboard/sender" element={
              <>
                <Navbar />
                <SenderDashboard />
              </>
            } />
            <Route path="/create-parcel" element={
              <>
                <Navbar />
                <CreateParcel />
              </>
            } />
            
            {/* Driver routes */}
            <Route path="/driver" element={
              <>
                <Navbar />
                <DriverDashboard />
              </>
            } />
            <Route path="/dashboard/driver" element={
              <>
                <Navbar />
                <DriverDashboard />
              </>
            } />
          </Routes>
        </div>
      </Router>
    </WalletProvider>
  );
}

export default App;
