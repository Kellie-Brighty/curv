export const TOKEN_ADDRESS = '0x0b5702A3000A3ae3e80C3dfD6Be547c4325f7EB9' as const;
export const HOOK_ADDRESS = '0xe16Af6E33266e572BbcaDB288bf3893942cd8220' as const;

// Uniswap V4 Mainnet PoolManager (Official)
export const POOL_MANAGER = '0x1F98000000000000000000000000000000000004' as const;

// Pool Key for Curv (ETH/tCURV) on Mainnet
export const MAINNET_POOL_KEY = {
  currency0: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  currency1: TOKEN_ADDRESS,
  fee: 10000, // 1.00% fee for the official pool
  tickSpacing: 1, // tickSpacing used in the live pool
  hooks: HOOK_ADDRESS
} as const;
