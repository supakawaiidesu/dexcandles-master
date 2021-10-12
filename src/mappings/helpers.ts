import { Address } from '@graphprotocol/graph-ts'
import { ERC20 } from '../types/Factory/ERC20'

export function fetchTokenDecimals(tokenAddress: string): u8 {
  let contract = ERC20.bind(Address.fromString(tokenAddress))
  let result = contract.try_decimals()
  if (!result.reverted) {
    return u8(result.value)
  }
  return 1
}

export function fetchTokenName(tokenAddress: string): string {
  let contract = ERC20.bind(Address.fromString(tokenAddress))
  let result = contract.try_name()
  if (!result.reverted) {
    return result.value.toString()
  }

  return ''
}

export function fetchTokenSymbol(tokenAddress: string): string {
  let contract = ERC20.bind(Address.fromString(tokenAddress))
  let result = contract.try_symbol()
  if (!result.reverted) {
    return result.value.toString()
  }

  return ''
}
