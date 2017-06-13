function repeat(x, n) {
  return new Array(n + 1).join("x")
}

function iota(n) {
  return repeat("x", n).split("").map((_, i) => i)
}

function render(id, html) {
  document.getElementById(id).innerHTML = html
}

function getValue(id) {
  return document.getElementById(id).value
}

function formatWad(wad) {
  return String(wad).replace(/\..*/, "")
}