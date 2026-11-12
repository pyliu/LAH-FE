const assert = require('node:assert/strict')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { createRequire } = require('node:module')

const projectRoot = path.resolve(__dirname, '..')
const projectRequire = createRequire(path.join(projectRoot, 'package.json'))
const sass = projectRequire('sass')
const postcss = projectRequire('postcss')
const options = {
  loadPaths: [path.join(projectRoot, 'assets/scss'), path.join(projectRoot, 'node_modules')],
  importers: [{
    findFileUrl (url) {
      return url.startsWith('~')
        ? pathToFileURL(path.join(projectRoot, 'node_modules', url.slice(1)))
        : null
    }
  }],
  logger: sass.Logger.silent
}
assert.equal(sass.compileString('@import "variables";', options).css.trim(), '')
const compiled = sass.compile(path.join(projectRoot, 'assets/scss/main.scss'), options)
const rules = new Map()
postcss.parse(compiled.css).walkRules((rule) => {
  for (const selector of rule.selectors) {
    const declarations = rules.get(selector) || {}
    rule.walkDecls((decl) => { declarations[decl.prop] = decl.value })
    rules.set(selector, declarations)
  }
})
function get (selector) {
  assert(rules.has(selector), `找不到 ${selector}`)
  return rules.get(selector)
}
function luminance (color) {
  let channels
  if (color.startsWith('#')) {
    let hex = color.slice(1)
    if (hex.length === 3) { hex = [...hex].map(c => c + c).join('') }
    assert.equal(hex.length, 6)
    channels = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16))
  } else {
    assert.match(color, /^rgb\(/)
    channels = color.match(/[\d.]+%?/g).map(value =>
      value.endsWith('%') ? parseFloat(value) * 255 / 100 : Number(value)
    )
    assert.equal(channels.length, 3)
  }
  const linear = channels.map((c) => {
    const v = c / 255
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722
}
let checks = 0
function contrast (name, foreground, background, minimum = 4.5) {
  const a = luminance(foreground)
  const b = luminance(background)
  const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
  assert(ratio >= minimum, `${name}: ${ratio} < ${minimum}`)
  checks++
  return ratio.toFixed(2)
}
const pageBackground = get('body')['background-color']
for (const variant of ['primary', 'secondary', 'success', 'danger']) {
  const base = get(`.btn-${variant}`)
  const white = contrast(`${variant} 實心`, base.color, base['background-color'])
  const onPage = contrast(`${variant} 頁面文字`, base['background-color'], pageBackground)
  for (const state of [':hover', ':focus', ':not(:disabled):not(.disabled):active']) {
    const button = { ...base, ...get(`.btn-${variant}${state}`) }
    contrast(`${variant}${state}`, button.color, button['background-color'])
  }
  const outline = get(`.btn-outline-${variant}`)
  for (const background of ['#ffffff', pageBackground]) {
    contrast(`${variant} 外框`, outline.color, background)
  }
  for (const state of [':hover', ':not(:disabled):not(.disabled):active']) {
    const button = get(`.btn-outline-${variant}${state}`)
    contrast(`${variant} 外框${state}`, button.color, button['background-color'])
  }
  const alert = get(`.alert-${variant}`)
  contrast(`${variant} 提示`, alert.color, alert['background-color'])
  contrast(`${variant} 提示連結`, get(`.alert-${variant} .alert-link`).color, alert['background-color'])
  console.log(`${variant}: 白字／色底 ${white}:1；色字／頁面 ${onPage}:1`)
}
for (const background of ['#ffffff', pageBackground]) {
  contrast('正文', get('body').color, background)
  contrast('次要文字', get('.text-muted').color, background)
  contrast('表單邊框', get('.form-control').border.split(' ').pop(), background, 3)
  contrast('焦點外框', get('.btn-primary')['background-color'], background, 3)
}
assert.equal(get('body')['line-height'], '1.5')
assert.equal(get('.btn')['border-radius'], '0.375rem')
assert.equal(get('.card')['border-radius'], '0.5rem')
assert.equal(get('.modal-content')['border-radius'], '0.5rem')
assert.equal(get('html.lah-theme-clean body:not(.theme-dark) .lah-shadow').filter, 'none')
assert.equal(get(':root')['--primary'].toLowerCase(), '#1d4ed8')
for (const background of ['#121212', '#212529']) {
  for (const variant of ['primary', 'secondary', 'success', 'danger', 'muted']) {
    contrast(`深色 ${variant}`, get(`html.lah-theme-clean .dark-container.dark-mode .text-${variant}`).color, background)
  }
}
console.log(`通過：Bootstrap／BootstrapVue SCSS 編譯、${checks} 組對比、行高、圓角與陰影檢查。`)
