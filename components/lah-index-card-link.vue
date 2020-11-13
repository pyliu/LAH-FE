<template>
  <b-card class="anim-appear-1s shadow lah-index-card-link">
    <NuxtLink :to="to">
      <font-awesome-icon :icon="icon" :size="size" />
    </NuxtLink>
    <template #footer>
      {{ text }}
    </template>
  </b-card>
</template>

<script>
export default {
  props: {
    to: { type: String, default: '/' },
    icon: { type: Array, default: () => ['fas', 'wrench'] },
    size: { type: String, default: '4x' },
    text: { type: String, default: '維護中' }
  }
};
</script>

<style lang="scss">
.lah-index-card-link {
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: auto;
  border-radius: 10px;
  border: 1px solid gray;
}
</style>
