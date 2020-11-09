<template>
  <div class="container">
    <div>
      <Logo />
      <h3 class="title">桃園市地政智慧管控系統</h3>
      <div class="mt-2 grids">
        <div class="grid-6col-2row"><NuxtLink to="/about_to_expire">即將逾期案件</NuxtLink></div>
        <div class="grid-6col-2row"><NuxtLink to="/expiry_of_announcement">公告期滿案件</NuxtLink></div>
        <div class="grid-6col-2row"><NuxtLink to="/ask_for_instructions">請示未結案件</NuxtLink></div>
        <div class="grid-6col-2row"><NuxtLink to="/">...</NuxtLink></div>
        <div class="grid-6col-2row"><NuxtLink to="/">...</NuxtLink></div>
        <div class="grid-6col-2row"><NuxtLink to="/">...</NuxtLink></div>
        <div class="grid-6col-2row"><NuxtLink to="/">...</NuxtLink></div>
        <div class="grid-6col-2row"><NuxtLink to="/">...</NuxtLink></div>
        <div class="grid-6col-2row"><NuxtLink to="/">...</NuxtLink></div>
        <div class="grid-6col-2row"><NuxtLink to="/">...</NuxtLink></div>
        <div class="grid-6col-2row"><NuxtLink to="/">...</NuxtLink></div>
        <div class="grid-6col-2row"><NuxtLink to="/">...</NuxtLink></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  methods: {
    test () { this.notify(this.uuid()) }
  }
}
</script>

<style>
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
}

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
