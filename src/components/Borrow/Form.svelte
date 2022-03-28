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
  export let token: Token;
  export let wallet: boolean;

  let loading = true;

  // the offer that supports this borrowing
  let offer: Offer;

  // the new intended contract (the form state)
  let contract: Contract;


  let collateral: Asset;
  let collaterals: Asset[];
  let synthetic: Asset;
  let ratio: number;

  // event dispatcher
  const dispatch = createEventDispatcher();
  const create = () => dispatch('create', contract);

  // based on token we want to borrow:
  // - find offer for this specific token
  // - build contract object (our state)
  async function getData() {
    const quantity = 0;
    let offers: Offer[], tokens: Token[]; // keep undefined to force reload
    offer = await getOffer({ offers, ticker: token.ticker, tokens });
    collaterals = [...offer.collateral];
    collateral = { ...collaterals[0], quantity };
    synthetic = { ...offer.synthetic, quantity };
    ratio = offer.ratio;
  }

  // update collateral quantity to reflect new ratio
  const calcQuantity = (_collateral: Asset, _synthetic: Asset, _ratio: number) => (
    _synthetic?.quantity * _synthetic?.value * _ratio / 100 / _collateral?.value
  );

  // get data when component mounts
  onMount(async () => {
    await getData();
    loading = false;
  });

  $: contract = { collateral, synthetic, ratio };
  $: collateral = { ...collateral, quantity: calcQuantity(collateral, synthetic, ratio) };
  $: exception = !loading && notEnoughFunds({ asset: collateral, balance });
  $: warning = ratio < offer?.ratio + 50;
</script>

{#if loading}
  <Spinner />
{:else}
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
    <Collateral bind:collateral {collaterals} />
  </div>
  <!-- additional info -->
  <Info {contract} />
  <!-- possible warnings -->
  <BorrowFee />
  {#if warning}<RatioNotSafe />{/if}
  {#if exception}<NotEnoughFunds />{/if}
  <!-- create contract button -->
  <Button on:click={create} {contract} {offer} {balance} {wallet} />
{/if}

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

