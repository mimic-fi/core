import { Contract } from 'ethers'
import { BigNumberish } from '@octopus-fi/v1-helpers'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

export type RawVaultDeployment = {
  mocked?: boolean
  protocolFee?: BigNumberish
  swapConnector?: Contract
  strategies?: Contract[]
  from?: SignerWithAddress
}

export type VaultDeployment = {
  mocked: boolean
  protocolFee: BigNumberish
  swapConnector: Contract
  strategies: Contract[]
  admin: SignerWithAddress
}
