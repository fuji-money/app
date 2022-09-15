import { Contract, UtxoWithBlindPrivKey } from './types'
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
import { debugMessage, numberToHexEncodedUint64LE } from './utils'
import {
  payments,
  Psbt,
  confidential,
  AssetHash,
  address,
  script,
  Transaction,
} from 'liquidjs-lib'
import { postData } from './fetch'
import {
  createFujiAccount,
  fujiAccountMissing,
  getMarinaProvider,
  getNextAddress,
  getNextChangeAddress,
  selectCoinsWithBlindPrivKey,
} from './marina'
import { synthAssetArtifact } from 'lib/artifacts'
import * as ecc from 'tiny-secp256k1'
import { Artifact, Contract as IonioContract } from '@ionio-lang/ionio'
import { getContractPayoutAmount } from './contracts'
import { fetchTxHex, getNetwork } from 'ldk'
import { explorerURL } from './explorer'

const getIonioInstance = (contract: Contract, network: NetworkString) => {
  // fee amount will be taken from covenant
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
    borrowAmount: contract.synthetic.quantity || 0,
    collateralAsset: contract.collateral.id,
    collateralAmount: contract.collateral.quantity || 0,
    payoutAmount: contract.payoutAmount || getContractPayoutAmount(contract),
    oraclePk: `0x${oraclePk.slice(1).toString('hex')}`,
    issuerPk: `0x${issuerPk.slice(1).toString('hex')}`,
    issuerScriptProgram: `0x${issuer.output!.slice(2).toString('hex')}`,
    priceLevel: numberToHexEncodedUint64LE(contract.priceLevel || 0),
    setupTimestamp: numberToHexEncodedUint64LE(timestamp),
  }
  debugMessage('contractParams', contractParams)

  // get needed addresses
  await marina.useAccount(marinaFujiAccountID)
  const covenantAddress = await marina.getNextAddress(contractParams)
  await marina.useAccount(marinaMainAccountID)
  debugMessage('covenantAddress', covenantAddress)

  // set covenant output
  const amount = contract.collateral.quantity || 0
  const covenantOutput = {
    script: address.toOutputScript(covenantAddress.confidentialAddress),
    value: confidential.satoshiToConfidentialValue(amount),
    asset: AssetHash.fromHex(contract.collateral.id, false).bytes,
    nonce: Buffer.alloc(0),
  }

  return { contractParams, covenantOutput, covenantAddress, timestamp }
}

interface PreparedBorrowTx {
  borrowerAddress: AddressInterface
  borrowerPublicKey: StringConstructor
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
  debugMessage('prepareBorrowTxWithClaimTx contract', contract)

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
  const hex = await fetchTxHex(utxo.txid, explorerURL(network))
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

  debugMessage('psbt', psbt)

  // these values have different type when speaking with server
  contractParams.setupTimestamp = timestamp.toString()
  contractParams.priceLevel = contract.priceLevel.toString()
  const borrowerPublicKey = (covenantAddress as any).constructorParams.fuji
  const borrowerAddress = await marina.getNextAddress()
  debugMessage('borrowerPublicKey', borrowerPublicKey)
  return {
    psbt,
    contractParams,
    borrowerAddress,
    borrowerPublicKey,
    collateralUtxos: utxos,
  }
}

export async function prepareBorrowTx(
  contract: Contract,
  network: NetworkString,
): Promise<PreparedBorrowTx> {
  debugMessage('prepareBorrowTx contract', contract)

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
    await marina.getAddresses([marinaMainAccountID]),
    collateral.id,
    collateral.quantity,
  )
  if (collateralUtxos.length === 0) throw new Error('Not enough funds')
  debugMessage('collateralAmount', collateral.quantity)
  debugMessage('collateralUtxos', collateralUtxos)

  // build Psbt
  const psbt = new Psbt({ network: getNetwork(network) })

  // add collateral inputs
  for (const utxo of collateralUtxos) {
    debugMessage('utxo')
    debugMessage(utxo.txid, utxo.vout, utxo.prevout)
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

  debugMessage('psbt', psbt)

  // these values have different type when speaking with server
  contractParams.setupTimestamp = timestamp.toString()
  contractParams.priceLevel = contract.priceLevel.toString()
  const borrowerPublicKey = (covenantAddress as any).constructorParams.fuji
  const borrowerAddress = await getNextAddress()
  debugMessage('borrowerPublicKey', borrowerPublicKey)

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
    debugMessage('proposeBorrowContract utxo', utxo)
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

  debugMessage('body', body)
  // post and return
  return postData(`${alphaServerUrl}/contracts`, body)
}

export async function prepareRedeemTx(
  contract: Contract,
  network: NetworkString,
  setStep: (arg0: number) => void,
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

  // fee amount will be taken from covenant
  const payoutAmount =
    contract.payoutAmount || getContractPayoutAmount(contract) // TODO

  // get ionio instance
  let ionioInstance = getIonioInstance(contract, network)

  // find coin for this contract
  const coins = await marina.getCoins([marinaFujiAccountID])
  // TODO stores the vout in storage. Now we assume is ALWAYS 0
  const coinToRedeem = coins.find(
    (c) => c.txid === contract.txid && c.vout === 0,
  )
  if (!coinToRedeem)
    throw new Error(
      'Contract cannot be found in the connected wallet. Wait for confirmations or try to reload the wallet and try again.',
    )

  const { txid, vout, prevout, unblindData } = coinToRedeem
  ionioInstance = ionioInstance.from(txid, vout, prevout, unblindData)

  // validate we have sufficient synthetic funds
  const syntheticUtxos = selectCoinsWithBlindPrivKey(
    await marina.getCoins([marinaMainAccountID]),
    await marina.getAddresses([marinaMainAccountID]),
    synthetic.id,
    synthetic.quantity,
  )
  if (syntheticUtxos.length === 0) throw new Error('Not enough fuji assets')

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

  // get redeem transaction
  const marinaSigner = {
    signTransaction: async (base64: string) => {
      return await marina.signTransaction(base64)
    },
  }
  const tx = ionioInstance.functions.redeem(marinaSigner)

  // add synthetic inputs
  // are these inputs confidential? if so, we need to pass the unblindData field of the coin
  // https://github.com/ionio-lang/ionio/blob/master/packages/ionio/test/e2e/transferWithKey.test.ts#L54
  for (const utxo of syntheticUtxos) {
    const { txid, vout, prevout, unblindData } = utxo
    tx.withUtxo({ txid, vout, prevout, unblindData })
  }

  // burn synthetic
  tx.withOpReturn(synthetic.quantity, synthetic.id)

  // payout to issuer
  tx.withRecipient(issuer.address!, payoutAmount, collateral.id)

  // get collateral back
  const collateralAddress = await marina.getNextAddress()
  tx.withRecipient(
    // address.fromConfidential(collateralAddress.confidentialAddress).unconfidentialAddress,
    collateralAddress.confidentialAddress,
    collateral.quantity - payoutAmount - feeAmount,
    collateral.id,
  )

  // add synthetic change if any
  if (syntheticChangeAmount > 0) {
    const borrowChangeAddress = await marina.getNextChangeAddress()
    debugMessage('output synthetic change', syntheticChangeAmount)
    tx.withRecipient(
      borrowChangeAddress.confidentialAddress,
      syntheticChangeAmount,
      synthetic.id,
    )
  }

  // pay fees
  tx.withFeeOutput(feeAmount)

  // change info on modal, now waiting for user to sign
  setStep(1)
  const signed = await tx.unlock()

  // finalize the fuji asset input
  // we skip utxo in position 0 since is finalized already by the redeem function
  for (let index = 1; index < signed.psbt.data.inputs.length; index++) {
    signed.psbt.finalizeInput(index)
  }

  const rawHex = signed.psbt.extractTransaction().toHex()
  const sentTransaction = await marina.broadcastTransaction(rawHex)
  return sentTransaction.txid
}

interface PreparedTopupTx {
  borrowerAddress: AddressInterface
  borrowerPublicKey: string
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
  if (!oldContract.collateral.quantity)
    throw new Error('Invalid old contract: no collateral quantity')
  if (!oldContract.synthetic.quantity)
    throw new Error('Invalid old contract: no synthetic quantity')

  // topup amount to deposit
  const topupAmount =
    newContract.collateral.quantity - oldContract.collateral.quantity

  // validate we have necessary utxos
  const collateralUtxos = selectCoinsWithBlindPrivKey(
    await marina.getCoins([marinaMainAccountID]),
    await marina.getAddresses([marinaMainAccountID]),
    newContract.collateral.id,
    topupAmount,
  )
  if (collateralUtxos.length === 0) throw new Error('Not enough funds')

  // validate we have sufficient synthetic funds
  const syntheticUtxos = selectCoinsWithBlindPrivKey(
    await marina.getCoins([marinaMainAccountID]),
    await marina.getAddresses([marinaMainAccountID]),
    oldContract.synthetic.id,
    oldContract.synthetic.quantity,
  )
  if (syntheticUtxos.length === 0) throw new Error('Not enough fuji assets')

  // get covenant params
  const { contractParams, covenantOutput, covenantAddress, timestamp } =
    await getCovenantOutput(newContract, network)

  // get ionio instance
  let ionioInstance = getIonioInstance(newContract, network)

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

  const tx = ionioInstance.functions.topup(skipSignature, marinaSigner)

  // add synthetic inputs
  for (const utxo of syntheticUtxos) {
    tx.withUtxo(utxo)
  }

  // add collateral inputs
  for (const utxo of collateralUtxos) {
    tx.withUtxo(utxo)
  }

  // burn fuji
  tx.withOpReturn(oldContract.synthetic.quantity, oldContract.synthetic.id)

  // new covenant output
  tx.withRecipient(
    covenantAddress.confidentialAddress,
    newContract.collateral.quantity,
    newContract.collateral.id,
  )

  // add collateral change output
  let collateralChangeAddress
  const collateralUtxosAmount = collateralUtxos.reduce(
    (value, utxo) => value + (utxo.value || 0),
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

  // add collateral change output
  let syntheticChangeAddress
  const syntheticUtxosAmount = syntheticUtxos.reduce(
    (value, utxo) => value + (utxo.value || 0),
    0,
  )
  const syntheticChangeAmount =
    syntheticUtxosAmount - oldContract.synthetic.quantity
  if (syntheticChangeAmount > 0) {
    syntheticChangeAddress = await getNextChangeAddress()
    tx.withRecipient(
      syntheticChangeAddress.confidentialAddress,
      syntheticChangeAmount,
      newContract.synthetic.id,
    )
  }

  debugMessage('tx', tx)

  // these values have different type when speaking with server
  contractParams.setupTimestamp = timestamp.toString()
  contractParams.priceLevel = newContract.priceLevel.toString()
  const borrowerPublicKey = (covenantAddress as any).constructorParams.fuji
  const borrowerAddress = await getNextAddress()
  const changeAddress = collateralChangeAddress // TODO - verify this

  return {
    borrowerAddress,
    borrowerPublicKey,
    contractParams,
    collateralChangeAddress,
    collateralUtxos,
    psbt: tx.psbt,
    syntheticUtxos,
  }
}

export async function proposeTopupContract({
  borrowerAddress,
  borrowerPublicKey,
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
      blindingPrivKeyOfCollateralInputs[idx] = utxo.blindPrivKey
    }
  })

  // get blinding priv key for each confidential collateral utxo
  // if utxo is not confidential, we MUST NOT pass the blind priv key
  const blindingPrivKeyOfSyntheticInputs: Record<number, string> = {}

  syntheticUtxos.forEach((utxo, idx) => {
    if (utxoIsConfidential(utxo)) {
      if (!utxo.blindPrivKey) throw new Error('Utxo without blindPrivKey')
      blindingPrivKeyOfSyntheticInputs[idx] = utxo.blindPrivKey
    }
  })

  if (!borrowerAddress.publicKey) return

  // get blinding pub key for collateral change if any
  const blindingPubKeyForCollateralChange = collateralChangeAddress
    ? {
        1: address
          .fromConfidential(collateralChangeAddress.confidentialAddress!)
          .blindingKey.toString('hex'),
      }
    : {}

  // get blinding pub key for synthetic change if any
  const blindingPubKeyForSyntheticChange = syntheticChangeAddress
    ? {
        1: address
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
    blindingPrivKeyOfSyntheticInputs,
    blindingPubKeyForSyntheticChange,
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

  debugMessage('body', body)
  // post and return
  return postData(`${alphaServerUrl}/contracts`, body)
}

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
