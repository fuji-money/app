<script lang="ts">
  import type { Asset, Contract } from "../../lib/types";
  import { prettyAsset } from "../../lib/utils";
  import Spinner from "../Spinner.svelte";
  import Modal from './Modal.svelte';
  import Summary from "./Summary.svelte";

  export let asset: Asset;
  export let contract: Contract;
</script>

<Modal id={'topup-modal'}>
  {#if contract && asset}
    <Spinner />
    <h3>Waiting for confirmation...</h3>
    <p>Topup contract with <strong>+{prettyAsset(asset)}</strong>:</p>
    <Summary {contract} />
    <p class="confirm">Confirm this transaction in your Marina wallet</p>
  {/if}
</Modal>
