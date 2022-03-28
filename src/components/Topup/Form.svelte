<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Asset, Contract } from '../../lib/types';
  import { notEnoughFunds } from '../../lib/utils';
  import Collateral from './Form/Collateral.svelte';
  import Button from './Form/Button.svelte';
  import Summary from './Summary.svelte';
  import NotEnoughFunds from '../Notifications/NotEnoughFunds.svelte';

  export let balance: Asset[];
  export let contract: Contract;
  export let wallet: boolean;

  let collateral = { ...contract.collateral, quantity: 0 };

  const dispatch = createEventDispatcher();
  const topup = () => dispatch('increase', collateral);

  const getFutureContract = (_collateral: Asset) => {
    return {
      ...contract,
      collateral: {
        ..._collateral,
        quantity: contract.collateral.quantity + _collateral.quantity,
      }
    }
  }

  $: future = getFutureContract(collateral);
  $: exception = notEnoughFunds({ asset: collateral, balance });
</script>

<!-- form -->
<div class="white-slip has-pink-border">
  <h3><span>1</span>Your present contract</h3>
  <Summary {contract} />
  <h3><span>2</span>Increase your collateral</h3>
  <Collateral bind:collateral />
  <h3><span>3</span>Confirm new values</h3>
  <Summary contract={future} />
</div>
<!-- possible warnings -->
{#if exception}<NotEnoughFunds />{/if}
<!-- create contract button -->
<Button on:click={topup} {balance} {collateral} {wallet} />

<style lang="scss">
  h3 {
    margin-top: 60px;
    &:first-child {
      margin-top: 10px;
    }
  }
</style>
