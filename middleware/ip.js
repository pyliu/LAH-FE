export default (ctx) => {
  if (process.server) {
    const ip = ctx.req.connection.remoteAddress || ctx.req.socket.remoteAddress
    ctx.store.commit('ip', ip)
    console.log(ip, 'server')
  }
  if (process.client) {
    // $store.commit('ip', store.getters.ip)
    console.log(`client`, store.getters.ip)
  }
}
