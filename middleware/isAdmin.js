export default function ({
  store,
  redirect
}) {
  const authority = store.state.config.authority
  // if the user is not admin
  if (!authority.isAdmin && !authority.isSuper) {
    return redirect('/')
  }
}
