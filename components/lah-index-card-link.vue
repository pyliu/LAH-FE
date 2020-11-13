<template>
  <b-card class="anim-appear-1s">
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
    icon: { type: Array, default: () => ['fas', 'home'] },
    size: { type: String, default: '5x' },
    text: { type: String, default: '回首頁' }
  }
};
</script>

<style></style>
