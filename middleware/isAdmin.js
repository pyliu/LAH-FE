export default function ({
  store,
  redirect
}) {
  if (store.state.svr === null) {
    return redirect('/login')
  }
  const authority = store.state.svr.config.authority
  // not admin => redirect to '/login'
  if (!authority.isAdmin && !authority.isSuper) {
    return redirect('/login')
  }
}
