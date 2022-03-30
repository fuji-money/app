import { findAsset } from './fetch';
import { Asset, Contract, ContractState } from './types';

// format numbers
export const prettyNumber = (num: number, min = 2, max = 8) => {
  return new Intl.NumberFormat('en-us', {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  }).format(num);
};

// format asset
export const prettyAsset = (asset: Asset) => `${prettyNumber(asset.quantity)} ${asset.ticker}`;

// format amount (amount is quantity x value)
export const prettyAmount = (asset: Asset) => `US $${prettyNumber(asset.quantity * asset.value)}`;

// show pretty ago time
export const prettyAgo = (timestamp: number): string => {
  const now = new Date().getSeconds();
  const delta = now - timestamp;
  if (delta > 86_400) {
    const days = Math.floor(delta / 86_400);
    return `${days}d`;
  }
  if (delta > 3_600) {
    const hours = Math.floor(delta / 3_600);
    return `${hours}h`;
  }
  if (delta > 60) {
    const minutes = Math.floor(delta / 60);
    return `${minutes}m`;
  }
  const seconds = delta;
  return `${seconds}s`;
};

// get contract ration
export const getContractRatio = (contract: Contract): number => {
  const { collateral, synthetic } = contract;
  const collateralAmount = collateral.value * collateral.quantity;
  const syntheticAmount = synthetic.value * synthetic.quantity;
  const ratio = collateralAmount / syntheticAmount * 100;
  return parseFloat(ratio.toFixed(2));
};

// get ratio state
export const getRatioState = (ratio: number, minRatio: number): ContractState => {
  if (ratio >= minRatio + 50) return ContractState.Safe;
  if (ratio >= minRatio + 25) return ContractState.Unsafe;
  if (ratio >= minRatio) return ContractState.Critical;
  return ContractState.Liquidated;
};

// get contract state
export const getContractState = (contract: Contract): ContractState => {
  if (!contract) return null;
  const ratio = getContractRatio(contract);
  return getRatioState(ratio, contract.collateral.ratio);
};

// open modal
export const openModal = (id: string) => {
  document.getElementById(`${id}-modal`)?.classList.add('is-active');
};

export const notEnoughFunds = ({ asset, assets }) => {
  const ticker = asset.ticker;
  const available = findAsset({ ticker, assets })?.quantity;
  return available < asset.quantity;
};
