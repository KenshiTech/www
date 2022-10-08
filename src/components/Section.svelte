<div class="section">
  <slot />
</div>

<style>
  .section {
    padding: 4em;
    padding-top: 2em;
    flex: 1;
    min-height: 30%;
  }

  @media screen and (max-width: 960px) {
    .section {
      padding: 2em;
    }
  }

  @media only screen and (max-width: 640px) {
    .section {
      padding: 1em;
    }
  }
</style>
