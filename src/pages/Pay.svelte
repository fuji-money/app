<script lang="ts">
  import Balance from '../components/Balance.svelte';
  import type { Asset, Contract } from '../lib/types';
  import Network from '../components/Pay/Network.svelte';
  import Qrcode from '../components/Pay/Qrcode.svelte';
  import Result from '../components/Pay/Result.svelte';
  import Confirm from '../components/Pay/Confirm.svelte';
  import Breadcrumbs from '../components/Navigation/Breadcrumbs.svelte';

  export let assets: Asset[];
  export let contract: Contract;
  export let extraCollateral: Asset;
  export let wallet: boolean;

  let network: string;
  let result: string;
  let bread = extraCollateral ? ['Dashboard', 'Topup'] : ['Borrow'];
  let crust = extraCollateral
    ? [contract.txid]
    : [contract.synthetic.ticker, contract.collateral.ticker];

  $: crumbs = [...crust, 'Pay', component()];
  $: component = () => {
    if (result) return 'Result';
    if (!network) return 'Network';
    if (network === 'liquid') return 'Confirm';
    if (network === 'lightning') return 'Qrcode';
  };
</script>

<Breadcrumbs {bread} {crumbs} on:navigate />
<h1>Pay</h1>
<div class="row">
  <div class="columns">
    <div class="column is-8">
      <div class="box has-pink-border">
        {#if component() === 'Result'}
          <Result {result} on:navigate />
        {:else if component() === 'Network'}
          <Network bind:network {contract} />
        {:else if component() === 'Qrcode'}
          <Qrcode bind:result {contract} {extraCollateral} />
        {:else if component() === 'Confirm'}
          <Confirm bind:result {contract} {extraCollateral} />
        {/if}
      </div>
    </div>
    <div class="column is-4">
      <Balance {assets} {wallet} on:connect />
    </div>
  </div>
</div>
