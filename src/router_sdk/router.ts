import { Token, Currency, CurrencyAmount, Percent, TradeType } from './core'
import { Trade } from './entities'
import invariant from 'tiny-invariant'

/**
 * Options for producing the arguments to send call to the router.
 */
export interface TradeOptions {
  /**
   * How much the execution price is allowed to move unfavorably from the trade execution price.
   */
  allowedSlippage: Percent
  /**
   * How long the swap is valid until it expires, in milliseconds.
   * This will be used to produce a `deadline` parameter which is computed from when the swap call parameters
   * are generated.
   */
  ttl: number
  /**
   * The account that should receive the output of the swap.
   */
  recipient: string

  /**
   * Whether any of the tokens in the path are fee on transfer tokens, which should be handled with special methods
   */
  feeOnTransfer?: boolean
}

export interface TradeOptionsDeadline extends Omit<TradeOptions, 'ttl'> {
  /**
   * When the transaction expires.
   * This is an atlernate to specifying the ttl, for when you do not want to use local time.
   */
  deadline: number
}

/**
 * The parameters to use in the call to the VaraSwap V2 Router to execute a trade.
 */
export interface SwapParameters {
  /**
   * The method to call on the VaraSwap V2 Router.
   */
  methodName: string
  /**
   * The arguments to pass to the method, all hex encoded.
   */
  args: (string | string[])[]
  /**
   * The amount of wei to send in hex.
   */
  value: string
}

function toHex(currencyAmount: CurrencyAmount<Currency>) {
  return `0x${currencyAmount.quotient.toString(16)}`
}

function toStringNum(currencyAmount: CurrencyAmount<Currency>) {
  return currencyAmount.quotient.toString()
}

const ZERO_HEX = '0x0'

/**
 * Represents the VaraSwap V2 Router, and has static methods for helping execute trades.
 */
export abstract class Router {
  /**
   * Cannot be constructed.
   */
  private constructor() {}
  /**
   * Produces the on-chain method name to call and the hex encoded parameters to pass as arguments for a given trade.
   * @param trade to produce call parameters for
   * @param options options for the call parameters
   */
  public static swapCallParameters(
    trade: Trade<Currency, Currency, TradeType>,
    options: TradeOptions | TradeOptionsDeadline
  ): SwapParameters {
    const varaIn = trade.inputAmount.currency.isNative
    const varaOut = trade.outputAmount.currency.isNative
    // the router does not support both vara in and out
    invariant(!(varaIn && varaOut), 'VARA_IN_OUT')
    invariant(!('ttl' in options) || options.ttl > 0, 'TTL')

    const to: string = options.recipient
    const amountIn: string = toStringNum(trade.maximumAmountIn(options.allowedSlippage))
    const amountOut: string = toStringNum(trade.minimumAmountOut(options.allowedSlippage))
    const path: string[] = trade.route.path.map((token: Token) => token.address)
    const deadline =
      'ttl' in options
        ? (Math.floor(new Date().getTime()) + options.ttl)
        : options.deadline

    const useFeeOnTransfer = Boolean(options.feeOnTransfer)

    let methodName: string
    let args: (string | string[])[]
    let value: string
    switch (trade.tradeType) {
      case TradeType.EXACT_INPUT:
        if (varaIn) {
          methodName = useFeeOnTransfer ? 'SwapExactVaraForTokensSupportingFeeOnTransferTokens' : 'SwapExactVaraForTokens'
          // (uint amountOutMin, address[] calldata path, address to, uint deadline)
          args = [amountOut, path, to, deadline.toString()]
          value = amountIn
        } else if (varaOut) {
          methodName = useFeeOnTransfer ? 'SwapExactTokensForVaraSupportingFeeOnTransferTokens' : 'SwapExactTokensForVara'
          // (uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)
          args = [amountIn, amountOut, path, to, deadline.toString()]
          value = '0'
        } else {
          methodName = useFeeOnTransfer
            ? 'SwapExactTokensForTokensSupportingFeeOnTransferTokens'
            : 'SwapExactTokensForTokens'
          // (uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)
          args = [amountIn, amountOut, path, to, deadline.toString()]
          value = '0'
        }
        break
      case TradeType.EXACT_OUTPUT:
        invariant(!useFeeOnTransfer, 'EXACT_OUT_FOT')
        if (varaIn) {
          methodName = 'SwapVaraForExactTokens'
          // (uint amountOut, address[] calldata path, address to, uint deadline)
          args = [amountOut, path, to, deadline.toString()]
          value = amountIn
        } else if (varaOut) {
          methodName = 'SwapTokensForExactVara'
          // (uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline)
          args = [amountOut, amountIn, path, to, deadline.toString()]
          value = '0'
        } else {
          methodName = 'SwapTokensForExactTokens'
          // (uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline)
          args = [amountOut, amountIn, path, to, deadline.toString()]
          value = '0'
        }
        break
    }
    return {
      methodName,
      args,
      value,
    }
  }
}
