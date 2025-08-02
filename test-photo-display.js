// Test script to verify sender photo display functionality
const API_BASE_URL = 'http://localhost:5006';

// Test 1: Check if backend is running
console.log('Testing backend connectivity...');
fetch(`${API_BASE_URL}/api`)
  .then(res => res.text())
  .then(data => console.log('Backend status:', data))
  .catch(err => console.error('Backend error:', err));

// Test 2: Check if photos endpoint is working
console.log('Testing photos endpoint...');
fetch(`${API_BASE_URL}/api/photos`)
  .then(res => res.json())
  .then(data => console.log('Photos endpoint:', data))
  .catch(err => console.error('Photos endpoint error:', err));

// Test 3: Check if parcels are stored with sender photos
console.log('Testing parcels with sender photos...');
fetch(`${API_BASE_URL}/api/parcels`)
  .then(res => res.json())
  .then(data => {
    console.log('Parcels found:', data.length);
    const parcelsWithPhotos = data.filter(p => p.senderPhoto);
    console.log('Parcels with sender photos:', parcelsWithPhotos.length);
    parcelsWithPhotos.forEach(p => {
      console.log(`Parcel ${p.deliveryId || p._id}:`, {
        hasPhoto: !!p.senderPhoto,
        photoUrl: p.senderPhoto
      });
    });
  })
  .catch(err => console.error('Parcels endpoint error:', err));
