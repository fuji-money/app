export function randomMessage(type: string): string {
  const messages = [
    'Lorem ipsum dolor sit amet',
    'Consectetur adipiscing elit',
    'Vestibulum pretium elementum felis',
    'Eu dictum sem ornare in',
  ]
  const index = Math.floor(Math.random() * messages.length)
  const suffix = messages[index]
  return `Contract ${type.toLowerCase()} with success - ${suffix}`
}

export function randomTxId(): string {
  let txid = ''
  for (let i = 0; i < 16; i++) {
    txid += Math.floor(Math.random() * 65536).toString(16)
  }
  return txid
}
