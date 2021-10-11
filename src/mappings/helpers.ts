import {BigInt, Address, Bytes} from '@graphprotocol/graph-ts'
import {ERC20} from '../types/Factory/ERC20'

export function fetchTokenDecimals(tokenAddress: Bytes): u8 {
    let contract = ERC20.bind((Address.fromString(tokenAddress.toHexString())));
    let decimalValue = null;
    let decimalResult = contract.try_decimals();
    if (!decimalResult.reverted) {
        decimalValue = decimalResult.value;
    } else {
        // Handle the error?
    }
    return u8(decimalValue)
}