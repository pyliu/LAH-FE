<template lang="pug">
lah-transition: span.lah-wrapper(
  v-if="!hide",
  :class="className",
  v-cloak
)
  span(v-html="message")
  lah-fa-icon.ml-1(
    v-if="closeMark && !$utils.empty(message)",
    icon="circle-xmark",
    size="sm",
    role="button",
    title="關閉訊息",
    :class="xmarkClassName",
    :variant="closeVariant",
    @click="close"
  )
</template>

<script>
export default {
  emit: ['open', 'hide', 'changed'],
  component: {},
  props: {
    message: { type: String, default: '' },
    shadow: { type: Boolean, default: false },
    border: { type: Boolean, default: false },
    borderVariant: { type: String, default: '' },
    autoHide: { type: Boolean, default: false },
    autoHideTime: { type: String, default: '10000' },
    closeMark: { type: Boolean, default: true },
    closeVariant: { type: String, default: 'secondary' },
    size: { type: String, default: '' },
    variant: { type: String, default: '' },
    pill: { type: Boolean, default: false },
    pos: { type: String, default: '' }
  },
  data: () => ({
    hide: false
  }),
  computed: {
    className () {
      let list = [`text-${this.variant}`]
      switch (this.size) {
        case 'sm':
          list.push('h6')
          break
        case 'md':
          list.push('h5')
          break
        case 'lg':
          list.push('h4')
          break
        case 'xl':
          list.push('h3')
          break
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          list.push(this.size)
          break
        default:
          break
      }
      switch (this.pos) {
        case 'center':
        case 'c':
          list.push('lah-pos-center')
          break
        case 'top':
        case 't':
          list.push('lah-pos-top')
          break
        case 'top-right':
        case 'tr':
          list.push('lah-pos-top-right')
          break
        case 'top-left':
        case 'tl':
          list.push('lah-pos-top-left')
          break
        case 'bottom':
        case 'b':
          list.push('lah-pos-bottom')
          break
        case 'bottom-right':
        case 'br':
          list.push('lah-pos-bottom-right')
          break
        case 'bottom-left':
        case 'bl':
          list.push('lah-pos-bottom-left')
          break
        default:
          break
      }
      if (this.shadow) {
        list.push('shadow')
      }
      if (this.border) {
        list = [
          ...list,
          ...['border', 'rounded', `p-${this.pill ? 5 : 3}`, `border-${this.borderVariant}`]
        ]
      }
      if (this.pill) {
        list.push('rounded-pill')
      }
      return list
    },
    xmarkClassName () {
      const list = []
      if (this.border) {
        list.push('lah-xmark')
      }
      return list
    },
    autoHideTimeInt () {
      return parseInt(this.autoHideTime)
    }
  },
  watch: {
    message (val) {
      this.hide = false
      this.$emit('changed', val)
      if (this.autoHide) {
        this.debounceHide()
      }
    },
    hide (val) {
      this.$emit(val ? 'close' : 'open', this.message)
    }
  },
  created () {
    this.debounceHide = this.$utils.debounce(() => { this.hide = true }, this.autoHideTime)
    this.debounceOpen = this.$utils.debounce(() => { this.hide = false }, 600)
  },
  mounted () {
    if (this.autoHide) {
      this.debounceHide()
    }
  },
  methods: {
    open () {
      this.debounceOpen()
    },
    close () {
      this.hide = true
    }
  }
}
</script>

<style lang="scss" scoped>
.lah-wrapper {
  position: relative;
  display: inline-block;
}
.lah-xmark {
  position: absolute;
  top: .25rem;
  right: 0;
  cursor: pointer;
  // transform: translate(50%, -50%);
}
@mixin posBase() {
  z-index: 9999;
  position: fixed;
  max-width: 90vw;
  max-height: 90vw;
  // set the transform to the negative half of the div's relative width and height.
  transform: translate(-50%, -50%);
  background-color: white;
}
.lah-pos-center {
  @include posBase();
  left: 50%;
  top: 50%;
}
.lah-pos-top {
  @include posBase();
  left: 50%;
  top: 15%;
}
.lah-pos-bottom {
  @include posBase();
  left: 50%;
  top: 85%;
}
.lah-pos-top-right {
  @include posBase();
  width: 30vw;
  max-height: 25vw;
  overflow: auto;
  right: -12.5%;
  top: 20%;
}
.lah-pos-top-left {
  @include posBase();
  width: 30vw;
  max-height: 25vw;
  overflow: auto;
  left: 17.5%;
  top: 20%;
}
.lah-pos-bottom-right {
  @include posBase();
  width: 30vw;
  max-height: 25vw;
  overflow: auto;
  right: -12.5%;
  bottom: -15%;
}
.lah-pos-bottom-left {
  @include posBase();
  width: 30vw;
  max-height: 25vw;
  overflow: auto;
  left: 17.5%;
  bottom: -15%;
}
</style>
