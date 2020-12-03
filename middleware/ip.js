export default ({
  req,
  store,
  $localForage
}) => {
  if (process.server) {
    const ip = req.connection.remoteAddress || req.socket.remoteAddress
    store.commit('ip', ip)
    console.log(ip)
  }
  if (process.client) {
    $localForage.setItem('ip', store.getters.ip).then((value) => {
      // Do other things once the value has been saved.
    }).catch((err) => {
      // This code runs if there were any errors
      console.error(err)
    })
  }
}
