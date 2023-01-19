export default function ({
  store,
  redirect
}) {
  const userinfo = store.getters.user
  // not inf unit => redirect to '/'
  if (!userinfo.unit !== '資訊課') {
    return redirect('/')
  }
}
