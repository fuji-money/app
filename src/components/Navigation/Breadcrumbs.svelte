<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let bread: string[];
  export let crumbs = [];

  const dispatch = createEventDispatcher();
  const navigate = (route: string) => dispatch('navigate', route);
  const goto = (link: string) => {
    if (link === 'Borrow') link = 'Offers';
    navigate(link.toLowerCase());
  }
</script>

<div class="is-flex">
  {#each bread as link}
    <p on:click={() => goto(link)} class="is-size-7">
      / {link}&nbsp;
    </p>
  {/each}
  {#each crumbs as link}
    <p class="is-size-7">
      / {link}&nbsp;
    </p>
  {/each}
</div>
