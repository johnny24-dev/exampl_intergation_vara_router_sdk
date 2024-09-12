export enum ChainId {
  MAINNET = 1,
  TESTNET = 2,
}

export const SUPPORTED_CHAINS = [
  ChainId.MAINNET,
  ChainId.TESTNET,
] as const
export type SupportedChainsType = (typeof SUPPORTED_CHAINS)[number]

export enum NativeCurrencyName {
  // Strings match input for CLI
  VARA = 'VARA',
}
