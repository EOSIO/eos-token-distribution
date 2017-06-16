// (C) block.one all rights reserved

pragma solidity ^0.4.10;

import 'ds-auth/auth.sol';
import 'ds-math/math.sol';
import 'ds-note/note.sol';
import 'ds-token/token.sol';
import 'ds-exec/exec.sol';
import 'gnosis-multisig/MultiSigWallet.sol';


contract EOSSale is DSAuth, DSExec, DSMath, DSNote {
    DSToken                     public EOS;  
    uint                        public startTime;
    uint                        public numberOfDays;
    uint128                     public foundersAllocation;
    bytes                       public foundersKey;
    uint                        public createPerDay;
    uint                        public createFirstDay;
    uint                        public openTime;
    uint128                     public totalSupply;

    mapping(uint=>uint)         public dailyTotals;
    mapping(uint=>
        mapping(address=>uint)) public userBuys;
    mapping(uint=>
        mapping(address=>bool)) public claimed;


    event LogBuy(uint day, address who, uint wad);
    event LogClaim(uint day, address who, uint wad);
    event LogCollect(uint wad);
    event LogRegister(address who, bytes key);

    
    // @param openTime_      - the first time at which payments will be accepted
    // @param startTime      - the end of initial window and start of the first 23 hour window
    // @param numberOfDays_  - the total number of 23 hour periods after the initial window
    // @param totalSupply_   - the total number of tokens to be allocated by this contract
    // @param foundersAlloc_ - the number of tokens reserved for founders and not distributed by sale
    // @param foundersKey    - the EOS key that will control the founders allocation in genesis block
    function EOSSale(uint numberOfDays_, uint128 totalSupply_, uint openTime_, uint startTime_, uint128 foundersAlloc_, bytes foundersKey_) {
        assert( totalSupply_ > foundersAlloc_ );
        assert( openTime_ < startTime_ );
        assert( numberOfDays_ > 0 );

        numberOfDays       = numberOfDays_;
        totalSupply        = totalSupply_;
        openTime           = openTime_;
        startTime          = startTime_;
        foundersAllocation = foundersAlloc_;
        foundersKey        = foundersKey_;
    }

    function initialize(DSToken eos) auth {
        assert(address(EOS) == address(0));

        EOS = eos;
        EOS.mint(totalSupply);

        // transfer foundersAllocation of EOS ERC-20 tokens to founders address and map to founders public key
        // founders ETH address '0xb1' is a provably non-transferrable address
        address founders = 0xb1; 
        EOS.push(founders, foundersAllocation);
        keys[founders] = foundersKey;
        LogRegister(founders, foundersKey);

        createFirstDay     = wmul(totalSupply, 0.2 ether);
        createPerDay       = div(sub(sub(totalSupply, foundersAllocation), createFirstDay), numberOfDays);
    }

    // overrideable for easy solidity tests
    function time() constant internal returns (uint) {
        return block.timestamp;
    }

    function today() constant returns (uint) {
        return dayFor(time());
    }

    // each day is 23 hours long so that end-of-window rotates around the
    // clock for all timezones.
    function dayFor(uint timestamp) constant returns (uint) {
        if( timestamp < startTime ) return 0;
        return (sub(timestamp, startTime) / (23 hours)) + 1;
    }

    // allocate 20% of tokens on the first day which starts at the time the 
    // contract is published and ends 23 hours after startTime 
    // allocate the remaining 80% in equal ammounts over the numberOfDays
    function createOnDay(uint day) constant returns (uint) {
        if( day == 0 ) {
            return createFirstDay;
        }
        return createPerDay;
    }

    // the default action upon receiving funds is disabled to mitigate people from sending
    // from accounts they do not control
    function() payable {
       buy();
    }

    // this method provides the buyer some protections regarding which day the buy 
    // order is submitted and the maximum price prior to applying this payment that will
    // be allowed.
    function buyWithLimit( uint timestamp, uint limit ) note payable {
        assert( time() > openTime  );
        assert( 0.01 ether <= msg.value && msg.value <= 1000 ether ); // min / max 
        assert( today() <= numberOfDays ); // prevent funds after last day
        assert( dayFor(timestamp) >= today() ); // allow people to pre-fund future days
        assert( dayFor(timestamp) <= numberOfDays ); // prevent people from prefunding past the end

        if( limit != 0 ) assert( dailyTotals[today()] + msg.value < limit );

        userBuys[today()][msg.sender] += msg.value;
        dailyTotals[today()] += msg.value;

        LogBuy(today(), msg.sender, msg.value);

        // save msg.sender if buyer hasn't registered already, this loop
        // converts fixed sized sender into dynamic sized bytes
        if (msg.sender == tx.origin && keys[msg.sender].length == 0) {
            bytes memory key = new bytes(20);
            for (uint i = 0; i < 20; i++) {
                key[i] = byte(uint8(uint(msg.sender) / (2**(8*(19 - i)))));
            }
            keys[msg.sender] = key;
            LogRegister(msg.sender, key);
        }
    }

    // buys at the current time with no limit
    function buy() note payable {
       buyWithLimit( time(), 0 );
    }

    // This will have small rounding errors, but the token is going to be
    // truncated to 8 or less decimal places anyway when it is launched on own chain.
    function claim(uint day, address who) note {
        assert( today() > day );
        assert( !claimed[day][who] );
        var dailyTotal = cast(dailyTotals[day]); // eth-style fixed-point 
        var userTotal = cast(userBuys[day][who]);

        if (dailyTotal == 0) return; // ignore 0 contribution days
        
        var price = wdiv(cast(createOnDay(day)), dailyTotal);
        var reward = wmul(price, userTotal);
        claimed[day][who] = true;
        EOS.push(who, reward);
        LogClaim(day, who, reward);
    }

    function claimAll(address who) note {
        for (uint i = 0; i < today(); i++) {
            claim(i, who);
        }
    }

    // The value can be a public key. Read full key import
    // policy. Manually registering requires a 33 byte public key
    // base58 encoded using the STEEM, BTS, or EOS public key format
    mapping(address=>bytes)   public keys;
    function register(bytes key) note {
        assert( today() <=  numberOfDays + 1 );
        assert(key.length == 33);
        keys[msg.sender] = key;
        LogRegister(msg.sender, key);
    }

    // Crowdsale owners can collect any time
    function collect() note auth {
        assert( today() > 0 ); // provably prevent any possible recycling during day 0
        exec(msg.sender, this.balance);
        LogCollect(this.balance);
    }

    // Anyone can `stop` the token 1 day after the sale ends.
    function freeze() note {
        assert( today() > numberOfDays + 1 );
        EOS.stop();
    }
}
