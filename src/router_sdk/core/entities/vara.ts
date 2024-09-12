import { WVARA } from './../addresses';
import invariant from 'tiny-invariant'
import { Currency } from './currency'
import { NativeCurrency } from './nativeCurrency'
import { Token } from './token'
/**
 * Ether is the main usage of a 'native' currency, i.e. for Ethereum mainnet and all testnets
 */
export class Vara extends NativeCurrency {
  protected constructor(chainId: number) {
    super(chainId, 12, 'VARA', 'Vara')
  }

  public get wrapped(): Token {
    const wvara = WVARA[this.chainId as keyof typeof WVARA]
    invariant(!!wvara, 'WRAPPED')
    return wvara
  }

  private static _varaCache: { [chainId: number]: Vara } = {}

  public static onChain(chainId: number): Vara {
    return this._varaCache[chainId] ?? (this._varaCache[chainId] = new Vara(chainId))
  }

  public equals(other: Currency): boolean {
    return other.isNative && other.chainId === this.chainId
  }
}
