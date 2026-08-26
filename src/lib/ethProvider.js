import { ethers } from 'ethers';

const RPC_URL = import.meta.env.VITE_SEPOLIA_RPC_URL;

export const provider = new ethers.JsonRpcProvider(RPC_URL);