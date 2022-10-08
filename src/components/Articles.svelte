<script>
  export let title = "Articles";
  export let padding = "4em";
  export let empty = false;
  export let error = false;
</script>

<div class="articles" style="--padding: {padding};">
  <h2>{title}</h2>
  {#if $$slots.filter}
    <slot name="filter" />
  {/if}
  {#if empty}
    <slot name="empty-message" />
  {:else if error}
    <slot name="error-message" />
  {:else}
    <div class="grid">
      <slot />
    </div>
  {/if}
</div>

<style>
  .articles {
    padding: var(--padding);
  }
  .articles h2 {
    font-size: 2em;
  }
  .articles .grid {
    margin-top: 4em;
    display: grid;
    grid-template-columns: repeat(
      auto-fill,
      minmax(280px, calc((100% - 6em) / 4))
    );
    gap: 2em;
  }
  @media only screen and (max-width: 500px) {
    .articles .grid {
      grid-template-columns: 1fr;
    }
  }
  @media only screen and (max-width: 600px) {
    .articles h2 {
      margin: 0;
    }
    .articles .grid {
      margin-top: 2em;
    }
  }
</style>
