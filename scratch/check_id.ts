import { keccak256, encodeAbiParameters } from 'viem';

const SEPOLIA_POOL_KEY = {
  currency0: '0x0000000000000000000000000000000000000000',
  currency1: '0xB66160F70336d06bF0eB896770Ba8Eb7E4CFfd92',
  fee: 3000,
  tickSpacing: 60,
  hooks: '0xdB4B84bF3de947441b96b8452B969018f794c480'
};

const poolId = keccak256(encodeAbiParameters(
  [{
    type: 'tuple',
    components: [
      { name: 'currency0', type: 'address' },
      { name: 'currency1', type: 'address' },
      { name: 'fee', type: 'uint24' },
      { name: 'tickSpacing', type: 'int24' },
      { name: 'hooks', type: 'address' }
    ]
  }],
  [SEPOLIA_POOL_KEY]
));

console.log("Calculated Pool ID:", poolId);
