import { Extractor, Finalizer, Pset } from 'liquidjs-lib'

// finalize and extract psetv2
export function finalizeTx(pset: Pset): string {
  const finalizer = new Finalizer(pset)
  finalizer.finalize()
  return Extractor.extract(finalizer.pset).toHex()
}
