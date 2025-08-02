import React, { useState } from 'react';
import { Eye, X } from 'lucide-react';

interface SenderPhotoViewerProps {
  photoUrl?: string;
  parcelId: string;
  blockchainParcel?: boolean;
  onFetchPhoto?: (parcelId: string) => Promise<string | null>;
}

const SenderPhotoViewer: React.FC<SenderPhotoViewerProps> = ({ 
  photoUrl, 
  parcelId, 
  blockchainParcel = false, 
  onFetchPhoto 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mongoPhotoUrl, setMongoPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch photo from MongoDB for blockchain parcels
  const fetchMongoPhoto = async () => {
    if (!onFetchPhoto || !parcelId) {
      console.error('Missing onFetchPhoto or parcelId');
      setError('Missing required parameters');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching photo for parcel:', parcelId);
      const url = await onFetchPhoto(parcelId);
      console.log('Received photo URL:', url);
      
      if (url) {
        setMongoPhotoUrl(url);
      } else {
        setError('No photo available for this parcel');
      }
    } catch (err) {
      console.error('Error fetching photo:', err);
      setError(`Failed to load photo: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const displayPhotoUrl = photoUrl || mongoPhotoUrl;

  return (
    <>
      <div className="flex items-center space-x-2">
        <button
          onClick={async () => {
            console.log('View photo clicked for parcel:', parcelId);
            console.log('Current photo URL:', displayPhotoUrl);
            
            if (!displayPhotoUrl && blockchainParcel) {
              await fetchMongoPhoto();
            }
            setIsModalOpen(true);
          }}
          disabled={loading}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Loading...</span>
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              <span>View Parcel Photo</span>
            </>
          )}
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Parcel Photo - Parcel #{parcelId}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-4">
              {displayPhotoUrl ? (
                <img
                  src={displayPhotoUrl}
                  alt={`Parcel ${parcelId}`}
                  className="w-full h-auto max-h-[70vh] object-contain rounded"
                />
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-500">
                    {error ? (
                      <div>
                        <p className="text-red-500 mb-2">{error}</p>
                        <button
                          onClick={fetchMongoPhoto}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          Retry
                        </button>
                      </div>
                    ) : (
                      <p>No photo available for this parcel</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end p-4 border-t">
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SenderPhotoViewer;
