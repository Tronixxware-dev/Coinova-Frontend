const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

function buildQuery(params = {}) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') usp.set(key, value);
  });
  const qs = usp.toString();
  return qs ? `?${qs}` : '';
}

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // some responses (e.g. 204) may have no body
  }

  if (!res.ok) {
    throw new ApiError(data?.error || `Request failed with status ${res.status}`, res.status, data);
  }
  return data;
}

export const api = {
  // Auth
  signup: (payload) => request('/auth/signup', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  refresh: (refreshToken) => request('/auth/refresh', { method: 'POST', body: { refreshToken } }),
  logout: (refreshToken) => request('/auth/logout', { method: 'POST', body: { refreshToken } }),
  forgotPassword: (payload) => request('/auth/forgot-password', { method: 'POST', body: payload }),
  resetPassword: (payload) => request('/auth/reset-password', { method: 'POST', body: payload }),

  // Wallet
  getWallet: (token) => request('/wallet', { token }),
  getWalletTransactions: (token, params) => request(`/wallet/transactions${buildQuery(params)}`, { token }),
  deposit: (token, payload) => request('/wallet/deposit', { method: 'POST', body: payload, token }),
  withdraw: (token, payload) => request('/wallet/withdraw', { method: 'POST', body: payload, token }),

  // Orders
  placeOrder: (token, payload) => request('/orders', { method: 'POST', body: payload, token }),
  getOrders: (token, params) => request(`/orders${buildQuery(params)}`, { token }),
  cancelOrder: (token, id) => request(`/orders/${id}`, { method: 'DELETE', token }),

  // Trades
  getTrades: (token, params) => request(`/trades${buildQuery(params)}`, { token }),

  // Order book
  getOrderBook: (token, symbol) => request(`/orderbook/${symbol}`, { token }),

  // Staking
  getStaking: (token) => request('/staking', { token }),
  stake: (token, payload) => request('/staking/stake', { method: 'POST', body: payload, token }),
  withdrawStaking: (token, payload) => request('/staking/withdraw', { method: 'POST', body: payload, token }),

  // Account
  changePassword: (token, payload) => request('/account/password', { method: 'PATCH', body: payload, token }),
  changeEmail: (token, payload) => request('/account/email', { method: 'PATCH', body: payload, token }),
  deleteAccount: (token, payload) => request('/account', { method: 'DELETE', body: payload, token }),
};