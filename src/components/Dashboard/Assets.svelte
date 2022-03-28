<script lang="ts">
  import type { Asset } from "../../lib/types";
  import { prettyNumber } from "../../lib/utils";
  import EmptyState from "../EmptyState.svelte";
  import Spinner from "../Spinner.svelte";
  import BorrowButton from "../Buttons/Borrow.svelte";
  import TradeButton from "../Buttons/Trade.svelte";

  export let assets: Asset[];
  export let wallet: boolean;

  $: loading = assets === undefined;
</script>

<section>
  <h2>Assets</h2>
    {#if loading}
      <Spinner />
    {:else}
      {#if !assets}
        <EmptyState type="assets" />
      {:else}
        {#each assets as asset}
          <div class="white-slip row">
            <div class="columns level">
              <div class="column is-flex">
                <img src="{asset.icon}" alt="asset logo">
                <div class="synthetic is-gradient">
                  <p>{asset.name}</p>
                  <p>
                    {#if wallet}
                      {prettyNumber(asset.quantity)}
                    {/if}
                    {asset.ticker}
                  </p>
                </div>
              </div>
              <div class="column">
                <p class="amount is-gradient">
                  {#if wallet}
                    US ${prettyNumber(asset.quantity * asset.value)}
                  {/if}
                </p>
              </div>
              <div class="column">
                <TradeButton on:trade />
                <BorrowButton {asset} on:borrow />
              </div>
            </div>
          </div>
        {/each}
      {/if}
    {/if}
</section>
