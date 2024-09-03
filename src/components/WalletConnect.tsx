import React from 'react';
import useWallet from '../hooks/useWallet';

const WalletConnect: React.FC = () => {
  const { isConnected, accounts, connectWallet, disconnectWallet } = useWallet();

  const handleChangeWallet = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }],
        });
        const newAccounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      } catch (error) {
        console.error('Failed to change wallet:', error);
      }
    } else {
      console.error('Ethereum object not found, do you have MetaMask installed?');
    }
  };

  return (
    <div className="wallet-status">
      {!isConnected ? (
        <button onClick={connectWallet} className="btn btn-primary">
          Connect Wallet
        </button>
      ) : (
        <>
          <div className="wallet-info">
            <span className="connected-text">Connected:</span>
            <span className="wallet-address">{accounts[0]}</span>
          </div>
          <div className="wallet-buttons">
            <button className="btn btn-primary" onClick={handleChangeWallet}>Change Wallet</button>
            <button className="btn btn-secondary" onClick={disconnectWallet}>Disconnect</button>
          </div>
        </>
      )}
    </div>
  );
};

export default WalletConnect;