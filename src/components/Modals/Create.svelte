<script lang="ts">
  import type { Contract } from '../../lib/types';
  import Spinner from '../Spinner.svelte';
  import Modal from './Modal.svelte';
  import Summary from './Summary.svelte';

  export let contract: Contract;
</script>

<Modal id={'create-modal'}>
  {#if contract}
    <Spinner />
    <h3>Waiting for confirmation...</h3>
    <p>Create contract:</p>
    <Summary {contract} />
    <p>Confirm this transaction in your Marina wallet</p>
  {/if}
</Modal>
