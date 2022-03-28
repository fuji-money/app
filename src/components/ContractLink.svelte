<script lang="ts">
  import type { Contract } from '../lib/types';
  export let contract: Contract;
  const baseURL = 'https://blockstream.info/liquid/tx/';
</script>

<a href={`${baseURL}${contract.txid}`} class="button external">
  {contract.txid.substring(0, 8)}...
</a>
