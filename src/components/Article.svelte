<script>
  import Card from "src/components/Card.svelte";

  export let image;
  export let title;
  export let description;
</script>

<div class="article">
  <Card padding={false}>
    <div class="article-inner">
      <img src={image} alt={title} />
      <div class="padded">
        <h3>{title}</h3>
        <div class="content">
          {@html description}
        </div>
        <div class="buttons">
          <slot />
        </div>
        {#if $$slots.footer}
          <slot name="footer" />
        {/if}
      </div>
    </div>
  </Card>
</div>

<style>
  .article img {
    max-width: 100%;
  }
  .article-inner {
    display: flex;
    align-items: flex-start;
    flex-direction: column;
    height: 100%;
  }
  .article {
    gap: 1em;
    display: flex;
    flex-direction: column;
  }
  .article h3 {
    margin-top: 0;
  }
  .article .buttons {
    display: flex;
    justify-content: start;
    margin-top: 2.5em;
    flex-wrap: wrap;
    gap: 0.5em;
  }
  .article .padded {
    display: flex;
    flex-direction: column;
    height: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }
  .article .padded .content {
    flex: 1;
  }
  .padded {
    padding: 2em;
  }
  @media only screen and (max-width: 798px) {
    .article {
      width: 100%;
    }
  }
  @media only screen and (max-width: 640px) {
    .padded {
      padding: 1em;
    }
  }
</style>
