<template lang="pug">
.chat-board(v-html="json.content")
</template>

<script>
/** */
export default {
  props: {
    json: {
      type: Object,
      default: () => ({
        content: 'message body',
        create_datetime: '2022-03-29 14:55:30',
        expire_datetime: '',
        flag: 0,
        from_ip: '192.168.xxx.xxx',
        id: 0,
        priority: 3,
        sender: 'HAXXXXXXXX',
        title: 'title'
      })
    }
  },
  data: () => ({ })
}
</script>

<style lang="scss">
.chat-board {
  img {
    max-width: 99%;
  }
}
</style>
