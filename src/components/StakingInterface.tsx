import React, { useState, useEffect } from 'react';
import { initiateDeposit, initiateWithdraw, claimWithdrawal, FIGMENT_API_URL } from '../services/figmentApi';
import WalletConnect from './WalletConnect';
import useWallet from '../hooks/useWallet';
import '../styles/StakingInterface.css';
import { ethers } from 'ethers';

declare global {
  interface Window {
    ethereum?: any;
  }
}

const StakingInterface: React.FC = () => {
  const { isConnected, accounts, provider } = useWallet();
  const [vaultAddress, setVaultAddress] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [depositorAddress, setDepositorAddress] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [positionTicket, setPositionTicket] = useState('');
  const [timestamp, setTimestamp] = useState('');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [decodedAPI, setDecodedAPI] = useState<{ data?: string; from?: string; to?: string; value?: string } | null>(null);
  const [txDetails, setTxDetails] = useState<{ transactionHash?: string; gasUsed?: string; topics: readonly string[] } | null>(null);
  const [canSignAndBroadcast, setCanSignAndBroadcast] = useState(false);
  const [savedInputs, setSavedInputs] = useState<{ [key: string]: string[] }>({
    vaultAddress: [],
    apiKey: [],
    userAddress: [],
    depositorAddress: [],
  });
  const [selectedEndpoint, setSelectedEndpoint] = useState('deposit');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isWaitingForReceipt, setIsWaitingForReceipt] = useState(false);

  const resetResponseStates = () => {
    setApiResponse(null);
    setDecodedAPI(null);
    setTxDetails(null);
    setTxHash(null);
    setIsWaitingForReceipt(false);
    setError(null);
  };

  useEffect(() => {
    const loadedInputs = localStorage.getItem('savedInputs');
    if (loadedInputs) {
      const parsedInputs = JSON.parse(loadedInputs);
      setSavedInputs({
        vaultAddress: parsedInputs.vaultAddress || [],
        apiKey: parsedInputs.apiKey || [],
        userAddress: parsedInputs.userAddress || [],
        depositorAddress: parsedInputs.depositorAddress || []
      });
    }
  }, []);

  useEffect(() => {
    console.log('Current provider:', provider);
    resetResponseStates();
  }, [provider]);

  useEffect(() => {
    resetResponseStates();
  }, [selectedEndpoint]);

  useEffect(() => {
    const canSign = !!decodedAPI && !!decodedAPI.data;
    console.log('Setting canSignAndBroadcast:', canSign);
    setCanSignAndBroadcast(canSign);
  }, [decodedAPI]);

  const saveInput = (key: string, value: string) => {
    if (value && savedInputs[key] && !savedInputs[key].includes(value)) {
      const updatedInputs = {
        ...savedInputs,
        [key]: [...(savedInputs[key] || []), value].slice(-5),
      };
      setSavedInputs(updatedInputs);
      localStorage.setItem('savedInputs', JSON.stringify(updatedInputs));
    }
  };

  const handleAction = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }
    try {
      setError(null);
      let response;
      if (selectedEndpoint === 'deposit') {
        response = await initiateDeposit(amount, depositorAddress, vaultAddress, apiKey);
      } else if (selectedEndpoint === 'withdraw') {
        response = await initiateWithdraw(amount, userAddress, vaultAddress, apiKey);
      } else if (selectedEndpoint === 'claim_withdrawal') {
        response = await claimWithdrawal(vaultAddress, positionTicket, timestamp, apiKey);
      }
      setApiResponse(response);
      
      const decoded = decodeApiResponse(response);
      console.log('Decoded API:', decoded);
      setDecodedAPI(decoded);

      setCanSignAndBroadcast(!!decoded && !!decoded.data);
    } catch (err: any) {
      setError(`Failed to initiate ${selectedEndpoint}. Please check your inputs and try again.`);
      console.error(`${selectedEndpoint} error:`, err.response?.data || err.message);
      setCanSignAndBroadcast(false);
    }
  };

  const decodeApiResponse = (data: any) => {
    console.log('API Response:', data);
  
    if (!data || !data.data || !data.data.unsigned_transaction_serialized) {
      console.error('Unexpected API response structure:', data);
      return null;
    }

    const transaction = ethers.Transaction.from(data.data.unsigned_transaction_serialized);

    const unsignedTx = data.data.unsigned_transaction_serialized;
    return {
      data: unsignedTx,
      from: accounts[0] || undefined,
      to: transaction.to ?? undefined,
      value: transaction.value?.toString()
    };
  };
  
  const handleSignAndBroadcast = async () => {
    console.log('handleSignAndBroadcast called');

    if (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask) {
      console.log('MetaMask is installed and connected');
    } else {
      console.error('MetaMask is not installed or not connected');
      setError('Please install MetaMask and connect it to this site');
      return;
    }

    if (!isConnected || !provider) {
      console.log('Not connected or no provider', { isConnected, provider });
      setError('Please connect your wallet first');
      return;
    }
    if (!decodedAPI || !decodedAPI.data) {
      console.log('No decoded API data', { decodedAPI });
      setError('No transaction data available. Please initiate a transaction first.');
      return;
    }
  
    try {
      const transaction = ethers.Transaction.from(decodedAPI.data);
      
      console.log('Sending transaction with params');
      const signer = await provider.getSigner();
      const txResponse = await signer.sendTransaction({
        to: transaction.to,
        value: transaction.value,
        data: transaction.data,
        gasLimit: '0x5028',
        maxPriorityFeePerGas: '0x3b9aca00',
        maxFeePerGas: '0x2540be400',
      });
      
      setTxHash(txResponse.hash);
      setIsWaitingForReceipt(true);

      console.log('Transaction sent:', txResponse.hash);

      const receipt = await provider.waitForTransaction(txResponse.hash);
      console.log('Transaction receipt received', receipt);
      if (receipt) {
        setTxDetails({
          transactionHash: receipt.hash,
          gasUsed: receipt.gasUsed.toString(),
          topics: receipt.logs[0]?.topics || []
        });
        setIsWaitingForReceipt(false);
      } else {
        setError('Transaction receipt not available');
        setIsWaitingForReceipt(false);
      }
    } catch (err: any) {
      console.error('Transaction error:', err);
      setError('Failed to sign and broadcast transaction: ' + (err.message || 'Unknown error'));
      setIsWaitingForReceipt(false);
    }
  };

  const formatJSON = (obj: any, indent = 0): JSX.Element[] => {
    return Object.entries(obj).flatMap(([key, value], index, array) => {
      const isLast = index === array.length - 1;
      const indentation = '  '.repeat(indent);
      const valueIndentation = '  '.repeat(indent + 1);
      
      const renderValue = (val: any) => {
        if (typeof val === 'string') {
          const isLongString = val.length > 50;
          return (
            <>
              {isLongString ? (
                <>
                  <br />
                  <span className="response-indent">{valueIndentation}</span>
                </>
              ) : null}
              <span className="response-string">"{val}"</span>
              {!isLast && <span className="response-comma">,</span>}
            </>
          );
        } else if (typeof val === 'number' || typeof val === 'boolean') {
          return (
            <span className={key === "max_transaction_cost" ? "response-number-green" : "response-number"}>
              {String(val)}
              {!isLast && <span className="response-comma">,</span>}
            </span>
          );
        } else {
          return null;
        }
      };
  
      const line = (
        <div key={`${key}-${index}`} className="response-line">
          <span className="response-indent">{indentation}</span>
          <span className="response-key">"{key}":</span>{' '}
          {typeof value === 'object' ? (
            <span className="response-bracket">{Array.isArray(value) ? '[' : '{'}</span>
          ) : (
            renderValue(value)
          )}
        </div>
      );
  
      if (typeof value === 'object') {
        return [
          line,
          ...formatJSON(value, indent + 1),
          <div key={`${key}-close`} className="response-line">
            <span className="response-indent">{indentation}</span>
            <span className="response-bracket">{Array.isArray(value) ? ']' : '}'}</span>
            {!isLast && <span className="response-comma">,</span>}
          </div>
        ];
      }
  
      return [line];
    });
  };
  
  const renderApiResponse = () => {
    return (
      <div className="response-section">
        <h3>API Response</h3>
        <div className="response-content">
          {apiResponse && apiResponse.data ? (
            <>
              <div className="response-line">
                <span className="response-bracket">{'{'}</span>
              </div>
              {formatJSON(apiResponse, 1)}
              <div className="response-line">
                <span className="response-bracket">{'}'}</span>
              </div>
            </>
          ) : (
            <div className="response-line">
              <span className="response-empty">No data yet. Make a request to see the response.</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="staking-interface">
      <h1 className="main-header">Figment Vaults API Playground</h1>
      <WalletConnect />
      
      <div className="input-container">
        <select
          value={selectedEndpoint}
          onChange={(e) => setSelectedEndpoint(e.target.value)}
          className="endpoint-dropdown"
        >
          <option value="deposit">Deposit</option>
          <option value="withdraw">Withdraw</option>
          <option value="claim_withdrawal">Claim Withdrawal</option>
        </select>
        <div className="input-group">
          <input
            type="text"
            value={vaultAddress}
            onChange={(e) => setVaultAddress(e.target.value)}
            placeholder="Enter Vault Address"
            className="staking-input"
          />
          <select
            onChange={(e) => setVaultAddress(e.target.value)}
            onBlur={() => saveInput('vaultAddress', vaultAddress)}
            className="input-dropdown"
          >
            <option value="">Select previous</option>
            {savedInputs.vaultAddress.map((addr, index) => (
              <option key={index} value={addr}>
                {addr}
              </option>
            ))}
          </select>
        </div>
        <div className="input-group">
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter API Key"
            className="staking-input"
          />
          <select
            onChange={(e) => setApiKey(e.target.value)}
            onBlur={() => saveInput('apiKey', apiKey)}
            className="input-dropdown"
          >
            <option value="">Select previous</option>
            {savedInputs.apiKey.map((key, index) => (
              <option key={index} value={key}>
                {key}
              </option>
            ))}
          </select>
        </div>
        {selectedEndpoint !== 'claim_withdrawal' && (
          <>
            <div className="input-group">
  <input
    type="text"
    value={selectedEndpoint === 'deposit' ? depositorAddress : userAddress}
    onChange={(e) => 
      selectedEndpoint === 'deposit' 
        ? setDepositorAddress(e.target.value) 
        : setUserAddress(e.target.value)
    }
    placeholder={selectedEndpoint === 'deposit' ? "Enter Depositor Address" : "Enter User Address"}
    className="staking-input"
  />
  <select
    onChange={(e) => 
      selectedEndpoint === 'deposit' 
        ? setDepositorAddress(e.target.value) 
        : setUserAddress(e.target.value)
    }
    onBlur={() => 
      selectedEndpoint === 'deposit' 
        ? saveInput('depositorAddress', depositorAddress) 
        : saveInput('userAddress', userAddress)
    }
    className="input-dropdown"
  >
    <option value="">Select previous</option>
    {(selectedEndpoint === 'deposit' ? savedInputs.depositorAddress : savedInputs.userAddress)?.map((addr, index) => (
      <option key={index} value={addr}>
        {addr}
      </option>
    ))}
  </select>
</div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={selectedEndpoint === 'deposit' ? "Enter amount to deposit" : "Enter assets to withdraw"}
              className="staking-input amount-input"
            />
          </>
        )}
        {selectedEndpoint === 'claim_withdrawal' && (
          <>
            <div className="input-group">
              <input
                type="text"
                value={positionTicket}
                onChange={(e) => setPositionTicket(e.target.value)}
                placeholder="Enter Position Ticket"
                className="staking-input"
              />
            </div>
            <div className="input-group">
              <input
                type="text"
                value={timestamp}
                onChange={(e) => setTimestamp(e.target.value)}
                placeholder="Enter Timestamp"
                className="staking-input"
              />
            </div>
          </>
        )}
      </div>
      <div className="button-container">
        <button onClick={handleAction}>
          {selectedEndpoint === 'deposit' ? 'Deposit' : selectedEndpoint === 'withdraw' ? 'Initiate Withdrawal' : 'Claim Withdrawal'}
        </button>
        <button 
          onClick={handleSignAndBroadcast} 
          disabled={!canSignAndBroadcast}
        >
          Sign & Broadcast
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}

      <div className="response-section">
        <h3>Passing to API</h3>
        <p><strong>Endpoint:</strong> {selectedEndpoint === 'deposit' ? 'Deposit Endpoint' : selectedEndpoint === 'withdraw' ? 'Withdraw Endpoint' : 'Claim Withdrawal Endpoint'}</p>
        <p><strong>URL:</strong> {`${FIGMENT_API_URL}/vaults/${vaultAddress}/transactions/${selectedEndpoint}`}</p>
        <h4>Params:</h4>
        <ul className="indented-list">
          <li><strong>network:</strong> holesky</li>
          {selectedEndpoint === 'claim_withdrawal' ? (
            <>
                            <li><strong>position_ticket:</strong> {positionTicket || '-'}</li>
              <li><strong>timestamp:</strong> {timestamp || '-'}</li>
            </>
          ) : (
            <>
              <li><strong>{selectedEndpoint === 'deposit' ? 'depositor_address' : 'user_address'}:</strong> {userAddress || '-'}</li>
              <li><strong>{selectedEndpoint === 'deposit' ? 'amount' : 'assets'}:</strong> {amount || '-'}</li>
            </>
          )}
        </ul>
        <h4>Headers:</h4>
        <ul className="indented-list">
          <li><strong>accept:</strong> application/json</li>
          <li><strong>x-api-key:</strong> {apiKey || '-'}</li>
          <li><strong>content-type:</strong> application/json</li>
        </ul>
      </div>

      {renderApiResponse()}

      <div className="response-section">
        <h3>Decoding API</h3>
        <p><strong>Data:</strong> <span className="wrap-text">{decodedAPI?.data || '-'}</span></p>
        <p><strong>From:</strong> <span>{decodedAPI?.from || '-'}</span></p>
        <p><strong>To:</strong> <span>{decodedAPI?.to || '-'}</span></p>
        <p><strong>Value:</strong> <span>{decodedAPI?.value || '-'}</span></p>
      </div>

      <div className="response-section">
        <h3>Transaction Details</h3>
        <p>
          <strong>Transaction Hash:</strong>{' '}
          {txHash ? (
            <a 
              href={`https://holesky.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="tx-link"
            >
              {txHash}
            </a>
          ) : '-'}
        </p>
        {isWaitingForReceipt ? (
          <div className="loading-spinner"></div>
        ) : (
          <>
            <p><strong>Gas Used:</strong> <span>{txDetails?.gasUsed || '-'}</span></p>
            <h4>Topics:</h4>
            <ul className="topics-list">
              {txDetails?.topics.length ? (
                <>
                  <li>
                    <span className="label">Event Signature:</span>
                    <span className="value">{txDetails.topics[0]}</span>
                  </li>
                  {txDetails.topics.slice(1).map((topic, index) => (
                    <li key={index}>
                      <span className="label">Event Param {index + 1}:</span>
                      <span className="value">{topic}</span>
                    </li>
                  ))}
                </>
              ) : (
                <li>-</li>
              )}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};

export default StakingInterface;