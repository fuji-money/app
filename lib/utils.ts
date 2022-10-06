import Decimal from 'decimal.js'
import { writeUInt64LE } from 'liquidjs-lib/src/bufferutils'
import { Tasks } from './tasks'

// number to string
export function numberToHexEncodedUint64LE(n: number): string {
  const num = Decimal.floor(n).toNumber()
  const buf = Buffer.alloc(8)
  writeUInt64LE(buf, num, 0)
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
) => {
  return () => {
    setData('')
    setResult('')
    handler()
  }
}
