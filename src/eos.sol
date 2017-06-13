// (C) block.one all rights reserved

pragma solidity ^0.4.10;

import 'ds-auth/auth.sol';
import 'ds-math/math.sol';
import 'ds-note/note.sol';
import 'ds-token/token.sol';
import 'ds-exec/exec.sol';
import 'ds-multisig/multisig.sol';


contract EOSSale is DSAuth, DSExec, DSMath, DSNote {
    DSToken                     public EOS;  
    uint                        public startTime;
    uint                        public numberOfDays;
    uint                        public foundersAllocation;
    uint                        public createPerDay;
    uint                        public createFirstDay;

    mapping(uint=>uint)         public dailyTotals;
    mapping(uint=>
        mapping(address=>uint)) public userBuys;
    mapping(uint=>
        mapping(address=>bool)) public claimed;


    event LogClaim(uint day, address who, uint wad);
    event LogCollect(uint wad);
    event LogRegister(address who, bytes key);

    
    function EOSSale(uint numberOfDays_, uint128 totalSupply_, uint startTime_, uint foundersAlloc_, bytes foundersKey ) {
        numberOfDays       = numberOfDays_;
        EOS                = new DSToken("EOS");
        EOS.mint(totalSupply_);

        foundersAllocation = foundersAlloc_;

        /// TODO: transfer foundersAllocation of EOS ERC-20 tokens to founders address and map to founders public key
        /// founders ETH address needs to be a provably non-transferrable address


        createFirstDay     = wmul(totalSupply_, 0.2 ether);
        createPerDay       = div(sub(sub(totalSupply_,foundersAllocation), createFirstDay), numberOfDays);
        startTime          = startTime_;
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

    // the default action is to buy tokens when receiving funds
    function() payable {
        buy();
    }

    // this method provides the buyer some protections regarding which day the buy 
    // order is submitted and the maximum price prior to applying this payment that will
    // be allowed.
    function buyWithLimit( uint timestamp, uint limit ) note payable {
        assert( 0.01 ether <= msg.value && msg.value <= 1000 ether ); // min / max 
        assert( today() <= numberOfDays );
        assert( dayFor(timestamp) == today() );

        if( limit != 0 ) assert( dailyTotals[today()] + msg.value < limit );

        userBuys[today()][msg.sender] += msg.value;
        dailyTotals[today()] += msg.value;

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

    function claim(address who) note {
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
        exec(msg.sender, this.balance);
        LogCollect(this.balance);
    }

    // Anyone can `stop` the token 1 day after the sale ends.
    function freeze() note {
        assert( today() > numberOfDays + 1 );
        EOS.stop();
    }
}
