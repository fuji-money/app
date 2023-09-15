import { Contract, ContractParams, ContractResponse, Oracle } from './types'
import { Utxo, Address, NetworkString } from 'marina-provider'
import zkpLib from '@vulpemventures/secp256k1-zkp'
import {
  feeAmount,
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
import {
  createFujiAccount,
  fujiAccountMissing,
  getFujiCoins,
  getMainAccountCoins,
  getMarinaProvider,
  getNextAddress,
  getNextChangeAddress,
  getNextCovenantAddress,
  getPublicKey,
} from './marina'
import * as ecc from 'tiny-secp256k1'
import { Artifact, Contract as IonioContract } from '@ionio-lang/ionio'
import { selectCoins } from './selection'
import { Network } from 'liquidjs-lib/src/networks'
import { getFactoryUrl } from './api'

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
  artifact: Artifact,
  contract: Contract,
  oracle: Oracle,
  xOnlyTreasuryPublicKey: string,
): Promise<{
  contractParams: ContractParams
  covenantOutput: UpdaterOutput
  covenantAddress: Address
}> {
  // check for marina
  const marina = await getMarinaProvider()
  if (!marina) throw new Error('Please install Marina')

  // set contract params
  const timestamp = Date.now()
  const contractParams: Omit<ContractParams, 'borrowerPublicKey'> = {
    borrowAsset: contract.synthetic.id,
    borrowAmount: contract.synthetic.quantity,
    oraclePublicKey: `0x${oracle.pubkey}`,
    treasuryPublicKey: `0x${xOnlyTreasuryPublicKey}`,
    priceLevel: numberToHex64LE(contract.priceLevel || 0),
    setupTimestamp: numberToHex64LE(timestamp),
    expirationTimeout,
    assetPair,
  }

  const covenantAddress = await getNextCovenantAddress(artifact, contractParams)

  // set covenant output
  const { scriptPubKey } = address.fromConfidential(
    covenantAddress.confidentialAddress,
  )
  const covenantOutput: UpdaterOutput = {
    script: scriptPubKey,
    amount: contract.collateral.quantity,
    asset: contract.collateral.id,
  }

  return {
    contractParams: {
      ...contractParams,
      borrowerPublicKey: `0x${(await getPublicKey(covenantAddress))
        .subarray(1)
        .toString('hex')}`,
    },
    covenantOutput,
    covenantAddress,
  }
}

// borrow
export interface PreparedBorrowTx {
  borrowerAddress: Address
  changeAddress?: Address
  collateralUtxos: Utxo[]
  contractParams: ContractParams
  collateralAsset: string
  collateralAmount: number
  pset: Pset
}

export async function prepareBorrowTxWithClaimTx(
  artifact: Artifact,
  contract: Contract,
  utxos: Utxo[],
  redeemScript: string, // must be associated with the first utxo
  oracle: Oracle,
  xOnlyTreasuryPublicKey: string,
): Promise<PreparedBorrowTx> {
  // check for marina
  const marina = await getMarinaProvider()
  if (!marina) throw new Error('Please install Marina')

  // check for marina account, create if doesn't exists
  if (await fujiAccountMissing(marina)) await createFujiAccount(marina)

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
    artifact,
    contract,
    oracle,
    xOnlyTreasuryPublicKey,
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
    borrowerAddress: await getNextAddress(),
    collateralUtxos: utxos,
    contractParams,
    pset: updater.pset,
    collateralAsset: contract.collateral.id,
    collateralAmount: contract.collateral.quantity,
  }
}

export async function prepareBorrowTx(
  artifact: Artifact,
  contract: Contract,
  oracle: Oracle,
  xOnlyTreasuryPublicKey: string,
): Promise<PreparedBorrowTx> {
  // check for marina
  const marina = await getMarinaProvider()
  if (!marina) throw new Error('Please install Marina')

  // check for marina account, create if doesn't exists
  if (await fujiAccountMissing(marina)) await createFujiAccount(marina)

  // validate contract
  const { collateral, synthetic } = contract
  if (!collateral.quantity)
    throw new Error('Invalid contract: no collateral quantity')
  if (!synthetic.quantity)
    throw new Error('Invalid contract: no synthetic quantity')
  if (!contract.priceLevel)
    throw new Error('Invalid contract: no contract priceLevel')

  const utxos = await getMainAccountCoins()
  // validate we have necessary utxo
  const collateralUtxos = selectCoins(
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
    artifact,
    contract,
    oracle,
    xOnlyTreasuryPublicKey,
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

  // add change output
  let changeAddress
  const collateralUtxosAmount = collateralUtxos.reduce(
    (value, utxo) => value + (utxo.blindingData?.value || 0),
    0,
  )
  const changeAmount = collateralUtxosAmount - collateral.quantity - feeAmount
  if (changeAmount > 0) {
    changeAddress = await getNextChangeAddress()
    const { scriptPubKey, blindingKey } = address.fromConfidential(
      changeAddress.confidentialAddress,
    )
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
    borrowerAddress: await getNextAddress(),
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
    borrowerAddress: borrowerAddress.confidentialAddress,
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
  artifact: Artifact,
  contract: Contract,
  network: NetworkString,
  swapAddress?: string,
) {
  // check for marina
  const marina = await getMarinaProvider()
  if (!marina) throw new Error('Please install Marina')

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

  const address = swapAddress || (await getNextAddress()).confidentialAddress

  // get ionio instance
  let ionioInstance = await getIonioInstance(artifact, contract, network)

  // find coin for this contract
  const collateralCoins = await getFujiCoins()
  const coinToRedeem = collateralCoins.find(
    (c) => c.txid === contract.txid && c.vout === contract.vout,
  )
  if (!coinToRedeem)
    throw new Error(
      'Contract cannot be found in the connected wallet. ' +
        'Wait for confirmations or try to reload the wallet and try again.',
    )

  // validate we have sufficient synthetic funds
  const utxos = await getMainAccountCoins()
  const syntheticUtxos = selectCoins(utxos, synthetic.id, synthetic.quantity)
  if (syntheticUtxos.length === 0) throw new Error('Not enough fuji funds')

  // calculate synthetic change amount
  const syntheticUtxosAmount = syntheticUtxos.reduce(
    (value, utxo) => value + (utxo.blindingData?.value || 0),
    0,
  )
  const syntheticChangeAmount = syntheticUtxosAmount - synthetic.quantity

  // marina signer for ionio redeem function
  const marinaSigner = {
    signTransaction: async (base64: string) => {
      return await marina.signTransaction(base64)
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
    const syntheticChangeAddress = await getNextChangeAddress()
    tx.withRecipient(
      syntheticChangeAddress.confidentialAddress,
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
  borrowerAddress: Address
  coinToTopup: Utxo
  contractParams: ContractParams
  collateralAsset: string
  collateralAmount: number
  collateralAndSynthUtxos: (Utxo & { redeemScript?: string })[]
  pset: Pset
}

export async function prepareTopupTx(
  artifact: Artifact,
  newContract: Contract,
  oldContract: Contract,
  network: NetworkString,
  collateralUtxos: (Utxo & { redeemScript?: string })[],
  oracle: Oracle,
  xOnlyTreasuryPublicKey: string,
): Promise<PreparedTopupTx> {
  // check for marina
  const marina = await getMarinaProvider()
  if (!marina) throw new Error('Please install Marina')

  // check for marina account, create if doesn't exists
  if (await fujiAccountMissing(marina)) await createFujiAccount(marina)

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

  // validate we have sufficient synthetic funds to burn
  const syntheticUtxos = selectCoins(
    await getMainAccountCoins(),
    burnAsset,
    burnAmount,
  )
  if (syntheticUtxos.length === 0) throw new Error('Not enough fuji funds')

  // get new covenant params
  const { contractParams, covenantAddress } = await getCovenantOutput(
    artifact,
    newContract,
    oracle,
    xOnlyTreasuryPublicKey,
  )

  // find coin for this contract
  const coins = await getFujiCoins()
  const coinToTopup = coins.find(
    (c) => c.txid === oldContract.txid && c.vout === oldContract.vout,
  )
  if (!coinToTopup)
    throw new Error(
      'Contract cannot be found in the connected wallet. ' +
        'Wait for confirmations or try to reload the wallet and try again.',
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
    signTransaction: async (base64: string) => {
      const signed = await marina.signTransaction(base64)
      return signed
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
    address.fromConfidential(covenantAddress.confidentialAddress!)
      .unconfidentialAddress,
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
    collateralChangeAddress = await getNextChangeAddress()
    tx.withRecipient(
      collateralChangeAddress.confidentialAddress,
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
    syntheticChangeAddress = await getNextChangeAddress()
    tx.withRecipient(
      syntheticChangeAddress.confidentialAddress,
      syntheticChangeAmount,
      newContract.synthetic.id,
      0,
    )
  }

  return {
    borrowerAddress: await getNextAddress(),
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
    borrowerAddress: borrowerAddress.confidentialAddress,
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
