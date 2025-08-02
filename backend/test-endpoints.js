const http = require('http');

console.log('=== Testing API Endpoints ===');

const testEndpoint = (path) => {
  const options = {
    hostname: 'localhost',
    port: 5005,
    path: path,
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    console.log(`${path}: Status ${res.statusCode}`);
    
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`Response for ${path}:`, data.substring(0, 200) + (data.length > 200 ? '...' : ''));
    });
  });

  req.on('error', (err) => {
    console.log(`${path}: Error - ${err.message}`);
  });

  req.on('timeout', () => {
    console.log(`${path}: Timeout`);
    req.destroy();
  });

  req.end();
};

// Test all endpoints
console.log('Testing backend server on port 5005...');
testEndpoint('/api');
testEndpoint('/api/parcels');
testEndpoint('/api/auth');
testEndpoint('/api/users');
testEndpoint('/uploads');

// Test photo serving
setTimeout(() => {
  const fs = require('fs');
  const path = require('path');
  const uploadsDir = path.join(__dirname, 'uploads');
  
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    if (files.length > 0) {
      console.log('\\n=== Testing Photo Serving ===');
      files.forEach(file => {
        testEndpoint(`/uploads/${file}`);
      });
    }
  }
}, 1000);
