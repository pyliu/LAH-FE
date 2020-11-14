<template>
  <div class="container">
    <div>
      <Logo />
      <h3 class="title">桃園市地政智慧管控系統</h3>
      <section class="b-card-container">
        <b-card-group deck class="mb-4">
          <lah-index-card-link :icon="['far', 'calendar-check']" to="/about-to-expire">即將逾期案件</lah-index-card-link>
          <lah-index-card-link :icon="['far', 'sticky-note']" to="/expiry-of-announcement">公告期滿案件</lah-index-card-link>
          <lah-index-card-link :icon="['fas', 'user-tie']" to="/ask-for-instructions">請示未結案件</lah-index-card-link>
          <lah-index-card-link>即將逾期案件</lah-index-card-link>
          <lah-index-card-link>開發維護中...</lah-index-card-link>
          <lah-index-card-link>開發維護中...</lah-index-card-link>
        </b-card-group>
        <b-card-group deck>
          <lah-index-card-link>開發維護中...</lah-index-card-link>
          <lah-index-card-link>開發維護中...</lah-index-card-link>
          <lah-index-card-link>開發維護中...</lah-index-card-link>
          <lah-index-card-link>開發維護中...</lah-index-card-link>
          <lah-index-card-link>開發維護中...</lah-index-card-link>
          <lah-index-card-link>開發維護中...</lah-index-card-link>
        </b-card-group>
      </section>
    </div>
  </div>
</template>

<script>
export default {
  head: {
    title: '桃園市地政智慧管控系統'
  },
  data: () => ({
    
  }),
  async asyncData(nuxt) {
    // SSR: returned object will replace the data inside "data" before rendering
  },
  watch: {},
  methods: {},
  mounted () {}
}
</script>

<style lang="scss">
a {
  color: var(--dark);
}

.container {
  margin: auto;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.b-card-container {
	display: flex;
	flex-wrap: wrap;
  height: 50vh;
  align-content: flex-start;
  .b-card-group {
    height: 45%;
  }
}

.grids {
	display: flex;
	flex-wrap: wrap;
	width: 100%;
  height: 40vh;
  align-content: flex-start;
  .grid-6col-2row {
    width: 15.5%;
    height: 48%;
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: auto;
    border-radius: 10px;
    border: 1px solid gray;
    margin: 0.5%;
  }
}
</style>
