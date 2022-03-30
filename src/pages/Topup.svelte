<script lang="ts">
  import Balance from '../components/Balance.svelte';
  import Form from '../components/Topup/Form.svelte';
  import type { Asset, Contract } from '../lib/types';

  export let assets: Asset[];
  export let contract: Contract;
  export let wallet: boolean;
</script>

<h1>Topup</h1>
<div class="row">
  <div class="columns">
    <div class="column is-8">
      <Form {assets} {contract} {wallet} on:increase />
    </div>
    <div class="column is-4">
      <Balance {assets} {wallet} on:connect />
    </div>
  </div>
</div>
