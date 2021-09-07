export default function ({
  store,
  redirect
}) {
  const authority = store.getters.authority
  // not admin/ => redirect to '/login'
  if (!authority.isAdmin && !authority.isNotifyMgtStaff) {
    return redirect('/notification/help')
  }
}
