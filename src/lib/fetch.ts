import { Activity, ActivityType, Asset, Contract, Offer, Token } from './types';
import { getRandomActivities } from './random';
import { getContractState } from './utils';

export function findAsset({ ticker, assets }) {
  return assets.find((asset: Asset) => asset.ticker === ticker);
}

function findToken({ ticker, tokens }): Token {
  return tokens.find((token: Token) => token.ticker === ticker);
}

async function fetchData(entity = '') {
  const url = `https://my-json-server.typicode.com/easter-monolith/fuji-api/${entity}`;
  const headers = { 'Content-Type': 'application/json' };
  const response = await fetch(url, { headers });
  return response.json();
}

export async function getActivities({ contracts, tokens }): Promise<Activity[]> {
  tokens ||= await getTokens;
  contracts ||= await getContracts({ tokens });
  let activities = [];
  for (const type in ActivityType) {
    activities = [...activities, ...(await getRandomActivities({ contracts, tokens, type }))];
  }
  return activities;
}

export async function getAssets({ contracts, offers, tokens }): Promise<Asset[]> {
  // get all synthetic tokens
  tokens ||= await fetchData('tokens');
  const assets: Asset[] = tokens.filter((token: Token) => token.isSynthetic);
  // calculate quantity TODO
  contracts ||= await getContracts({ tokens });
  assets.forEach((asset) => {
    const filter = (c: Contract) => c.synthetic.ticker === asset.ticker;
    const reducer = (prev: number, curr: Contract) => prev + curr.synthetic.quantity;
    asset.quantity = contracts.filter(filter).reduce(reducer, 0);
  });
  // find out wich offers allow to borrow more of this
  offers ||= await getOffers({ tokens });
  assets.forEach((asset) => {
    asset.offer = offers.find((o) => o.synthetic.ticker === asset.ticker);
  });
  return assets;
}

export async function getContracts({ tokens }): Promise<Contract[]> {
  tokens ||= await getTokens();
  const contracts = await fetchData('contracts');
  return contracts.map((contract: Contract) => {
    let ticker = contract.collateral.ticker;
    contract.collateral = {
      ...contract.collateral,
      ...findToken({ ticker, tokens }),
    };
    ticker = contract.synthetic.ticker;
    contract.synthetic = {
      ...contract.synthetic,
      ...findToken({ ticker, tokens }),
    };
    contract.state = getContractState(contract);
    return contract;
  });
}

export async function getContract({ contracts, id, tokens }): Promise<Contract> {
  tokens ||= await getTokens();
  contracts ||= await getContracts({ tokens });
  return contracts.find((c: Contract) => c.txid === id);
}

export async function getOffers({ tokens }): Promise<Offer[]> {
  tokens ||= await getTokens();
  const offers = await fetchData('offers');
  return offers.map((offer) => {
    const collateral = findToken({ ticker: offer.collateral, tokens });
    const synthetic = findToken({ ticker: offer.synthetic, tokens });
    return { ...offer, collateral, synthetic };
  });
}

export async function getOffer({ offers, ticker, tokens }): Promise<Offer | null> {
  if (!ticker) return null;
  tokens ||= await getTokens();
  offers ||= await getOffers({ tokens });
  return offers.find(({ synthetic }) => synthetic.ticker === ticker);
}

export async function getTokens(): Promise<Token[]> {
  return await fetchData('tokens');
}

// for each token (synthetic and collateral) returns Token with quantity (aka Asset)
export async function getBalance({ assets, tokens }): Promise<Asset[]> {
  if (!assets) return null;
  tokens ||= await getTokens();
  // dummy data, TODO
  const dummy = {
    LBTC: 2,
    USDt: 42_000,
  };
  return tokens.map((token: Token) => {
    const ticker = token.ticker;
    const quantity = dummy[ticker] || findAsset({ ticker, assets })?.quantity || 0;
    return { ...token, quantity };
  });
}
