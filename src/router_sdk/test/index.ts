import { get_all_pairs } from "../utils";
import { USDT, Vara } from "../core";
    
const get_pairs_test = async () => {
    const pairs = await get_all_pairs(Vara.onChain(2), USDT[2])
    console.log(pairs)
}

get_pairs_test()