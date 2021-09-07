import { Contract } from 'ethers'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

import { BigNumberish } from '@mimic-fi/v1-helpers'

export type NAry<T> = T | Array<T>

export type Account = string | { address: string }

export type TxParams = {
  from?: SignerWithAddress
}

export type Allowed = 'any' | 'whitelisted' | 'none'

export type RawAgreementDeployment = {
  vault?: Contract
  depositFee?: BigNumberish
  withdrawFee?: BigNumberish
  performanceFee?: BigNumberish
  feeCollector?: Account
  maxSwapSlippage?: BigNumberish
  managers?: Account[]
  withdrawers?: Account[]
  allowedTokens?: Allowed
  tokens?: Contract[]
  allowedStrategies?: Allowed
  strategies?: Contract[]
  from?: SignerWithAddress
}

export type AgreementDeployment = {
  vault: Contract
  depositFee: BigNumberish
  withdrawFee: BigNumberish
  performanceFee: BigNumberish
  feeCollector: Account
  maxSwapSlippage: BigNumberish
  managers: Account[]
  withdrawers: Account[]
  allowedTokens: Allowed
  tokens: Contract[]
  allowedStrategies: Allowed
  strategies: Contract[]
  from?: SignerWithAddress
}

export function toAddress(account: Account): string {
  return typeof account === 'string' ? account : account.address
}

export function toAddresses(accounts: Account[]): string[] {
  return accounts.map(toAddress)
}
