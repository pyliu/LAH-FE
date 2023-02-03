export default function ({
  store,
  redirect
}) {
  const userinfo = store.getters.user
  const authority = store.getters.authority
  // not admin/inf => redirect to '/login'
  if (!authority.isAdmin && !userinfo.unit !== '資訊課') {
    return redirect('/login')
  }
}
