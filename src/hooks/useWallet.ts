import { useState, useEffect } from 'react';
import MetaMaskOnboarding from '@metamask/onboarding';
import { ethers } from 'ethers';

const useWallet = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);

  const onboarding = new MetaMaskOnboarding();

  const isMetaMaskInstalled = () => {
    return Boolean(window.ethereum && window.ethereum.isMetaMask);
  };

  const connectWallet = async () => {
    if (isMetaMaskInstalled()) {
      try {
        const newAccounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        handleNewAccounts(newAccounts);
      } catch (error) {
        console.error('Failed to connect:', error);
      }
    } else {
      onboarding.startOnboarding();
    }
  };

  const handleNewAccounts = (newAccounts: string[]) => {
    setAccounts(newAccounts);
    setIsConnected(newAccounts.length > 0);
    if (newAccounts.length > 0) {
      const newProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(newProvider);
    } else {
      setProvider(null);
    }
  };

  useEffect(() => {
    if (isMetaMaskInstalled()) {
      window.ethereum.on('accountsChanged', handleNewAccounts);

      // Check if already connected
      window.ethereum.request({ method: 'eth_accounts' })
        .then(handleNewAccounts)
        .catch(console.error);
    }

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleNewAccounts);
      }
    };
  }, []);

  const disconnectWallet = () => {
    setAccounts([]);
    setIsConnected(false);
    setProvider(null);
  };

  return {
    isConnected,
    accounts,
    provider,
    connectWallet,
    disconnectWallet,
  };
};

export default useWallet;