var state
let privateKeyPair = null

//var eos_sale_address_kovan  = "0xda68e806918125abe379e35c46df0e71dfbfeea8"
//var eos_token_address_kovan = "0x74b279820bdf69bed7e99fd1000df2e1983a5caf"
/*
var eos_sale_address_kovan  = "0xc75c91214a4e9c1b8f055e61d8577cd988561b47"
var eos_token_address_kovan = "0xa49047938b5a3117c22dab31c1be03973b1d2bca"
var eos_sale, eos_token

var state

var kovan = {
  name: "Kovan",
  genesis: "0xa3c565fc15c7478862d50ccd6561e3c06b24cc509bf388941c25ea985ce32cb9",
}

var chain = kovan

var WAD = 1000000000000000000

var hopefully = $ => (error, result) => {
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


*/
// onload = () => setTimeout(() => {
  /*if (!window.web3) {
    byId("app").innerHTML = `
      <div>
        <div class="pane before-error">
          <h2>Could not connect to Ethereum</h2>
          <p>

            Consider installing <a href=https://metamask.io>MetaMask</a>,
            <a href=#>Mist</a> or another Ethereum client.

            If you&rsquo;re using MetaMask, you may need to unlock
            your account. You can also try disabling and re-enabling
            the MetaMask plugin by going to <a
            href=chrome://extensions>chrome://extensions</a>.

          </p>

          <p>Please reload this page and try again.</p>
        </div>
      </div>
    `
  } else {
    eos_sale  = web3.eth.contract(eos_sale_abi).at(eos_sale_address_kovan)
    eos_token = web3.eth.contract(eos_token_abi).at(eos_token_address_kovan)

    web3.eth.getBlock(0, hopefully(block => {
      if (block.hash == chain.genesis) {
        poll()
      } else {
        lament(new Error(`Wrong blockchain; please use ${chain.name}`))
      }
    }))
  }
// }, 500)*/

/*
function refresh() {
  return new Promise((resolve, reject) => {
    web3.eth.getBlock("latest", hopefully(block => {
      var time = block.timestamp

      async.parallel(Object.assign({
        today: $ => eos_sale.dayFor(time, $),
        days: $ => eos_sale.numberOfDays($),
        startTime: $ => eos_sale.startTime($),
      }, web3.eth.accounts[0] ? {
        eth_balance: $ => web3.eth.getBalance(web3.eth.accounts[0], $),
        eos_balance: $ => eos_token.balanceOf(web3.eth.accounts[0], $),
        publicKey: $ => eos_sale.keys(web3.eth.accounts[0], $),
      } : {}), hopefully(({
        today, days, startTime,
        eth_balance, eos_balance, publicKey,
      }) => {
        var startMoment = moment(Number(startTime) * 1000)

        // Entropy for generating the EOS key.  The key could be added or changed.
        byId("app").addEventListener("mousemove", entropyEvent, {capture: false, passive: true})

        if (keyChange(publicKey)) {
          // The key was just changed
          if(byId("generate-link")) {
            show("generate-link")
          }
          if(byId("register-pane")) {
            hide("register-pane")
          }
        }

        async.map(iota(Number(days) + 1), (i, $) => {
          var day = { id: i }
          eos_sale.createOnDay(day.id, hopefully(createOnDay => {
            eos_sale.dailyTotals(day.id, hopefully(dailyTotal => {
              eos_sale.userBuys(day.id, web3.eth.accounts[0], hopefully(userBuys => {
                day.name = day.id
                day.createOnDay = createOnDay.div(WAD)
                day.dailyTotal = dailyTotal.div(WAD)
                day.userBuys = userBuys.div(WAD)
                day.price = dailyTotal.div(createOnDay)
                day.received = day.dailyTotal.equals(0) ? web3.toBigNumber(0) : day.createOnDay.div(day.dailyTotal).times(day.userBuys)

                if (day.id == 0) {
                  day.ends = startMoment
                } else {
                  day.begins = startMoment.clone().add(23 * (day.id - 1), "hours")
                  day.ends = day.begins.clone().add(23, "hours")
                }

                eos_sale.claimed(day.id, web3.eth.accounts[0], hopefully(claimed => {
                  day.claimed = claimed

                  $(null, day)
                }))
              }))
            }))
          }))
        }, hopefully(days => {
          var unclaimed = days.filter((x, i) => {
            return i < Number(today) && !x.claimed
          }).reduce((a, x) => x.received.plus(a), web3.toBigNumber(0))

          resolve(update({
            time, days, unclaimed, today, eth_balance, eos_balance, publicKey,
            ...(state ? { } : { buyWindow: today }),
          }))
        }))
      }))
    }))
  })
}*/

var render = ({
  time, days, unclaimed, today,
  eth_balance, eos_balance, publicKey, buyWindow,
}) => <div>
  <p style={{ width: "95%" }}>

    This will generate a private and public key pair for the EOS chain. The code is not mine.
    It is forked from the code the EOS team built. The difference is that this works in any browser without the web3 dependency.
    It will work in any browser and you don't need any plugins.

  </p>
  Source code can be reviewed here: <a href="https://github.com/Nadejde/eos-token-sale">https://github.com/Nadejde/eos-token-sale</a>.

  <div>
    <div className="pane">
      <table><tbody>
        <tr>
          <th>EOS public key</th>
          <td style={{ textAlign: "left" }}>
            <span>
              <a href="#" id="generate-link" style={{ float: "right" }}
                 onClick={event => (generate(), event.preventDefault())}>
                Generate EOS key
              </a>
            </span>
          </td>
        </tr>
      </tbody></table>
    </div>
    <div className="hidden pane" id="generate-pane">
      <span id="generate-progress">
        Generating key...
      </span>
      <div id="generate-confirm" className="hidden">
        <h3>{publicKey ? "Change" : "Register"} EOS key</h3>

        {publicKey ? <p>This will replace your EOS claim key:
          <table>
            <tbody>
              <tr>
                <th>Public key</th>
                <td style={{textAlign: 'left'}}>
                  <span style={{width: '30em'}}>{publicKey}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </p> : <span></span>}

        <p>Please back up the private key displayed below in multiple
        safe locations before continuing.  You should make more than
        one copy and keep all copies in separate secure locations.
        If you use an external storage device such as a USB stick,
        make sure to safely eject the device before continuing.</p>

        <table>
          <tbody>
            <tr>
              <th>Description</th>
              <td style={{ textAlign: "left" }}>
                EOS Token Sale Claim Key
              </td>
            </tr>
            <tr>
              <th>Public key</th>
              <td style={{textAlign: 'left'}}>
                <code id="generate-pubkey" style={{ width: "30em" }}></code>
              </td>
            </tr>
            <tr>
              <th>Private key</th>
              <td style={{ textAlign: "left" }}>
                <code id="generate-privkey" style={{ width: "30em" }}></code>
              </td>
            </tr>

          </tbody>
        </table>

        <p>

          There is no way to recover your private key.  You must save
          it right now or you will be unable to access your EOS tokens
          when the sale ends.

        </p>
      </div>
    </div>
  </div>
</div>

state = Object.assign({}, state, 0)
ReactDOM.render(render(state), byId("app"))

function generate() {
    showPane('generate')

    setTimeout(() => {
        privateKeyPair = genKeyPair()
        hide("generate-progress")
        byId("generate-pubkey").innerHTML = privateKeyPair.pubkey
        byId("generate-privkey").innerHTML = privateKeyPair.privkey
        show("generate-confirm")
    })
}

function genKeyPair() {
    var {PrivateKey} = eos_ecc
    var d = PrivateKey.randomKey()
    var privkey = d.toWif()
    var pubkey = d.toPublic().toString()
    return {pubkey, privkey}
}

function showPane(name) {
    hidePanes()
    show(`${name}-pane`)
    hide(`${name}-link`)
}

function hidePanes() {
    for (var x of "generate transfer buy register".split(" ")) {
        try {
            show(`${x}-link`)
            hide(`${x}-pane`)
        } catch (error) {}
    }
}

/*
function buy() {
  byId("buy-button").classList.add("hidden")
  byId("buy-progress").classList.remove("hidden")
  var amount = getValue("buy-input").replace(/,/g, "")
  eos_sale.buyWithLimit(state.buyWindow, 0, {
    value: web3.toWei(amount)
  }, hopefully(result =>
    ping(result).then(() => {
      hidePanes()
      byId("buy-input").value = ""
      byId("buy-button").classList.remove("hidden")
      byId("buy-progress").classList.add("hidden")
    })
  ))
}

function claim() {
  byId("claim-button").classList.add("hidden")
  byId("claim-progress").classList.remove("hidden")
  eos_sale.claimAll({
    gas: 2000000,
  }, hopefully(result => ping(result).then(() => {
    byId("claim-button").classList.remove("hidden")
    byId("claim-progress").classList.add("hidden")
  })))
}

function transfer() {
  byId("transfer-button").classList.add("hidden")
  byId("transfer-progress").classList.remove("hidden")
  var guy = getValue("transfer-address-input")
  var wad = getValue("transfer-amount-input").replace(/,/g, "") * WAD
  eos_token.transfer(guy, wad, hopefully(result => ping(result).then(() => {
    hidePanes()
    byId("transfer-button").classList.remove("hidden")
    byId("transfer-progress").classList.add("hidden")
  })))
}

function entropyEvent(e) {
  var {key_utils} = eos_ecc
  if(e.type === 'mousemove')
      key_utils.addEntropy(e.pageX, e.pageY, e.screenX, e.screenY)
  else
      console.log('onEntropyEvent Unknown', e.type, e)
}







function generateConfirm() {
  const confirmPriv = getValue("generate-confirm-input")
  if(confirmPriv !== privateKeyPair.privkey) {
    show("generate-unmatched")
    return
  }
  hide("generate-unmatched")
  hide('generate-pane')
  byId("generate-pubkey").innerHTML = null
  byId("generate-privkey").innerHTML = null
  byId("generate-confirm-input").value = null
  show('register-pane')
  register()
}

function generateCancel(e) {
  e.preventDefault()
  privateKeyPair = null
  hide('register-pane')
  show("generate-link")
  hide('generate-pane')
  hide("generate-unmatched")
  byId("generate-pubkey").innerHTML = null
  byId("generate-privkey").innerHTML = null
  byId("generate-confirm-input").value = null
}

function register() {
  const key = privateKeyPair.pubkey
  show("register-progress")
  eos_sale.register(key, {
    gas: 1000000,
  }, hopefully(result => ping(result).then(() => {
    hidePanes()
    hide("register-progress")
  })))
}

let lastPublicKey

function keyChange(pubkey) {
  const changed = (lastPublicKey != pubkey)
  lastPublicKey = pubkey
  return changed
}

function ping(tx) {
  return new Promise((resolve, reject) => {
    function f() {
      web3.eth.getTransactionReceipt(
        tx, (err, x) => x ? refresh().then(() => resolve(x))
          : setTimeout(f, 1000))
    }
    f()
  })
}

var loaded

setTimeout(() => loaded || location.reload(), 20000)

function poll() {
  refresh().then(() => (loaded = true, setTimeout(poll, 10000)))
}

function update(x) {
  state = Object.assign({}, state, x)
  ReactDOM.render(render(state), byId("app"))
}
*/