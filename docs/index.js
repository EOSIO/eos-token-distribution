var eos_sale_address_kovan  = "0x80dd33ac64789251432511161f1869657e6b1173"
var eos_token_address_kovan = "0x2b011999cc166f56c467e07898e718519090cc4f"
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

function showPane(name) {
  for (var x of "transfer buy register".split(" ")) {
    try {
      show(`${x}-link`)
      hide(`${x}-pane`)
    } catch (error) {}
  }

  show(`${name}-pane`)
  hide(`${name}-link`)
}

function hidePanes() {
  for (var x of "transfer buy register".split(" ")) {
    try {
      show(`${x}-link`)
      hide(`${x}-pane`)
    } catch (error) {}
  }
}

onload = () => setTimeout(() => {
  if (!window.web3) {
    render("app", `
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

          <p>Please reload this page and try again. </p>
        </div>
      </div>
    `)
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
}, 500)

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

        if (publicKey.length > 42) {
          publicKey = web3.toAscii(publicKey)
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
}

function render({
  time, days, unclaimed, today, eth_balance, eos_balance, publicKey, buyWindow,
}) {
  return <div>
            <p style={{ width: "80%" }}>

              The EOS Token Sale will distributed daily over about 341
              days.  1,000,000,000 (one billion) EOS tokens will be minted
              at the start of the sale.  These tokens will be split into
              different rolling windows of availability.  The tokens
              available in a window will be split proportional to all
              contributions made during the window period.

            </p>

            For more details, please review the token sale <a
            href="https://github.com/eosio/eos-token-sale">contract source
            code</a>.

            <span style={{ position: "absolute", top: "1.5rem", left: "15rem", padding: "1rem 2rem", color: "gray" }}>
              <b style={{ marginRight: ".2rem" }}>Last updated: </b>
              {moment(time * 1000).format("LTS")}
            </span>

            {web3.eth.accounts[0] ? <div>
              <div className="pane">
                <table><tbody>
                  <tr>
                    <th>Ethereum account</th>
                    <td style={{ width: "45rem", textAlign: "left" }}>
                      <code>{web3.eth.accounts[0]}</code>
                    </td>
                  </tr>
                  <tr>
                    <th>EOS public key</th>
                    <td style={{ textAlign: "left" }}>
                      {publicKey ? <span>
                        <code>{publicKey}</code>
                        <a href="#" id="register-link" style={{ float: "right" }}
                           onClick={event => (event.preventDefault(), showPane('register'))}>
                          Change your EOS key
                        </a>
                      </span> : <span>
                        <span style={{ color: "gray" }}>
                          (no EOS public key registered)
                        </span>
                        <a href="#" id="register-link" style={{ float: "right" }}
                           onClick={event => (event.preventDefault(), showPane('register'))}>
                          Register your EOS key
                        </a>
                      </span>}
                    </td>
                  </tr>
                  <tr>
                    <th>Token balances</th>
                    <td style={{ textAlign: "left" }}>
                      {formatETH(eth_balance.div(WAD))} ETH
                      <a href="#" id="buy-link"
                         style={{ marginLeft: "1rem", float: "right" }}
                         onClick={event => (event.preventDefault(), showPane('buy'))}>
                        Buy EOS tokens
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <th></th>
                    <td style={{ textAlign: "left" }}>
                      {formatEOS(unclaimed)} EOS (unclaimed)
                      <span style={{ marginLeft: "1rem", float: "right" }}>
                        <button id="claim-button" disabled={unclaimed.equals(0)}
                                onClick={event => (event.preventDefault(), claim())}>
                          Claim EOS tokens
                        </button>
                        <span id="claim-progress" className="hidden">
                          Claiming tokens...
                        </span>
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <th></th>
                    <td style={{ textAlign: "left" }}>
                      {formatEOS(eos_balance.div(WAD))} EOS
                      <a href="#" id="transfer-link"
                         style={{ marginLeft: "1rem", float: "right" }}
                         onClick={event => (event.preventDefault(), showPane('transfer'))}>
                        Transfer EOS tokens
                      </a>
                    </td>
                  </tr>
                </tbody></table>
              </div>
              <form className="hidden pane" id="register-pane"
                    onSubmit={event => (event.preventDefault(), register())}>
                <h3>{publicKey ? "Change" : "Register"} EOS public key</h3>
                <table><tbody>
                  <tr>
                    <th>Public key</th>
                    <td style={{ textAlign: "left" }}>
                      <input //defaultValue={escape(publicKey)}
                             id="register-input" required
                             minLength={33} maxLength={33}
                             style={{ width: "30em", fontFamily: "monospace" }}/>
                      <span style={{ marginLeft: "1rem" }}>
                        <button id="register-button">
                          {publicKey ? "Change" : "Register"} key
                        </button>
                        <span id="register-progress" className="hidden">
                          Registering key...
                        </span>
                      </span>
                    </td>
                  </tr>
                </tbody></table>
              </form>
              <form className="hidden pane" id="buy-pane"
                    onSubmit={event => (event.preventDefault(), buy())}>
                <h3>Buy EOS tokens</h3>
                <table><tbody>
                  <tr>
                    <th>Sale window</th>
                    <td style={{ textAlign: "left" }}>
                      <select id="sale-window" value={buyWindow} onChange={e => update({ buyWindow: e.target.value })}>
                        {days.map((d, i) => <option key={i} value={i}>Window #{i}</option>)}
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <th>Closes</th>
                    <td style={{ textAlign: "left" }}>
                      {days[buyWindow].ends.fromNow()}
                    </td>
                  </tr>
                  <tr>
                    <th>EOS for sale</th>
                    <td style={{ textAlign: "left" }}>
                      {formatEOS(days[buyWindow].createOnDay)} EOS
                    </td>
                  </tr>
                  <tr>
                    <th>Total ETH</th>
                    <td style={{ textAlign: "left" }}>
                      {formatETH(days[buyWindow].dailyTotal)} ETH
                    </td>
                  </tr>
                  <tr>
                    <th>Your ETH</th>
                    <td style={{ textAlign: "left" }}>
                      {formatETH(days[buyWindow].userBuys)} ETH
                    </td>
                  </tr>
                  <tr>
                    <th>Effective price</th>
                    <td style={{ textAlign: "left" }}>
                      {days[buyWindow].price.toFormat(9)} ETH/EOS
                    </td>
                  </tr>
                  <tr>
                    <th>Send ETH</th>
                    <td style={{ textAlign: "left" }}>
                      <input type="text" required id="buy-input"
                             placeholder={formatETH(eth_balance.div(WAD))}/>
                      {" ETH"}
                      <span style={{ marginLeft: "1.5rem" }}>
                        <button id="buy-button">
                          Send ETH
                        </button>
                        <span id="buy-progress" className="hidden">
                          Sending ETH...
                        </span>
                      </span>
                    </td>
                  </tr>
                </tbody></table>
              </form>
              <form className="hidden pane before-error" id="transfer-pane"
                    onSubmit={event => (event.preventDefault(), transfer())}>
                <h3>Transfer EOS tokens to another Ethereum account</h3>
                <table><tbody>
                  <tr>
                    <th>Recipient account</th>
                    <td style={{ textAlign: "left" }}>
                      <input placeholder="0x0123456789abcdef0123456789abcdef01234567"
                             id="transfer-address-input" required
                             minLength={42} maxLength={42}
                             style={{ width: "100%" }}/>
                    </td>
                  </tr>
                  <tr>
                    <th>Transfer amount</th>
                    <td style={{ textAlign: "left" }}>
                      <input placeholder={formatEOS(eos_balance.div(WAD))}
                             id="transfer-amount-input" required
                             style={{ width: "15em" }}/>
                      {" EOS"}
                      <span style={{ marginLeft: "1rem" }}>
                        <button id="transfer-button">
                          Transfer EOS tokens
                        </button>
                        <span id="transfer-progress" className="hidden">
                          Transferring tokens...
                        </span>
                      </span>
                    </td>
                  </tr>
                </tbody></table>
              </form>
              <div className="pane">
                <table style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th>Window</th>
                      <th>EOS for sale</th>
                      <th>Total ETH</th>
                      <th>Effective price</th>
                      <th>Closes</th>
                      <th>Your ETH</th>
                      <th>Your EOS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {days.map((day, i) =>
                      <tr key={i} className={i == Number(today) ? "active" : ""}>
                        <td>
                          #{day.name}
                          {i == Number(today) ? "" : ""}
                        </td>
                        <td>{formatEOS(day.createOnDay)} EOS</td>
                        <td>{formatETH(day.dailyTotal)} ETH</td>
                        <td>{day.dailyTotal == 0 ? "n/a" : (
                          `${day.price.toFormat(9)} ETH/EOS`
                        )}</td>
                        <td>{day.ends.fromNow()}</td>
                        <td>{formatETH(day.userBuys)} ETH</td>
                        <td>
                          {formatEOS(day.received)} EOS
                          {i >= Number(today)
                            && <span title="Pending EOS subject to change if additional funds received" style={{ cursor: "pointer" }}> *</span>}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div> :
              <div className="pane before-error">
                <h3>Ethereum account not found</h3>

                It looks like an Ethereum client is available in your
                browser, but I couldn&rsquo;t find any accounts.
                If you&rsquo;re using MetaMask, you may need to unlock
                your account. You can also try disabling and re-enabling
                the MetaMask plugin by going to <a
                href="chrome://extensions">chrome://extensions</a>.

              </div>
            }
          </div>
}


function buy() {
  byId("buy-button").classList.add("hidden")
  byId("buy-progress").classList.remove("hidden")
  var wad = getValue("buy-input")
  var timestamp = Math.round(state.days[state.buyWindow].ends.unix()) - 3600
  console.log(timestamp)
  eos_sale.buyWithLimit(timestamp, 0, {
    value: web3.toWei(wad)
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
  eos_sale.claimAll(web3.eth.accounts[0], {
    gas: 2000000,
  }, hopefully(result => ping(result).then(() => {
    hidePanes()
    byId("claim-button").classList.add("hidden")
    byId("claim-progress").classList.remove("hidden")
  })))
}

function transfer() {
  byId("transfer-button").classList.add("hidden")
  byId("transfer-progress").classList.remove("hidden")
  var guy = getValue("transfer-address-input")
  var wad = getValue("transfer-amount-input") * WAD
  eos_token.transfer(guy, wad, hopefully(result => ping(result).then(() => {
    hidePanes()
    byId("transfer-button").classList.remove("hidden")
    byId("transfer-progress").classList.add("hidden")
  })))
}

function register() {
  byId("register-button").classList.add("hidden")
  byId("register-progress").classList.remove("hidden")
  var key = getValue("register-input")
  eos_sale.register(web3.fromAscii(key), {
    gas: 1000000,
  }, hopefully(result => ping(result).then(() => {
    hidePanes()
    byId("register-button").classList.remove("hidden")
    byId("register-progress").classList.add("hidden")
  })))
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
  refresh().then(() => (loaded = true, setTimeout(poll, 3000)))
}

function update(x) {
  state = { ...state, ...x }
  react("app", render(state))
}
