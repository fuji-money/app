<script lang="ts">
  import type { Asset } from '../lib/types';
  import { prettyNumber } from '../lib/utils';
  import ConnectButton from './Buttons/Connect.svelte';

  export let assets: Asset[];
  export let wallet: boolean;
</script>

<div class="white-slip has-pink-border">
  {#if assets}
    <h3>Your balance</h3>
    {#if !wallet}
      <ConnectButton {wallet} on:connect />
    {:else}
      <table class="table is-fullwidth">
        <thead>
          <tr>
            <th>Ticker</th>
            <th>
              <abbr title="Quantity" />Qty
            </th>
          </tr>
        </thead>
        <tbody>
          {#each assets as asset}
            <tr>
              <td>
                <img src={asset.icon} alt="{asset.name} logo" />
                {asset.ticker}
              </td>
              <td>{prettyNumber(asset.quantity)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  {/if}
</div>

<style lang="scss">
  table {
    font-size: 0.9rem;
  }
  td:nth-child(2),
  th:nth-child(2) {
    text-align: right;
  }
  td:nth-child(2) {
    color: #63159b;
  }
  img {
    height: 20px;
    position: relative;
    top: 4px;
  }
</style>
