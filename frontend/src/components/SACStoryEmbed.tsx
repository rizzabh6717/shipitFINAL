import React, { useEffect, useState } from 'react';

interface SACStoryEmbedProps {
  storyUrl?: string;
  height?: string;
  width?: string;
  token?: string; // Optional authentication token
}

const SACStoryEmbed: React.FC<SACStoryEmbedProps> = ({ 
  // Replace with your actual SAC story URL
  storyUrl = 'https://basic-trial-sac.cfapps.ap11.hana.ondemand.com/sap/fpa/ui/tenants/b265d/bo/story/FDF0490652444A2543FCE686D3B0C38A',
  height = '100vh',
  width = '100%',
  token
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actualUrl, setActualUrl] = useState(storyUrl);

  useEffect(() => {
    // Check if we have a valid SAC story URL
    if (storyUrl && storyUrl.includes('sapanalytics.cloud')) {
      setActualUrl(storyUrl);
    } else {
      setError('Please provide your actual SAC story URL');
    }
  }, [storyUrl]);

  // Construct URL with authentication if token provided
  const getSacUrl = () => {
    let url = actualUrl;
    if (token) {
      url += `?token=${token}`;
    }
    return url;
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setError('Failed to load SAC story. Please check your story URL and permissions.');
    setIsLoading(false);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-gray-100 rounded-lg p-6">
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-gray-700 text-center mb-4">{error}</p>
        <div className="text-sm text-gray-600 text-center">
          <p>Steps to fix:</p>
          <ol className="text-left mt-2 space-y-1">
            <li>1. Open your SAC story</li>
            <li>2. Click Share → Embed</li>
            <li>3. Copy the embed URL</li>
            <li>4. Replace the placeholder URL in code</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      {isLoading && (
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      <iframe
        src={getSacUrl()}
        width={width}
        height={height}
        frameBorder="0"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        allowFullScreen
        title="SAP Analytics Cloud Story"
        className="w-full h-full border-0 rounded-lg shadow-lg"
        style={{ display: isLoading ? 'none' : 'block' }}
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      />
      
      <div className="mt-4 text-sm text-gray-600">
        <p className="text-center">
          <strong>Note:</strong> Ensure your SAC story is publicly accessible or properly authenticated
        </p>
      </div>
    </div>
  );
};

export default SACStoryEmbed;
