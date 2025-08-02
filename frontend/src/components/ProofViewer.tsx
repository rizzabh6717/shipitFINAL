import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface ProofViewerProps {
  parcelId: string;
  proofPhoto: string;
  proofUploadTime: string;
  onReleaseFunds: () => void;
  onClose: () => void;
}

const ProofViewer: React.FC<ProofViewerProps> = ({
  parcelId,
  proofPhoto,
  proofUploadTime,
  onReleaseFunds,
  onClose
}) => {
  const [releasingFunds, setReleasingFunds] = useState(false);

  const handleReleaseFunds = async () => {
    setReleasingFunds(true);
    
    try {
      // Call the smart contract to release funds
      // This should trigger the releaseFunds function from the blockchain context
      await onReleaseFunds();
      
      toast.success('Funds released successfully!');
      onClose();
    } catch (error) {
      console.error('Error releasing funds:', error);
      toast.error('Failed to release funds. Please try again.');
    } finally {
      setReleasingFunds(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">
            Proof of Delivery
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Proof photo */}
          <div className="bg-gray-700 rounded-lg p-4">
            <img
              src={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5006'}/uploads/${proofPhoto}`}
              alt="Proof of delivery"
              className="w-full h-64 object-cover rounded-lg"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.innerHTML = '<div class="text-red-400 text-center p-4">Proof photo not found</div>';
                }
              }}
            />
          </div>

          {/* Upload details */}
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-white font-medium">Delivery Confirmed</span>
            </div>
            <p className="text-gray-300 text-sm">
              Photo uploaded: {formatDate(proofUploadTime)}
            </p>
            <p className="text-gray-300 text-sm">
              Parcel ID: {parcelId}
            </p>
          </div>

          {/* Warning message */}
          <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div>
                <p className="text-yellow-200 font-medium">Important</p>
                <p className="text-yellow-300 text-sm">
                  Please verify that the delivery proof is satisfactory before releasing funds. 
                  This action cannot be undone.
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleReleaseFunds}
              disabled={releasingFunds}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white py-2 px-4 rounded-md transition-colors flex items-center justify-center"
            >
              {releasingFunds ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Releasing...
                </>
              ) : (
                'Release Funds'
              )}
            </button>
          </div>

          <p className="text-gray-400 text-xs text-center">
            By clicking "Release Funds", you confirm that the delivery has been completed satisfactorily.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProofViewer;
