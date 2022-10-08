<script>
  import Button from "./Button.svelte";
  export let tags = [];
</script>

<div class="tags">
  {#each tags as tag}
    <div class="tag">
      <Button
        active={tag.checked}
        on:click={() => (tag.checked = !tag.checked)}
      >
        {#if tag.icon}
          <svelte:component this={tag.icon} />
        {/if}
        {tag.name}
      </Button>
    </div>
  {/each}
</div>

<style>
  .tags {
    display: flex;
    gap: 0.5em;
  }
</style>
