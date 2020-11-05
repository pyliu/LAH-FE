<template>
  <div class="container">
    <div>
      <Logo />
      <h1 class="title">
        桃園地政業務小幫手
      </h1>
      <div class="links">
        <a
          href="http://220.1.35.84/"
          target="_blank"
          rel="noopener noreferrer"
          class="button--green"
        >
          之前版本
        </a>
        <a
          href="https://github.com/pyliu/LAH-NUXTJS"
          target="_blank"
          rel="noopener noreferrer"
          class="button--grey"
        >
          原始碼
        </a>
      </div>
    </div>
  </div>
</template>

<script>
export default {}
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
  font-family:
    'Quicksand',
    'Source Sans Pro',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    Arial,
    sans-serif;
  display: block;
  font-weight: 300;
  font-size: 100px;
  color: #35495e;
  letter-spacing: 1px;
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
