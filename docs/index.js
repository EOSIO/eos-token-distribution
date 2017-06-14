var eos_sale_address_kovan  = "0x584483282cfcad032eb5ff6c03260a079ab5fbc8"
var eos_token_address_kovan = "0x3b06e4e45ccc45ee21e276462ab07e8581fcf0e6"
var eos_sale, eos_token

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
    append("app", `
      <div class="error pane">
        <h3>${error.message}</h3>
        <pre>${error.stack}</pre>
      </div>
    `)
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

onload = () => setTimeout(() => {
  if (!window.web3) {
    render("app", `
      <div>
        <div class=pane>
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
                day.received = day.createOnDay.div(day.dailyTotal).times(day.userBuys)

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

          render("app", `
            <p style="width: 80%">

              The EOS Token Sale will distributed daily over about 341
              days.  1,000,000,000 (one billion) EOS tokens will be minted
              at the start of the sale.  These tokens will be split into
              different rolling windows of availability.  The tokens
              available in a window will be split proportional to all
              contributions made during the window period.

            </p>

            For more details, please review the token sale <a
            href=https://github.com/eosio/eos-token-sale>contract source
            code</a>.

            ${web3.eth.accounts[0] ? `
              <div class=pane>
                <table style="width: 100%">
                  <thead>
                    <tr>
                      <th>Sale window</th>
                      <th>EOS for sale</th>
                      <th>Total contributions</th>
                      <th>Your contribution</th>
                      <th>EOS received</th>
                      <th>Effective price</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${days.map((day, i) => i > Number(today) ? `
                      <tr class=future>
                        <td>#${day.name}</td>
                        <td>${formatEOS(day.createOnDay)} EOS</td>
                        <td></td>
                        <td></td>
                        <td></td>
                      </tr>
                    ` : `
                      <tr ${i == Number(today) ? "class=active" : ""}>
                        <td>
                          #${day.name}
                          ${i == Number(today) ? "(open) " : ""}
                        </td>
                        <td>${formatEOS(day.createOnDay)} EOS</td>
                        <td>${formatETH(day.dailyTotal)} ETH</td>
                        <td>${formatETH(day.userBuys)} ETH</td>
                        <td>${formatEOS(day.received)} EOS</td>
                        <td>${day.dailyTotal == 0 ? "n/a" : (
                          `${day.price.toFixed(9)} ETH/EOS`
                        )}</td>
                      </tr>
                    `).join("\n")}
                  </tbody>
                </table>
              </div>
              <div class=pane>
                <table>
                  <tr>
                    <th>Ethereum account</th>
                    <td style="width: 45rem; text-align: left">
                      <code>${web3.eth.accounts[0]}</code>
                    </td>
                  </tr>
                  <tr>
                    <th>EOS public key</th>
                    <td style="text-align: left">
                      ${publicKey ? `
                        <code>${publicKey}</code>
                        <a href=# id=register-link style="float: right"
                           onclick="showPane('register'),
                                    event.preventDefault()">
                          Change your EOS key
                        </a>
                      ` : `
                        <span style="color: gray">
                          (no EOS public key registered)
                        </span>
                        <a href=# id=register-link style="float: right"
                           onclick="showPane('register'),
                                    event.preventDefault()">
                          Register your EOS key
                        </a>
                      `}
                    </td>
                  </tr>
                  <tr>
                    <th>Token balances</th>
                    <td style="text-align: left">
                      ${formatETH(eth_balance.div(WAD))} ETH
                      <a href=# id=buy-link
                         style="margin-left: 1rem; float: right"
                         onclick="showPane('buy'),
                                  event.preventDefault()">
                        Buy EOS tokens
                      </a>
                    </td>
                  </tr>
                  ${unclaimed.equals(0) ? "" : `
                    <tr>
                      <th></th>
                      <td style="text-align: left">
                        ${formatEOS(unclaimed)} EOS (unclaimed)
                        <span style="margin-left: 1rem; float: right">
                          <a href=# id=claim-button
                             onclick="claim(), event.preventDefault()">
                            Claim EOS tokens
                          </a>
                          <span id=claim-progress class=hidden>
                            Claiming tokens...
                          </span>
                        </span>
                      </td>
                    </tr>
                  `}
                  ${eos_balance.equals(0) ? "" : `
                    <tr>
                      <th></th>
                      <td style="text-align: left">
                        ${formatEOS(eos_balance.div(WAD))} EOS
                        <a href=# id=transfer-link
                           style="margin-left: 1rem; float: right"
                           onclick="showPane('transfer'),
                                    event.preventDefault()">
                          Transfer EOS tokens
                        </a>
                      </td>
                    </tr>
                  `}
                </table>
              </div>
              <form class="hidden pane" id=register-pane
                    onsubmit="register(), event.preventDefault()">
                <h3>${publicKey ? "Change" : "Register"} EOS public key</h3>
                <table>
                  <tr>
                    <th>Public key</th>
                    <td style="text-align: left">
                      <input value=${escape(publicKey)}
                             id=register-input required
                             style="width: 30em">
                      <span style="margin-left: 1rem">
                        <button id=register-button>
                          ${publicKey ? "Change" : "Register"} key
                        </button>
                        <span id=register-progress class=hidden>
                          Registering key...
                        </span>
                      </span>
                    </td>
                  </tr>
                </table>
              </form>
              <form class="hidden pane" id=buy-pane
                    onsubmit="buy(), event.preventDefault()">
                <h3>Buy EOS tokens &mdash; sale window #${today}</h3>
                <table>
                  <tr>
                    <th>Timeframe</th>
                    <td style="text-align: left">
                      ${days[Number(today)].begins ? `started ${days[today].begins.fromNow()}, ` : ""}
                      ends ${days[Number(today)].ends.fromNow()}
                    </td>
                  </tr>
                  <tr>
                    <th>Tokens for sale</th>
                    <td style="text-align: left">
                      ${formatEOS(days[Number(today)].createOnDay)} EOS
                    </td>
                  </tr>
                  <tr>
                    <th>Total contributions</th>
                    <td style="text-align: left">
                      ${formatETH(days[Number(today)].dailyTotal)} ETH
                    </td>
                  </tr>
                  <tr>
                    <th>Your contribution</th>
                    <td style="text-align: left">
                      ${formatWad(days[Number(today)].userBuys)} ETH
                    </td>
                  </tr>
                  <tr>
                    <th>Effective price</th>
                    <td style="text-align: left">
                      ${days[Number(today)].price.toFixed(9)} ETH/EOS
                    </td>
                  </tr>
                  <tr>
                    <th>Add contribution</th>
                    <td style="text-align: left">
                      <input type=text required id=buy-input
                             placeholder=${formatETH(eth_balance.div(WAD))}>
                      ETH
                      <span style="margin-left: 1.5rem">
                        <button id=buy-button>
                          Buy EOS tokens
                        </button>
                        <span id=buy-progress class=hidden>
                          Sending ETH...
                        </span>
                      </span>
                    </td>
                  </tr>
                </table>
              </form>
              <form class="hidden pane" id=transfer-pane
                    onsubmit="transfer(), event.preventDefault()">
                <h3>Transfer EOS tokens to another Ethereum account</h3>
                <table>
                  <tr>
                    <th>Recipient account</th>
                    <td style="text-align: left">
                      <input placeholder=0x0123456789abcdef0123456789abcdef01234567
                             id=transfer-address-input required
                             style="width: 100%">
                    </td>
                  </tr>
                  <tr>
                    <th>Transfer amount</th>
                    <td style="text-align: left">
                      <input placeholder=${formatEOS(eos_balance.div(WAD))}
                             id=transfer-amount-input required
                             style="width: 15em">
                      EOS
                      <span style="margin-left: 1rem">
                        <button id=transfer-button >
                          Transfer EOS tokens
                        </button>
                        <span id=transfer-progress class=hidden>
                          Transferring tokens...
                        </span>
                      </span>
                    </td>
                  </tr>
                </table>
              </form>

            ` : `
              <div class=pane>
                <h3>Ethereum account not found</h3>

                It looks like an Ethereum client is available in your
                browser, but I couldn&rsquo;t find any accounts.
                If you&rsquo;re using MetaMask, you may need to unlock
                your account. You can also try disabling and re-enabling
                the MetaMask plugin by going to <a
                href=chrome://extensions>chrome://extensions</a>.

              </div>
            `}
          `)
        }))
      }))
    }))
  }
}, 500)

function buy() {
  byId("buy-button").classList.add("hidden")
  byId("buy-progress").classList.remove("hidden")
  var wad = getValue("buy-input")
  eos_sale.buy({ value: web3.toWei(wad) }, hopefully(result => {
    setTimeout(() => location.reload(), 10000)
  }))
}

function claim() {
  byId("claim-button").classList.add("hidden")
  byId("claim-progress").classList.remove("hidden")
  eos_sale.claimAll(web3.eth.accounts[0], hopefully(result => {
    setTimeout(() => location.reload(), 10000)
  }))
}

function transfer() {
  byId("transfer-button").classList.add("hidden")
  byId("transfer-progress").classList.remove("hidden")
  var guy = getValue("transfer-address-input")
  var wad = getValue("transfer-amount-input") * WAD
  eos_token.transfer(guy, wad, hopefully(result => {
    setTimeout(() => location.reload(), 10000)
  }))
}

function register() {
  byId("register-button").classList.add("hidden")
  byId("register-progress").classList.remove("hidden")
  var key = getValue("register-input")
  eos_sale.register(web3.fromAscii(key), hopefully(result => {
    setTimeout(() => location.reload(), 10000)
  }))
}
