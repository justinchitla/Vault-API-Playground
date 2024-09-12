import axios from 'axios';

export const FIGMENT_API_URL = 'http://localhost:3001/api';

export const initiateDeposit = async (amount: string, fromAddress: string, receiverAddress: string, vaultAddress: string, apiKey: string) => {
  try {
    const response = await axios.post(
      `${FIGMENT_API_URL}/vaults/${vaultAddress}/transactions/deposit`,
      { 
        network: 'holesky',
        from_address: fromAddress,
        receiver_address: receiverAddress,
        amount: amount
      },
      {
        headers: {
          'accept': 'application/json',
          'x-api-key': apiKey,
          'content-type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Deposit API error:', error);
    throw error;
  }
};

export const initiateWithdraw = async (assets: string, fromAddress: string, receiverAddress: string, vaultAddress: string, apiKey: string) => {
  try {
    const response = await axios.post(
      `${FIGMENT_API_URL}/vaults/${vaultAddress}/transactions/withdraw`,
      { 
        network: 'holesky',
        from_address: fromAddress,
        receiver_address: receiverAddress,
        assets: assets
      },
      {
        headers: {
          'accept': 'application/json',
          'x-api-key': apiKey,
          'content-type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Withdraw API error:', error);
    throw error;
  }
};

export const claimWithdrawal = async (vaultAddress: string, fromAddress: string, positionTicket: string, timestamp: string, apiKey: string) => {
  try {
    const response = await axios.post(
      `${FIGMENT_API_URL}/vaults/${vaultAddress}/transactions/claim_withdrawal`,
      { 
        network: 'holesky',
        from_address: fromAddress,
        position_ticket: positionTicket,
        timestamp: timestamp
      },
      {
        headers: {
          'accept': 'application/json',
          'x-api-key': apiKey,
          'content-type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Claim Withdrawal API error:', error);
    throw error;
  }
};

export const getDepositorBalance = async (vaultAddress: string, depositorAddress: string, apiKey: string) => {
  try {
    const response = await axios.get(
      `${FIGMENT_API_URL}/vaults/${vaultAddress}/address/${depositorAddress}/balance?network=holesky`,
      {
        headers: {
          'accept': 'application/json',
          'x-api-key': apiKey,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Depositor Balance API error:', error);
    throw error;
  }
};

export const getDepositorExitPositions = async (vaultAddress: string, depositorAddress: string, apiKey: string) => {
  const response = await axios.get(`${FIGMENT_API_URL}/vaults/${vaultAddress}/address/${depositorAddress}/exit_positions`, {
    params: { network: 'holesky' },
    headers: {
      'accept': 'application/json',
      'x-api-key': apiKey,
    },
  });
  return response.data;
};

export const getDepositorActions = async (vaultAddress: string, depositorAddress: string, apiKey: string) => {
  const response = await axios.get(`${FIGMENT_API_URL}/vaults/${vaultAddress}/address/${depositorAddress}/actions`, {
    params: { network: 'holesky' },
    headers: {
      'accept': 'application/json',
      'x-api-key': apiKey,
    },
  });
  return response.data;
};

export const getDepositorRewards = async (vaultAddress: string, depositorAddress: string, apiKey: string, network: string = 'holesky') => {
  try {
    const response = await axios.get(
      `${FIGMENT_API_URL}/vaults/${vaultAddress}/address/${depositorAddress}/rewards`,
      {
        params: { network },
        headers: {
          'accept': 'application/json',
          'x-api-key': apiKey,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Depositor Rewards API error:', error);
    throw error;
  }
};