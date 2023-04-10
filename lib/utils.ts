import b58 from 'bs58check'
import Decimal from 'decimal.js'
import { readUInt64LE, writeUInt64LE } from 'liquidjs-lib/src/bufferutils'
import { Tasks } from './tasks'

// Buffer encoded in base64 Little Endian to string
export function bufferBase64LEToString(base64: string) {
  const buf = Buffer.from(base64, 'base64')
  const num = readUInt64LE(buf, 0)
  return num.toString()
}

// number to uint64LE
export function numberToUint64LE(n: number): Buffer {
  const num = Decimal.floor(n).toNumber()
  const buf = Buffer.alloc(8)
  writeUInt64LE(buf, num, 0)
  return Buffer.from(buf)
}

// hex LE to string
export function hexLEToString(hex: string): string {
  return bufferBase64LEToString(
    Buffer.from(hex.slice(2), 'hex').toString('base64'),
  )
}

// hex LE to number
export function hexLEToNumber(hex: string): number {
  return Decimal.floor(hexLEToString(hex)).toNumber()
}

// number to string
export function numberToHexEncodedUint64LE(n: number): string {
  const buf = numberToUint64LE(n)
  return '0x'.concat(buf.toString('hex'))
}

export function toSatoshis(fractional: number, precision: number = 8): number {
  return Decimal.floor(
    new Decimal(fractional).mul(Decimal.pow(10, precision)),
  ).toNumber()
}

export function fromSatoshis(
  integer: number = 0,
  precision: number = 8,
): number {
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
      return 'deposit'
    case Tasks.Redeem:
      return 'receive'
    case Tasks.Topup:
      return 'deposit'
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
  xpub = xpub.trim()

  try {
    let data = b58.decode(xpub)
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
