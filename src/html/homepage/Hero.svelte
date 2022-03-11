<section class="hero">
  <div class="container">
    <div class="row">
      <div class="column">
        <div class="navbar-container">
          <div>
            <a href="/" class="brand">
              <img src="images/fuji-logo-128.png" alt="fuji logo" class="brand-logo">
            </a>
          </div>
          <div>
            <nav class="nav-menu">
              <a href="/">News</a>
              <a href="/">Apps</a>
              <a href="/">Github</a>
            </nav>
            <a href="/" class="button-primary">Join Telegram Group</a>
            <img class="menu-icon" src="images/menu-1.svg" alt="menu icon">
          </div>
        </div>
      </div>
    </div>
    <div class="row hero-wrapper">
      <div class="column">
        <h1 class="hero-heading">Fuji Money</h1>
        <p class="subheading">Borrow bitcoin-backed stable-coins, synthetic stocks &amp; bonds without intermediaries.</p>
      </div>
      <div class="column no-padding">
        <img src="images/illustration-1.svg" alt="" class="hero-image">
      </div>
    </div>
  </div>
</section>

<style lang="scss">
  section.hero {
    overflow: hidden;
    padding-top: 60px;
    padding-bottom: 90px;
    background-image: -webkit-gradient(linear, left top, left bottom, from(#fffbf8), to(#ffeae5));
    background-image: linear-gradient(180deg, #fffbf8, #ffeae5);
  }
  .row.hero-wrapper {
    position: relative;
    display: -ms-grid;
    display: grid;
    margin-top: 120px;
    grid-auto-columns: 1fr;
    grid-column-gap: 24px;
    grid-row-gap: 24px;
    -ms-grid-columns: 1fr 1fr;
    grid-template-columns: 1fr 1fr;
    -ms-grid-rows: auto;
    grid-template-rows: auto;
  }
  .menu-icon {
    display: none;
    padding: 12px;
    max-width: 32px;
  }
  .nav-menu {
    align-items: center;
    display: flex;
    a {
      color: #6b1d9c;
      font-family: 'Proxima Nova Regular', sans-serif;
      font-size: 24px;
      font-weight: 400;
      line-height: 1.5;
      padding: 20px;
      transition: color 300ms ease;
      -webkit-transition: color 300ms ease;
      &:last-child {
        margin-right: 60px;
      }
    }
  }
  .navbar-container {
    background-color: transparent;
    display: flex;
    justify-content: space-between;
    z-index: 1000;max-width: 100%;
    position: relative;
    &>div {
      display: flex;
      flex-direction: row;
    }
    &>div:nth-child(2) {
      min-width: 50%;
      justify-content: flex-end;
    }
  }

  @media screen and (max-width: 991px) {
    .menu-icon {
      display: block;
    }
    .nav-menu {
      display: none;
    }
  }
</style>
