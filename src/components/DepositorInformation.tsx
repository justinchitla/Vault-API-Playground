import React, { useState, useEffect } from 'react';
import { getDepositorBalance, getDepositorExitPositions, getDepositorActions, getDepositorRewards, FIGMENT_API_URL } from '../services/figmentApi';
import WalletConnect from './WalletConnect';
import useWallet from '../hooks/useWallet';
import '../styles/StakingInterface.css';

const DepositorInformation: React.FC = () => {
  const { isConnected } = useWallet();
  const [vaultAddress, setVaultAddress] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [depositorAddress, setDepositorAddress] = useState('');
  const [balanceResponse, setBalanceResponse] = useState<any>(null);
  const [exitPositionsResponse, setExitPositionsResponse] = useState<any>(null);
  const [actionsResponse, setActionsResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [rewardsResponse, setRewardsResponse] = useState<any>(null);
  const [savedInputs, setSavedInputs] = useState<{ [key: string]: string[] }>({
    vaultAddress: [],
    apiKey: [],
    depositorAddress: [],
  });
  const [isLoading, setIsLoading] = useState({
    balance: false,
    exitPositions: false,
    actions: false,
    rewards: false
  });

  useEffect(() => {
    // Load saved inputs from local storage
    const loadedInputs = localStorage.getItem('savedInputsDepositor');
    if (loadedInputs) {
      setSavedInputs(JSON.parse(loadedInputs));
    }
  }, []);

  const saveInput = (key: string, value: string) => {
    if (value && !savedInputs[key].includes(value)) {
      const updatedInputs = {
        ...savedInputs,
        [key]: [...savedInputs[key], value].slice(-5), // Keep last 5 entries
      };
      setSavedInputs(updatedInputs);
      localStorage.setItem('savedInputsDepositor', JSON.stringify(updatedInputs));
    }
  };

  const handleGetDepositorInfo = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }
    try {
      setError(null);
      setIsLoading({ balance: true, exitPositions: true, actions: true, rewards: true });
  
      const balanceResponse = await getDepositorBalance(vaultAddress, depositorAddress, apiKey);
      setBalanceResponse(balanceResponse);
      setIsLoading(prev => ({ ...prev, balance: false }));
  
      const exitPositionsResponse = await getDepositorExitPositions(vaultAddress, depositorAddress, apiKey);
      setExitPositionsResponse(exitPositionsResponse);
      setIsLoading(prev => ({ ...prev, exitPositions: false }));

      const actionsResponse = await getDepositorActions(vaultAddress, depositorAddress, apiKey);
      setActionsResponse(actionsResponse);
      setIsLoading(prev => ({ ...prev, actions: false }));

      const rewardsResponse = await getDepositorRewards(vaultAddress, depositorAddress, apiKey);
      setRewardsResponse(rewardsResponse);
      setIsLoading(prev => ({ ...prev, rewards: false }));
    } catch (err: any) {
      setError('Failed to fetch depositor information. Please check your inputs and try again.');
      console.error('Depositor Information error:', err.response?.data || err.message);
      setIsLoading({ balance: false, exitPositions: false, actions: false, rewards: false });
    }
  };

  const renderSection = (title: string, url: string, response: any, isLoading: boolean) => {
    return (
      <div className="response-section">
        <h3>{title}</h3>
        <p><strong>URL:</strong> <span className="wrap-text">{url}</span></p>
        
        <h4>Response:</h4>
        <div className="response-content">
          {isLoading ? (
            <div className="loading-spinner"></div>
          ) : response ? (
            <>
              <div className="response-line">
                <span className="response-bracket">{'{'}</span>
              </div>
              {formatJSON(response, 1)}
              <div className="response-line">
                <span className="response-bracket">{'}'}</span>
              </div>
            </>
          ) : (
            <div className="response-line">
              <span className="response-empty">No data yet. Click "Get Depositor Information" to see the response.</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const formatJSON = (obj: any, indent = 0): JSX.Element[] => {
    return Object.entries(obj).flatMap(([key, value], index, array) => {
      const isLast = index === array.length - 1;
      const indentation = '  '.repeat(indent);
      
      const line = (
        <div key={`${key}-${index}`} className="response-line">
          <span className="response-indent">{indentation}</span>
          <span className="response-key">"{key}":</span>{' '}
          <div className="response-value-wrapper">
            {typeof value === 'object' ? (
              <span className="response-bracket">{Array.isArray(value) ? '[' : '{'}</span>
            ) : (
              <span className={
                typeof value === 'string' 
                  ? "response-string" 
                  : key === "balance" 
                    ? "response-number-green" 
                    : "response-number"
              }>
                {typeof value === 'string' ? `"${value}"` : String(value)}
                {!isLast && typeof value !== 'object' && <span className="response-comma">,</span>}
              </span>
            )}
          </div>
        </div>
      );
  
      if (typeof value === 'object') {
        const nestedElements = formatJSON(value, indent + 1);
        return [
          line,
          ...nestedElements,
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

  return (
    <div className="staking-interface">
      <h1 className="main-header">Figment Vaults API Playground</h1>
      <WalletConnect />
      <div className="input-container">
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
        <div className="input-group">
          <input
            type="text"
            value={depositorAddress}
            onChange={(e) => setDepositorAddress(e.target.value)}
            placeholder="Enter Depositor Address"
            className="staking-input"
          />
          <select
            onChange={(e) => setDepositorAddress(e.target.value)}
            onBlur={() => saveInput('depositorAddress', depositorAddress)}
            className="input-dropdown"
          >
            <option value="">Select previous</option>
            {savedInputs.depositorAddress.map((addr, index) => (
              <option key={index} value={addr}>
                {addr}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="button-container">
        <button onClick={handleGetDepositorInfo}>Get Depositor Information</button>
      </div>
      {error && <p className="error-message">{error}</p>}
      {renderSection(
        "Get Depositor Balance",
        `${FIGMENT_API_URL}/vaults/${vaultAddress}/depositors/${depositorAddress}/balance?network=holesky`,
        balanceResponse,
        isLoading.balance
      )}
      {renderSection(
        "Get Depositor Exit Positions",
        `${FIGMENT_API_URL}/vaults/${vaultAddress}/depositors/${depositorAddress}/exit_positions?network=holesky`,
        exitPositionsResponse,
        isLoading.exitPositions
      )}
      {renderSection(
        "Get Depositor Actions",
        `${FIGMENT_API_URL}/vaults/${vaultAddress}/depositors/${depositorAddress}/actions?network=holesky`,
        actionsResponse,
        isLoading.actions
      )}
      {renderSection(
        "List Depositor Rewards",
        `${FIGMENT_API_URL}/vaults/${vaultAddress}/depositors/${depositorAddress}/rewards?network=holesky`,
        rewardsResponse,
        isLoading.rewards
      )}
    </div>
  );
};

export default DepositorInformation;