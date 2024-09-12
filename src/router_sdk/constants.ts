import { HexString } from '@gear-js/api'
import { Percent } from './core'
import JSBI from 'jsbi'

/**
 * @deprecated use FACTORY_ADDRESS_MAP instead
 */
export const FACTORY_ADDRESS = '0x47f0d84bc61dd913f7e15d860c7eae21005af7b778ec08c66388ffba9d3b28cc'
export const ROUTER_ADDRESS = '0x84ec08ed03b1cd29421446067967ac2ed0b61b92ae47fdac86c89e3cb6b9c45a'
export const NETWORK = 'wss://testnet.vara.network'

export const MINIMUM_LIQUIDITY = JSBI.BigInt(1000)

interface ContractSails {
    programId: HexString,
    idl: string
}


export const VFT_IDL = `
  constructor {
  New : (name: str, symbol: str, decimals: u8);
};

service Vft {
  Deposit : () -> bool;
  Withdraw : (value: u256) -> bool;
  Approve : (spender: actor_id, value: u256) -> bool;
  Transfer : (to: actor_id, value: u256) -> bool;
  TransferFrom : (from: actor_id, to: actor_id, value: u256) -> bool;
  query Allowance : (owner: actor_id, spender: actor_id) -> u256;
  query BalanceOf : (account: actor_id) -> u256;
  query Decimals : () -> u8;
  query Name : () -> str;
  query Symbol : () -> str;
  query TotalSupply : () -> u256;

  events {
    Deposit: struct { dst: actor_id, wad: u256 };
    Withdraw: struct { src: actor_id, wad: u256 };
    Approval: struct { owner: actor_id, spender: actor_id, value: u256 };
    Transfer: struct { from: actor_id, to: actor_id, value: u256 };
  }
};
`

export const CONTRACT_DATA: ContractSails = {
    programId: ROUTER_ADDRESS,
    idl: `type RouterError = enum {
  PairAlreadyExists,
  TransferLiquidityFailed,
  TransferFromLiquidityFailed,
  TransferFromFailed,
  InsufficientFee,
  BurnLiquidityFailed,
  InsufficientVaraAmount,
  InsufficientTokenAmount,
  CreatePairFailed,
  WithdrawWvaraFailed,
  DepositWVARAFailed,
  SwapFailed,
  MintLiquidityFailed,
  Expired,
  PairNotFound,
  IdenticalAddresses,
  ZeroAddress,
  InsufficientBAmount,
  InsufficientAAmount,
  InsufficientLiquidity,
  InvalidPath,
  InsufficientOutputAmount,
  InsufficientInputAmount,
  InvalidLiquidityAmount,
  ExcessiveInputAmount,
  TransferFailed,
};

constructor {
  New : (factory: actor_id, wvara: actor_id);
};

service RouterService {
  AddLiquidity : (token_a: actor_id, token_b: actor_id, amount_a_desired: u256, amount_b_desired: u256, amount_a_min: u256, amount_b_min: u256, to: actor_id, deadline: u64) -> result (struct { u256, u256, u256 }, RouterError);
  AddLiquidityVara : (token: actor_id, amount_token_desired: u256, amount_token_min: u256, amount_vara_min: u256, to: actor_id, deadline: u64) -> result (struct { u256, u256, u256 }, RouterError);
  CreatePair : (token_a: actor_id, token_b: actor_id) -> result (null, RouterError);
  RemoveLiquidity : (token_a: actor_id, token_b: actor_id, liquidity: u256, amount_a_min: u256, amount_b_min: u256, to: actor_id, deadline: u64) -> result (struct { u256, u256 }, RouterError);
  RemoveLiquidityVara : (token: actor_id, liquidity: u256, amount_token_min: u256, amount_vara_min: u256, to: actor_id, deadline: u64) -> result (struct { u256, u256 }, RouterError);
  SwapExactTokensForTokens : (amount_in: u256, amount_out_min: u256, path: vec actor_id, to: actor_id, deadline: u64) -> result (vec u256, RouterError);
  SwapExactTokensForVara : (amount_in: u256, amount_out_min: u256, path: vec actor_id, to: actor_id, deadline: u64) -> result (vec u256, RouterError);
  SwapExactVaraForTokens : (amount_out_min: u256, path: vec actor_id, to: actor_id, deadline: u64) -> result (vec u256, RouterError);
  SwapTokensForExactTokens : (amount_out: u256, amount_in_max: u256, path: vec actor_id, to: actor_id, deadline: u64) -> result (vec u256, RouterError);
  SwapTokensForExactVara : (amount_out: u256, amount_in_max: u256, path: vec actor_id, to: actor_id, deadline: u64) -> result (vec u256, RouterError);
  SwapVaraForExactTokens : (amount_out: u256, path: vec actor_id, to: actor_id, deadline: u64) -> result (vec u256, RouterError);
  TransferFromLiquidity : (pair: actor_id, from: actor_id, to: actor_id, liquidity: u256) -> result (null, RouterError);
  TransferLiquidity : (pair: actor_id, to: actor_id, liquidity: u256) -> result (null, RouterError);
  query GetAmountIn : (amount_out: u256, reserve_in: u256, reserve_out: u256) -> result (u256, RouterError);
  query GetAmountOut : (amount_in: u256, reserve_in: u256, reserve_out: u256) -> result (u256, RouterError);
  query GetAmountsIn : (amount_out: u256, path: vec actor_id) -> result (vec u256, RouterError);
  query GetAmountsOut : (amount_in: u256, path: vec actor_id) -> result (vec u256, RouterError);
  query GetReserves : (token_a: actor_id, token_b: actor_id) -> result (struct { u256, u256, actor_id }, RouterError);
  query PairFor : (token_a: actor_id, token_b: actor_id) -> result (actor_id, RouterError);
  query Quote : (amount_a: u256, reserve_a: u256, reserve_b: u256) -> result (u256, RouterError);
  query SortTokens : (token_a: actor_id, token_b: actor_id) -> result (struct { actor_id, actor_id }, RouterError);

  events {
    CreatePair: struct { token_a: actor_id, token_b: actor_id, pair_address: actor_id };
    AddLiquidity: struct { token_a: actor_id, token_b: actor_id, amount_a: u256, amount_b: u256, to: actor_id, liquidity: u256 };
    AddLiquidityVARA: struct { token_a: actor_id, amount_a: u256, amount_vara: u256, to: actor_id, liquidity: u256 };
    RemoveLiquidity: struct { token_a: actor_id, token_b: actor_id, amount_a_received: u256, amount_b_received: u256, to: actor_id, liquidity: u256 };
    RemoveLiquidityVARA: struct { token_a: actor_id, amount_a_received: u256, amount_vara_received: u256, to: actor_id, liquidity: u256 };
    SwapExactTokensForTokens: struct { amount_in: u256, amount_out: u256, path: vec actor_id, to: actor_id };
    SwapTokensForExactTokens: struct { amount_out: u256, amount_in: u256, path: vec actor_id, to: actor_id };
    SwapExactVARAForTokens: struct { amount_in: u256, amount_out: u256, path: vec actor_id, to: actor_id };
    SwapTokensForExactVARA: struct { amount_out: u256, amount_in: u256, path: vec actor_id, to: actor_id };
    SwapExactTokensForVARA: struct { amount_in: u256, amount_out: u256, path: vec actor_id, to: actor_id };
    SwapVARAForExactTokens: struct { amount_out: u256, amount_in: u256, path: vec actor_id, to: actor_id };
  }
};

`
};

// exports for internal consumption
export const ZERO = JSBI.BigInt(0)
export const ONE = JSBI.BigInt(1)
export const FIVE = JSBI.BigInt(5)
export const _997 = JSBI.BigInt(997)
export const _1000 = JSBI.BigInt(1000)
export const BASIS_POINTS = JSBI.BigInt(10000)

export const ZERO_PERCENT = new Percent(ZERO)
export const ONE_HUNDRED_PERCENT = new Percent(ONE)
export const BIPS_BASE = 10000
export const ONE_BIPS = new Percent(1, BIPS_BASE)

export const BETTER_TRADE_LESS_HOPS_THRESHOLD = new Percent(50, BIPS_BASE)