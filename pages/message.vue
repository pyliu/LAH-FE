<template>
  <div />
</template>

<script>
export default {
  middleware: [
    ({ redirect }) => redirect(301, '/notification/message')
  ]
}
</script>
