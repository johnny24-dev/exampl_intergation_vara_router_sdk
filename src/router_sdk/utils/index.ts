
import SailsCalls, { AccountSigner } from "../SailsCalls";
import { ADDITIONAL_BASES, BASES_TO_CHECK_TRADES_AGAINST, Currency, Token, CUSTOM_BASES, CurrencyAmount, TradeType } from "../core";
import { Pair } from "../entities/pair";
import { flatMap } from "lodash";
import { BETTER_TRADE_LESS_HOPS_THRESHOLD, CONTRACT_DATA, NETWORK } from "../constants";
import { BigNumber } from "@ethersproject/bignumber";
import { Trade } from "../entities";

export const get_all_pairs = async (currencyA?: Currency, currencyB?: Currency, sails?: SailsCalls): Promise<Pair[]> => {

    const chainId = currencyA?.chainId;

    const [tokenA, tokenB] = chainId ? [currencyA?.wrapped, currencyB?.wrapped] : [undefined, undefined]

    let bases: Token[] = []
    if (chainId) {
        const common = BASES_TO_CHECK_TRADES_AGAINST[chainId as keyof typeof BASES_TO_CHECK_TRADES_AGAINST] ?? []
        const additionalA = tokenA ? ADDITIONAL_BASES[chainId as keyof typeof ADDITIONAL_BASES]?.[tokenA.address] ?? [] : []
        const additionalB = tokenB ? ADDITIONAL_BASES[chainId as keyof typeof ADDITIONAL_BASES]?.[tokenB.address] ?? [] : []
        bases = [...common, ...additionalA, ...additionalB]
    }
    const basePairs: [Token, Token][] = flatMap(bases, (base): [Token, Token][] => bases.map((otherBase) => [base, otherBase]))
    const all_combinations = allPairCombinations(tokenA, tokenB, bases, basePairs)
    let queries = []
    for (const [tokenA, tokenB] of all_combinations) {
        const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
        const query = sails?.query(
            `RouterService/GetReserves`,
            {
                callArguments: [
                    token0.address,
                    token1.address
                ]
            }
        ).catch((e) => {
            console.log('error', e)
        })
        queries.push(query)
    }
    const results_reserves = await Promise.all(queries)

    //map results_reserves with all_combinattions
    const raw_pairs: Pair[] = []
    for (let i = 0; i < all_combinations.length; i++) {
        const [tokenA, tokenB] = all_combinations[i]
        const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
        if (results_reserves[i]) {
            let data: any = results_reserves[i]?.ok
            raw_pairs.push(new Pair(CurrencyAmount.fromRawAmount(token0, BigNumber.from(data[0] || 0).toString()), CurrencyAmount.fromRawAmount(token1, BigNumber.from(data[1] || 0).toString()), data[2]))
        }
    }
    // remove duplicates liquidity address
    const pairs = raw_pairs.filter((pair, index, self) =>
        index === self.findIndex((t) => t.liquidityToken.address === pair.liquidityToken.address)
    );
    return pairs
}

export const MAX_HOPS = 4

export const calculate_best_trade_exact_in = (
    all_pairs: Pair[],
    currencyAmountIn: CurrencyAmount<Currency>,
    currencyOut: Currency,
) : Trade<Currency, Currency, TradeType> | null => {
    let bestTradeSoFar: Trade<Currency, Currency, TradeType> | null = null
    for (let i = 1; i <= MAX_HOPS; i++) {
        const currentTrade: Trade<Currency, Currency, TradeType> | null =
          Trade.bestTradeExactIn(all_pairs, currencyAmountIn, currencyOut, { maxHops: i, maxNumResults: 1 })[0] ??
          null
        // if current trade is best yet, save it
        if (Trade.isTradeBetter(bestTradeSoFar, currentTrade, BETTER_TRADE_LESS_HOPS_THRESHOLD)) {
          bestTradeSoFar = currentTrade
        }
      }
      return bestTradeSoFar
}

export const calculate_best_trade_exact_out = (
    all_pairs: Pair[],
    currencyIn: Currency,
    currencyAmountOut: CurrencyAmount<Currency>
) : Trade<Currency, Currency, TradeType> | null => {    
    let bestTradeSoFar: Trade<Currency, Currency, TradeType> | null = null
    for (let i = 1; i <= MAX_HOPS; i++) {
        const currentTrade: Trade<Currency, Currency, TradeType> | null =
          Trade.bestTradeExactOut(all_pairs, currencyIn, currencyAmountOut, { maxHops: i, maxNumResults: 1 })[0] ??
          null
        // if current trade is best yet, save it
        if (Trade.isTradeBetter(bestTradeSoFar, currentTrade, BETTER_TRADE_LESS_HOPS_THRESHOLD)) {
          bestTradeSoFar = currentTrade
        }
      }
      return bestTradeSoFar
}


export const send_message = async (url_command: string, payload: any, onload?: () => void, onsuccess?: () => void, onerror?: () => void, keyPair: AccountSigner, sails: SailsCalls): Promise<any> => {
    const response = await sails?.command(
        `${url_command}`,
        keyPair,
        {   
            tokensToSend:BigInt(payload.value),
            callArguments: [
                ...payload.args
            ],
            callbacks: {
                onLoad() {
                    onload?.();
                },

                onSuccess() {
                    onsuccess?.();
                },

                onError() {
                    onerror?.();
                },

            }
        }
    );
    return response
}



const allPairCombinations =
    (tokenA?: Token, tokenB?: Token, bases?: Token[], basePairs?: [Token, Token][]): [Token, Token][] => tokenA && tokenB
        ? [
            // the direct pair
            [tokenA, tokenB],
            // token A against all bases
            ...(bases ?? []).map((base): [Token, Token] => [tokenA, base]),
            // token B against all bases
            ...(bases ?? []).map((base): [Token, Token] => [tokenB, base]),
            // each base against all bases
            ...(basePairs ?? []),
        ]
            .filter((tokens): tokens is [Token, Token] => Boolean(tokens[0] && tokens[1]))
            .filter(([t0, t1]) => t0.address !== t1.address)
            .filter(([tokenA_, tokenB_]) => {
                if (!tokenA.chainId) return true;
                const customBases = CUSTOM_BASES[tokenA.chainId as keyof typeof CUSTOM_BASES];

                const customBasesA: Token[] | undefined = customBases?.[tokenA_.address];
                const customBasesB: Token[] | undefined = customBases?.[tokenB_.address];

                if (!customBasesA && !customBasesB) return true;

                if (customBasesA && !customBasesA.find((base) => tokenB_.equals(base))) return false;
                if (customBasesB && !customBasesB.find((base) => tokenA_.equals(base))) return false;

                return true;
            })
        : []

export default {
    get_all_pairs
}