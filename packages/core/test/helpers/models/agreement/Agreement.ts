import { BigNumber, Contract, utils } from 'ethers'
import { BigNumberish, ZERO_ADDRESS } from '@mimic-fi/v1-helpers'

import { Account, toAddress, toAddresses } from '../types'
import { Allowed, RawAgreementDeployment } from './types'

import Vault from '../vault/Vault'
import TokenList from '../tokens/TokenList'
import AgreementDeployer from './AgreementDeployer'

export default class Agreement {
  instance: Contract
  vault: Vault
  feeCollector: Account
  depositFee: BigNumberish
  performanceFee: BigNumberish
  maxSwapSlippage: BigNumberish
  managers: Account[]
  withdrawers: Account[]
  tokens: Contract[]
  allowedTokens: Allowed
  strategies: Contract[]
  allowedStrategies: Allowed

  static async create(params: RawAgreementDeployment = {}): Promise<Agreement> {
    return AgreementDeployer.deploy(params)
  }

  constructor(
    instance: Contract,
    vault: Vault,
    feeCollector: Account,
    depositFee: BigNumberish,
    performanceFee: BigNumberish,
    maxSwapSlippage: BigNumberish,
    managers: Account[],
    withdrawers: Account[],
    tokens: Contract[],
    allowedTokens: Allowed,
    strategies: Contract[],
    allowedStrategies: Allowed
  ) {
    this.instance = instance
    this.vault = vault
    this.feeCollector = feeCollector
    this.depositFee = depositFee
    this.performanceFee = performanceFee
    this.maxSwapSlippage = maxSwapSlippage
    this.managers = managers
    this.withdrawers = withdrawers
    this.tokens = tokens
    this.allowedTokens = allowedTokens
    this.strategies = strategies
    this.allowedStrategies = allowedStrategies
  }

  get address(): string {
    return this.instance.address
  }

  async areWithdrawers(accounts: Account[]): Promise<boolean> {
    const addresses = toAddresses(accounts)
    const results = await Promise.all(addresses.map(async (address) => await this.instance.isWithdrawer(address)))
    return results.every(Boolean)
  }

  async areManagers(accounts: Account[]): Promise<boolean> {
    const addresses = toAddresses(accounts)
    const results = await Promise.all(addresses.map(async (address) => await this.instance.isManager(address)))
    return results.every(Boolean)
  }

  async areAllowedSenders(accounts: Account[]): Promise<boolean> {
    const addresses = toAddresses(accounts)
    const results = await Promise.all(addresses.map(async (address) => await this.instance.isSenderAllowed(address)))
    return results.every(Boolean)
  }

  async isStrategyAllowed(strategy: Account): Promise<boolean> {
    return this.instance.isStrategyAllowed(toAddress(strategy))
  }

  async isTokenAllowed(token: Account): Promise<boolean> {
    return this.instance.isTokenAllowed(toAddress(token))
  }

  async getDepositFee(): Promise<{ fee: BigNumber; collector: string }> {
    const [fee, collector] = await this.instance.getDepositFee()
    return { fee, collector }
  }

  async getPerformanceFee(): Promise<{ fee: BigNumber; collector: string }> {
    const [fee, collector] = await this.instance.getPerformanceFee()
    return { fee, collector }
  }

  async getFeeCollector(): Promise<BigNumber> {
    return this.instance.feeCollector()
  }

  async getMaxSwapSlippage(): Promise<BigNumber> {
    return this.instance.maxSwapSlippage()
  }

  async getSupportedCallbacks(): Promise<string> {
    return this.instance.getSupportedCallbacks()
  }

  async canDeposit({ who, where, how }: { who: Account; where: Account; how?: string[] }): Promise<boolean> {
    return this.canPerform({ who, where, what: this.vault.getSighash('deposit'), how })
  }

  async canWithdraw({ who, where, how }: { who: Account; where: Account; how?: string[] }): Promise<boolean> {
    return this.canPerform({ who, where, what: this.vault.getSighash('withdraw'), how })
  }

  async canSwap({ who, where, how }: { who: Account; where: Account; how?: Array<string | BigNumberish> }): Promise<boolean> {
    const parsedHow = how ? how.map((h) => (typeof h === 'string' ? h : utils.hexZeroPad(utils.hexlify(h), 32))) : []
    return this.canPerform({ who, where, what: this.vault.getSighash('swap'), how: parsedHow })
  }

  async canJoin({ who, where, how }: { who: Account; where: Account; how?: string[] }): Promise<boolean> {
    return this.canPerform({ who, where, what: this.vault.getSighash('join'), how })
  }

  async canExit({ who, where, how }: { who: Account; where: Account; how?: string[] }): Promise<boolean> {
    return this.canPerform({ who, where, what: this.vault.getSighash('exit'), how })
  }

  async canPerform({ who, where, what, how }: { who: Account; where: Account; what?: string; how?: string[] }): Promise<boolean> {
    const padRight = (s: string) => `0x${s.replace('0x', '').padEnd(64, '0')}`
    what = padRight(what ?? ZERO_ADDRESS)
    how = (how ?? []).map(padRight)
    return this.instance.canPerform(toAddress(who), toAddress(where), what, how)
  }
}
