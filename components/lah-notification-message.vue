<template lang="pug">
  .d-flex.my-1.justify-content-center
    p.msg-item(v-html="message")
    //- timestamp for the message
    .time.s-60.mx-1.text-muted
      b-icon(icon="arrow-return-left" flip-v)
      div {{ messageTime }}
</template>

<script>
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import isEmpty from 'lodash/isEmpty'

export default {
  props: {
    dataJson: { type: Object, required: true }
  },
  data: () => ({}),
  computed: {
    messageTime () {
      return this.$utils.empty(this.dataJson.create_datetime) ? '' : this.dataJson.create_datetime.split(' ')[1]
    },
    message () {
      if (isEmpty(this.dataJson.content)) {
        return ''
      }
      return DOMPurify?.sanitize(marked.parse(this.dataJson.content.replaceAll('\n', '  \n')))
    }
  },
  methods: {}
}
</script>

<style lang="scss" scoped>
.msg-item {
  position: relative;
  overflow: hidden;
  background: #e6e9e9;
  min-width: 250px;

  display: inline-block;
  border-radius: 15px;
  color: rgb(10, 10, 10);
  padding: 10px;
  max-width: 350px;
  text-align: left;
  box-sizing: border-box;
  margin-bottom: 0rem !important;
}
.time {
  display: inline-block;
  align-self: flex-end;
  svg {
    cursor: pointer;
  }
}
</style>
