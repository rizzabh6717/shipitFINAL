import React from 'react';

const AnalyticsPage: React.FC = () => {
  return (
    <div className="min-h-screen w-screen bg-black flex flex-col">
      {/* Header */}
      <div className="bg-black p-4">
        <h1 className="text-white text-xl font-bold text-center">Analytics</h1>
      </div>
      
      {/* Photo */}
      <div className="flex-1 flex items-center justify-center">
        <img
          src="https://i.postimg.cc/26XkSY7P/Screenshot-2025-08-01-210626.png"
          alt="Analytics Dashboard"
          className="max-w-full max-h-full object-contain"
        />
      </div>
    </div>
  );
};

export default AnalyticsPage;
