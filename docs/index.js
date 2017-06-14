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

function updateBalance() {
  eos_token.balanceOf(web3.eth.accounts[0], function(error, balance) {
    render("eos-balance", `${balance.div(WAD)} EOS`)
  })
}

onload = () => setTimeout(() => {
  if (!window.web3) {
    document.body.innerHTML = `
      <h1>No web3 provider detected</h1>
      <p>Consider installing <a href=https://metamask.io>MetaMask</a>.</p>
    `
  } else {
    eos_sale  = web3.eth.contract(eos_sale_abi).at(eos_sale_address_kovan)
    eos_token = web3.eth.contract(eos_token_abi).at(eos_token_address_kovan)

    async.parallel(Object.assign({
      days: $ => eos_sale.numberOfDays($),
    }, web3.eth.accounts[0] ? {
      eth_balance: $ => web3.eth.getBalance(web3.eth.accounts[0], $),
    } : {}), hopefully(({ eth_balance, days }) => {
      async.map(iota(Number(days)), (i, $) => {
        var day = { id: i }
        eos_sale.createOnDay(day.id, hopefully(forSale => {
          eos_sale.dailyTotals(day.id, hopefully(contributions => {
            day.name = day.id + 1
            day.tokensForSale = forSale.div(WAD)
            day.contributions = contributions.div(WAD)
            day.price = contributions.div(forSale)
            $(null, day)
          }))
        }))
      }, hopefully(days => render("app", `
        <h1>EOS Token Sale</h1>

        <p>

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
            <table>
              <tr>
                <th>Ethereum account</th>
                <td><code>${web3.eth.accounts[0]}</code></td>
              </tr>
              <tr>
                <th>EOS public key</th>
                <td style="text-align: left">
                  <span style="color: gray">
                    (no EOS public key registered)
                  </span>
                  <a href=# style="margin-left: 1rem">
                    Register your EOS key
                  </a>
                </td>
              </tr>
              <tr>
                <th>Token balances</th>
                <td style="text-align: left">
                  ${eth_balance.div(WAD)} ETH
                  <a href=# id=buy-link
                     style="margin-left: 1rem; float: right"
                     onclick="show('buy-pane'), hide('buy-link')">
                    Buy EOS tokens
                  </a>
                </td>
              </tr>
              <tr>
                <th></th>
                <td style="text-align: left">
                  0.0 EOS
                  <a href=# style="margin-left: 1rem; float: right">
                    Transfer EOS tokens
                  </a>
                </td>
              </tr>
              <tr>
                <th></th>
                <td style="text-align: left">
                  0.0 EOS (unclaimed)
                  <a href=# style="margin-left: 1rem; float: right">
                    Claim EOS tokens
                  </a>
                </td>
              </tr>
            </table>
          </div>
          <div class="hidden pane" id=buy-pane>
            <table>
              <tr>
                <th>Currently active sale window</th>
                <td style="text-align: left">
                  <span style="margin-right: .5rem">#2</span>
                  (started 5 hours ago; ends in 18 hours)
                </td>
              </tr>
              <tr>
                <th>Tokens for sale in window</th>
                <td style="text-align: left">
                  ${formatWad(days[0].tokensForSale)} EOS
                </td>
              </tr>
              <tr>
                <th>Total contributions in window</th>
                <td style="text-align: left">
                  ${formatWad(days[0].contributions)} ETH
                </td>
              </tr>
              <tr>
                <th>Your contribution in window</th>
                <td style="text-align: left">
                  ${formatWad(days[0].contributions)} ETH
                </td>
              </tr>
              <tr>
                <th>Effective minimum price</th>
                <td style="text-align: left">
                  ${days[0].price.toFixed(9)} ETH/EOS
                </td>
              </tr>
              <tr>
                <th>Additional contribution</th>
                <td style="text-align: left">
                  <form>
                    <input type=text required
                           placeholder=${eth_balance.div(WAD)}>
                    ETH
                    <button style="margin-left: 1.5rem">
                      Buy EOS tokens
                    </button>
                  </form>
                </td>
              </tr>
            </table>
          </div>
        ` : `
          <div class=pane>
            <h3>Ethereum account not found</h3>

            It looks like an Ethereum client is available in your
            browser, but I couldn&rsquo;t find any accounts.
            If you&rsquo;re using MetaMask, you may need to unlock
            your account. Please reload this page and try again.

          </div>
        `}

        <table style="width: 100%; margin-bottom: 2rem">
          <thead>
            <tr>
              <th>Window</th>
              <th>Tokens for sale</th>
              <th>Total contributions</th>
              <th>Your contribution</th>
              <th>Effective price</th>
            </tr>
          </thead>
          <tbody>
            ${days.map(day => {
              return `
                <tr>
                  <td>#${day.name}</td>
                  <td>${formatWad(day.tokensForSale)} EOS</td>
                  <td>${formatWad(day.contributions)} ETH</td>
                  <td>${formatWad(day.contributions)} ETH</td>
                  <td>${day.contributions == 0 ? "n/a" : (
                    `${day.price.toFixed(9)} ETH/EOS`
                  )}</td>
                </tr>
              `
            }).join("\n")}
          </tbody>
        </table>
      `)))
    }))
  }
}, 500)

function buy() {
  var wad = getValue("buy-input")
  eos_sale.buy({ value: web3.toWei(wad) }, (error, result) => {
    console.log(error || result)
  })
}

function claim() {
  var address = getValue("claim-input")
  eos_sale.claim(address, (error, result) => {
    console.log(error || result)
  })
}

function transfer() {
  var guy = getValue("transfer-address-input")
  var wad = getValue("transfer-amount-input")
  eos_token.transfer(guy, wad, (error, result) => {
    console.log(error || result)
  })
}

function register() {
  var key = getValue("register-input")
  sale.register(key, (error, result) => {
    console.log(error || result)
  })
}
