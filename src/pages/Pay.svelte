<script lang="ts">
  import Balance from '../components/Balance.svelte';
  import type { Asset, Contract } from '../lib/types';
  import Network from '../components/Pay/Network.svelte';
  import Qrcode from '../components/Pay/Qrcode.svelte';
  import Result from '../components/Pay/Result.svelte';
  import Confirm from '../components/Pay/Confirm.svelte';

  export let assets: Asset[];
  export let contract: Contract;
  export let extraCollateral: Asset;
  export let wallet: boolean;

  let network: string;
  let result: string;
</script>

<h1>Pay</h1>
<div class="row">
  <div class="columns">
    <div class="column is-8">
      <div class="white-slip has-pink-border">
        {#if result}
          <Result {result} />
        {:else if !network}
          <Network bind:network {contract} />
        {:else if network === 'lightning'}
          <Qrcode bind:result {contract} {extraCollateral} />
        {:else if network === 'liquid'}
          <Confirm bind:result {contract} {extraCollateral} />
        {/if}
      </div>
    </div>
    <div class="column is-4">
      <Balance {assets} {wallet} on:connect />
    </div>
  </div>
</div>
