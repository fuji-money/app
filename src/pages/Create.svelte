<script lang="ts">
  import Form from '../components/Borrow/Form.svelte';
  import Balance from '../components/Balance.svelte';
  import type { Asset, Offer } from '../lib/types';

  export let offer: Offer;
  export let balance: Asset[];
  export let wallet: boolean;
</script>

<h1>Borrow</h1>
<div class="row">
  <div class="columns">
    <div class="column is-8">
      <Form {offer} {balance} {wallet} on:create />
    </div>
    <div class="column is-4">
      <Balance {balance} {wallet} on:connect />
    </div>
  </div>
</div>
