import { BigInt, Address, ethereum } from '@graphprotocol/graph-ts'

import { loadOrCreateERC20 } from './ERC20';
import { loadOrCreateStrategy, createLastRate } from './Strategy';
import { Portfolio as PortfolioContract } from '../types/Vault/Portfolio'

import { Deposit, Withdraw, Join, Exit, Swap, ProtocolFeeSet, WhitelistedTokenSet, WhitelistedStrategySet } from '../types/Vault/Vault'
import {
  Vault as VaultEntity,
  Strategy as StrategyEntity,
  Account as AccountEntity,
  AccountBalance as AccountBalanceEntity,
  AccountStrategy as AccountStrategyEntity,
  Portfolio as PortfolioEntity,
} from '../types/schema'

export const VAULT_ID = 'VAULT_ID'

export function handleDeposit(event: Deposit): void {
  loadOrCreateVault(event.address)
  loadOrCreateERC20(event.params.token)
  loadOrCreateAccount(event.params.account, event.address)
  let balance = loadOrCreateAccountBalance(event.params.account, event.params.token)
  balance.amount = balance.amount.plus(event.params.amount).minus(event.params.depositFee)
  balance.save()
}

export function handleWithdraw(event: Withdraw): void {
  loadOrCreateVault(event.address)
  loadOrCreateERC20(event.params.token)
  loadOrCreateAccount(event.params.account, event.address)
  let balance = loadOrCreateAccountBalance(event.params.account, event.params.token)
  balance.amount = balance.amount.minus(event.params.fromVault).minus(event.params.withdrawFee)
  balance.save()
}

export function handleJoin(event: Join): void {
  let vault = loadOrCreateVault(event.address)
  loadOrCreateAccount(event.params.account, event.address)

  let strategy = loadOrCreateStrategy(event.params.strategy, vault, event)
  strategy.shares = strategy.shares.plus(event.params.shares)
  strategy.save()

  let accountStrategy = loadOrCreateAccountStrategy(event.params.account, event.params.strategy)
  accountStrategy.shares = accountStrategy.shares.plus(event.params.shares)
  accountStrategy.invested = accountStrategy.invested.plus(event.params.amount)
  accountStrategy.save()

  let accountBalance = loadOrCreateAccountBalance(event.params.account, Address.fromString(strategy.token))
  accountBalance.amount = accountBalance.amount.minus(event.params.amount)
  accountBalance.save()
}

export function handleExit(event: Exit): void {
  let vault = loadOrCreateVault(event.address)
  loadOrCreateAccount(event.params.account, event.address)

  let strategy = loadOrCreateStrategy(event.params.strategy, vault, event)
  strategy.shares = strategy.shares.minus(event.params.shares)
  strategy.save()

  let accountStrategy = loadOrCreateAccountStrategy(event.params.account, event.params.strategy)
  accountStrategy.shares = accountStrategy.shares.minus(event.params.shares)
  accountStrategy.invested = accountStrategy.invested.minus(event.params.amountInvested)
  accountStrategy.save()

  let accountBalance = loadOrCreateAccountBalance(event.params.account, Address.fromString(strategy.token))
  accountBalance.amount = accountBalance.amount.plus(event.params.amountReceived).minus(event.params.protocolFee).minus(event.params.performanceFee)
  accountBalance.save()
}

export function handleSwap(event: Swap): void {
  loadOrCreateERC20(event.params.tokenIn)
  let balanceIn = loadOrCreateAccountBalance(event.params.account, event.params.tokenIn)
  balanceIn.amount = balanceIn.amount.minus(event.params.amountIn).plus(event.params.remainingIn)
  balanceIn.save()

  loadOrCreateERC20(event.params.tokenOut)
  let balanceOut = loadOrCreateAccountBalance(event.params.account, event.params.tokenOut)
  balanceOut.amount = balanceOut.amount.plus(event.params.amountOut)
  balanceOut.save()
}

export function handleProtocolFeeSet(event: ProtocolFeeSet): void {
  let vault = loadOrCreateVault(event.address)
  vault.protocolFee = event.params.protocolFee
  vault.save()
}

export function handleWhitelistedTokenSet(event: WhitelistedTokenSet): void {
  let token = loadOrCreateERC20(event.params.token)
  token.whitelisted = event.params.whitelisted
  token.save();
}

export function handleWhitelistedStrategySet(event: WhitelistedStrategySet): void {
  let vault = loadOrCreateVault(event.address)
  let strategy = loadOrCreateStrategy(event.params.strategy, vault, event)
  strategy.whitelisted = event.params.whitelisted
  strategy.save();
}

export function handleBlock(block: ethereum.Block): void {
  let vault = VaultEntity.load(VAULT_ID)
  if (vault !== null && vault.strategies !== null) {
    let strategies = vault.strategies;
    for (let i: i32 = 0; i < strategies.length; i++) {
      let strategy = StrategyEntity.load(strategies[i])
      if (strategy !== null) createLastRate(strategy!, block.timestamp)
    }
  }
}

function loadOrCreateVault(vaultAddress: Address): VaultEntity {
  let vault = VaultEntity.load(VAULT_ID)

  if (vault === null) {
    vault = new VaultEntity(VAULT_ID)
    vault.strategies = []
    vault.address = vaultAddress.toHexString()
    vault.protocolFee = BigInt.fromI32(0)
    vault.save()
  }

  return vault!
}

function loadOrCreateAccount(accountAddress: Address, vaultAddress: Address): AccountEntity {
  let id = accountAddress.toHexString()
  let account = AccountEntity.load(id)

  if (account === null) {
    account = new AccountEntity(id)
    account.vault = vaultAddress.toHexString()
    account.save()
    tryDecodingPortfolio(accountAddress);
  }

  return account!
}

function loadOrCreateAccountBalance(accountAddress: Address, tokenAddress: Address): AccountBalanceEntity {
  let id = accountAddress.toHexString() + "-" + tokenAddress.toHexString()
  let accountBalance = AccountBalanceEntity.load(id)

  if (accountBalance === null) {
    accountBalance = new AccountBalanceEntity(id)
    accountBalance.account = accountAddress.toHexString()
    accountBalance.token = tokenAddress.toHexString()
    accountBalance.amount = BigInt.fromI32(0)
    accountBalance.save()
  }

  return accountBalance!
}

function loadOrCreateAccountStrategy(accountAddress: Address, strategyAddress: Address): AccountStrategyEntity {
  let id = accountAddress.toHexString() + "-" + strategyAddress.toHexString()
  let accountStrategy = AccountStrategyEntity.load(id)

  if (accountStrategy === null) {
    accountStrategy = new AccountStrategyEntity(id)
    accountStrategy.account = accountAddress.toHexString()
    accountStrategy.strategy = strategyAddress.toHexString()
    accountStrategy.shares = BigInt.fromI32(0)
    accountStrategy.invested = BigInt.fromI32(0)
    accountStrategy.save()
  }

  return accountStrategy!
}

function tryDecodingPortfolio(accountAddress: Address): void {
  let portfolioContract = PortfolioContract.bind(accountAddress)
  let depositFeeResponse = portfolioContract.try_getDepositFee()
  let withdrawFeeResponse = portfolioContract.try_getWithdrawFee()
  let performanceFeeResponse = portfolioContract.try_getPerformanceFee()

  if (!depositFeeResponse.reverted && !withdrawFeeResponse.reverted && !performanceFeeResponse.reverted) {
    let id = accountAddress.toHexString()
    let portfolio = PortfolioEntity.load(id)
    if (portfolio == null) {
      portfolio = new PortfolioEntity(id)
      portfolio.feeCollector = depositFeeResponse.value.value1
      portfolio.depositFee = depositFeeResponse.value.value0
      portfolio.withdrawFee = withdrawFeeResponse.value.value0
      portfolio.performanceFee = performanceFeeResponse.value.value0
      portfolio.account = id
      portfolio.save()
    }
  }
}
