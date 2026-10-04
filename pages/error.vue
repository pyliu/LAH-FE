<template lang="pug">
div(v-cloak)
  lah-error-view(
    :error="error"
    :from-path="fromPath"
  )
</template>

<script>
import isEmpty from 'lodash/isEmpty'
import LahErrorView from '~/components/lah-error-view.vue'

export default {
  components: { LahErrorView },
  asyncData ({ store, redirect, error, query, from }) {
    const lastMsg = store.getters.lastMessage
    const errMessage = (error && typeof error === 'object' && error.message) || ''
    const qMsg = (query && (query.message || query.msg)) || ''
    const qCode = (query && (query.code || query.statusCode || query.status)) || ''

    if (isEmpty(lastMsg) && isEmpty(errMessage) && isEmpty(qMsg) && isEmpty(qCode)) {
      return redirect('/')
    }

    const statusCode = parseInt(qCode) || (error && error.statusCode) || 499
    const errObj = {
      statusCode,
      message: qMsg || errMessage || lastMsg || '發生未預期的系統問題',
      stack: (error && error.stack) || ''
    }
    const fromPath = (query && query.from) || (from ? from.fullPath : '') || ''

    return {
      error: errObj,
      fromPath
    }
  },
  head () {
    return {
      title: `${this.error?.statusCode || 500} 錯誤訊息 - 桃園市地政局`
    }
  }
}
</script>
