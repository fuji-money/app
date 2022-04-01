<script lang="ts">
  import Spinner from '../Utils/Spinner.svelte';
  import Modal from './Modal.svelte';
  import type { Contract } from '../../lib/types';
  import Summary from '../Contract/Summary.svelte';

  export let contract: Contract;
</script>

<Modal id={'redeem-modal'}>
  {#if contract}
    <Spinner />
    <h3>Waiting for confirmation...</h3>
    <p>Redeem contract:</p>
    <Summary {contract} />
    <p class="confirm">Confirm this transaction in your Marina wallet</p>
  {/if}
</Modal>
