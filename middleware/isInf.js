export default function ({
  store,
  route,
  redirect
}) {
  const userinfo = store.getters.user
  const authority = store.getters.authority
  // not admin/inf => redirect to '/login'
  if (!authority.isAdmin && userinfo?.unit !== '資訊課') {
    const redirectQuery = route?.fullPath && !route.fullPath.startsWith('/login')
      ? `?redirect=${encodeURIComponent(route.fullPath)}`
      : ''
    return redirect(`/login${redirectQuery}`)
  }
}
