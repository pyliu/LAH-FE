export default ({ $axios }, inject) => {
  // all injected var can be used by this.${varname} in Vue and ${varname} in Nuxt, e.g. this.$http (Vue), $http (Nuxt)
  inject('http', $axios)
  inject('log', console.log.bind(console))
  inject('error', console.error.bind(console))
  inject('warn', console.warn.bind(console))
  inject('assert', console.assert.bind(console))
}
