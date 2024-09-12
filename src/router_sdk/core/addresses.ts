import { ChainId } from "./chains"
import { Token } from "./entities"

export const WVARA = {
  [ChainId.TESTNET]: new Token(
    ChainId.TESTNET,
    '0x0902f92a4ba0747e0a379a67c4c5178a8d833bdb5727932e1310a20b8a049af8',
    12,
    'WVARA',
    'Wrapped VARA',
  ),
  [ChainId.MAINNET]: new Token(
    ChainId.MAINNET,
    '0x8c805723ebc0a7fc5b7d3e7b75d567918e806b3461cb9fa21941a9edc0220bf',
    12,
    'WVARA',
    'Wrapped VARA'),
}
export const USDC = {
  [ChainId.MAINNET]: new Token(
    ChainId.MAINNET,
    '0x8c73bfc6eb50445a5543714a0c345ada1c7469dbe36a9290e7470e6ad9040fc7',
    12,
    'USDC',
    'USD Coin',
  ),
  [ChainId.TESTNET]: new Token(
    ChainId.TESTNET,
    '0x8c73bfc6eb50445a5543714a0c345ada1c7469dbe36a9290e7470e6ad9040fc7',
    12,
    'USDC',
    'USD Coin',
  ),
}

export const USDT = {
  [ChainId.MAINNET]: new Token(
    ChainId.MAINNET,
    '0xabe4ef22dfe18d325d28c400757cb9f713fe5152b6ce5cff71870c1b885c8738',
    12,
    'USDT',
    'Tether USD',
  ),
  [ChainId.TESTNET]: new Token(
    ChainId.TESTNET,
    '0xabe4ef22dfe18d325d28c400757cb9f713fe5152b6ce5cff71870c1b885c8738',
    12,
    'USDT',
    'Tether USD',
  ),
}

// used to construct intermediary pairs for trading
export const BASES_TO_CHECK_TRADES_AGAINST = {
  [ChainId.TESTNET]: [
    WVARA[ChainId.TESTNET],
    USDC[ChainId.TESTNET],
    USDT[ChainId.TESTNET],
  ],
  [ChainId.MAINNET]: [
    WVARA[ChainId.MAINNET],
    USDC[ChainId.MAINNET],
    USDT[ChainId.MAINNET],
  ],
}

/**
 * Additional bases for specific tokens
 * @example { [WBTC.address]: [renBTC], [renBTC.address]: [WBTC] }
 */
export const ADDITIONAL_BASES: { [chainId in ChainId]?: { [tokenAddress: string]: Token[] } } = {}

export const CUSTOM_BASES: { [chainId in ChainId]?: { [tokenAddress: string]: Token[] } } = {}