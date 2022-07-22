export function randomTxId(): string { // TODO
  let txid = ''
  for (let i = 0; i < 16; i++) {
    txid += Math.floor(Math.random() * 65536).toString(16)
  }
  return txid
}
