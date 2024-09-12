import React, { useState, useEffect } from 'react';
import { convertSharesToAssets, convertAssetsToShares, FIGMENT_API_URL } from '../services/figmentApi';
import WalletConnect from './WalletConnect';
import useWallet from '../hooks/useWallet';
import '../styles/StakingInterface.css';

const VaultInformation: React.FC = () => {
  const { isConnected } = useWallet();
  const [vaultAddress, setVaultAddress] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [selectedEndpoint, setSelectedEndpoint] = useState('shares_to_assets');
  const [sharesOrAssets, setSharesOrAssets] = useState('');
  const [conversionResponse, setConversionResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [savedInputs, setSavedInputs] = useState<{ [key: string]: string[] }>({
    vaultAddress: [],
    apiKey: [],
  });

  useEffect(() => {
    const loadedInputs = localStorage.getItem('savedInputsVault');
    if (loadedInputs) {
      setSavedInputs(JSON.parse(loadedInputs));
    }
  }, []);

  const saveInput = (key: string, value: string) => {
    if (value && !savedInputs[key].includes(value)) {
      const updatedInputs = {
        ...savedInputs,
        [key]: [...savedInputs[key], value].slice(-5),
      };
      setSavedInputs(updatedInputs);
      localStorage.setItem('savedInputsVault', JSON.stringify(updatedInputs));
    }
  };

  const handleConversion = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }
    try {
      setError(null);
      setIsLoading(true);

      let response;
      if (selectedEndpoint === 'shares_to_assets') {
        response = await convertSharesToAssets(vaultAddress, sharesOrAssets, apiKey);
      } else {
        response = await convertAssetsToShares(vaultAddress, sharesOrAssets, apiKey);
      }
      setConversionResponse(response);
    } catch (err: any) {
      setError('Failed to fetch conversion information. Please check your inputs and try again.');
      console.error('Conversion error:', err.response?.data || err.message);
    } finally {
      setIsLoading(false);
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
              <span className="response-empty">No data yet. Click "Convert" to see the response.</span>
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
      <h1 className="main-header">Vault Information</h1>
      <WalletConnect />
      <div className="input-container">
        <select
          value={selectedEndpoint}
          onChange={(e) => setSelectedEndpoint(e.target.value)}
          className="endpoint-dropdown"
        >
          <option value="shares_to_assets">Shares to Assets</option>
          <option value="assets_to_shares">Assets to Shares</option>
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
        <div className="input-group">
          <input
            type="text"
            value={sharesOrAssets}
            onChange={(e) => setSharesOrAssets(e.target.value)}
            placeholder={selectedEndpoint === 'shares_to_assets' ? "Enter Shares" : "Enter Assets"}
            className="staking-input"
          />
        </div>
      </div>
      <div className="button-container">
        <button onClick={handleConversion}>Convert</button>
      </div>
      {error && <p className="error-message">{error}</p>}
      {renderSection(
        selectedEndpoint === 'shares_to_assets' ? "Shares to Assets" : "Assets to Shares",
        `${FIGMENT_API_URL}/vaults/${vaultAddress}/information/${selectedEndpoint}?network=holesky`,
        conversionResponse,
        isLoading
      )}
    </div>
  );
};

export default VaultInformation;