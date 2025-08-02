import React, { useState } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_ENDPOINTS } from '../config/api';

interface ProofOfDeliveryUploadProps {
  parcelId: string;
  onUploadSuccess: (proofData: { proofPhoto: string; proofUploadTime: string }) => void;
  onCancel: () => void;
}

const ProofOfDeliveryUpload: React.FC<ProofOfDeliveryUploadProps> = ({
  parcelId,
  onUploadSuccess,
  onCancel
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a photo first');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('proofPhoto', selectedFile);
      formData.append('parcelId', parcelId);

      const response = await fetch(`${API_ENDPOINTS.parcels}/${parcelId}/proof`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Proof of delivery uploaded successfully!');
        onUploadSuccess({
          proofPhoto: data.proofPhoto,
          proofUploadTime: data.proofUploadTime
        });
      } else {
        toast.error(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload proof. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">
            Upload Proof of Delivery
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* File input */}
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
            {preview ? (
              <div className="space-y-4">
                <img
                  src={preview}
                  alt="Preview"
                  className="max-w-full h-48 object-cover rounded-lg mx-auto"
                />
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreview(null);
                  }}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Remove photo
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <Camera className="w-12 h-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-gray-300 mb-2">
                    Take a photo of the delivered package
                  </p>
                  <label className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md cursor-pointer transition-colors">
                    <Upload className="w-4 h-4 mr-2" />
                    Select Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      capture="environment"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Upload button */}
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white py-2 px-4 rounded-md transition-colors"
            >
              {uploading ? 'Uploading...' : 'Upload Proof'}
            </button>
          </div>

          <p className="text-gray-400 text-xs text-center">
            Maximum file size: 5MB. Supported formats: JPG, PNG, WebP
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProofOfDeliveryUpload;
