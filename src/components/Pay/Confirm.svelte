<script lang="ts">
import type { Contract } from "../../lib/types";

  import Spinner from "../Spinner.svelte";

  export let contract: Contract;
  export let result: string;
</script>

<Spinner />
<h3>Waiting for confirmation...</h3>
<p>Create contract:</p>
<!--
<Summary {contract} />
-->
<p class="confirm">Confirm this transaction in your Marina wallet</p>
