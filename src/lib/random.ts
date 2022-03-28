import { getContracts, getTokens } from './fetch';
import { Activity, ActivityType, Contract } from './types';

async function randomContract({ contracts, tokens }): Promise<Contract> {
  tokens ||= await getTokens();
  contracts ||= await getContracts({ tokens });
  const randomIndex = Math.floor(Math.random() * contracts.length);
  return contracts[randomIndex];
}

function randomMessage(): string {
  const messages = [
    'Lorem ipsum dolor sit amet',
    'Consectetur adipiscing elit',
    'Vestibulum pretium elementum felis',
    'Eu dictum sem ornare in',
  ];
  const index = Math.floor(Math.random() * messages.length);
  return messages[index];
}

function randomTime(): number {
  const now = new Date().getSeconds();
  return now - Math.floor(Math.random() * 100_000);
}

function randomTxid(): string {
  let txid = '';
  for (let i = 0; i < 16; i++) {
    txid += Math.floor(Math.random() * 65536).toString(16);
  }
  return txid;
}

export async function getRandomActivities({ contracts, tokens, type }): Promise<Activity[]> {
  if (type === ActivityType.Liquidated) return [];
  tokens ||= await getTokens();
  contracts ||= await getContracts({ tokens });
  let contract: Contract;
  let message: string;
  const activities: Activity[] = [];
  for (let i = 0; i < 5; i++) {
    contract = await randomContract({ contracts, tokens });
    message = `Contract ${type.toLowerCase()} with success - ${randomMessage()}`;
    activities.push({
      icon: contract.synthetic.icon,
      contract,
      createdAt: randomTime(),
      message,
      txid: randomTxid(),
      type: ActivityType[type],
    });
  }
  return activities;
}
