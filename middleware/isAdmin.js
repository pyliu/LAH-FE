export default function ({
  store,
  redirect
}) {
  if (store.state.svr === null) {
    return redirect('/')
  }
  const authority = store.state.svr.config.authority
  // not admin => redirect to '/'
  if (!authority.isAdmin && !authority.isSuper) {
    return redirect('/')
  }
}
