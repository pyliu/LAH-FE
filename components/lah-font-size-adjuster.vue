<template lang="pug">
.lah-font-size-adjuster.d-flex.align-items-center.justify-content-between
  .d-flex.align-items-center.text-nowrap
    font-awesome-icon.mr-2(
      :icon="['fas', 'font']"
      fixed-width
      size="lg"
    )
    span 顯示字級
  b-button-group(size="sm")
    b-button(
      variant="outline-secondary"
      size="sm"
      :disabled="scale <= minScale"
      @click.stop="decrease"
      title="字體縮小 5% (最小 85%)"
      class="text-light adjust-btn"
    )
      strong A-
    b-button(
      :variant="scale === 100 ? 'secondary' : 'primary'"
      size="sm"
      @click.stop="reset"
      title="點擊重設為 100%"
      class="font-weight-bold px-2 scale-indicator"
    ) {{ scale }}%
    b-button(
      variant="outline-secondary"
      size="sm"
      :disabled="scale >= maxScale"
      @click.stop="increase"
      title="字體放大 5% (最大 140%)"
      class="text-light adjust-btn"
    )
      strong A+
</template>

<script>
export default {
  name: 'LahFontSizeAdjuster',
  data: () => ({
    minScale: 85,
    maxScale: 140,
    step: 5
  }),
  computed: {
    scale () {
      return this.$store.getters.displayFontScale || 100
    }
  },
  methods: {
    decrease () {
      const next = Math.max(this.scale - this.step, this.minScale)
      this.$store.commit('setDisplayFontScale', next)
    },
    increase () {
      const next = Math.min(this.scale + this.step, this.maxScale)
      this.$store.commit('setDisplayFontScale', next)
    },
    reset () {
      this.$store.commit('setDisplayFontScale', 100)
    }
  }
}
</script>

<style lang="scss" scoped>
.lah-font-size-adjuster {
  color: rgb(187, 184, 184);
  font-size: 1rem;
  user-select: none;

  .adjust-btn {
    border-color: rgba(255, 255, 255, 0.25);
    &:hover:not(:disabled) {
      background-color: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.5);
    }
    &:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }
  }

  .scale-indicator {
    min-width: 3.5rem;
    font-size: 0.85rem;
    cursor: pointer;
    letter-spacing: 0.5px;

    &:hover {
      filter: brightness(1.15);
    }
  }
}
</style>
