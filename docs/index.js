var eos_sale_address_kovan  = "0x584483282cfcad032eb5ff6c03260a079ab5fbc8"
var eos_token_address_kovan = "0x3b06e4e45ccc45ee21e276462ab07e8581fcf0e6"
var eos_sale, eos_token

var WAD = 1000000000000000000

function updateBalance() {
  eos_token.balanceOf(web3.eth.accounts[0], function(error, balance) {
    render("eos-balance", `${balance.div(WAD)} EOS`)
  })
}

onload = () => {
  if (!window.web3) {
    document.body.innerHTML = `
      <h1>No web3 provider detected</h1>
      <p>Consider installing <a href=https://metamask.io>MetaMask</a>.</p>
    `
  } else {
    eos_sale  = web3.eth.contract(eos_sale_abi).at(eos_sale_address_kovan)
    eos_token = web3.eth.contract(eos_token_abi).at(eos_token_address_kovan)

    eos_sale.numberOfDays((error, days) => {
      async.map(iota(Number(days)), (i, $) => {
        var day = { id: Number(i) }
        eos_sale.createOnDay(day.id, (error, forSale) => {
          eos_sale.dailyTotals(day.id, (error, contributions) => {
            day.name = day.id + 1
            day.tokensForSale = forSale.div(WAD)
            day.contributions = contributions.div(WAD)
            day.price = contributions.div(forSale)
            $(null, day)
          })
        })
      }, (error, days) => {
        render("app", `
          <h2>EOS token sale</h2>

          <p>

            The EOS token sale will be conducted on a continuous
            distribution model during 1 year. One billion tokens
            (1,000,000,000 EOS) will be minted at the start of the
            sale. These tokens are then split into separate windows of
            availability &mdash; one per day. The tokens
            allocated to a given window are split proportionally to
            all contributions made during that period.

          </p>

          For more details, please review the token sale <a
          href=https://github.com/eosio/eos-token-sale>contract source
          code</a>.

          <div class=pane>
            ${web3.eth.accounts[0] ? `
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
                  <td style="text-align: left">0.0 ETH</td>
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
            ` : `
              <div>
                <h3>Ethereum account not found</h3>

                It looks like an Ethereum client is available in your
                browser, but I couldn&rsquo;t find any accounts.
                If you&rsquo;re using MetaMask, you may need to unlock
                your account. Please reload this page and try again.

              </div>
            `}
          </div>

          <table style="width: 100%; margin-bottom: 2rem">
            <tr>
              <th>Day</th>
              <th>Tokens for sale</th>
              <th>Total contributions</th>
              <th>Your contribution</th>
              <th>Effective price</th>
            </tr>
            ${days.map(day => {
              return `
                <tr>
                  <td>${day.name}</td>
                  <td>${formatWad(day.tokensForSale)} EOS</td>
                  <td>${formatWad(day.contributions)} ETH</td>
                  <td>${formatWad(day.contributions)} ETH</td>
                  <td>${day.contributions == 0 ? "n/a" : (
                    `${day.price.toFixed(9)} ETH/EOS`
                  )}</td>
                </tr>
              `
            }).join("\n")}
          </table>
        `)
      })
    })
  }
}

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
