<template>
  <div class="container">
    <div>
      <Logo />
      <h3 class="title">
        桃園市地政業務小幫手
      </h3>
      <div class="links">
        
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
  margin: 0 auto;
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

.links {
  padding-top: 15px;
}
</style>
