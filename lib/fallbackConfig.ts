import { NetworkString } from 'marina-provider'
import { ConfigResponse } from './types'

// Last successful mainnet response from factory.fuji-labs.io/contracts/info,
// captured 29 Apr 2024. The factory origin certificate is invalid (Cloudflare
// 526), which browsers surface as a CORS error, so redeem cannot wait on it.
// https://web.archive.org/web/20240429191752/https://factory.fuji-labs.io/contracts/info
const mainnetFallback: ConfigResponse = {
  assets: [
    {
      assetID:
        '0dea022a8a25abb128b42b0f8e98532bc8bd74f8a77dc81251afcc13168acef7',
      tokenID:
        'e39ebb9d2fcfa5b924a554f1ac6f7fe244655aad0486d6a076e40745ec11d30b',
      entropy:
        '4dda2f666041036e6276b738057a5cf68a561c8e3385cf2da4b4df4ed18c594c',
      minCollateralRatio: 110,
      maxCirculatingSupply: 2100000,
    },
  ],
  oracles: [
    {
      url: 'https://oracle.fuji-labs.io',
      xOnlyPublicKey:
        'f30697e7f0bc100639a990b5215f641606b2bad214e1e574a5188c5ad763bc4d',
    },
  ],
  xOnlyIssuerPublicKey:
    'd7d54ddca8eadddaad76898d927ee7af514c2ec49de3492d0901340783342236',
  offers: [
    {
      id: 'BTCUSD',
      collateralAsset:
        '6f0279e9ed041c3d710a9f57d0c02928416460c4b722ae3457a11eec381c526d',
      syntheticAsset:
        '0dea022a8a25abb128b42b0f8e98532bc8bd74f8a77dc81251afcc13168acef7',
    },
  ],
}

// Testnet factory (stage-factory.fuji.money) is unreachable. These are the
// asset ids previously shipped with the app, enough to list and redeem.
const testnetFallback: ConfigResponse = {
  assets: [
    {
      assetID:
        '0d86b2f6a8c3b02a8c7c8836b83a081e68b7e2b4bcdfc58981fc5486f59f7518',
      tokenID: '',
      entropy: '',
      minCollateralRatio: 110,
      maxCirculatingSupply: -1,
    },
  ],
  oracles: [
    {
      url: 'https://oracle.fuji-labs.io',
      xOnlyPublicKey:
        'c304c3b5805eecff054c319c545dc6ac2ad44eb70f79dd9570e284c5a62c0f9e',
    },
  ],
  xOnlyIssuerPublicKey: '',
  offers: [
    {
      id: 'BTCUSD',
      collateralAsset:
        '144c654344aa716d6f3abcc1ca90e5641e4e2a7f633bc09fe3baf64585819a49',
      syntheticAsset:
        '0d86b2f6a8c3b02a8c7c8836b83a081e68b7e2b4bcdfc58981fc5486f59f7518',
    },
  ],
}

const fallbackByNetwork: Partial<Record<NetworkString, ConfigResponse>> = {
  liquid: mainnetFallback,
  testnet: testnetFallback,
}

export function getFallbackConfig(
  network: NetworkString,
): ConfigResponse | undefined {
  return fallbackByNetwork[network]
}

const cacheKey = (network: NetworkString) => `fujiFactoryConfig:${network}`

function isConfigResponse(value: unknown): value is ConfigResponse {
  if (!value || typeof value !== 'object') return false
  const config = value as ConfigResponse
  return (
    Array.isArray(config.assets) &&
    config.assets.length > 0 &&
    Array.isArray(config.offers) &&
    Array.isArray(config.oracles) &&
    config.oracles.length > 0 &&
    typeof config.xOnlyIssuerPublicKey === 'string' &&
    config.assets.every(
      (asset) =>
        typeof asset?.assetID === 'string' &&
        typeof asset?.minCollateralRatio === 'number',
    )
  )
}

export function readCachedFactoryConfig(
  network: NetworkString,
): ConfigResponse | undefined {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(cacheKey(network))
    if (!raw) return
    const parsed: unknown = JSON.parse(raw)
    if (!isConfigResponse(parsed)) return
    return parsed
  } catch (ignore) {
    return
  }
}

export function writeCachedFactoryConfig(
  network: NetworkString,
  config: ConfigResponse,
): void {
  if (typeof window === 'undefined') return
  if (!isConfigResponse(config)) return
  localStorage.setItem(cacheKey(network), JSON.stringify(config))
}
