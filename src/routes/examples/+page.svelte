<script>
  import { browser } from "$app/environment";
  import Navbar from "src/components/Navbar.svelte";
  import Footer from "src/components/Footer.svelte";
  import Section from "src/components/Section.svelte";
  import Articles from "src/components/Articles.svelte";
  import Article from "src/components/Article.svelte";
  import Button from "src/components/Button.svelte";
  import TagsSelect from "src/components/TagsSelect.svelte";
  import External from "src/icons/External.svelte";
  import D20 from "src/icons/D20.svelte";
  import CloudSensor from "src/icons/CloudSensor.svelte";
  import MongoDB from "src/icons/MongoDB.svelte";
  import Shuffle from "src/icons/Shuffle.svelte";
  import Node from "src/icons/Node.svelte";
  import Solidity from "src/icons/Solidity.svelte";
  import Python from "src/icons/Python.svelte";
  import Go from "src/icons/Go.svelte";
  import { onMount } from "svelte";

  export let examples = [];
  export let products = [];
  export let languages = [];
  let error;

  const getTagIcon = (tag) => {
    switch (tag.value) {
      case "di-graphql":
        return D20;
      case "r-api":
        return CloudSensor;
      case "di-mql":
        return MongoDB;
      case "vrf":
        return Shuffle;
      case "node":
        return Node;
      case "solidity":
        return Solidity;
      case "python":
        return Python;
      case "go":
        return Go;
      default:
        return null;
    }
  };

  const fetchTags = async () => {
    const response = await fetch("/api/examples/tags");
    const tags = await response.json();
    const tagsWithIcons = tags.map((tag) => ({
      ...tag,
      icon: getTagIcon(tag),
    }));
    products = tagsWithIcons.filter((tag) => tag.type === "product");
    languages = tagsWithIcons.filter((tag) => tag.type === "language");
  };

  const fetchExamples = async (_products, _languages) => {
    try {
      const res = await fetch(
        "/api/examples?tags=" +
          encodeURIComponent(
            _products
              .concat(_languages)
              .filter((t) => t?.checked)
              .map((t) => t.value)
              .join(",")
          )
      );
      if (!res.ok) {
        throw new Error("There was an error fetching the examples.");
      }
      examples = await res.json();
    } catch (e) {
      error = e.message;
      console.error(e);
      examples = [];
    }
  };

  $: if (browser) fetchExamples(products, languages);

  onMount(async () => {
    if (browser) {
      await fetchTags();
      await fetchExamples([]);
    }
  });
</script>

<Navbar />

<Articles
  title="Examples"
  padding="2em 4em 4em 4em"
  empty={!error && !examples.length}
  error={!!error}
>
  <div class="filters" slot="filter">
    <div class="filter product">
      <span>By product:</span>
      <TagsSelect bind:tags={products} />
    </div>
    <div class="filter language">
      <span>By language:</span>
      <TagsSelect bind:tags={languages} />
    </div>
  </div>
  <div slot="empty-message" class="empty-message">
    There are no published examples matching your criteria.
  </div>
  <div slot="error-message" class="error-message">
    ⚠️ {error}
  </div>
  {#each examples as example}
    <Article
      title={example.name}
      description={example.description}
      image={example.image}
    >
      <Button href={example.url} target="_blank" solid>
        View website
        <External />
      </Button>
      <Button href={example.source_url} target="_blank" solid>
        View source code
        <External />
      </Button>
      <div class="footer" slot="footer">
        <div class="products">
          <span>
            Products: {example.tags
              .filter((t) => t.type === "product")
              .map((t) => t.name)
              .join(", ")}
          </span>
        </div>
        <div class="languages">
          <span>
            Languages: {example.tags
              .filter((t) => t.type === "language")
              .map((t) => t.name)
              .join(", ")}
          </span>
        </div>
      </div>
    </Article>
  {/each}
</Articles>

<Footer />

<style>
  .filters {
    display: flex;
    width: 100%;
    gap: 4em;
  }
  .filter {
    display: flex;
    flex-direction: column;
    gap: 0.5em;
  }
  .empty-message,
  .error-message {
    margin: 2em 0;
  }
  .footer {
    padding-top: 1.5em;
    opacity: 0.4;
  }
</style>
