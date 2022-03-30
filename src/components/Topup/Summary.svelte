<script lang="ts">
  import type { Contract } from '../../lib/types';
  import { getContractState, prettyAmount, prettyAsset, getContractRatio, prettyRatio } from '../../lib/utils';
  import PrettyState from '../PrettyState.svelte';

  export let contract: Contract;

  $: ratio = getContractRatio(contract);
  $: state = getContractState(contract);
</script>

<div class="has-pink-border">
  <div class="row">
    <div class="columns">
      <div class="column is-4">
        <p>Synthetic</p>
        <p>{prettyAsset(contract.synthetic)}</p>
        <p>{prettyAmount(contract.synthetic)}</p>
      </div>
      <div class="column is-4">
        <p>Ratio</p>
        <p>{prettyRatio(ratio)}%</p>
        <p><PrettyState {state} /></p>
      </div>
      <div class="column is-4">
        <p>Collateral</p>
        <p>{prettyAsset(contract.collateral)}</p>
        <p>{prettyAmount(contract.collateral)}</p>
      </div>
    </div>
  </div>
</div>

<style lang="scss">
  .row {
    padding: 2rem 4rem;
  }
  .column {
    p {
      font-weight: 700;
      text-align: left;
    }
    p:nth-child(1) {
      color: #63159b;
      font-size: 0.9rem;
      text-transform: uppercase;
    }
    p:nth-child(3) {
      color: #9D9D9D;
      font-size: 0.9rem;
      font-weight: 400;
    }
  }
</style>
