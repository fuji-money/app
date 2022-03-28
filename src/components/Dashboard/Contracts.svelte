<script lang="ts">
  import type { Contract } from '../../lib/types';
  import EmptyState from '../EmptyState.svelte';
  import PrettyState from '../PrettyState.svelte';
  import Spinner from '../Spinner.svelte';
  import RedeemButton from '../Buttons/Redeem.svelte';
  import TopupButton from '../Buttons/Topup.svelte';
  import ContractLink from '../ContractLink.svelte';

  export let contracts: Contract[];
  export let wallet: boolean;

  let showActive = true;
  let filteredContracts: Contract[];

  $: filteredContracts = showActive ? contracts : [];
  $: loading = contracts === undefined;
</script>

<section>
  <div class="header level">
    <div class="level-left">
      <div class="level-item">
        <h2>Contracts</h2>
      </div>
    </div>
    <div class="level-right">
      <div class="level-item">
        <!-- svelte-ignore a11y-missing-attribute -->
        <p>
          <strong>Show:</strong> &nbsp;
          <a class:selected={showActive} on:click={() => (showActive = true)}>Active</a> |
          <a class:selected={!showActive} on:click={() => (showActive = false)}>Expired</a>
        </p>
      </div>
    </div>
  </div>
  {#if !wallet}
    <EmptyState type="wallet" />
  {:else if loading}
    <Spinner />
  {:else if filteredContracts.length === 0}
    <EmptyState type={'contracts'} />
  {:else}
    {#each filteredContracts as contract}
      <div class="white-slip row">
        <div class="columns level">
          <div class="column is-2">
            <p><strong>{contract.synthetic.quantity} {contract.synthetic.ticker}</strong></p>
          </div>
          <div class="column is-2">
            <PrettyState state={contract.state} />
          </div>
          <div class="column is-8">
            <ContractLink {contract} />
            <RedeemButton {contract} on:redeem />
            <TopupButton {contract} on:topup />
          </div>
        </div>
      </div>
    {/each}
  {/if}
</section>
