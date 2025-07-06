# ShipIT - Decentralized P2P Delivery Platform

A blockchain-powered peer-to-peer delivery platform built on the Avalanche network, enabling secure and transparent deliveries through smart contract escrow.

## 🚀 Features

- **Decentralized Escrow**: Smart contracts hold delivery fees securely until confirmation
- **Real-time Tracking**: Live updates on parcel status and driver details
- **Dual User Roles**: Separate interfaces for Senders and Drivers
- **Route Optimization**: AI-powered matching between parcels and driver routes
- **Secure Payments**: MetaMask integration with Avalanche network
- **Responsive Design**: Beautiful dark theme optimized for all devices

## 🛠 Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Maps**: Leaflet.js with React-Leaflet

### Blockchain Integration
- **Web3 Library**: ethers.js v6
- **Wallet**: MetaMask integration
- **Network**: Avalanche (configurable)
- **Smart Contracts**: Solidity-based escrow system

### Development Tools
- **TypeScript**: Full type safety
- **ESLint**: Code linting and formatting
- **PostCSS**: CSS processing with Autoprefixer

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd shipit-delivery-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
VITE_AVALANCHE_RPC_URL=https://api.avax.network/ext/bc/C/rpc
VITE_CONTRACT_ADDRESS=your_contract_address_here
VITE_CHAIN_ID=43114
```

### MetaMask Setup
1. Install MetaMask browser extension
2. Add Avalanche network:
   - Network Name: Avalanche Network
   - RPC URL: https://api.avax.network/ext/bc/C/rpc
   - Chain ID: 43114
   - Symbol: AVAX
   - Explorer: https://snowtrace.io/

## 🏗 Project Structure

```
src/
├── components/          # Reusable UI components
│   └── Navbar.tsx      # Navigation component
├── contexts/           # React contexts
│   └── WalletContext.tsx # Web3 wallet management
├── pages/              # Main application pages
│   ├── LandingPage.tsx # Landing page with wallet connection
│   ├── SenderDashboard.tsx # Sender interface
│   ├── DriverDashboard.tsx # Driver interface
│   └── CreateParcel.tsx # Parcel creation form
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── App.tsx             # Main application component
└── main.tsx           # Application entry point
```

## 🔗 Backend Integration

### Smart Contract Integration

The frontend is designed to integrate with Avalanche smart contracts. Key integration points:

1. **Contract ABI**: Place your contract ABI in `src/contracts/`
2. **Contract Address**: Configure in environment variables
3. **Web3 Provider**: Managed through WalletContext

### Required Smart Contract Functions

Your smart contract should implement these functions:

```solidity
// Create new delivery request
function createDelivery(
    string memory fromAddress,
    string memory toAddress,
    string memory itemDescription,
    uint256 itemValue,
    uint256 deliveryFee
) external payable;

// Accept delivery (driver)
function acceptDelivery(uint256 deliveryId) external;

// Confirm delivery (sender)
function confirmDelivery(uint256 deliveryId) external;

// Get delivery details
function getDelivery(uint256 deliveryId) external view returns (DeliveryStruct memory);
```

### API Integration Points

For additional backend services, integrate at these points:

1. **User Authentication**: Extend WalletContext
2. **Real-time Updates**: Add WebSocket connections
3. **Geolocation Services**: Integrate mapping APIs
4. **Notification System**: Add push notifications
5. **Analytics**: Track user interactions and delivery metrics

### Database Schema (if using off-chain storage)

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY,
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    role VARCHAR(10) NOT NULL, -- 'sender' or 'driver'
    created_at TIMESTAMP DEFAULT NOW()
);

-- Deliveries table
CREATE TABLE deliveries (
    id UUID PRIMARY KEY,
    contract_delivery_id INTEGER UNIQUE,
    sender_id UUID REFERENCES users(id),
    driver_id UUID REFERENCES users(id),
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    item_description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 🚀 Deployment

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy `dist/` folder to your hosting service
3. Configure environment variables on your hosting platform

### Recommended Hosting Platforms
- **Vercel**: Automatic deployments with GitHub integration
- **Netlify**: Easy static site hosting
- **AWS S3 + CloudFront**: Scalable cloud hosting
- **IPFS**: Decentralized hosting option

## 🔐 Security Considerations

1. **Smart Contract Audits**: Ensure contracts are audited before mainnet deployment
2. **Input Validation**: All user inputs are validated client-side and should be validated on-chain
3. **Private Key Management**: Never store private keys in the application
4. **HTTPS**: Always use HTTPS in production
5. **Content Security Policy**: Implement CSP headers

## 🧪 Testing

```bash
# Run linting
npm run lint

# Type checking
npx tsc --noEmit

# Build test
npm run build
```

## 📱 Mobile Responsiveness

The application is fully responsive and optimized for:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🎨 Design System

### Color Palette
- **Primary**: Blue (#3B82F6) to Purple (#8B5CF6) gradient
- **Success**: Green (#10B981)
- **Warning**: Yellow (#F59E0B)
- **Error**: Red (#EF4444)
- **Background**: Gray-900 (#111827)
- **Surface**: Gray-800 (#1F2937)

### Typography
- **Headings**: Inter font family, bold weights
- **Body**: Inter font family, regular weight
- **Code**: Fira Code, monospace

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Join our Discord community
- Email: support@shipit-delivery.com

## 🗺 Roadmap

- [ ] Multi-chain support (Ethereum, Polygon)
- [ ] Mobile app development
- [ ] Advanced route optimization
- [ ] Insurance integration
- [ ] Reputation system
- [ ] Multi-language support
- [ ] API for third-party integrations

---

Built with ❤️ for the decentralized future of logistics.