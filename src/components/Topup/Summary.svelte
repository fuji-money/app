<script lang="ts">
  import type { Contract } from '../../lib/types';
  import { getContractState, prettyAmount, prettyAsset, getContractRatio, prettyRatio } from '../../lib/utils';
  import PrettyState from '../PrettyState.svelte';

  export let contract: Contract;

  $: ratio = getContractRatio(contract);
  $: state = getContractState(contract);
</script>

<div class="has-pink-border">
  <div class="row py-4 px-6">
    <div class="columns">
      <div class="column is-4 info-card">
        <p>Synthetic</p>
        <p>{prettyAsset(contract.synthetic)}</p>
        <p>{prettyAmount(contract.synthetic)}</p>
      </div>
      <div class="column is-4 info-card">
        <p>Ratio</p>
        <p>{prettyRatio(ratio)}%</p>
        <p><PrettyState {state} /></p>
      </div>
      <div class="column is-4 info-card">
        <p>Collateral</p>
        <p>{prettyAsset(contract.collateral)}</p>
        <p>{prettyAmount(contract.collateral)}</p>
      </div>
    </div>
  </div>
</div>
