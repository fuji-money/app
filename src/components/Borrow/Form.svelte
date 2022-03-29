<script lang="ts">
  import { onMount } from 'svelte';
  import { getOffer } from '../../lib/fetch';
  import type { Asset, Contract, Offer, Token } from '../../lib/types';
  import Spinner from '../Spinner.svelte';
  import { createEventDispatcher } from 'svelte';
  import Button from './Form/Button.svelte';
  import Info from './Form/Info.svelte';
  import Synthetic from './Form/Synthetic.svelte';
  import Ratio from './Form/Ratio.svelte';
  import Collateral from './Form/Collateral.svelte';
  import { notEnoughFunds } from '../../lib/utils';
  import NotEnoughFunds from '../Notifications/NotEnoughFunds.svelte';
  import RatioNotSafe from '../Notifications/RatioNotSafe.svelte';
  import BorrowFee from '../Notifications/BorrowFee.svelte';

  export let balance: Asset[];
  export let offer: Offer;
  export let wallet: boolean;

  let loading = true;

  // the new intended contract (the form state)
  let contract: Contract;

  let collateral = offer.collateral;
  let synthetic = offer.synthetic;
  let ratio = offer.collateral.ratio;

  // event dispatcher
  const dispatch = createEventDispatcher();
  const create = () => dispatch('create', contract);

  // update collateral quantity to reflect new ratio
  const calcQuantity = (_collateral: Asset, _synthetic: Asset, _ratio: number) => (
    _synthetic?.quantity * _synthetic?.value * _ratio / 100 / _collateral?.value
  );

  $: contract = { collateral, synthetic, ratio };
  $: collateral = { ...collateral, quantity: calcQuantity(collateral, synthetic, ratio) };
  $: exception = notEnoughFunds({ asset: collateral, balance });
  $: warning = ratio < offer.ratio + 50;
</script>

<!-- form -->
<div class="white-slip has-pink-border">
  <!-- step 1 / choose collateral -->
  <h3><span>1</span>How much {synthetic.ticker} you want to borrow?</h3>
  <p class="intro">Lorem ipsum dolor</p>
  <Synthetic bind:synthetic />
  <!-- step 2 / choose ratio -->
  <h3><span>2</span>Set a collateral ratio</h3>
  <p class="intro">Lorem ipsum dolor</p>
  <Ratio bind:ratio {offer} />
  <!-- step 3 / confirm borrow amount -->
  <h3><span>3</span>Confirm collateral amount</h3>
  <p class="intro">Lorem ipsum dolor</p>
  <Collateral bind:collateral />
</div>
<!-- additional info -->
<Info {contract} />
<!-- possible warnings -->
<BorrowFee />
{#if warning}<RatioNotSafe />{/if}
{#if exception}<NotEnoughFunds />{/if}
<!-- create contract button -->
<Button on:click={create} {contract} {offer} {balance} {wallet} />

<style lang="scss">
  h3 {
    margin-top: 40px;
    &:first-child {
      margin-top: 10px;
    }
  }
  p {
    &.intro {
      font-size: 0.9rem;
      margin-left: 30px;
      padding-bottom: 20px;
    }
  }
</style>

