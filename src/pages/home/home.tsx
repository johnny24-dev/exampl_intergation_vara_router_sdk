import { useEffect, useState } from 'react';
import { useContext } from 'react';
import { dAppContext } from '@/Context/dappContext';
import { Button } from '@/components/ui/button';
import { useAccount } from '@gear-js/react-hooks';
import { useSailsCalls } from '@/app/hooks';
import "./examples.css";
import { calculate_best_trade_exact_in, calculate_best_trade_exact_out, get_all_pairs, send_message } from '@/router_sdk/utils';
import { ChainId, CurrencyAmount, Percent, USDC, USDT, Vara } from '@/router_sdk/core';
import { Trade } from '@/router_sdk/entities';
import { Router } from '@/router_sdk';
import JSBI from 'jsbi';
import SailsCalls from '@/app/SailsCalls';
import { CONTRACT_DATA, NETWORK, VFT_IDL } from '@/router_sdk/constants';
import { HexString } from '@gear-js/api/types';
import { web3FromSource } from '@polkadot/extension-dapp';
import { Signer } from '@polkadot/types/types';


function Home() {
    const sails = useSailsCalls();
    const { account } = useAccount();
    const {
        currentVoucherId,
        setCurrentVoucherId,
        setSignlessAccount
    } = useContext(dAppContext);

    const [pageSignlessMode, setPageSignlessMode] = useState(false);
    const [contractState, setContractState] = useState("");

    useEffect(() => {
        if (!account) {
            setPageSignlessMode(true);
        } else {
            setPageSignlessMode(false);
        }
        if (setCurrentVoucherId) setCurrentVoucherId(null)
    }, [account])


    const getUserSigner = (): Promise<[HexString, Signer]> => {
        return new Promise(async (resolve, reject) => {
            if (!account) {
                console.log("Accounts not ready!");
                reject('Account not ready!');
                return;
            }

            const { signer } = await web3FromSource(account.meta.source);
            resolve([account.decodedAddress, signer]);
        })
    }


    const handleSwapExactVaraForTokens = async () => {

        const sails = await SailsCalls.new({
            network: NETWORK,
            idl: CONTRACT_DATA.idl,
            contractId: CONTRACT_DATA.programId,
        });
        const current_amount_in = CurrencyAmount.fromRawAmount(Vara.onChain(ChainId.TESTNET), JSBI.BigInt('100000000000'));
        const currency_out = USDT[ChainId.TESTNET]
        const all_pairs = await get_all_pairs(current_amount_in.currency, currency_out, sails);
        const best_trades = calculate_best_trade_exact_in(all_pairs, current_amount_in, currency_out);
        console.log('best_trades', best_trades?.inputAmount.quotient.toString(), best_trades?.outputAmount.quotient.toString(), best_trades?.inputAmount.currency.symbol, best_trades?.outputAmount.currency.symbol)
        if (!best_trades) {
            console.log('No best trade found');
            return;
        }
        const payload = Router.swapCallParameters(best_trades, {
            ttl: 50000 * 1000,
            allowedSlippage: new Percent(1, 100), // slippage 1%
            recipient: account?.decodedAddress as string
        })
        console.log(payload);
       
        const [userAddress, signer] = await getUserSigner();
        const url_command = `${CONTRACT_DATA.programId}/RouterService/${payload.methodName}`
        const response = await send_message(url_command, payload, () => {
            console.log('Message to send is loading');
        }, () => {
            console.log('Message send successfully!');
        }, () => {
            console.log('An error ocurred!');
        }, {
            userAddress, signer
        }, sails);

        console.log('response', response)

    }

    const handleSwapVaraForExactTokens = async () => {
        const sails = await SailsCalls.new({
            network: NETWORK,
            idl: CONTRACT_DATA.idl,
            contractId: CONTRACT_DATA.programId,
        });

        const current_in = Vara.onChain(ChainId.TESTNET);
        const currency_amount_out = CurrencyAmount.fromRawAmount(USDT[ChainId.TESTNET], JSBI.BigInt('10000000000000'));
        const all_pairs = await get_all_pairs(current_in, currency_amount_out.currency, sails);
        // log all_pairs reserves
        console.log('all_pairs', all_pairs.map((pair) => pair.reserve0.quotient.toString() + ' ' + pair.reserve1.quotient.toString()))
        const best_trades = calculate_best_trade_exact_out(all_pairs, current_in, currency_amount_out);
        if (!best_trades) {
            console.log('No best trade found');
            return;
        }
        console.log('best_trades', best_trades.inputAmount.quotient.toString(), best_trades.outputAmount.quotient.toString(), best_trades.inputAmount.currency.symbol, best_trades.outputAmount.currency.symbol)
        const payload = Router.swapCallParameters(best_trades, {
            ttl: 50000 * 1000,
            allowedSlippage: new Percent(0, 100), // slippage 0%
            recipient: account?.decodedAddress as string
        })
        console.log(payload);
        const [userAddress, signer] = await getUserSigner();
        const url_command = `${CONTRACT_DATA.programId}/RouterService/${payload.methodName}`
        const response = await send_message(url_command, payload, () => {
            console.log('Message to send is loading');
        }, () => {
            console.log('Message send successfully!');
        }, () => {
            console.log('An error ocurred!');
        }, { userAddress, signer }, sails);
        console.log('response', response)
    }

    const handleSwapExactTokensForVara = async () => {
        const sails = await SailsCalls.new({
            network: NETWORK,
            idl: CONTRACT_DATA.idl,
            contractId: CONTRACT_DATA.programId,
        });

        const [userAddress, signer] = await getUserSigner();

        const current_amount_in = CurrencyAmount.fromRawAmount(USDT[ChainId.TESTNET], JSBI.BigInt('100000000000000')); // 100 USDT
        const currency_out = Vara.onChain(ChainId.TESTNET);
        const all_pairs = await get_all_pairs(current_amount_in.currency, currency_out, sails);
        console.log('all_pairs', all_pairs)
        console.log('all_pairs', all_pairs.map((pair) => pair.reserve0.quotient.toString() + ' ' + pair.reserve1.quotient.toString()))
        const best_trades = calculate_best_trade_exact_in(all_pairs, current_amount_in, currency_out);
        console.log('best_trades', best_trades?.inputAmount.quotient.toString(), best_trades?.outputAmount.quotient.toString(), best_trades?.inputAmount.currency.symbol, best_trades?.outputAmount.currency.symbol)
        // log all amounts
        if (!best_trades) {
            console.log('No best trade found');
            return;
        }
        const payload_router = Router.swapCallParameters(best_trades, {
            ttl: 50000 * 1000,
            allowedSlippage: new Percent(0, 100), // slippage 0%
            recipient: account?.decodedAddress as string
        })

        console.log('payload_router', payload_router)

        // approve token
        const vft_sails = await SailsCalls.new({
            network: NETWORK,
            idl: VFT_IDL,
            contractId: payload_router.args[2][0] as any,
        });

        const approve_payload = {
            value:'0',
            args: [
                CONTRACT_DATA.programId,
                payload_router.args[0]
            ]
        }

        const url_vft_command = `${payload_router.args[2][0]}/Vft/Approve`
        const approve_response = await send_message(url_vft_command, approve_payload, () => {
            console.log('Message to send is loading');
        }, async() =>  {
            console.log('Approve successfully!');
        }, () => {
            console.log('An error ocurred!');
        }, { userAddress, signer }, vft_sails);
        console.log('approve_response', approve_response)

        //execute swap
        const url_command = `${CONTRACT_DATA.programId}/RouterService/${payload_router.methodName}`
        const res = await send_message(url_command, payload_router, () => {
            console.log('Message to send is loading');
        }, () => {
            console.log('Swap successfully!');
        }, () => {
            console.log('An error ocurred!');
        }, { userAddress, signer }, sails);
        console.log('res', res)  
    }

    const handleSwapExactTokensForTokens = async () => {
        const sails = await SailsCalls.new({
            network: NETWORK,
            idl: CONTRACT_DATA.idl,
            contractId: CONTRACT_DATA.programId,
        });
        
        const [userAddress, signer] = await getUserSigner();

        const current_amount_in = CurrencyAmount.fromRawAmount(USDT[ChainId.TESTNET], JSBI.BigInt('10000000000000')); // 10 USDT
        const currency_out = USDC[ChainId.TESTNET];
        const all_pairs = await get_all_pairs(current_amount_in.currency, currency_out, sails);
        console.log('all_pairs', all_pairs.map((pair) => pair.reserve0.quotient.toString() + ' ' + pair.reserve1.quotient.toString()))
        const best_trades = calculate_best_trade_exact_in(all_pairs, current_amount_in, currency_out);
        console.log('best_trades', best_trades?.inputAmount.quotient.toString(), best_trades?.outputAmount.quotient.toString(), best_trades?.inputAmount.currency.symbol, best_trades?.outputAmount.currency.symbol)
        if (!best_trades) {
            console.log('No best trade found');
            return;
        }
        const payload_router = Router.swapCallParameters(best_trades, {
            ttl: 50000 * 1000,
            allowedSlippage: new Percent(0, 100), // slippage 0%
            recipient: account?.decodedAddress as string
        })

        console.log('payload_router', payload_router)

        // approve token
        const vft_sails = await SailsCalls.new({
            network: NETWORK,
            idl: VFT_IDL,
            contractId: payload_router.args[2][0] as any,
        });

        const approve_payload = {
            value:'0',
            args: [
                CONTRACT_DATA.programId,
                payload_router.args[0]
            ]
        }

        const url_vft_command = `${payload_router.args[2][0]}/Vft/Approve`
        const approve_response = await send_message(url_vft_command, approve_payload, () => {
            console.log('Message to send is loading');
        }, async() =>  {
            console.log('Approve successfully!');
        }, () => {
            console.log('An error ocurred!');
        }, { userAddress, signer }, vft_sails);
        console.log('approve_response', approve_response)

        //execute swap
        const url_command = `${CONTRACT_DATA.programId}/RouterService/${payload_router.methodName}`
        const res = await send_message(url_command, payload_router, () => {
            console.log('Message to send is loading');
        }, () => {
            console.log('Swap successfully!');
        }, () => {
            console.log('An error ocurred!');
        }, { userAddress, signer }, sails);
        console.log('res', res)  
    }

    const handleSwapTokensForExactTokens = async () => {
        const sails = await SailsCalls.new({
            network: NETWORK,
            idl: CONTRACT_DATA.idl,
            contractId: CONTRACT_DATA.programId,
        });
        
        const [userAddress, signer] = await getUserSigner();

        const currency_in = USDT[ChainId.TESTNET]; // 10 USDT
        const currency_amount_out = CurrencyAmount.fromRawAmount(USDC[ChainId.TESTNET], JSBI.BigInt('1000000000000')); //1 USDC
        const all_pairs = await get_all_pairs(currency_in, currency_amount_out.currency, sails);
        console.log('all_pairs', all_pairs.map((pair) => pair.reserve0.quotient.toString() + ' ' + pair.reserve1.quotient.toString()))
        const best_trades = calculate_best_trade_exact_out(all_pairs,currency_in, currency_amount_out, );
        console.log('best_trades', best_trades?.inputAmount.quotient.toString(), best_trades?.outputAmount.quotient.toString(), best_trades?.inputAmount.currency.symbol, best_trades?.outputAmount.currency.symbol)
        if (!best_trades) {
            console.log('No best trade found');
            return;
        }
        const payload_router = Router.swapCallParameters(best_trades, {
            ttl: 50000 * 1000,
            allowedSlippage: new Percent(0, 100), // slippage 0%
            recipient: account?.decodedAddress as string
        })

        console.log('payload_router', payload_router)

        // approve token
        const vft_sails = await SailsCalls.new({
            network: NETWORK,
            idl: VFT_IDL,
            contractId: payload_router.args[2][0] as any,
        });

        const approve_payload = {
            value:'0',
            args: [
                CONTRACT_DATA.programId,
                payload_router.args[1]
            ]
        }

        const url_vft_command = `${payload_router.args[2][0]}/Vft/Approve`
        const approve_response = await send_message(url_vft_command, approve_payload, () => {
            console.log('Message to send is loading');
        }, async() =>  {
            console.log('Approve successfully!');
        }, () => {
            console.log('An error ocurred!');
        }, { userAddress, signer }, vft_sails);
        console.log('approve_response', approve_response)

        // execute swap
        const url_command = `${CONTRACT_DATA.programId}/RouterService/${payload_router.methodName}`
        const res = await send_message(url_command, payload_router, () => {
            console.log('Message to send is loading');
        }, () => {
            console.log('Swap successfully!');
        }, () => {
            console.log('An error ocurred!');
        }, { userAddress, signer }, sails);
        console.log('res', res)  
    }

    const handleSwapTokensForExactVara = async () => {
        const sails = await SailsCalls.new({
            network: NETWORK,
            idl: CONTRACT_DATA.idl,
            contractId: CONTRACT_DATA.programId,
        });
        
        const [userAddress, signer] = await getUserSigner();

        const currency_in = USDT[ChainId.TESTNET]; // 10 USDT
        const currency_amount_out = CurrencyAmount.fromRawAmount(Vara.onChain(ChainId.TESTNET), JSBI.BigInt('100000000000')); // 0.1 Vara
        const all_pairs = await get_all_pairs(currency_in, currency_amount_out.currency, sails);
        console.log('all_pairs', all_pairs.map((pair) => pair.reserve0.quotient.toString() + ' ' + pair.reserve1.quotient.toString()))
        const best_trades = calculate_best_trade_exact_out(all_pairs, currency_in, currency_amount_out, );
        console.log('best_trades', best_trades?.inputAmount.quotient.toString(), best_trades?.outputAmount.quotient.toString(), best_trades?.inputAmount.currency.symbol, best_trades?.outputAmount.currency.symbol)
        if (!best_trades) {
            console.log('No best trade found');
            return;
        }
        const payload_router = Router.swapCallParameters(best_trades, {
            ttl: 50000 * 1000,
            allowedSlippage: new Percent(0, 100), // slippage 0%
            recipient: account?.decodedAddress as string
        })

        console.log('payload_router', payload_router)

        // approve token
        const vft_sails = await SailsCalls.new({
            network: NETWORK,
            idl: VFT_IDL,
            contractId: payload_router.args[2][0] as any,
        });

        const approve_payload = {
            value:'0',
            args: [
                CONTRACT_DATA.programId,
                payload_router.args[1]
            ]
        }

        const url_vft_command = `${payload_router.args[2][0]}/Vft/Approve`
        const approve_response = await send_message(url_vft_command, approve_payload, () => {
            console.log('Message to send is loading');
        }, async() =>  {
            console.log('Approve successfully!');
        }, () => {
            console.log('An error ocurred!');
        }, { userAddress, signer }, vft_sails);
        console.log('approve_response', approve_response)

        // execute swap
        const url_command = `${CONTRACT_DATA.programId}/RouterService/${payload_router.methodName}`
        const res = await send_message(url_command, payload_router, () => {
            console.log('Message to send is loading');
        }, () => {
            console.log('Swap successfully!');
        }, () => {
            console.log('An error ocurred!');
        }, { userAddress, signer }, sails);
        console.log('res', res)  
    }

    return (
        <div className='examples-container'>

            <div className='examples'>
                <div className='information'>
                    <p>
                        signless mode: {pageSignlessMode ? "Activated" : "disabled"}
                    </p>
                    <p>
                        voucher active: {currentVoucherId ? "true" : "false"}
                    </p>
                    <p
                        style={{
                            maxWidth: "300px"
                        }}
                    >
                        state: {contractState}
                    </p>
                </div>
                <Button onClick={async () => {
                    if (!sails) {
                        console.log('No esta lsita el account o sails');
                        return;
                    }
                    handleSwapExactVaraForTokens()

                }}>
                    Swap Exact Vara For Tokens
                </Button>


                <Button onClick={async () => {
                    if (!sails) {
                        console.log('No esta lsita el account o sails');
                        return;
                    }
            
                    handleSwapVaraForExactTokens()
            

                }}>
                    SwapVara For Exact Tokens
                </Button>

                <Button onClick={async () => {
                    if (!sails) {
                        console.log('No esta lsita el account o sails');
                        return;
                    }
            
                    handleSwapExactTokensForVara()
            

                }}>
                    Swap Exact Tokens for Vara
                </Button>

                <Button onClick={async () => {
                    if (!sails) {
                        console.log('No esta lsita el account o sails');
                        return;
                    }
            
                    handleSwapExactTokensForTokens()
            

                }}>
                    Swap Exact Tokens for Tokens
                </Button>

                <Button onClick={async () => {
                    if (!sails) {
                        console.log('No esta lsita el account o sails');
                        return;
                    }
            
                    handleSwapTokensForExactTokens()
            

                }}>
                    Swap Tokens for Exact Tokens
                </Button>

                <Button onClick={async () => {
                    if (!sails) {
                        console.log('No esta lsita el account o sails');
                        return;
                    }
            
                    handleSwapTokensForExactVara()
            

                }}>
                    Swap Tokens for Exact Vara
                </Button>

            </div>
        </div>
    );
}

export { Home };
