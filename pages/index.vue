<template>
  <div class="container">
    <div>
      <Logo />
      <h3 class="title">桃園市地政智慧管控系統 {{ip}}</h3>
      <div class="mt-2 grids">
        <div class="grid-6col-2row">
          <NuxtLink to="/about_to_expire">
            <font-awesome-icon
              :icon="['far', 'calendar-check']"
              pull="left"
              size="5x"
              class="anim-appear-1s ml-4"
            />
            即將逾期案件
          </NuxtLink>
        </div>
        <div class="grid-6col-2row">
          <NuxtLink to="/expiry_of_announcement">
            <font-awesome-icon
              :icon="['fas', 'scroll']"
              pull="left"
              size="4x"
              class="anim-appear-1s ml-4"
            />
            公告期滿案件
          </NuxtLink>
        </div>
        <div class="grid-6col-2row">
          <NuxtLink to="/ask_for_instructions">
            <font-awesome-icon
              :icon="['fas', 'user-tie']"
              pull="left"
              size="4x"
              class="anim-appear-1s ml-4"
            />
            請示未結案件
          </NuxtLink>
        </div>
        <div class="grid-6col-2row"><NuxtLink to="/"><font-awesome-icon :icon="['fas', 'wrench']" class="anim-appear-1s" size="lg" /></NuxtLink></div>
        <div class="grid-6col-2row"><NuxtLink to="/"><font-awesome-icon :icon="['fas', 'wrench']" class="anim-appear-1s" size="lg" /></NuxtLink></div>
        <div class="grid-6col-2row"><NuxtLink to="/"><font-awesome-icon :icon="['fas', 'wrench']" class="anim-appear-1s" size="lg" /></NuxtLink></div>
        <div class="grid-6col-2row"><NuxtLink to="/"><font-awesome-icon :icon="['fas', 'wrench']" class="anim-appear-1s" size="lg" /></NuxtLink></div>
        <div class="grid-6col-2row"><NuxtLink to="/"><font-awesome-icon :icon="['fas', 'wrench']" class="anim-appear-1s" size="lg" /></NuxtLink></div>
        <div class="grid-6col-2row"><NuxtLink to="/"><font-awesome-icon :icon="['fas', 'wrench']" class="anim-appear-1s" size="lg" /></NuxtLink></div>
        <div class="grid-6col-2row"><NuxtLink to="/"><font-awesome-icon :icon="['fas', 'wrench']" class="anim-appear-1s" size="lg" /></NuxtLink></div>
        <div class="grid-6col-2row"><NuxtLink to="/"><font-awesome-icon :icon="['fas', 'wrench']" class="anim-appear-1s" size="lg" /></NuxtLink></div>
        <div class="grid-6col-2row"><NuxtLink to="/"><font-awesome-icon :icon="['fas', 'wrench']" class="anim-appear-1s" size="lg" /></NuxtLink></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  head: {
    title: '桃園市地政智慧管控系統'
  },
  data: () => ({
    other: 'this is other',
    message: undefined
  }),
  async asyncData({ $axios }) {
    const params = new URLSearchParams();
    params.append('type', 'ip');
    /**
     * json format is { status, ip, data_count, message }
    */
    const json = await $axios.$post('/api/query_json_api.php', params)
    return {...json}
  },
  watch: {
    message(str) { this.notify(str) }
  },
  methods: { },
  mounted () {
    this.notify(this.message)
    // this.isBusy = true
    // this.$axios.post('/api/query_json_api.php', this.postParams({
    //   type: 'ip'
    // })).then(res => {
    //   this.ip = res.data.ip;
    //   this.notify(this.message + ' 2')
    // }).catch(err => {
    //   this.$error(err);
    // }).finally(() => {
    //   this.isBusy = false
    // })
  }
}
</script>

<style lang="scss">
.container {
  margin: auto;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.title {
  font-family: "Quicksand", "Source Sans Pro", -apple-system, BlinkMacSystemFont,
    "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  display: block;
  font-weight: bold;
  font-size: 4rem;
  color: #35495e;
  letter-spacing: 1px;
  margin-top: 2rem;
}

.subtitle {
  font-weight: 300;
  font-size: 42px;
  color: #526488;
  word-spacing: 5px;
  padding-bottom: 15px;
}

.grids {
	display: flex;
	flex-wrap: wrap;
	width: 100%;
  height: 40vh;
  align-content: flex-start;
  padding: auto;
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

.grid-center {
	box-sizing: border-box;
	display: flex;
  justify-content: center;
  align-items: center;
	padding: auto;
	height: 100%;
}

.grid-one-third {
	width: 32.66%;
	margin: 0.5%;
}
</style>
