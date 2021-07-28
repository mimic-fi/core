import path from 'path'
import { Contract } from 'ethers'
import { Artifact } from 'hardhat/types'
import { Artifacts } from 'hardhat/internal/artifacts'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'

import { getSigner } from './signers'

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

export async function deploy(nameOrArtifact: string | { abi: any; bytecode: string }, args: Array<any> = [], from?: SignerWithAddress): Promise<Contract> {
  if (!args) args = []
  if (!from) from = await getSigner()

  const { ethers } = await import('hardhat')
  const artifact = typeof nameOrArtifact === 'string' ? await getArtifact(nameOrArtifact) : nameOrArtifact
  const factory = await ethers.getContractFactory(artifact.abi, artifact.bytecode)
  const instance = await factory.connect(from).deploy(...args)
  return instance.deployed()
}

export async function instanceAt(nameOrArtifact: string | any, address: string): Promise<Contract> {
  const { ethers } = await import('hardhat')
  const artifact = typeof nameOrArtifact === 'string' ? await getArtifact(nameOrArtifact) : nameOrArtifact
  return ethers.getContractAt(artifact.abi, address)
}

export async function getArtifact(contractName: string): Promise<Artifact> {
  const artifactsPath = !contractName.includes('/') ? path.resolve('./artifacts') : path.resolve(process.cwd(), '../../node_modules', contractName.split('/').slice(0, -1).join('/'))
  const artifacts = new Artifacts(artifactsPath)
  return artifacts.readArtifact(contractName.split('/').slice(-1)[0])
}
