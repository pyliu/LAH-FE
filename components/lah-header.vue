<template lang="pug">
h3.lah-header.d-flex.justify-content-between.align-items-center.py-3(
  :class="{ 'is-scrolled': isScrolled }"
)
  lah-button.bars-button.mr-1(
    icon="bars"
    size="lg"
    action="ld-move-fade-ltr"
    variant="outline-dark"
    title="開啟選單"
    no-icon-gutter
    v-b-toggle.lah-sidebar
  )
  client-only: slot
  lah-transition: .d-flex
    lah-button.home-button.ml-1(
      v-if="showHome"
      :icon="icon"
      size="lg"
      action="ld-breath"
      :variant="variant"
      :title="title"
      to="/"
      no-icon-gutter
    )
  lah-sidebar-admin(v-if="authority.isAdmin")
  lah-sidebar(v-else)
</template>

<script>
export default {
  data: () => ({
    isScrolled: false
  }),
  computed: {
    showHome () { return this.$route.path !== '/' },
    icon () { return this.systemConfigs.mock ? 'laptop-code' : 'house-chimney' },
    variant () { return this.systemConfigs.mock ? 'success' : 'outline-dark' },
    title () { return this.systemConfigs.mock ? '注意：系統處於模擬模式' : '回到地政事務所入口網' }
  },
  watch: {
    $route () {
      this.$nextTick(this.checkScroll)
    }
  },
  mounted () {
    this.checkScroll = () => {
      const scrolled = (window.pageYOffset || document.documentElement.scrollTop || 0) > 10
      if (this.isScrolled !== scrolled) {
        this.isScrolled = scrolled
      }
    }
    window.addEventListener('scroll', this.checkScroll, { passive: true })
    this.checkScroll()
  },
  beforeDestroy () {
    if (this.checkScroll) {
      window.removeEventListener('scroll', this.checkScroll)
    }
  }
}
</script>

<style lang="scss" scoped>
.lah-header {
  position: sticky;
  top: 0;
  z-index: 1020;
  background-color: transparent;
  border-bottom: 1px solid transparent;
  box-shadow: none;
  margin-top: 0 !important;
  margin-left: -15px;
  margin-right: -15px;
  padding-left: 15px;
  padding-right: 15px;
  transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;

  &.is-scrolled {
    background-color: #ffffff;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);

    .dark-mode & {
      background-color: #121212;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .auto-theme & {
      background-color: var(--dyn-card-bg, #ffffff);
      border-bottom: 1px solid var(--dyn-border, rgba(0, 0, 0, 0.08));
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
    }
  }
}

@mixin common() {
  width: 3.4rem;
  border-radius: 10px;
  z-index: 1030;
  // border: 1px solid gray;
}

.bars-button {
  @include common();
}

.home-button {
  @include common();
}
</style>
