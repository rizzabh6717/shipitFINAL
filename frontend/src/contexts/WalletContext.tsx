import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import ParcelEscrowABI from '../contracts/ParcelEscrowABI.json';

declare global {
  interface Window {
    ethereum?: any;
  }
}

// Contract configuration
const CONTRACT_ADDRESS = "place your address"; // Your deployed contract address
const AVALANCHE_CHAIN_ID = "0xa869"; // Avalanche Fuji Testnet (43113 in hex)
const AVALANCHE_RPC_URL = "https://api.avax-test.network/ext/bc/C/rpc";

interface DeliveryStruct {
  sender: string;
  driver: string;
  fromAddress: string;
  toAddress: string;
  itemDescription: string;
  itemValue: bigint;
  deliveryFee: bigint;
  escrowAmount: bigint;
  status: number;
}

interface WalletContextType {
  account: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  contract: ethers.Contract | null;
  isConnected: boolean;
  userRole: 'sender' | 'driver' | null;
  connectWallet: () => Promise<void>;
  setUserRole: (role: 'sender' | 'driver') => void;
  disconnect: () => void;
  createDelivery: (fromAddress: string, toAddress: string, itemDescription: string, itemValue: number, deliveryFee: number) => Promise<any>;
  acceptDelivery: (deliveryId: number) => Promise<any>;
  confirmDelivery: (deliveryId: number) => Promise<any>;
  getDelivery: (deliveryId: number) => Promise<DeliveryStruct | null>;
  getUserDeliveries: () => Promise<any[]>;
  getAvailableDeliveries: () => Promise<any[]>;
  markAsDelivered: (deliveryId: number) => Promise<any>;
  markAsPickedUp: (deliveryId: number) => Promise<any>;
}

export const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [userRole, setUserRole] = useState<'sender' | 'driver' | null>(null);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });

        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== AVALANCHE_CHAIN_ID) {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: AVALANCHE_CHAIN_ID }],
            });
          } catch (switchError: any) {
            if (switchError.code === 4902) {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: AVALANCHE_CHAIN_ID,
                  chainName: 'Avalanche Fuji Testnet',
                  nativeCurrency: {
                    name: 'AVAX',
                    symbol: 'AVAX',
                    decimals: 18
                  },
                  rpcUrls: [AVALANCHE_RPC_URL],
                  blockExplorerUrls: ['https://testnet.snowtrace.io/']
                }]
              });
            }
          }
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();

        const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, ParcelEscrowABI, signer);

        setProvider(provider);
        setSigner(signer);
        setContract(contractInstance);
        setAccount(address);

        console.log('Wallet connected:', address);
        console.log('Contract initialized:', CONTRACT_ADDRESS);
      } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Failed to connect wallet. Please try again.');
      }
    } else {
      alert('Please install MetaMask to use this application');
    }
  };

  const disconnect = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setContract(null);
    setUserRole(null);
  };

  const createDelivery = async (fromAddress: string, toAddress: string, itemDescription: string, itemValue: number, deliveryFee: number) => {
    if (!contract || !signer) {
      throw new Error('Contract not initialized or wallet not connected');
    }

    try {
      const INR_TO_AVAX_RATE = 0.0003;
      const deliveryFeeInAVAX = deliveryFee * INR_TO_AVAX_RATE;
      const escrowAmountWei = ethers.parseEther(deliveryFeeInAVAX.toString());

      console.log('Creating delivery with escrow amount:', deliveryFeeInAVAX, 'AVAX');

      const tx = await contract.createDelivery(
        fromAddress,
        toAddress,
        itemDescription,
        itemValue,
        escrowAmountWei,
        { value: escrowAmountWei }
      );

      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'DeliveryCreated';
        } catch {
          return false;
        }
      });

      let deliveryId = null;
      if (event) {
        const parsed = contract.interface.parseLog(event);
        deliveryId = parsed?.args[0];
      }

      return {
        transactionHash: tx.hash,
        deliveryId: deliveryId?.toString(),
        escrowAmount: deliveryFeeInAVAX
      };
    } catch (error) {
      console.error('Error creating delivery:', error);
      throw error;
    }
  };

  const acceptDelivery = async (deliveryId: number) => {
    if (!contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const tx = await contract.acceptDelivery(deliveryId);
      console.log('Accept delivery transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Accept delivery confirmed:', receipt);
      return { transactionHash: tx.hash };
    } catch (error) {
      console.error('Error accepting delivery:', error);
      throw error;
    }
  };

  const confirmDelivery = async (deliveryId: number) => {
    if (!contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const tx = await contract.confirmDelivery(deliveryId);
      console.log('Confirm delivery transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Confirm delivery confirmed:', receipt);
      return { transactionHash: tx.hash };
    } catch (error) {
      console.error('Error confirming delivery:', error);
      throw error;
    }
  };

  const markAsDelivered = async (deliveryId: number) => {
    if (!contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const tx = await contract.markAsDelivered(deliveryId);
      console.log('Mark as delivered transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Mark as delivered confirmed:', receipt);
      return { transactionHash: tx.hash };
    } catch (error) {
      console.error('Error marking as delivered:', error);
      throw error;
    }
  };

  const markAsPickedUp = async (deliveryId: number) => {
    if (!contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const tx = await contract.markAsPickedUp(deliveryId);
      console.log('Mark as picked up transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Mark as picked up confirmed:', receipt);
      return { transactionHash: tx.hash };
    } catch (error) {
      console.error('Error marking as picked up:', error);
      throw error;
    }
  };

  const getDelivery = async (deliveryId: number): Promise<DeliveryStruct | null> => {
    if (!contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const delivery = await contract.getDelivery(deliveryId);
      return delivery;
    } catch (error) {
      console.error('Error getting delivery:', error);
      return null;
    }
  };

  const getUserDeliveries = async () => {
    if (!contract || !account) {
      return [];
    }

    try {
      console.log('Fetching deliveries for account:', account);

      const deliveryCounter = await contract.deliveryCounter();
      console.log('Total deliveries:', deliveryCounter.toString());

      const deliveries = [];

      for (let i = 1; i <= deliveryCounter; i++) {
        try {
          console.log(`Fetching delivery ${i}...`);
          const delivery = await contract.getDelivery(i);
          console.log(`Delivery ${i}:`, delivery);

          if (delivery.sender.toLowerCase() === account.toLowerCase()) {
            deliveries.push({
              id: i,
              sender: delivery.sender,
              driver: delivery.driver,
              fromAddress: delivery.fromAddress,
              toAddress: delivery.toAddress,
              itemDescription: delivery.itemDescription,
              itemValue: delivery.itemValue.toString(),
              deliveryFee: ethers.formatEther(delivery.deliveryFee),
              escrowAmount: ethers.formatEther(delivery.escrowAmount),
              status: Number(delivery.status) // Convert BigInt to number
            });
          }
        } catch (error) {
          console.error(`Error fetching delivery ${i}:`, error);
        }
      }

      console.log('Found deliveries for user:', deliveries);
      return deliveries;
    } catch (error) {
      console.error('Error getting user deliveries:', error);
      return [];
    }
  };

  const getAvailableDeliveries = async () => {
    if (!contract) {
      console.error('Contract not initialized for getAvailableDeliveries');
      return [];
    }

    try {
      console.log('Fetching available deliveries...');

      const deliveryCounter = await contract.deliveryCounter();
      console.log('Total deliveries for drivers:', deliveryCounter.toString());

      const availableDeliveries = [];

      for (let i = 1; i <= deliveryCounter; i++) {
        try {
          const delivery = await contract.getDelivery(i);
          console.log(`Delivery ${i} details:`, {
            fromAddress: delivery.fromAddress,
            toAddress: delivery.toAddress,
            itemDescription: delivery.itemDescription,
            status: delivery.status.toString()
          });

          // FIXED: Convert BigInt status to number for comparison
          if (Number(delivery.status) === 0 ||
             (delivery.driver.toLowerCase() === account?.toLowerCase() &&
              Number(delivery.status) >= 1 && Number(delivery.status) <= 3)) {

            console.log(`Delivery ${i} is available for driver`);
            availableDeliveries.push({
              id: i,
              sender: delivery.sender,
              driver: delivery.driver,
              fromAddress: delivery.fromAddress,
              toAddress: delivery.toAddress,
              itemDescription: delivery.itemDescription,
              itemValue: delivery.itemValue.toString(),
              deliveryFee: ethers.formatEther(delivery.deliveryFee),
              escrowAmount: ethers.formatEther(delivery.escrowAmount),
              status: Number(delivery.status) // Convert to number for consistency
            });
          } else {
            console.log(`Delivery ${i} not available, status: ${delivery.status}`);
          }
        } catch (error) {
          console.error(`Error fetching delivery ${i}:`, error);
        }
      }

      console.log('Available deliveries found:', availableDeliveries);
      return availableDeliveries;
    } catch (error) {
      console.error('Error getting available deliveries:', error);
      return [];
    }
  };

  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect();
        } else {
          setAccount(accounts[0]);
          if (provider) {
            provider.getSigner().then(newSigner => {
              const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, ParcelEscrowABI, newSigner);
              setContract(contractInstance);
            });
          }
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }
  }, [provider]);

  const value = {
    account,
    provider,
    signer,
    contract,
    isConnected: !!account,
    userRole,
    connectWallet,
    setUserRole,
    disconnect,
    createDelivery,
    acceptDelivery,
    confirmDelivery,
    getDelivery,
    getUserDeliveries,
    getAvailableDeliveries,
    markAsDelivered,
    markAsPickedUp,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
