let WAD        = 1000000000000000000

let unhex      = data => data.replace(/^0x/, "")
let hex        = data => `0x${unhex(data)}`
let bytes4     = data => hex(unhex(data).slice(0, 8))
let sighash    = sig => bytes4(web3.sha3(sig))
let parts      = (data, n) => data.match(new RegExp(`.{${n}}`, "g")) || []
let hexparts   = (data, n) => parts(unhex(data), n).map(hex)
let words32    = data => hexparts(data, 64)
let bytes      = data => hexparts(data, 2)
let hexcat     = (...data) => hex(data.map(unhex).join(""))
let word       = data => hex(unhex(data).padStart(64, "0"))
let calldata   = (sig, ...words) => hexcat(sig, ...words.map(word))
let toAsync    = promise => $ => promise.then(x => $(null, x), $)
var byId       = id          => document.getElementById(id)
var formatWad  = wad         => String(wad).replace(/\..*/, "")
var formatEOS  = wad         => wad ? wad.toFormat(4) : "0"
var formatETH  = wad         => wad ? wad.toFormat(2) : "0"
var getValue   = id          => byId(id).value
var show       = id          => byId(id).classList.remove("hidden")
var hide       = id          => byId(id).classList.add("hidden")
var iota       = n           => repeat("x", n).split("").map((_, i) => i)
var repeat     = (x, n)      => new Array(n + 1).join("x")

let toQueryString = params => Object.keys(params).map(name => ([
  encodeURIComponent(name), encodeURIComponent(params[name]),
])).map(([name, value]) => `${name}=${value}`).join("&")

let call = params => etherscan(
  Object.assign(params, { module: "proxy", action: "eth_call" })
)

let ETHERSCAN_URL = "https://api.etherscan.io/api?"
let etherscan = async params => {
  let response = await fetch(ETHERSCAN_URL + toQueryString(params))

  if (response.ok) {
    let json = await response.json()

    if (json.error) {
      throw new Error(JSON.stringify(json.error))
    } else {
      return json.result
    }
  } else {
    throw new Error(`HTTP ${response.statusCode}`)
  }
}

let update = patch => {
  state = Object.assign({}, state, patch)
  ReactDOM.render(render(state), byId("app"))
}

let hopefully = $ => (error, result) => {
  if (error) {
    lament(error)
  } else {
    $(result)
  }
}

function lament(error) {
  if (error) {
    document.querySelector(".before-error").outerHTML += `
      <div class="error pane">
        <h3>${error.message}</h3>
        <pre>${error.stack}</pre>
      </div>
    `
  }
}

function showPane(name) {
  hidePanes()
  show(`${name}-pane`)
  disable(`${name}-link`)
}

function hidePanes() {
  for (let x of "generate transfer buy register".split(" ")) {
    try {
      enable(`${x}-link`)
      hide(`${x}-pane`)
    } catch (error) {}
  }
}

function enable(id) {
  byId(id).classList.remove("disabled");
  byId(id).parentNode.classList.remove("disabled");
}

function disable(id) {
  byId(id).classList.add("disabled");
  byId(id).parentNode.classList.add("disabled");
}
