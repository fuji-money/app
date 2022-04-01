<script>
  export let id;

  const closeModals = () => {
    (document.querySelectorAll('.modal') || []).forEach((modal) => {
      modal.classList.remove('is-active');
    });
  };
</script>

<div class="modal" {id}>
  <div on:click={closeModals} class="modal-background" />
  <div class="modal-content">
    <div class="box has-text-centered">
      <slot />
    </div>
  </div>
  <button on:click={closeModals} class="modal-close is-large" aria-label="close" />
</div>
