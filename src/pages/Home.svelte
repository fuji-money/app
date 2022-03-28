<script>
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();
  const advance = () => dispatch('advance', null);
</script>

<section>
  <div class="container has-text-centered">
    <img class="logo" src="images/fuji-logo-128.png" alt="fuji logo" />
    <p class="cta">Choose any link below to access the decentralized web app</p>
    <div class="links-wrapper">
      <!-- svelte-ignore a11y-missing-attribute -->
      <p><a on:click={advance}>https://fuji.money</a></p>
      <p><a href="https://mirrorprotocol.is">https://mirrorprotocol.is</a></p>
    </div>
  </div>
</section>

<style lang="scss">
  section {
    background: linear-gradient(180deg, #fffbf8 0%, #ffeae5 100%);
    min-height: 100vh;
  }
  .cta {
    color: #2c024d;
    display: inline-block;
    font-family: 'Proxima Nova Regular', sans-serif;
    font-size: 24px;
    font-weight: 400;
    margin: auto;
    max-width: 500px;
  }
  .logo {
    display: block;
    margin: 80px auto;
  }
</style>
