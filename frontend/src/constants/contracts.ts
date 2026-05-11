export const TOKEN_ADDRESS = '0x00cb7Bc0089BB4DbDB834E930e488cdbc742062F' as const;
export const HOOK_ADDRESS = '0x2fEeb46c2938B047C583f709de138458e8CBc480' as const;

// Uniswap V4 Sepolia PoolManager (Official)
export const POOL_MANAGER = '0xE03A1074c86CFeDd5C142C4F04F1a1536e203543' as const;

// Pool Key for Curv (ETH/CURV)
// sorting logic moved to ExecutePanel for safety
export const SEPOLIA_POOL_KEY = {
  currency0: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  currency1: TOKEN_ADDRESS,
  fee: 3000,
  tickSpacing: 60,
  hooks: HOOK_ADDRESS
} as const;
