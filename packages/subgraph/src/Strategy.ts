import { Address, BigInt, log } from '@graphprotocol/graph-ts'

import { loadOrCreateERC20 } from './ERC20'
import { Strategy as StrategyContract } from '../types/Vault/Strategy'
import { Strategy as StrategyEntity, Vault as VaultEntity } from '../types/schema'

export function loadOrCreateStrategy(strategyAddress: Address, vault: VaultEntity): StrategyEntity {
  let id = strategyAddress.toHexString()
  let strategy = StrategyEntity.load(id)

  if (strategy === null) {
    strategy = new StrategyEntity(id)
    strategy.vault = vault.id
    strategy.token = getStrategyToken(strategyAddress).toHexString()
    strategy.whitelisted = false
    strategy.metadata = getStrategyMetadata(strategyAddress)
    strategy.shares = BigInt.fromI32(0)
    strategy.value = BigInt.fromI32(0)
    strategy.save()
  }

  let strategies = vault.strategies
  strategies.push(id)
  vault.strategies = strategies
  vault.save()

  return strategy!
}

export function getStrategyValue(address: Address): BigInt {
  let strategyContract = StrategyContract.bind(address)
  let getTotalValueCall = strategyContract.try_getTotalValue()

  if (!getTotalValueCall.reverted) {
    return getTotalValueCall.value
  }

  log.warning('getTotalValue() call reverted for {}', [address.toHexString()])
  return BigInt.fromI32(0)
}

export function getStrategyMetadata(address: Address): string {
  let strategyContract = StrategyContract.bind(address)
  let metadataCall = strategyContract.try_getMetadataURI()

  if (!metadataCall.reverted) {
    return metadataCall.value
  }

  log.warning('getMetadataURI() call reverted for {}', [address.toHexString()])
  return 'Unknown'
}

export function getStrategyToken(address: Address): Address {
  let strategyContract = StrategyContract.bind(address)
  let tokenCall = strategyContract.try_getToken()

  if (!tokenCall.reverted) {
    loadOrCreateERC20(tokenCall.value)
    return tokenCall.value
  }

  log.warning('getToken() call reverted for {}', [address.toHexString()])
  return Address.fromString('0x0000000000000000000000000000000000000000')
}
