<script>
  export let href;
  export let target = "";
</script>

<a on:click {href} {target}><slot /></a>

<style>
  a {
    color: #000;
    display: inline-flex;
    align-items: center;
    gap: 0.5em;
  }
  a:hover::after {
    content: "";
    width: 1em;
    height: 1em;
    display: block;
    background: url("data:image/svg+xml;charset=utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'><!--! Font Awesome Pro 6.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path fill='%23ba3322' d='M335 408.1C330.3 404.3 328 398.2 328 392s2.344-12.28 7.031-16.97L430.1 280H24C10.75 280 0 269.2 0 255.1C0 242.7 10.75 232 24 232h406.1l-95.03-95.03c-9.375-9.375-9.375-24.56 0-33.94s24.56-9.375 33.94 0l136 136c9.375 9.375 9.375 24.56 0 33.94l-136 136C359.6 418.3 344.4 418.3 335 408.1z'/></svg>");
    animation: appear 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
  @keyframes appear {
    from {
      opacity: 0;
      transform: translateX(-4px);
    }
    to {
      opacity: 1;
      transform: translateX(0px);
    }
  }
</style>
