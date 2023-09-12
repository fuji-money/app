import { Asset, ConfigResponseOffer, Offer, Oracle } from './types'

export function populateOffer(
  offer: ConfigResponseOffer,
  assets: Asset[],
  oracles: Oracle[],
): Offer {
  const oraclePubkeys = oracles
    .filter((oracle) => oracle.pubkey)
    .map((oracle) => oracle.pubkey ?? '')
  const collateral = assets.find((a) => a.id === offer.collateralAsset)
  const synthetic = assets.find((a) => a.id === offer.syntheticAsset)
  if (!collateral)
    throw new Error(`Unknown collateral id ${offer.collateralAsset}`)
  if (!synthetic)
    throw new Error(`Unknown synthetic id ${offer.collateralAsset}`)
  return {
    id: offer.id,
    collateral,
    oracles: oraclePubkeys,
    synthetic,
    isAvailable: true,
  }
}
