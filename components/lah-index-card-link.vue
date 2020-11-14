<template>
  <b-card class="anim-appear-1s shadow lah-index-card-link">
    <NuxtLink :to="to">
      <div class="mb-2">
        <font-awesome-icon :icon="icon" :size="size" :style="style" />
      </div>
      <b-card-title><slot></slot></b-card-title>
    </NuxtLink>
  </b-card>
</template>

<script>
export default {
  props: {
    to: { type: String, default: "/" },
    icon: { type: Array, default: () => ["fas", "wrench"] },
    size: { type: String, default: "3x" },
    style: { type: String, default: '' }
  },
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
  height: 100%;
}
</style>
