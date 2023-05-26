import b58 from 'bs58check'
import Decimal from 'decimal.js'
import { readUInt64LE, writeUInt64LE } from 'liquidjs-lib/src/bufferutils'
import { Tasks } from './tasks'

// The 3 following function are need to transform encoding
// for contractParams.priceLevel and contractParams.setupTimestamp:
// - values go to alpha factory in base64 64 bytes LE (Little Endian)
// - are used by Marina and Ionio encoded in hex 64 bytes LE
// - we need to extract the numeric values to recreate contracts
//   from marina coins in syncContractsWithMarina and coinToContract
// The strategy is to have it allways store in hex64LE and derive from there

// used to propose contracts to alpha factory
export function hex64LEToBase64LE(hex: string): string {
  const buf = Buffer.from(hex.slice(2), 'hex')
  return buf.toString('base64')
}

// used in coinToContract (marina coin => contract)
// used in syncContractsWithMarina
export function hex64LEToNumber(hex: string): number {
  const buf = Buffer.from(hex.slice(2), 'hex')
  return readUInt64LE(buf, 0)
}

// used in contract provider to migrate old contracts
// used in getCovenantOutput to transform contract.priceLevel (number)
// into contract.contractParams.priceLevel (hex 64 LE)
export function numberToHex64LE(n: number): string {
  const num = Decimal.floor(n).toNumber()
  const buf = Buffer.alloc(8)
  writeUInt64LE(buf, num, 0)
  return '0x'.concat(buf.toString('hex'))
}

export function toSatoshis(fractional: number, precision: number): number {
  return Decimal.floor(
    new Decimal(fractional).mul(Decimal.pow(10, precision)),
  ).toNumber()
}

export function fromSatoshis(integer: number, precision: number): number {
  return new Decimal(integer).div(Decimal.pow(10, precision)).toNumber()
}

// open modal
export const openModal = (id: string): void => {
  document.getElementById(id)?.classList.add('is-active')
}

// close modal
export const closeModal = (id: string): void => {
  document.getElementById(id)?.classList.remove('is-active')
}

// close modal
export const closeAllModals = (): void => {
  const modals = document.querySelectorAll('.modal')
  for (const el of Array.from(modals)) {
    el.classList.remove('is-active')
  }
}

export async function sleep(miliseconds: number) {
  await Promise.resolve(
    new Promise((resolve) => {
      setTimeout(resolve, miliseconds)
    }),
  )
}

export const extractError = (error: any): string => {
  return error instanceof Error
    ? error.message
    : typeof error === 'string'
    ? error
    : ''
}

export const operationFromTask = (task: string): string => {
  switch (task) {
    case Tasks.Borrow:
    case Tasks.Topup:
      return 'deposit'
    case Tasks.Redeem:
      return 'receive'
    case Tasks.Multiply:
      return 'Multiply'
    default:
      return 'unknown'
  }
}

export const retry = (
  setData: (arg0: string) => void,
  setResult: (arg0: string) => void,
  handler = () => {},
  updateBalances = () => {},
) => {
  return () => {
    setData('')
    setResult('')
    updateBalances()
    handler()
  }
}

// This has been taken from https://github.com/Casa/xpub-converter/blob/master/js/xpubConvert.js
/*
  This script uses version bytes as described in SLIP-132
  https://github.com/satoshilabs/slips/blob/master/slip-0132.md
*/
const prefixes = new Map([
  ['xpub', '0488b21e'],
  ['ypub', '049d7cb2'],
  ['Ypub', '0295b43f'],
  ['zpub', '04b24746'],
  ['Zpub', '02aa7ed3'],
  ['tpub', '043587cf'],
  ['upub', '044a5262'],
  ['Upub', '024289ef'],
  ['vpub', '045f1cf6'],
  ['Vpub', '02575483'],
])

/*
 * This function takes an extended public key (with any version bytes, it doesn't need to be an xpub)
 * and converts it to an extended public key formatted with the desired version bytes
 * @param xpub: an extended public key in base58 format. Example: xpub6CpihtY9HVc1jNJWCiXnRbpXm5BgVNKqZMsM4XqpDcQigJr6AHNwaForLZ3kkisDcRoaXSUms6DJNhxFtQGeZfWAQWCZQe1esNetx5Wqe4M
 * @param targetFormat: a string representing the desired prefix; must exist in the "prefixes" mapping defined above. Example: Zpub
 */
function changeVersionBytes(xpub: string, targetFormat: string) {
  if (!prefixes.has(targetFormat)) {
    return 'Invalid target version'
  }

  // trim whitespace
  const _xpub = xpub.trim()

  try {
    let data = b58.decode(_xpub)
    data = data.slice(4)
    data = Buffer.concat([
      Buffer.from(prefixes.get(targetFormat)!, 'hex'),
      data,
    ])
    return b58.encode(data)
  } catch (err) {
    throw new Error(
      "Invalid extended public key! Please double check that you didn't accidentally paste extra data.",
    )
  }
}

export function toXpub(anyPub: string) {
  return changeVersionBytes(anyPub, 'xpub')
}

export function encodeExpirationTimeout(seconds: number): Buffer {
  const SEQUENCE_LOCKTIME_MASK = 0x0000ffff
  const SEQUENCE_LOCKTIME_TYPE_FLAG = 1 << 22
  const SEQUENCE_LOCKTIME_GRANULARITY = 9
  const SECONDS_MOD = 1 << SEQUENCE_LOCKTIME_GRANULARITY
  const SECONDS_MAX = SEQUENCE_LOCKTIME_MASK << SEQUENCE_LOCKTIME_GRANULARITY

  if (!Number.isFinite(seconds)) throw new Error('Invalid seconds')
  if (seconds > SECONDS_MAX)
    throw new Error('seconds too large, max is ' + SECONDS_MAX)
  if (seconds % SECONDS_MOD !== 0)
    throw new Error('seconds must be a multiple of ' + SECONDS_MOD)

  const asNumber =
    SEQUENCE_LOCKTIME_TYPE_FLAG | (seconds >> SEQUENCE_LOCKTIME_GRANULARITY)
  return Buffer.from(asNumber.toString(16), 'hex').reverse()
}
