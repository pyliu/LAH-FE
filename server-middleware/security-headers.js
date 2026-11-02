/**
 * 資安加固中介軟體：移除 HTTP 回應標頭中的伺服器技術棧特徵指紋 (X-Powered-By 等)
 */
module.exports = function (req, res, next) {
  if (res && typeof res.removeHeader === 'function') {
    res.removeHeader('x-powered-by')
    res.removeHeader('X-Powered-By')
  }
  next()
}
