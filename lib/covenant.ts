import { Contract, ContractParams, ContractResponse, Oracle } from './types'
import { Utxo, NetworkString } from 'marina-provider'
import zkpLib from '@vulpemventures/secp256k1-zkp'
import {
  feeAmount,
  treasuryPublicKey,
  minDustLimit,
  assetPair,
  expirationTimeout,
  expirationSeconds,
} from 'lib/constants'
import { numberToHex64LE, hex64LEToBase64LE } from './utils'
import {
  address,
  script,
  witnessStackToScriptWitness,
  networks,
  Creator,
  Updater,
  Pset,
  UpdaterOutput,
  AssetHash,
  Finalizer,
  OwnedInput,
  Transaction,
} from 'liquidjs-lib'
import {
  contractsRequest,
  ProposeContractArgs,
  TopupContractArgs,
  topupRequest,
} from './fetch'
import * as ecc from 'tiny-secp256k1'
import { Artifact, Contract as IonioContract } from '@ionio-lang/ionio'
import { selectCoins } from './selection'
import { Network } from 'liquidjs-lib/src/networks'
import { getFactoryUrl } from './api'
import { Wallet } from './wallet'

const getNetwork = (str?: NetworkString): Network => {
  return str ? (networks as Record<string, Network>)[str] : networks.liquid
}

export async function getIonioInstance(
  artifact: Artifact,
  contract: Contract,
  network: NetworkString,
) {
  // get ionio instance
  const params = contract.contractParams
  if (!params) throw new Error('missing contract params')
  // constructor params, must be on same order as artifact
  const constructorParams = [
    params.borrowAsset,
    params.borrowAmount,
    params.treasuryPublicKey,
    expirationTimeout,
    params.borrowerPublicKey,
    params.oraclePublicKey,
    params.priceLevel,
    params.setupTimestamp,
    assetPair,
  ]
  if (constructorParams.findIndex((a) => a === undefined) !== -1) {
    throw new Error('missing contract params')
  }

  return new IonioContract(artifact, constructorParams, getNetwork(network), {
    ecc,
    zkp: await zkpLib(),
  })
}

async function getCovenantOutput(
  wallet: Wallet,
  artifact: Artifact,
  contract: Contract,
  oracle: Oracle,
): Promise<{
  contractParams: ContractParams
  covenantOutput: UpdaterOutput
  confidentialAddress: string
}> {
  // set contract params
  const timestamp = Date.now()
  const treasuryPk = Buffer.from(treasuryPublicKey, 'hex')
  const parametersWithoutKey: Omit<ContractParams, 'borrowerPublicKey'> = {
    borrowAsset: contract.synthetic.id,
    borrowAmount: contract.synthetic.quantity,
    oraclePublicKey: `0x${oracle.pubkey}`,
    treasuryPublicKey: `0x${treasuryPk.slice(1).toString('hex')}`,
    priceLevel: numberToHex64LE(contract.priceLevel || 0),
    setupTimestamp: numberToHex64LE(timestamp),
    expirationTimeout,
    assetPair,
  }

  const { confidentialAddress, contractParams } =
    await wallet.getNextCovenantAddress(artifact, parametersWithoutKey)

  // set covenant output
  const { scriptPubKey } = address.fromConfidential(confidentialAddress)

  const covenantOutput: UpdaterOutput = {
    script: scriptPubKey,
    amount: contract.collateral.quantity,
    asset: contract.collateral.id,
  }

  return {
    contractParams,
    covenantOutput,
    confidentialAddress,
  }
}

// borrow
export interface PreparedBorrowTx {
  borrowerAddress: string
  changeAddress?: string
  collateralUtxos: Utxo[]
  contractParams: ContractParams
  collateralAsset: string
  collateralAmount: number
  pset: Pset
}

export async function prepareBorrowTxWithClaimTx(
  wallet: Wallet,
  artifact: Artifact,
  contract: Contract,
  utxos: Utxo[],
  redeemScript: string, // must be associated with the first utxo
  oracle: Oracle,
): Promise<PreparedBorrowTx> {
  // validate contract
  const { collateral, synthetic } = contract
  if (!collateral.quantity)
    throw new Error('Invalid contract: no collateral quantity')
  if (!synthetic.quantity)
    throw new Error('Invalid contract: no synthetic quantity')
  if (!contract.priceLevel)
    throw new Error('Invalid contract: no contract priceLevel')

  const [utxo] = utxos

  const pset = Creator.newPset()
  const updater = new Updater(pset)

  // get covenant
  const { contractParams, covenantOutput } = await getCovenantOutput(
    wallet,
    artifact,
    contract,
    oracle,
  )

  updater
    .addInputs([
      {
        txid: utxo.txid,
        txIndex: utxo.vout,
        witnessUtxo: utxo.witnessUtxo,
        sighashType: Transaction.SIGHASH_ALL,
      },
    ])
    .addInWitnessScript(0, Buffer.from(redeemScript, 'hex'))
    // add covenant output to position 0
    .addOutputs([covenantOutput])

  return {
    borrowerAddress: await wallet.getNextAddress(),
    collateralUtxos: utxos,
    contractParams,
    pset: updater.pset,
    collateralAsset: contract.collateral.id,
    collateralAmount: contract.collateral.quantity,
  }
}

export async function prepareBorrowTx(
  wallet: Wallet,
  artifact: Artifact,
  contract: Contract,
  oracle: Oracle,
): Promise<PreparedBorrowTx> {
  // validate contract
  const { collateral, synthetic } = contract
  if (!collateral.quantity)
    throw new Error('Invalid contract: no collateral quantity')
  if (!synthetic.quantity)
    throw new Error('Invalid contract: no synthetic quantity')
  if (!contract.priceLevel)
    throw new Error('Invalid contract: no contract priceLevel')

  const utxos = await wallet.getCoins()

  // validate we have necessary utxo
  const { selection: collateralUtxos, change: changeAmount } = selectCoins(
    utxos,
    collateral.id,
    collateral.quantity + feeAmount,
  )

  if (collateralUtxos.length === 0)
    throw new Error('Not enough collateral funds')

  // build Psbt
  const pset = Creator.newPset()
  const updater = new Updater(pset)

  // get covenant params
  const { contractParams, covenantOutput } = await getCovenantOutput(
    wallet,
    artifact,
    contract,
    oracle,
  )

  // add collateral inputs
  updater
    .addInputs(
      collateralUtxos.map((utxo) => ({
        txid: utxo.txid,
        txIndex: utxo.vout,
        witnessUtxo: utxo.witnessUtxo,
        sighashType: Transaction.SIGHASH_ALL,
      })),
    )
    .addOutputs([covenantOutput])

  let changeAddress = undefined
  if (changeAmount > 0) {
    changeAddress = await wallet.getNextChangeAddress()
    const { scriptPubKey, blindingKey } =
      address.fromConfidential(changeAddress)
    updater.addOutputs([
      {
        script: scriptPubKey,
        amount: changeAmount,
        asset: collateral.id,
        blinderIndex: 0,
        blindingPublicKey: blindingKey,
      },
    ])
  }

  return {
    borrowerAddress: await wallet.getNextAddress(),
    changeAddress,
    collateralUtxos,
    contractParams,
    pset: updater.pset,
    collateralAsset: contract.collateral.id,
    collateralAmount: contract.collateral.quantity,
  }
}

export async function proposeBorrowContract(
  {
    borrowerAddress,
    contractParams,
    collateralAsset,
    collateralAmount,
    collateralUtxos,
    pset,
  }: PreparedBorrowTx,
  network: NetworkString,
): Promise<ContractResponse> {
  // deconstruct contractParams
  const {
    borrowAsset,
    borrowAmount,
    borrowerPublicKey,
    oraclePublicKey,
    priceLevel,
    setupTimestamp,
    treasuryPublicKey,
  } = contractParams

  const blindersOfCollateralInputs: OwnedInput[] = []

  pset.inputs.forEach((input, index) => {
    const utxo = collateralUtxos.find(
      (utxo) =>
        utxo.txid ===
          Buffer.from(input.previousTxid).reverse().toString('hex') &&
        utxo.vout === input.previousTxIndex,
    )
    if (!utxo || !utxo.blindingData) return
    blindersOfCollateralInputs.push({
      index,
      asset: AssetHash.fromHex(utxo.blindingData.asset).bytesWithoutPrefix,
      value: utxo.blindingData.value.toString(),
      assetBlindingFactor: Buffer.from(
        utxo.blindingData.assetBlindingFactor,
        'hex',
      ),
      valueBlindingFactor: Buffer.from(
        utxo.blindingData.valueBlindingFactor,
        'hex',
      ),
    })
  })

  // build post body
  const args: ProposeContractArgs = {
    // anything is fine for now as attestation
    attestation: {
      message: '',
      messageHash: '',
      signature: '',
    },
    collateralAmount,
    collateralAsset,
    covenantOutputIndexInTransaction: 0,
    borrowerAddress,
    contractParams: {
      assetPair: Buffer.from(assetPair.substring(2), 'hex'),
      borrowAsset,
      borrowAmount,
      borrowerPublicKey,
      expirationTimeout: expirationSeconds,
      oraclePublicKey,
      priceLevel: hex64LEToBase64LE(priceLevel),
      setupTimestamp: hex64LEToBase64LE(setupTimestamp),
      treasuryPublicKey,
    },
    blindersOfCollateralInputs,
    partialTransaction: pset.toBase64(),
  }

  // post and return
  const factoryUrl = getFactoryUrl(network)
  return contractsRequest(factoryUrl, args)
}

// redeem
export async function prepareRedeemTx(
  owner: Wallet, // who owns the collateral
  wallet: Wallet, // who will pay to redeem collateral
  artifact: Artifact,
  contract: Contract,
  network: NetworkString,
  swapAddress?: string,
) {
  // validate contract
  const { collateral, synthetic } = contract
  if (!collateral.quantity)
    throw new Error('Invalid contract: no collateral quantity')
  if (!synthetic.quantity)
    throw new Error('Invalid contract: no synthetic quantity')
  if (!contract.priceLevel)
    throw new Error('Invalid contract: no contract priceLevel')
  if (collateral.quantity < feeAmount + minDustLimit)
    throw new Error('Invalid contract: collateral amount too low')

  const address = swapAddress || (await wallet.getNextAddress())

  // get ionio instance
  let ionioInstance = await getIonioInstance(artifact, contract, network)

  // find coin for this contract
  if (!contract.txid) throw new Error('Invalid contract: no txid')
  if (contract.vout === undefined) throw new Error('Invalid contract: no vout')

  const coinToRedeem = await owner.getContractCoin(contract.txid, contract.vout)
  if (!coinToRedeem)
    throw new Error(
      'Contract cannot be found in the connected wallet. ' +
        'Wait for confirmations or try to reload the wallet and try again.',
    )

  const coins = await wallet.getCoins()
  // validate we have sufficient synthetic funds
  const { selection: syntheticUtxos, change: syntheticChangeAmount } =
    selectCoins(coins, synthetic.id, synthetic.quantity)
  if (syntheticUtxos.length === 0) throw new Error('Not enough fuji funds')

  // marina signer for ionio redeem function
  const marinaSigner = {
    signTransaction: async (base64: string) => {
      const signedByOwner = await owner.signPset(base64)
      if (owner.type !== wallet.type) return wallet.signPset(signedByOwner)
      return signedByOwner
    },
  }

  // prepare ionio instance and tx
  const { txid, vout, witnessUtxo, blindingData } = coinToRedeem
  if (!witnessUtxo) throw new Error('Invalid witnessUtxo')

  const unblindData = blindingData
    ? {
        asset: AssetHash.fromHex(blindingData.asset).bytesWithoutPrefix,
        assetBlindingFactor: Buffer.from(
          blindingData.assetBlindingFactor,
          'hex',
        ),
        value: blindingData.value.toString(),
        valueBlindingFactor: Buffer.from(
          blindingData.valueBlindingFactor,
          'hex',
        ),
      }
    : undefined

  ionioInstance = ionioInstance.from(txid, vout, witnessUtxo, unblindData)
  const tx = ionioInstance.functions.redeem(marinaSigner)

  // add synthetic inputs
  for (const utxo of syntheticUtxos) {
    const output = {
      txid: utxo.txid,
      vout: utxo.vout,
      prevout: utxo.witnessUtxo!,
      unblindData: utxo.blindingData && {
        value: utxo.blindingData.value.toString(),
        asset: AssetHash.fromHex(utxo.blindingData.asset).bytesWithoutPrefix,
        assetBlindingFactor: Buffer.from(
          utxo.blindingData.assetBlindingFactor,
          'hex',
        ),
        valueBlindingFactor: Buffer.from(
          utxo.blindingData.valueBlindingFactor,
          'hex',
        ),
      },
    }

    tx.withUtxo(output)
  }

  // burn synthetic
  tx.withOpReturn(synthetic.quantity, synthetic.id)

  // get collateral back or sent to boltz case is a submarine swap
  tx.withRecipient(address, collateral.quantity - feeAmount, collateral.id, 0)

  // add synthetic change if any
  if (syntheticChangeAmount > 0) {
    const syntheticChangeAddress = await wallet.getNextChangeAddress()
    tx.withRecipient(
      syntheticChangeAddress,
      syntheticChangeAmount,
      synthetic.id,
      0,
    )
  }

  // pay fees
  tx.withFeeOutput(feeAmount)

  // change info on modal, now waiting for user to sign
  return tx
}

// topup
export interface PreparedTopupTx {
  borrowerAddress: string
  coinToTopup: Utxo
  contractParams: ContractParams
  collateralAsset: string
  collateralAmount: number
  collateralAndSynthUtxos: (Utxo & { redeemScript?: string })[]
  pset: Pset
}

export async function prepareTopupTx(
  contractOwner: Wallet, // wallet that owns the contract
  wallet: Wallet, // wallet that will topup
  artifact: Artifact,
  newContract: Contract,
  oldContract: Contract,
  network: NetworkString,
  collateralUtxos: (Utxo & { redeemScript?: string })[],
  oracle: Oracle,
): Promise<PreparedTopupTx> {
  // validate contracts
  if (!newContract.collateral.quantity)
    throw new Error('Invalid new contract: no collateral quantity')
  if (!newContract.synthetic.quantity)
    throw new Error('Invalid new contract: no synthetic quantity')
  if (!newContract.priceLevel)
    throw new Error('Invalid new contract: no contract priceLevel')
  if (!oldContract.txid) throw new Error('Invalid old contract: no txid')
  if (!oldContract.collateral.quantity)
    throw new Error('Invalid old contract: no collateral quantity')
  if (!oldContract.synthetic.quantity)
    throw new Error('Invalid old contract: no synthetic quantity')

  // burn amount, and topup amount to deposit
  const burnAmount = oldContract.synthetic.quantity
  const burnAsset = oldContract.synthetic.id
  const topupAmount =
    newContract.collateral.quantity - oldContract.collateral.quantity

  // find coin for this contract
  if (!oldContract.txid) throw new Error('Invalid contract: no txid')
  if (oldContract.vout === undefined)
    throw new Error('Invalid contract: no vout')

  const coinToTopup = await contractOwner.getContractCoin(
    oldContract.txid,
    oldContract.vout,
  )
  if (!coinToTopup)
    throw new Error(
      'Contract cannot be found in the connected wallet. ' +
        'Wait for confirmations or try to reload the wallet and try again.',
    )

  const coins = await wallet.getCoins()
  // validate we have sufficient synthetic funds to burn
  const { selection: syntheticUtxos } = selectCoins(
    coins,
    burnAsset,
    burnAmount,
  )
  if (syntheticUtxos.length === 0) throw new Error('Not enough fuji funds')

  // get new covenant params
  const { contractParams, confidentialAddress } = await getCovenantOutput(
    wallet,
    artifact,
    newContract,
    oracle,
  )

  const { txid, vout, witnessUtxo, blindingData } = coinToTopup
  if (!witnessUtxo) throw new Error('Invalid witnessUtxo')

  // get ionio instance
  let ionioInstance = await getIonioInstance(artifact, oldContract, network)
  ionioInstance = ionioInstance.from(
    txid,
    vout,
    witnessUtxo,
    blindingData
      ? {
          valueBlindingFactor: Buffer.from(
            blindingData.valueBlindingFactor,
            'hex',
          ),
          assetBlindingFactor: Buffer.from(
            blindingData.assetBlindingFactor,
            'hex',
          ),
          asset: AssetHash.fromHex(blindingData.asset).bytesWithoutPrefix,
          value: blindingData.value.toString(10),
        }
      : undefined,
  )

  // signatures needed for topup
  const marinaSigner = {
    signTransaction: (base64: string) => {
      return contractOwner.signPset(base64)
    },
  }
  const skipSignature = {
    signTransaction: (p: string) => Promise.resolve(p),
  }

  // this will add old covenant output as first input on tx
  const tx = ionioInstance.functions.topup(skipSignature, marinaSigner)
  const updater = new Updater(tx.pset)

  // add collateral inputs
  for (const utxo of collateralUtxos) {
    if (utxo.redeemScript) {
      // utxo from lightning
      updater.addInputs([
        {
          txid: utxo.txid,
          txIndex: utxo.vout,
          witnessUtxo: utxo.witnessUtxo,
          sighashType: Transaction.SIGHASH_ALL,
        },
      ])

      updater.addInWitnessScript(0, Buffer.from(utxo.redeemScript, 'hex'))
    } else {
      // utxo from marina getCoins
      tx.withUtxo({
        txid: utxo.txid,
        vout: utxo.vout,
        prevout: utxo.witnessUtxo!,
        unblindData: utxo.blindingData && {
          valueBlindingFactor: Buffer.from(
            utxo.blindingData.valueBlindingFactor,
            'hex',
          ),
          assetBlindingFactor: Buffer.from(
            utxo.blindingData.assetBlindingFactor,
            'hex',
          ),
          asset: AssetHash.fromHex(utxo.blindingData.asset).bytesWithoutPrefix,
          value: utxo.blindingData.value.toString(10),
        },
      })
    }
  }

  // add synthetic inputs
  for (const utxo of syntheticUtxos) {
    tx.withUtxo({
      txid: utxo.txid,
      vout: utxo.vout,
      prevout: utxo.witnessUtxo!,
      unblindData: utxo.blindingData && {
        valueBlindingFactor: Buffer.from(
          utxo.blindingData.valueBlindingFactor,
          'hex',
        ),
        assetBlindingFactor: Buffer.from(
          utxo.blindingData.assetBlindingFactor,
          'hex',
        ),
        asset: AssetHash.fromHex(utxo.blindingData.asset).bytesWithoutPrefix,
        value: utxo.blindingData.value.toString(10),
      },
    })
  }

  // burn fuji
  tx.withOpReturn(burnAmount, burnAsset)

  // new covenant output
  // the covenant must be always unconf!
  tx.withRecipient(
    address.fromConfidential(confidentialAddress).unconfidentialAddress,
    newContract.collateral.quantity,
    newContract.collateral.id,
  )

  // add collateral change output if needed
  let collateralChangeAddress
  const collateralUtxosAmount = collateralUtxos.reduce(
    (value: number, utxo: any) => value + (utxo.value || 0),
    0,
  )
  const collateralChangeAmount = collateralUtxosAmount - topupAmount - feeAmount
  if (collateralChangeAmount > 0) {
    collateralChangeAddress = await wallet.getNextChangeAddress()
    tx.withRecipient(
      collateralChangeAddress,
      collateralChangeAmount,
      newContract.collateral.id,
      0,
    )
  }

  // add synthetic change output if needed
  let syntheticChangeAddress
  const syntheticUtxosAmount = syntheticUtxos.reduce(
    (value, utxo) => value + (utxo.blindingData?.value || 0),
    0,
  )
  const syntheticChangeAmount = syntheticUtxosAmount - burnAmount
  if (syntheticChangeAmount > 0) {
    syntheticChangeAddress = await wallet.getNextChangeAddress()
    tx.withRecipient(
      syntheticChangeAddress,
      syntheticChangeAmount,
      newContract.synthetic.id,
      0,
    )
  }

  return {
    borrowerAddress: await wallet.getNextAddress(),
    coinToTopup,
    contractParams,
    pset: tx.pset,
    collateralAmount: newContract.collateral.quantity,
    collateralAsset: newContract.collateral.id,
    collateralAndSynthUtxos: collateralUtxos.concat(syntheticUtxos),
  }
}

export async function proposeTopupContract(
  {
    borrowerAddress,
    coinToTopup,
    contractParams,
    pset,
    collateralAmount,
    collateralAsset,
    collateralAndSynthUtxos,
  }: PreparedTopupTx,
  network: NetworkString,
): Promise<ContractResponse> {
  // deconstruct contractParams
  const {
    borrowAsset,
    borrowAmount,
    borrowerPublicKey,
    oraclePublicKey,
    priceLevel,
    setupTimestamp,
    treasuryPublicKey,
  } = contractParams

  const blindersOfCollateralInputs: OwnedInput[] = []
  const blindersOfSynthInputs: OwnedInput[] = []

  pset.inputs.forEach((input, index) => {
    const utxo = collateralAndSynthUtxos.find(
      (utxo) =>
        utxo.txid ===
          Buffer.from(input.previousTxid).reverse().toString('hex') &&
        utxo.vout === input.previousTxIndex,
    )
    if (!utxo || !utxo.blindingData) return
    ;(utxo.blindingData.asset === collateralAsset
      ? blindersOfCollateralInputs
      : blindersOfSynthInputs
    ).push({
      index,
      asset: AssetHash.fromHex(utxo.blindingData.asset).bytesWithoutPrefix,
      value: utxo.blindingData.value.toString(),
      assetBlindingFactor: Buffer.from(
        utxo.blindingData.assetBlindingFactor,
        'hex',
      ),
      valueBlindingFactor: Buffer.from(
        utxo.blindingData.valueBlindingFactor,
        'hex',
      ),
    })
  })

  // build post body
  const args: TopupContractArgs = {
    // anything is fine for now as attestation
    attestation: {
      message: '',
      messageHash: '',
      signature: '',
    },
    collateralAmount,
    collateralAsset,
    covenantOutputIndexInTransaction: 0,
    borrowerAddress,
    contractParams: {
      borrowAsset,
      borrowAmount,
      treasuryPublicKey,
      oraclePublicKey,
      borrowerPublicKey,
      priceLevel: hex64LEToBase64LE(priceLevel),
      setupTimestamp: hex64LEToBase64LE(setupTimestamp),
      expirationTimeout: expirationSeconds,
      assetPair: Buffer.from(assetPair.substring(2), 'hex'),
    },
    blindersOfCollateralInputs,
    blindersOfSynthInputs,
    partialTransaction: pset.toBase64(),
  }

  // post and return
  const factoryUrl = getFactoryUrl(network)
  return topupRequest(factoryUrl, coinToTopup.txid, coinToTopup.vout, args)
}

export function finalizeTopupCovenantInput(pset: Pset) {
  const covenantInputIndex = 0
  const { tapScriptSig } = pset.inputs[covenantInputIndex]
  let witnessStack: Buffer[] = []
  if (tapScriptSig && tapScriptSig.length > 0) {
    for (const s of tapScriptSig) {
      witnessStack.push(s.signature)
    }
  }

  const finalizer = new Finalizer(pset)
  finalizer.finalizeInput(covenantInputIndex, (inputIndex, pset) => {
    return {
      finalScriptSig: undefined,
      finalScriptWitness: witnessStackToScriptWitness([
        ...witnessStack,
        pset.inputs[inputIndex].tapLeafScript![0].script,
        pset.inputs[inputIndex].tapLeafScript![0].controlBlock,
      ]),
    }
  })
}

// other

export function getFuncNameFromScriptHexOfLeaf(
  artifact: Artifact,
  witness: string,
): string {
  const mapWitnessLengthToState: Record<number, string> = {}
  artifact.functions.map(({ name, asm }) => {
    // 27: 'topup'
    mapWitnessLengthToState[asm.length] = name // 37: 'liquidate'
  }) // 47: 'redeem'
  const asm = script
    .toASM(script.decompile(Buffer.from(witness, 'hex')) || [])
    .split(' ')
  return mapWitnessLengthToState[asm.length] || 'unknown'
}
