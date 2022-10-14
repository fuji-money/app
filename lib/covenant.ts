import { BlindPrivKeysMap, Contract, UtxoWithBlindPrivKey } from './types'
import { Utxo, AddressInterface, NetworkString } from 'marina-provider'
import {
  alphaServerUrl,
  feeAmount,
  issuerPubKey,
  marinaFujiAccountID,
  marinaMainAccountID,
  minDustLimit,
  oraclePubKey,
} from 'lib/constants'
import { numberToHexEncodedUint64LE } from './utils'
import {
  payments,
  confidential,
  AssetHash,
  address,
  script,
  Transaction,
  witnessStackToScriptWitness,
  Psbt,
} from 'liquidjs-lib'
import { fetchHex, postData } from './fetch'
import {
  createFujiAccount,
  fujiAccountMissing,
  getMarinaProvider,
  getNextAddress,
  getNextChangeAddress,
} from './marina'
import { synthAssetArtifact } from 'lib/artifacts'
import * as ecc from 'tiny-secp256k1'
import { Artifact, Contract as IonioContract } from '@ionio-lang/ionio'
import { getContractPayoutAmount } from './contracts'
import { getNetwork } from 'ldk'
import { randomBytes } from 'crypto'
import { selectCoinsWithBlindPrivKey } from './selection'

const getIonioInstance = (contract: Contract, network: NetworkString) => {
  // get payout amount
  const payoutAmount =
    contract.payoutAmount || getContractPayoutAmount(contract) // TODO
  // get ionio instance
  const params = contract.contractParams
  const constructorParams = [
    // borrow asset
    params.borrowAsset,
    // collateral asset
    params.collateralAsset,
    // borrow amount
    params.borrowAmount,
    // payout on redeem amount for issuer
    payoutAmount,
    // borrower public key
    contract.borrowerPubKey,
    // oracle public key
    params.oraclePk,
    // issuer public key
    params.issuerPk,
    // issuer output
    params.issuerScriptProgram, // segwit program
    // price level
    numberToHexEncodedUint64LE(params.priceLevel),
    // timestamp
    numberToHexEncodedUint64LE(params.setupTimestamp),
  ]

  return new IonioContract(
    synthAssetArtifact as Artifact,
    constructorParams,
    getNetwork(network),
    ecc,
  )
}

async function getCovenantOutput(contract: Contract, network: NetworkString) {
  // check for marina
  const marina = await getMarinaProvider()
  if (!marina) throw new Error('Please install Marina')

  // set contract params
  const timestamp = Date.now()
  const issuer = payments.p2wpkh({
    pubkey: Buffer.from(issuerPubKey, 'hex'),
    network: getNetwork(network),
  })
  const oraclePk = Buffer.from(oraclePubKey, 'hex')
  const issuerPk = Buffer.from(issuerPubKey, 'hex')
  const contractParams = {
    borrowAsset: contract.synthetic.id,
    borrowAmount: contract.synthetic.quantity,
    collateralAsset: contract.collateral.id,
    collateralAmount: contract.collateral.quantity,
    payoutAmount: contract.payoutAmount || getContractPayoutAmount(contract),
    oraclePk: `0x${oraclePk.slice(1).toString('hex')}`,
    issuerPk: `0x${issuerPk.slice(1).toString('hex')}`,
    issuerScriptProgram: `0x${issuer.output!.slice(2).toString('hex')}`,
    priceLevel: numberToHexEncodedUint64LE(contract.priceLevel || 0),
    setupTimestamp: numberToHexEncodedUint64LE(timestamp),
  }

  // get needed addresses
  await marina.useAccount(marinaFujiAccountID)
  const covenantAddress = await marina.getNextAddress(contractParams)
  await marina.useAccount(marinaMainAccountID)

  // set covenant output
  const amount = contract.collateral.quantity
  const covenantOutput = {
    script: address.toOutputScript(covenantAddress.confidentialAddress),
    value: confidential.satoshiToConfidentialValue(amount),
    asset: AssetHash.fromHex(contract.collateral.id, false).bytes,
    nonce: Buffer.alloc(0),
  }

  return { contractParams, covenantOutput, covenantAddress, timestamp }
}

// borrow
export interface PreparedBorrowTx {
  borrowerAddress: AddressInterface
  borrowerPublicKey: string
  changeAddress?: AddressInterface
  collateralUtxos: UtxoWithBlindPrivKey[]
  contractParams: any
  psbt: Psbt
}

export async function prepareBorrowTxWithClaimTx(
  contract: Contract,
  network: NetworkString,
  redeemScript: string,
  utxos: any,
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
  const hex = await fetchHex(utxo.txid, network)
  const prevout = Transaction.fromHex(hex).outs[utxo.vout]

  const psbt = new Psbt({ network: getNetwork(network) })

  // add the lockup utxo of Boltz
  psbt.addInput({
    hash: utxo.txid,
    index: utxo.vout,
    witnessUtxo: prevout,
    witnessScript: Buffer.from(redeemScript, 'hex'),
  })

  // get covenant
  const { contractParams, covenantOutput, covenantAddress, timestamp } =
    await getCovenantOutput(contract, network)

  // add covenant in position 0
  psbt.addOutput(covenantOutput)

  // these values have different type when speaking with server
  contractParams.setupTimestamp = timestamp.toString()
  contractParams.priceLevel = contract.priceLevel.toString()
  const borrowerPublicKey = (covenantAddress as any).constructorParams.fuji
  const borrowerAddress = await marina.getNextAddress()
  return {
    borrowerAddress,
    borrowerPublicKey,
    collateralUtxos: utxos,
    contractParams,
    psbt,
  }
}

export async function prepareBorrowTx(
  contract: Contract,
  network: NetworkString,
  blindPrivKeysMap: BlindPrivKeysMap,
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

  // validate we have necessary utxo
  const collateralUtxos = selectCoinsWithBlindPrivKey(
    await marina.getCoins([marinaMainAccountID]),
    collateral.id,
    collateral.quantity + feeAmount,
    blindPrivKeysMap,
  )
  if (collateralUtxos.length === 0)
    throw new Error('Not enough collateral funds')

  // build Psbt
  const psbt = new Psbt({ network: getNetwork(network) })

  // add collateral inputs
  for (const utxo of collateralUtxos) {
    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: utxo.prevout,
    })
  }

  // get covenant params
  const { contractParams, covenantOutput, covenantAddress, timestamp } =
    await getCovenantOutput(contract, network)

  // add covenant in position 0
  psbt.addOutput(covenantOutput)

  // add change output
  let changeAddress
  const collateralUtxosAmount = collateralUtxos.reduce(
    (value, utxo) => value + (utxo.value || 0),
    0,
  )
  const changeAmount = collateralUtxosAmount - collateral.quantity - feeAmount
  if (changeAmount > 0) {
    changeAddress = await getNextChangeAddress()
    psbt.addOutput({
      script: address.toOutputScript(changeAddress.confidentialAddress),
      value: confidential.satoshiToConfidentialValue(changeAmount),
      asset: AssetHash.fromHex(collateral.id, false).bytes,
      nonce: Buffer.alloc(0),
    })
  }

  // these values have different type when speaking with server
  contractParams.setupTimestamp = timestamp.toString()
  contractParams.priceLevel = contract.priceLevel.toString()
  const borrowerPublicKey = (covenantAddress as any).constructorParams.fuji
  const borrowerAddress = await getNextAddress()

  return {
    borrowerAddress,
    borrowerPublicKey,
    changeAddress,
    collateralUtxos,
    contractParams,
    psbt,
  }
}

export async function proposeBorrowContract({
  borrowerAddress,
  borrowerPublicKey,
  changeAddress,
  collateralUtxos,
  contractParams,
  psbt,
}: PreparedBorrowTx) {
  // deconstruct contractParams
  const {
    borrowAsset,
    borrowAmount,
    collateralAsset,
    collateralAmount,
    payoutAmount,
    oraclePk,
    issuerPk,
    issuerScriptProgram,
    priceLevel,
    setupTimestamp,
  } = contractParams

  // get blinding priv key for each confidential collateral utxo
  // if utxo is not confidential, we MUST NOT pass the blind priv key
  const blindingPrivKeyOfCollateralInputs: Record<number, string> = {}

  const utxoIsConfidential = (u: Utxo) =>
    u.prevout.rangeProof != null && u.prevout.rangeProof.length > 0

  collateralUtxos.forEach((utxo, idx) => {
    if (utxoIsConfidential(utxo)) {
      if (!utxo.blindPrivKey) throw new Error('Utxo without blindPrivKey')
      blindingPrivKeyOfCollateralInputs[idx] = utxo.blindPrivKey
    }
  })

  if (!borrowerAddress.publicKey) return

  const blindingPubKeyForCollateralChange = changeAddress
    ? {
        1: address
          .fromConfidential(changeAddress.confidentialAddress!)
          .blindingKey.toString('hex'),
      }
    : {}

  // build post body
  const body = {
    // anything is fine for now as attestation
    attestation: {
      message: '',
      messageHash: '',
      signature: '',
    },
    blindingPrivKeyOfCollateralInputs,
    blindingPubKeyForCollateralChange,
    borrowerAddress: borrowerAddress.confidentialAddress,
    contractParams: {
      borrowAsset,
      borrowAmount,
      collateralAsset,
      collateralAmount,
      payoutAmount,
      issuerPublicKey: issuerPk,
      issuerScriptProgram,
      oraclePublicKey: oraclePk,
      borrowerPublicKey,
      priceLevel,
      setupTimestamp,
    },
    partialTransaction: psbt.toBase64(),
  }

  // post and return
  return postData(`${alphaServerUrl}/contracts`, body)
}

// redeem

export async function prepareRedeemTx(
  contract: Contract,
  network: NetworkString,
  blindPrivKeysMap: BlindPrivKeysMap,
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
  if (!contract.payoutAmount)
    throw new Error('Invalid contract: no contract payoutAmount')
  if (collateral.quantity < contract.payoutAmount + feeAmount + minDustLimit)
    throw new Error('Invalid contract: collateral amount too low')

  const address =
    swapAddress || (await marina.getNextAddress()).confidentialAddress

  // payout amount will be taken from covenant
  const payoutAmount =
    contract.payoutAmount || getContractPayoutAmount(contract) // TODO

  // get ionio instance
  let ionioInstance = getIonioInstance(contract, network)

  // find coin for this contract
  const fujiCoins = await marina.getCoins([marinaFujiAccountID])
  const coinToRedeem = fujiCoins.find(
    (c) => c.txid === contract.txid && c.vout === contract.vout,
  )
  if (!coinToRedeem)
    throw new Error(
      'Contract cannot be found in the connected wallet.' +
        'Wait for confirmations or try to reload the wallet and try again.',
    )

  // validate we have sufficient synthetic funds
  const syntheticUtxos = selectCoinsWithBlindPrivKey(
    await marina.getCoins([marinaMainAccountID]),
    synthetic.id,
    synthetic.quantity,
    blindPrivKeysMap,
  )
  if (syntheticUtxos.length === 0) throw new Error('Not enough fuji funds')

  // calculate synthetic change amount
  const syntheticUtxosAmount = syntheticUtxos.reduce(
    (value, utxo) => value + (utxo.value || 0),
    0,
  )
  const syntheticChangeAmount = syntheticUtxosAmount - synthetic.quantity

  // get issuer address
  const issuer = payments.p2wpkh({
    pubkey: Buffer.from(issuerPubKey, 'hex'),
    network: getNetwork(network),
  })

  // marina signer for ionio redeem function
  const marinaSigner = {
    signTransaction: async (base64: string) => {
      return await marina.signTransaction(base64)
    },
  }

  // prepapre ionio instance and tx
  const { txid, vout, prevout, unblindData } = coinToRedeem
  ionioInstance = ionioInstance.from(txid, vout, prevout, unblindData)
  const tx = ionioInstance.functions.redeem(marinaSigner)

  // add synthetic inputs
  for (const utxo of syntheticUtxos) {
    tx.withUtxo(utxo)
  }

  // burn synthetic
  tx.withOpReturn(synthetic.quantity, synthetic.id)

  // payout to issuer
  tx.withRecipient(issuer.address!, payoutAmount, collateral.id)

  // get collateral back or sent to boltz case is a submarine swap
  tx.withRecipient(
    address,
    collateral.quantity - payoutAmount - feeAmount,
    collateral.id,
  )

  const aux = (await marina.getNextChangeAddress()).confidentialAddress

  // add synthetic change if any
  if (syntheticChangeAmount > 0) {
    const borrowChangeAddress = await marina.getNextChangeAddress()
    tx.withRecipient(
      borrowChangeAddress.confidentialAddress,
      syntheticChangeAmount,
      synthetic.id,
    )
  } else if (swapAddress) {
    // in a redeem, some inputs (if not all) are confidential.
    // in the case of a redeem to lightning, if we don't have any change
    // all outputs will be unconfidential, which would break the protocol.
    // by adding a confidential op_return with value 0 fixes it.
    const blindingKey = randomBytes(33).toString('hex')
    tx.withOpReturn(0, collateral.id, [], blindingKey)
  }

  // pay fees
  tx.withFeeOutput(feeAmount)

  // change info on modal, now waiting for user to sign
  return tx
}

// topup

export interface PreparedTopupTx {
  borrowerAddress: AddressInterface
  borrowerPublicKey: string
  coinToTopup: Utxo
  contractParams: any
  collateralChangeAddress?: AddressInterface
  collateralUtxos: UtxoWithBlindPrivKey[]
  psbt: Psbt
  syntheticChangeAddress?: AddressInterface
  syntheticUtxos: UtxoWithBlindPrivKey[]
}

export async function prepareTopupTx(
  newContract: Contract,
  oldContract: Contract,
  network: NetworkString,
  collateralUtxos: any,
  blindPrivKeysMap: BlindPrivKeysMap,
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
  const syntheticUtxos = selectCoinsWithBlindPrivKey(
    await marina.getCoins([marinaMainAccountID]),
    burnAsset,
    burnAmount,
    blindPrivKeysMap,
  )
  if (syntheticUtxos.length === 0) throw new Error('Not enough fuji funds')

  // get new covenant params
  const { contractParams, covenantAddress, timestamp } =
    await getCovenantOutput(newContract, network)

  // find coin for this contract
  const coins = await marina.getCoins([marinaFujiAccountID])
  const coinToTopup = coins.find(
    (c) => c.txid === oldContract.txid && c.vout === oldContract.vout,
  )
  if (!coinToTopup)
    throw new Error(
      'Contract cannot be found in the connected wallet. ' +
        'Wait for confirmations or try to reload the wallet and try again.',
    )

  const { txid, vout, prevout, unblindData } = coinToTopup

  // get ionio instance
  let ionioInstance = getIonioInstance(oldContract, network)
  ionioInstance = ionioInstance.from(txid, vout, prevout, unblindData)

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

  // add collateral inputs
  for (const utxo of collateralUtxos) {
    if (utxo.redeemScript) {
      // utxo from lightning
      tx.psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        witnessUtxo: utxo.prevout,
        witnessScript: Buffer.from(utxo.redeemScript, 'hex'),
      })
    } else {
      // utxo from marina getCoins
      tx.withUtxo(utxo)
    }
  }

  // add synthetic inputs
  for (const utxo of syntheticUtxos) {
    tx.withUtxo(utxo)
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
    )
  }

  // add synthetic change output if needed
  let syntheticChangeAddress
  const syntheticUtxosAmount = syntheticUtxos.reduce(
    (value, utxo) => value + (utxo.value || 0),
    0,
  )
  const syntheticChangeAmount = syntheticUtxosAmount - burnAmount
  if (syntheticChangeAmount > 0) {
    syntheticChangeAddress = await getNextChangeAddress()
    tx.withRecipient(
      syntheticChangeAddress.confidentialAddress,
      syntheticChangeAmount,
      newContract.synthetic.id,
    )
  }

  // these values have different type when speaking with server
  contractParams.setupTimestamp = timestamp.toString()
  contractParams.priceLevel = newContract.priceLevel.toString()
  const borrowerPublicKey = (covenantAddress as any).constructorParams.fuji
  const borrowerAddress = await marina.getNextAddress()

  return {
    borrowerAddress,
    borrowerPublicKey,
    coinToTopup,
    contractParams,
    collateralChangeAddress,
    collateralUtxos,
    psbt: tx.psbt,
    syntheticChangeAddress,
    syntheticUtxos,
  }
}

export async function proposeTopupContract({
  borrowerAddress,
  borrowerPublicKey,
  coinToTopup,
  contractParams,
  collateralChangeAddress,
  collateralUtxos,
  psbt,
  syntheticChangeAddress,
  syntheticUtxos,
}: PreparedTopupTx) {
  // deconstruct contractParams
  const {
    borrowAsset,
    borrowAmount,
    collateralAsset,
    collateralAmount,
    payoutAmount,
    oraclePk,
    issuerPk,
    issuerScriptProgram,
    priceLevel,
    setupTimestamp,
  } = contractParams

  // util to find if a utxo is confidential
  const utxoIsConfidential = (u: Utxo) =>
    u.prevout.rangeProof != null && u.prevout.rangeProof.length > 0

  // get blinding priv key for each confidential collateral utxo
  // if utxo is not confidential, we MUST NOT pass the blind priv key
  const blindingPrivKeyOfCollateralInputs: Record<number, string> = {}

  collateralUtxos.forEach((utxo, idx) => {
    if (utxoIsConfidential(utxo)) {
      if (!utxo.blindPrivKey) throw new Error('Utxo without blindPrivKey')
      blindingPrivKeyOfCollateralInputs[idx + 1] = utxo.blindPrivKey
    }
  })

  // get blinding priv key for each confidential collateral utxo
  // if utxo is not confidential, we MUST NOT pass the blind priv key
  const blindingPrivKeyOfSynthInputs: Record<number, string> = {}

  syntheticUtxos.forEach((utxo, idx) => {
    if (utxoIsConfidential(utxo)) {
      if (!utxo.blindPrivKey) throw new Error('Utxo without blindPrivKey')
      blindingPrivKeyOfSynthInputs[idx + 1 + collateralUtxos.length] =
        utxo.blindPrivKey
    }
  })

  if (!borrowerAddress?.publicKey) return

  // get blinding pub key for collateral change if any
  const blindingPubKeyForCollateralChange = collateralChangeAddress
    ? {
        2: address
          .fromConfidential(collateralChangeAddress.confidentialAddress!)
          .blindingKey.toString('hex'),
      }
    : {}

  // get blinding pub key for synthetic change if any
  const blindingPubKeyForSynthChange = syntheticChangeAddress
    ? collateralChangeAddress
      ? {
          3: address
            .fromConfidential(syntheticChangeAddress.confidentialAddress!)
            .blindingKey.toString('hex'),
        }
      : {
          2: address
            .fromConfidential(syntheticChangeAddress.confidentialAddress!)
            .blindingKey.toString('hex'),
        }
    : {}

  // build post body
  const body = {
    // anything is fine for now as attestation
    attestation: {
      message: '',
      messageHash: '',
      signature: '',
    },
    blindingPrivKeyOfCollateralInputs,
    blindingPubKeyForCollateralChange,
    blindingPrivKeyOfSynthInputs,
    blindingPubKeyForSynthChange,
    borrowerAddress: borrowerAddress.confidentialAddress,
    contractParams: {
      borrowAsset,
      borrowAmount,
      collateralAsset,
      collateralAmount,
      payoutAmount,
      issuerPublicKey: issuerPk,
      issuerScriptProgram,
      oraclePublicKey: oraclePk,
      borrowerPublicKey,
      priceLevel,
      setupTimestamp,
    },
    partialTransaction: psbt.toBase64(),
  }

  // post and return
  const { txid, vout } = coinToTopup
  return postData(`${alphaServerUrl}/contracts/${txid}:${vout}/topup`, body)
}

export const finalizeTopupCovenantInput = (ptx: Psbt) => {
  const covenantInputIndex = 0
  const { tapScriptSig } = ptx.data.inputs[covenantInputIndex]
  let witnessStack: Buffer[] = []
  if (tapScriptSig && tapScriptSig.length > 0) {
    for (const s of tapScriptSig) {
      witnessStack.push(s.signature)
    }
  }
  ptx.finalizeInput(covenantInputIndex, (_, input) => {
    return {
      finalScriptSig: undefined,
      finalScriptWitness: witnessStackToScriptWitness([
        ...witnessStack,
        input.tapLeafScript![0].script,
        input.tapLeafScript![0].controlBlock,
      ]),
    }
  })
}

// other

export function getFuncNameFromScriptHexOfLeaf(witness: string): string {
  const mapWitnessLengthToState: Record<number, string> = {}
  synthAssetArtifact.functions.map(({ name, asm }) => {
    // 27: 'topup'
    mapWitnessLengthToState[asm.length] = name // 37: 'liquidate'
  }) // 47: 'redeem'
  const asm = script
    .toASM(script.decompile(Buffer.from(witness, 'hex')) || [])
    .split(' ')
  return mapWitnessLengthToState[asm.length] || 'unknown'
}
