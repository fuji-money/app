<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Asset, Contract } from '../../lib/types';
  import { getContractRatio, notEnoughFunds, prettyRatio } from '../../lib/utils';
  import Button from './Form/Button.svelte';
  import Summary from './Summary.svelte';
  import NotEnoughFunds from '../Notifications/NotEnoughFunds.svelte';
  import Ratio from '../Borrow/Form/Ratio.svelte';

  export let assets: Asset[];
  export let contract: Contract;
  export let wallet: boolean;

  let extraCollateral = { ...contract.collateral, quantity: 0 };
  let ratio = getContractRatio(contract);
  let options = {
    min: prettyRatio(ratio),
    safe: contract.collateral.ratio + 50,
  }

  const dispatch = createEventDispatcher();
  const topup = () => dispatch('increase', extraCollateral);

  const getContractWithExtra = ({ quantity }) => {
    return {
      ...contract,
      collateral: {
        ...contract.collateral,
        quantity: contract.collateral.quantity + quantity,
      }
    }
  }

  const calcQuantity = (r: number) => {
    const { collateral, synthetic } = contract;
    const quantity = synthetic.value * synthetic.quantity * r / 100 / collateral.value;
    return quantity - collateral.quantity;
  }

  $: future = getContractWithExtra(extraCollateral);
  $: extraCollateral = { ...contract.collateral, quantity: calcQuantity(ratio) };
  $: exception = notEnoughFunds({ asset: extraCollateral, assets });
</script>

<!-- form -->
<div class="white-slip has-pink-border">
  <h3><span>1</span>Your present contract</h3>
  <Summary {contract} />
  <h3><span>2</span>How much collateral do you want to add?</h3>
  <Ratio bind:ratio {...options} />
  <h3><span>3</span>Confirm new values</h3>
  <Summary contract={future} />
</div>
<!-- possible warnings -->
{#if exception}<NotEnoughFunds />{/if}
<!-- create contract button -->
<Button on:click={topup} {assets} {extraCollateral} {wallet} />

<style lang="scss">
  h3 {
    margin-top: 60px;
    &:first-child {
      margin-top: 10px;
    }
  }
</style>
