<template lang="pug">
client-only: transition-group.lah(name="list-reverse")
  slot
</template>

<script>
export default {
  emit: [],
  component: {},
  props: {},
  data: () => ({}),
  computed: {},
  watch: {},
  created () {},
  mounted () {},
  methods: {}
}
</script>

<style lang="scss" scoped>
.lah {
  display: flex;
  flex-wrap: wrap;
  // [修改] 改用 flex-start 避免最後一行項目分散兩端
  justify-content: flex-start;
  align-items: stretch; /* Stretch child elements to fill the height */

  > * {
    margin-bottom: 1.25rem;
    // [新增] 計算間距：(容器寬度 - 3個卡片寬度) / 2個間隙
    // 這樣可以模擬 space-between 的效果，但保持靠左對齊
    margin-right: calc((100% - (31vw * 3)) / 2);

    // [新增] 每一行的第 3 個元素（最右邊那個）不需要 margin-right
    &:nth-child(3n) {
      margin-right: 0;
    }
  }

  > .card {
    width: 31vw;
    height: calc((100vh - 150px) / 3);
    overflow: auto;
    .card-body {
      // height: calc((100vh - 300px) / 3);
      overflow: auto;
      .card { width: 100%; }
    }
  }
}
</style>
