<script>
  import FooterCopyright from "./FooterCopyright.svelte";
</script>

<section class="footer">
  <div class="container is-max-desktop">
    <div class="footer-logo-wrapper">
      <img src="images/fuji-logo-footer.png" loading="lazy" alt="" class="footer-logo">
    </div>
    <div class="footer-wrapper">
      <div class="footer-links-wrapper">
        <a href="/" class="footer-links">Terms of services</a>
        <div class="footer-links">|</div>
        <a href="/" class="footer-links">Privacy policy</a>
      </div>
      <div class="social-icons-wrapper">
        <a href="/" class="footer-social-icon-link">
          <img src="images/medium.svg" loading="lazy" alt="">
        </a>
        <a href="/" class="footer-social-icon-link">
          <img src="images/github.svg" loading="lazy" alt="">
        </a>
        <a href="/" class="footer-social-icon-link">
          <img src="images/twitter.svg" loading="lazy" alt="">
        </a>
        <a href="/" class="footer-social-icon-link">
          <img src="images/telegram.svg" loading="lazy" alt="">
        </a>
      </div>
    </div>
  </div>
</section>

<FooterCopyright />

<style lang="scss">
  section.footer {
    padding-top: 100px;
    padding-bottom: 100px;
    border-top: 1px solid #323654;
    background-color: #323654;
  }
  .footer-links {
    margin-right: 10px;
    color: #fff;
  }
  .footer-logo {
    height: 75px;
    margin: 0 auto;
  }
  .footer-logo-wrapper {
    align-items: center;
    border-bottom: 1px solid hsla(0, 0%, 100%, 0.64);
    display: flex;
    flex-direction: column;
    margin-bottom: 24px;
    padding-bottom: 24px;
  }
  .footer-links-wrapper {
    align-items: center;
    display: flex;
  }
  .footer-social-icon-link {
    margin-right: 12px;
    margin-left: 12px;
    &:last-child {
      margin-right: 0px;
    }
  }
  .footer-wrapper {
    display: grid;
    grid-auto-columns: 1fr;
    grid-column-gap: 24px;
    grid-row-gap: 24px;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto;
  }
  .social-icons-wrapper {
    align-items: center;
    display: flex;
    justify-self: end;
  }
  @media screen and (max-width: 1023px) {
    section.footer {
      padding-top: 60px;
      padding-bottom: 60px;
    }
    .footer-logo {
      height: 56px;
    }
    .footer-logo-wrapper {
      margin-bottom: 24px;
      padding-bottom: 24px;
    }
  }
  @media screen and (max-width: 768px) {
    section.footer {
      padding-top: 48px;
      padding-bottom: 48px;
    }
    .footer-links-wrapper {
      justify-content: center;
    }
    .footer-logo {
      height: 40px;
    }
    .social-icons-wrapper {
      justify-content: center;
    }
    .footer-wrapper {
      grid-template-columns: 1fr;
      grid-template-rows: auto auto;
    }
  }
  @media screen and (max-width: 479px) {
    .footer-logo {
      height: 36px;
    }
  }
</style>
