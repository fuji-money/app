import { Activity, ActivityType, Asset, Contract, Offer } from './types';
import { getRandomActivities } from './random';
import { getContractState } from './utils';

export function findAsset({ ticker, assets }) {
  return assets.find((asset: Asset) => asset.ticker === ticker);
}

async function fetchData(entity = '') {
  const url = `https://my-json-server.typicode.com/easter-monolith/fuji-api/${entity}`;
  const headers = { 'Content-Type': 'application/json' };
  const response = await fetch(url, { headers });
  return response.json();
}

export async function getActivities({ assets, contracts }): Promise<Activity[]> {
  assets ||= await getAssets();
  contracts ||= await getContracts({ assets });
  let activities = [];
  for (const type in ActivityType) {
    activities = [...activities, ...(await getRandomActivities({ contracts, assets, type }))];
  }
  return activities;
}

export async function getAssets(): Promise<Asset[]> {
  return await fetchData('assets');
}

export async function getContracts({ assets }): Promise<Contract[]> {
  assets ||= await getAssets();
  const contracts = await fetchData('contracts');
  return contracts.map((contract: Contract) => {
    let ticker = contract.collateral.ticker;
    contract.collateral = {
      ...contract.collateral,
      ...findAsset({ ticker, assets }),
    };
    ticker = contract.synthetic.ticker;
    contract.synthetic = {
      ...contract.synthetic,
      ...findAsset({ ticker, assets }),
    };
    contract.state = getContractState(contract);
    return contract;
  });
}

export async function getContract({ contracts, id, assets }): Promise<Contract> {
  assets ||= await getAssets();
  contracts ||= await getContracts({ assets });
  return contracts.find((c: Contract) => c.txid === id);
}

export async function getOffers({ assets }): Promise<Offer[]> {
  assets ||= await getAssets();
  const offers = await fetchData('offers');
  return offers.map((offer) => {
    const collateral = findAsset({ ticker: offer.collateral, assets });
    const synthetic = findAsset({ ticker: offer.synthetic, assets });
    return { ...offer, collateral, synthetic };
  });
}

export async function getOffer({ offers, id, assets }): Promise<Offer | null> {
  if (!id) return null;
  assets ||= await getAssets();
  offers ||= await getOffers({ assets });
  return offers.find((offer) => offer.id === id);
}

// for each asset, return asset with quantity
export async function getBalance({ assets, contracts }): Promise<Asset[]> {
  assets ||= await getAssets();
  contracts ||= await getContracts({ assets });
  const synthetic = {};
  for (const contract of contracts) {
    const ticker = contract.synthetic.ticker;
    if (!synthetic[ticker]) synthetic[ticker] = 0;
    synthetic[ticker] += contract.synthetic.quantity;
  }
  // dummy data, TODO
  const collateral = {
    LBTC: 2,
    USDt: 42_000,
  };
  return assets.map((asset: Asset) => {
    const ticker = asset.ticker;
    const quantity = collateral[ticker] || synthetic[ticker] || 0;
    return { ...asset, quantity };
  });
}
