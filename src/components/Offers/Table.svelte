<script lang="ts">
  import BorrowButton from '../Buttons/Borrow.svelte';
  import ConnectButton from '../Buttons/Connect.svelte';
  import { prettyNumber } from '../../lib/utils';
  import type { Offer } from '../../lib/types';

  export let filteredOffers: Offer[];
  export let wallet: boolean;
</script>

<div class="row mt-6 mb-0 pr-4 pl-4">
  <div class="columns">
    <div class="column is-2">
      <h2>Asset</h2>
    </div>
    <div class="column is-2">
      <h2>Collateral asset</h2>
    </div>
    <div class="column is-2">
      <h2>Collateral ratio</h2>
    </div>
    <div class="column is-2">
      <h2>Oracle price</h2>
    </div>
    <div class="column is-4">&nbsp;</div>
  </div>
</div>
{#each filteredOffers as offer}
  <div class="box row">
    <div class="columns level">
      <div class="column is-flex is-2">
        <img src={offer.synthetic.icon} alt="{offer.synthetic.ticker} logo" />
        <img src={offer.collateral.icon} alt="{offer.collateral.ticker} logo" />
        <div class="is-gradient my-auto has-text-weight-bold">
          <p class="is-size-7 mb-0">{offer.synthetic.name}</p>
          <p class="is-size-7 mb-0">{offer.synthetic.ticker}</p>
        </div>
      </div>
      <div class="column is-2">
        <p class="is-gradient">{offer.collateral.ticker}</p>
      </div>
      <div class="column is-2">
        <p class="is-gradient">{`>${offer.collateral.ratio}%`}</p>
      </div>
      <div class="column is-2">
        <p class="amount is-gradient">US ${prettyNumber(offer.synthetic.value)}</p>
      </div>
      <div class="column is-4 has-text-right">
        {#if wallet}
          <BorrowButton {offer} on:borrow />
        {:else}
          <ConnectButton {wallet} on:connect />
        {/if}
      </div>
    </div>
  </div>
{/each}

<style lang="scss">
  .columns .column:nth-child(1) {
    img {
      display: block;
      height: 60px;
      padding: 10px;
      padding-left: 0;
    }
    img:nth-child(1) {
      z-index: 10;
    }
    img:nth-child(2) {
      position: relative;
      left: -24px;
    }
  }
</style>
