<template>
  <div v-cloak>
    <lah-header>
      <lah-transition appear>
        <div class="d-flex justify-content-between w-100">
          <div class="d-flex">
            <div class="my-auto">錯誤訊息</div>
          </div>
          <div></div>
        </div>
      </lah-transition>
    </lah-header>
    <b-container fluid v-cloak>
      <div class="text-center">
        <div class="box">
          <i class="fas fa-exclamation-circle fa2"></i>
          <div class="text">
            <i class="fas fa-quote-right fa1"></i>
            <div>
              <h4 v-html="message"/>
            </div>
          </div>
        </div>
      </div>
    </b-container>
  </div>
</template>

<script>
export default {
  head: {
    title: '發生錯誤-桃園市地政局'
  },
  asyncData ({ store, redirect, error}) {
    if (store.getters.lastMessage === '' && error.message === undefined) {
      redirect('/')
    }
  },
  computed: {
    message () {
      return this.lastMessage || error.message
    }
  }
}
</script>

<style lang="scss" scoped>
* {
  -webkit-box-sizing: border-box;
  -moz-box-sizing: border-box;
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

.box {
  background-color: transparent;
  border-radius: 3px;
  color: #FFF;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 65vh;
  height: 50vh;
  transform-style: preserve-3d;
  perspective: 2000px;
  transition: .4s;
  text-align: center;
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: transparent;
    border-top: 20px solid rgb(56, 58, 223);
    border-left: 20px solid rgb(56, 58, 223);
    box-sizing: border-box;
  }
  &:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-bottom: 20px solid rgb(56, 58, 223);
    border-right: 20px solid rgb(56, 58, 223);
    box-sizing: border-box;
  }
  .fas {
    font-size: 25px;
    height: 50px;
    width: 50px;
    line-height: 50px !important;
    background-color: rgb(56, 58, 223);
    // color: #2C3A47;
    color: #FFF;
  }
  .fa2 {
    position: absolute;
    bottom: 0;
    right: 0;
    z-index: 1;
  }
  .text {
    position: absolute;
    top: 30px;
    left: -30px;
    width: calc(100% + 60px);
    height: calc(100% - 60px);
    background-color: #2C3A47;
    border-radius: 3px;
    transition: .4s;
    .fa1 {
      position: absolute;
      top: 0;
      left: 0;
    }
    div {
      position: absolute;
      top: 50%;
      left: 0;
      transform: translateY(-50%);
      text-align: center;
      width: 100%;
      padding: 30px 60px;
      line-height: 1.5;
      box-sizing: border-box;
      h3 {
        font-size: 30px;
        margin-bottom: 5px;
      }
      p {
        font-size: 15px;
      }
    }
  }
  &:hover {
    .text {
      transform: rotateY(20deg) skewY(-3deg)
    }
    transform: translate(-50%, -50%) rotateY(-20deg) skewY(3deg)
  }
}
</style>
