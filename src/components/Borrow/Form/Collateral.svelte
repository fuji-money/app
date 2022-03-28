<script lang="ts">
  import type { Asset } from "../../../lib/types";
  import { prettyNumber } from "../../../lib/utils";

  export let collateral: Asset;
  export let collaterals: Asset[];

  // event handler
  const change = (e: any) => {
    collateral = collaterals.find((c) => c.ticker === e.target.value);
  }
</script>


<div class="level is-pink">
  <div class="level-left">
    <div class="level-item">
      <p class="ml-3"><img src={collateral.icon} alt="collateral icon" /></p>
      {#if collaterals.length === 1}
        <p class="ml-3">{collaterals[0].ticker}</p>
      {:else}
        <div class="select is-primary has-pink-background">
          <select class="has-pink-background" on:change={change}>
            {#each collaterals as { ticker }}
              <option>{ticker}</option>
            {/each}
          </select>
        </div>
      {/if}
    </div>
  </div>
  <div class="level-right">
    <div class="level-item">
      <p class="mr-3">{prettyNumber(collateral.quantity)}</p>
    </div>
  </div>
</div>

<style lang="scss">
  img {
    height: 1.5rem;
    margin-top: 2px;
  }
  select {
    border: 0;
  }
  .level {
    min-height: 45px;
  }
</style>
