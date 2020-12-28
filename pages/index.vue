<template>
  <div class="container">
    <div>
      <section class="fixed-title-height">
        <lah-transition appear>
          <div v-if="ready">
            <Logo />
            <h3 class="title lah-shadow text-nowrap">桃園市地政智慧管控系統</h3>
          </div>
        </lah-transition>
      </section>
      <lah-transition appear>
        <section v-if="ready" class="b-card-container">
          <b-card-group deck class="mb-4">
            <lah-index-card-link :icon="['far', 'calendar-check']" to="/expire">即將逾期案件</lah-index-card-link>
            <lah-index-card-link :icon="['far', 'sticky-note']" to="/expiry-of-announcement">公告期滿案件</lah-index-card-link>
            <lah-index-card-link :icon="['fas', 'user-tie']" to="/ask-for-instructions">取消請示案件</lah-index-card-link>
            <lah-index-card-link :icon="['fas', 'money-check-alt']" to="/trust-case">信託案件</lah-index-card-link>
            <lah-index-card-link :icon="['fas', 'user-tag']" to="/non-scrivener-case">非專業代理人案件</lah-index-card-link>
            <lah-index-card-link :icon="['fas', 'user-astronaut']" to="/foreigner-case">外人地權案件</lah-index-card-link>
          </b-card-group>
          <b-card-group deck>
            <lah-index-card-link icon-variant="muted" action="damage">三七五租約標的異動</lah-index-card-link>
            <lah-index-card-link icon-variant="muted" action="damage">未辦標的註記異動</lah-index-card-link>
            <lah-index-card-link icon-variant="muted" action="damage">參考資訊檔標的異動通知書產製</lah-index-card-link>
            <lah-index-card-link icon-variant="muted" action="damage">逾期未駁回查詢</lah-index-card-link>
            <lah-index-card-link icon-variant="muted" action="damage">辦畢通知查詢</lah-index-card-link>
            <lah-index-card-link icon-variant="muted" action="damage">領狀管控查詢</lah-index-card-link>
          </b-card-group>
        </section>
      </lah-transition>
    </div>
  </div>
</template>

<script>
export default {
  head: {
    title: '桃園市地政智慧管控系統'
  },
  data: () => ({
    ready: false
  }),
  async asyncData(nuxt) {
    // SSR: returned object will replace the data inside "data" before rendering
  },
  watch: {},
  methods: {},
  mounted () {
    this.ready = true
  }
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

.fixed-title-height {
  height: 45vh;
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
