export default function ({
  store,
  redirect
}) {
  const authority = store.getters.authority
  // not admin/super => redirect to '/login'
  if (!authority.isAdmin && !authority.isSuper) {
    return redirect('/login')
  }
}
