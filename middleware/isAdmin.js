export default function ({
  store,
  redirect
}) {
  // const userinfo = store.getters.user
  // not inf unit => redirect to '/'
  // if (!userinfo.unit !== '資訊課') {
  //   return redirect('/')
  // }
  const authority = store.getters.authority
  // not admin/super => redirect to '/login'
  if (!authority.isAdmin) {
    return redirect('/login')
  }
}
