<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import ConnectButton from './Buttons/Connect.svelte';

  export let wallet: boolean;

  const dispatch = createEventDispatcher();
  const navigate = (id: string) => dispatch('navigate', id);
  const trade = () => dispatch('trade', null);
</script>

<section>
  <div class="container">
    <div class="is-flex is-justify-content-space-between">
      <div>
        <!-- svelte-ignore a11y-missing-attribute -->
        <a on:click={() => navigate('home')}>
          <img src="/images/fuji-logo-128.png" alt="fuji logo" />
        </a>
      </div>
      <div class="is-flex is-align-content-center">
        <!-- svelte-ignore a11y-missing-attribute -->
        <a on:click={() => navigate('dashboard')}>Dashboard</a>
        <!-- svelte-ignore a11y-missing-attribute -->
        <a on:click={trade}>Trade</a>
        <!-- svelte-ignore a11y-missing-attribute -->
        <a on:click={() => navigate('borrow')}>Borrow</a>
        <ConnectButton {wallet} on:connect />
      </div>
    </div>
  </div>
</section>

<style lang="scss">
  a {
    color: #6b1d9c;
    display: inline-block;
    font-weight: 700;
    margin: auto;
    padding: 20px;
    text-decoration: none;
    transition: color 300ms ease;
  }
  .container {
    margin-bottom: 60px;
  }
  img {
    max-height: 40px;
    margin-left: -20px;
  }
</style>
