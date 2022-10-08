<script>
  export let href;
  export let target;
  export let solid = false;
  export let flat = false;
  export let disabled = false;
  export let active = false;
</script>

{#if href}
  <a class="button" {href} {target} class:flat class:solid>
    <span><slot /></span>
  </a>
{:else}
  <button
    class="button"
    class:flat
    class:solid
    class:active
    on:click
    on:mouseenter
    on:mouseleave
    {disabled}
  >
    <span><slot /></span>
  </button>
{/if}

<style>
  .button {
    border: 1px solid var(--primary-color);
    padding: 0.5em 1em;
    background: transparent;
    font-size: 1em;
    border-radius: 0.5em;
    display: flex;
    align-items: center;
    gap: 0.75em;
    cursor: pointer;
    overflow: hidden;
  }
  .button:not(.flat) {
    color: var(--primary-color);
  }
  .button.flat {
    padding: 0;
    border: none;
    color: currentColor;
  }
  .button.solid {
    color: #fff;
    background: #000;
    border: 1px solid #000;
    border: none;
    font-size: 1em;
  }
  .button :global(svg) {
    height: 0.8em;
    fill: currentColor;
  }
  .button.flat :global(svg) {
    height: 1em;
    fill: currentColor;
  }
  .button.solid :global(.fa-secondary) {
    fill: #fff !important;
  }
  .button.solid :global(.fa-primary) {
    fill: #fff !important;
  }
  .button > span {
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 0.5em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .button:not(.solid) {
    position: relative;
  }
  .button.active,
  .button:not(.flat):hover {
    color: #fff;
  }
  .button.active::after,
  .button:not(.solid):not(.flat)::after {
    content: "";
    position: absolute;
    right: 0;
    top: -1px;
    bottom: -1px;
    width: 0;
    background: var(--primary-color);
    transition: width cubic-bezier(0.165, 0.84, 0.44, 1) 0.1s;
    z-index: 0;
    border-radius: 0.5em;
  }
  .button.active::after,
  .button:not(.solid):hover::after {
    width: 100% !important;
    border: 1px solid var(--primary-color);
    box-sizing: content-box;
  }
  .button.solid :global(svg) {
    transition: transform cubic-bezier(0.165, 0.84, 0.44, 1) 0.1s;
  }
  .button.solid:hover :global(svg:last-of-type) {
    transform: rotate(45deg);
  }
  .button {
    transition: transform cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.2s;
  }
  .button:active {
    transform: scale(0.98);
  }
  a.button.flat:visited {
    color: currentColor;
  }
</style>
