<template>
  <div class="container">
    <div>
      <Logo />
      <h3 class="title">桃園市地政智慧管控系統</h3>
      <section class="b-card-container">
        <b-card-group deck class="mb-4">
          <lah-index-card-link :icon="['far', 'calendar-check']" to="/about_to_expire">即將逾期案件</lah-index-card-link>
          <lah-index-card-link :icon="['fas', 'scroll']" to="/expiry_of_announcement">公告期滿案件</lah-index-card-link>
          <lah-index-card-link :icon="['fas', 'user-tie']" to="/ask_for_instructions">請示未結案件</lah-index-card-link>
          <lah-index-card-link>維護中 ... </lah-index-card-link>
          <lah-index-card-link>維護中 ... </lah-index-card-link>
          <lah-index-card-link>維護中 ... </lah-index-card-link>
        </b-card-group>
        <b-card-group deck>
          <lah-index-card-link>維護中 ... </lah-index-card-link>
          <lah-index-card-link>維護中 ... </lah-index-card-link>
          <lah-index-card-link>維護中 ... </lah-index-card-link>
          <lah-index-card-link>維護中 ... </lah-index-card-link>
          <lah-index-card-link>維護中 ... </lah-index-card-link>
          <lah-index-card-link>維護中 ... </lah-index-card-link>
        </b-card-group>
      </section>
      <!--
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
      -->
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
