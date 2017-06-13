# Draft EOS Token Sale Contract 

***DISCLAIMER: Everything contained in this repository is in draft form and subject to change at any time and provided for information purposes only.  block.one does not guarantee the accuracy of the information contained in this repository and the information is provided “as is” with no representations or warranties, express or implied. This code is owned and copyrighted by block.one and cannot be used by anyone for any purpose other than testing on the Etheruem test network.***

This repository contains the draft source code for the EOS Token Sale. It is being released so that it may be reviewed by the community and deployed and tested by all on the Ethereum test network.

**No information regarding the final terms and timing or properties of the sale have been released at this time.**

## Description

This draft contract manages the sale of a ERC-20 compatible token ("EOS") on the Ethereum (ETH) blockchain.

The EOS Token Sale will distributed daily over about 341 days. 1,000,000,000 (one billion) EOS tokens will be minted at the start of the sale. These tokens will be split into different rolling windows of availability. The tokens available in a window will be split proportional to all contributions made during the window period. 

For example:

    20 EOS are available during the window
    Bob contributes 4 ETH
    Alice contributes 1 ETH
    Bob contributed 80% of the total contributions and gets 16 EOS
    Alice contributed 20% of the total contributions and gets 4 EOS

### Example Distribution Schedule

1. 200,000,000 EOS (20%) will be available during a 5 day window from the time the contract is published.
2. 700,000,000 EOS (30%) will be split evenly into 350 consecutive 23 hour windows of 2,000,000 EOS tokens each starting after the initial window.
3. 100,000,000 EOS (10%) will be reserved for the founders and cannot be traded or transferred on the Ethereum network.

#### 341 days after the creation of this contract the EOS ERC-20 token will be frozen and non transferrable.


## Rationale 

When designing the EOS distribution system, the primary goal was ensuring as fair and wide of a distribution as possible; we aim to achieve this by focusing on the following three objectives:

### 1. Equal Opportunity
In order to ensure that everyone can participate, EOS are not sold for a fixed price; they are sold at a price determined by market demand for their acquisition. This is achieved by distributing a fixed amount of EOS (supply) proportionally toward the daily ETH proceeds (demand). Each window is 23 hours long which means that everyone in every timezone will have periodic opportunities to have favorable start and/or end times for a window regardless of their timezone.

### 2. Broad Awareness
Distribution can only be as wide as the number of people that are aware of the ability to get involved. By stretching the distribution process out over the course of approximately 1 year, the community has the time to gather information and assess project merits before early stage windows of opportunity are closed.

### 3. Fair and Auditable Incoming Value
An Ethereum smart contract proves the receipt of incoming value for the creation of each EOS token. This process:

 - Mimics the economics and distribution access of traditional PoW mining contributions
 - Preserves the value lost to hardware and electricity for PoW
 - Makes it easy for everyone to participate
 - Eliminates unfair advantages associated with economies of scale


## Technical Risks

This smart contract runs on the Ethereum network; therefore, you need to be aware of certain things.

### 1. Block Production occurs at Random Times

The block time is used to determine the window a transaction is credited to. The timing of block production is determined via proof of work so transactions submitted in the final second of a window may not get included when you think.  To mitigate this, it is possible to use the interface to require the transaction to apply it to the current day or fail.

### 2. Network Congestion 

The Ethereum network is prone to periodic congestion during which transactions can be delayed or lost. Some individuals may intentionally spam the Ethereum network in an attempt to gain an advantage. Do not assume Ethereum block producers will include your transaction when you want or that your tranasction will be included at all. This is a limitation of Ethereum and not the EOS Token Sale contract.

### 3. Do not fund Token Sale Contract from an account you do not control

Tokens are allocated to the account that sent them. If you send from an exchange or other account that you do not control then you may not be able to claim your EOS tokens without their help.

### 4. Failing register a public key for your Ethereum account

If you hold EOS tokens in an Etheruem account and fail to register a public key or lose the private key that maps to your registered public key, then your EOS tokens will not be part of the snapshot.


## FAQ

### 1. How do I participate?

The EOS Token Sale has not yet been started, but you can participate in our test sale now.  

The recommend way to participate in the EOS Token Sale contract is to use [our interface](https://eosio.github.io/eos-token-sale/) with the [Metamask Extension](https://metamask.io) in the Google Chrome browser. 

### 2. Why are tokens frozen after a year?

The ERC-20 token is frozen so that there is not a moving target for generating a snapshot for generation of genesis block of an EOS.IO based blockchain. It also protects exchanges from people attempting to deposit or withdraw EOS ERC-20 tokens after the snapshot.


## Advanced Participation

To participate in the EOS token sale, simply send ETH to the contract address during a window of your choice. 

The EOS tokens will be reserved for you to claim when the window completes. To claim the tokens, visit the [Ethereum Foundation Wallet](https://wallet.ethereum.org/) using an Ethereum-enabled browser (e.g. Metamask, Mist, Parity) or the [MyEtherWallet Contract Viewer](https://www.myetherwallet.com/#contracts) and load in your keyfile. If the user has never used Ethereum before, the [Metamask Extension](https://metamask.io) in the Google Chrome browser is the recommended Ethereum wallet.

**Contract Address:**

    0x123

**ABI / JSON Interface:**

    [{"constant":true,"inputs":[{"name":"day","type":"uint256"}],"name":"issueOnDay","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"},{"name":"","type":"address"}],"name":"claimed","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"owner_","type":"address"}],"name":"setOwner","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"issueFirstDay","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"EOS20","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"},{"name":"","type":"address"}],"name":"userBuys","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"freeze","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"keys","outputs":[{"name":"","type":"bytes"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"startTime","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"authority_","type":"address"}],"name":"setAuthority","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"dailyTotals","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"key","type":"bytes"}],"name":"register","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"issuePerDay","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"buy","outputs":[],"payable":true,"type":"function"},{"constant":true,"inputs":[],"name":"today","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"authority","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"timestamp","type":"uint256"}],"name":"dayFor","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"day","type":"uint256"},{"name":"who","type":"address"}],"name":"claim","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"collect","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"numberOfDays","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"inputs":[{"name":"numberOfDays_","type":"uint256"},{"name":"issuePerDay_","type":"uint256"},{"name":"startTime_","type":"uint256"}],"payable":false,"type":"constructor"},{"payable":true,"type":"fallback"},{"anonymous":false,"inputs":[{"indexed":false,"name":"day","type":"uint256"},{"indexed":false,"name":"who","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"LogClaim","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"wad","type":"uint256"}],"name":"LogCollect","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"who","type":"address"},{"indexed":false,"name":"key","type":"bytes"}],"name":"LogRegister","type":"event"},{"anonymous":true,"inputs":[{"indexed":true,"name":"sig","type":"bytes4"},{"indexed":true,"name":"guy","type":"address"},{"indexed":true,"name":"foo","type":"bytes32"},{"indexed":true,"name":"bar","type":"bytes32"},{"indexed":false,"name":"wad","type":"uint256"},{"indexed":false,"name":"fax","type":"bytes"}],"name":"LogNote","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"authority","type":"address"}],"name":"LogSetAuthority","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"}],"name":"LogSetOwner","type":"event"}]

If using the Ethereum Foundation Wallet, the instructions to claim are here:

* Click `Contracts`
* Click `Watch Contract`
* For name, enter EOSSale
* For address and JSON Interface, enter the information above and click `OK`
* Click on your new contract
* Click `ClaimAll` from the function dropdown
* Enter your address in the `who` field.
* Click `Execute` and confirm transaction

If you are using MyEtherWallet, the instructions to claim are here:

* For address and ABI / JSON Interface, enter the information above and click Access
* Click ClaimAll from the function dropdown and enter your address in the `who` field
* Load in your wallet file and unlock it
* Click `Write`
* set `Amount to Send` to `0` and `Gas Limit` to `3141592`
* Click Generate Transaction 

The EOS tokens should now be in your wallet.

## To Transfer EOS to an Exchange

Load the token details into the Ethereum Foundation Wallet or MyEtherWallet. The token details are:

**Address:**

    0x123

**Decimals:**

    18

**Symbol:**

    EOS

**Name:**

    EOS

For Ethereum Foundation Wallet:

* Click `Contracts`
* Click `Watch Token`
* Enter the token address from above
* The rest of the details should auto-populate.
* Click `OK`
* The Token should now be an option on the Send page of the wallet. You can now transfer it to any address.

For MyEtherWallet:

* Click `Send Ether & Tokens`
* Load in your wallet file and unlock it
* Click `Add Custom Token` on the right side of the page and add the token details from above
* EOS should now be available as an option in the currency dropdown of the transfer screen. You can now transfer it to any address.

## Register Your Public Key

At any time a user can map their Etheruem address to a public key in one of the following formats:

0. EOS Public Keys         - EOS4yfYEjUodfs.......DfavaddbvD
1. Steem Public Keys       - STM4yfYEjUoey4.......UaSt2Sx9W4
2. BitShares Public Keys   - BTS5WaszCsqVN9.......Wz47B3wUqa 


## Command Line Usage 

This README assumes you have an Ethereum blockchain client installed. If you don't have one, [Parity](https://parity.io/parity.html) is recommended.

### Getting set up

You will need the [Nix Package Manager](https://nixos.org/nix/) to work with the EOS contracts from the command line. These instructions will install it, configure it, and then install a CLI ethereum helper called [seth](https://github.com/dapphub/seth)

    $ curl https://nixos.org/nix/install | sh
    $ nix-channel --add https://nix.dapphub.com/pkgs/dapphub
    $ nix-channel --update
    $ nix-env -i seth

### Commands

**Buying Tokens:**

    $ seth send -F <ETH_ADDRESS> -G 4600000 --value=$(seth --to-wei <INVESTMENT> ETH) <SALE_ADDRESS> "buy()"

**Claiming tokens:**
 
    $ seth send -F <ETH_ADDRESS> -G 4600000 <SALE_ADDRESS> "claim(address)" <ETH_ADDRESS>

**Registering public key:**
 
    $ seth send -F <ETH_ADDRESS> -G 4600000 <SALE_ADDRESS> "register(bytes)" <PUBLIC_KEY>


Copyright © 2017 block.one. All rights reserved.
