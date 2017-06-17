pragma solidity ^0.4.11;

import "ds-guard/guard.sol";
import "ds-test/test.sol";
import 'ds-exec/exec.sol';

import "./eos.sol";

contract TestUser is DSExec {
    TestableEOSSale sale;

    function TestUser(TestableEOSSale sale_) {
        sale = sale_;
    }

    function() payable {}

    function doBuy(uint wad) {
        sale.buy.value(wad)();
    }

    function doBuyWithLimit(uint wad, uint window, uint limit) {
        sale.buyWithLimit.value(wad)(window, limit);
    }

    function doClaim(uint window) {
        sale.claim(window);
    }

    function doFreeze() {
        sale.freeze();
    }

    function doExec(uint wad) {
        exec(sale, wad);
    }
}

contract TestOwner {
    TestableEOSSale sale;

    function TestOwner(TestableEOSSale sale_) {
        sale = sale_;
    }

    function() payable {}

    function doCollect() {
        sale.collect();
    }
}

contract TestableEOSSale is EOSSale {
    function TestableEOSSale(
        uint n, uint128 t, uint o, uint s, uint128 a, string k
    ) EOSSale(n, t, o, s, a, k) {}

    uint public localTime;

    function time() constant returns (uint) {
        return localTime;
    }

    function addTime(uint extra) {
        localTime += extra;
    }
}

contract EOSSaleTest is DSTest, DSExec {
    TestableEOSSale  sale;
    DSToken          EOS;
    DSGuard          guard;
    TestUser         user1;
    TestUser         user2;
    TestOwner        owner;
    uint             window;

    function setUp() {
        string memory x = new string(1);

        EOS = new DSToken("EOS");
        window = 0;

        sale = new TestableEOSSale(
            5, 156.25 ether, now, block.timestamp + 1 days, 10 ether, x
        );

        EOS.setOwner(sale);
        sale.initialize(EOS);

        sale.addTime(now + 1);

        user1 = new TestUser(sale);
        user2 = new TestUser(sale);
        owner = new TestOwner(sale);

        user1.transfer(100 ether);
        user2.transfer(100 ether);

        guard = new DSGuard();
        guard.okay(owner, sale);

        sale.setAuthority(guard);
    }

    function addTime() {
        sale.addTime(1 days);
    }

    function nextRound(uint wad, uint wad1, uint wad2) {
        if (wad != 0) sale.buy.value(wad)();
        if (wad1 != 0) user1.doBuy(wad1);
        if (wad2 != 0) user2.doBuy(wad2);

        addTime();

        sale.claim(window);
        user1.doClaim(window);
        user2.doClaim(window);

        window++;
    }

    function testFailBuyBeforeOpen() {
        string memory x = new string(1);
        sale = new TestableEOSSale(
            5, 156.25 ether, now + 1, block.timestamp + 1 days, 10 ether, x
        );
        sale.addTime(now);
        sale.buy.value(1 ether)();
    }

    function testBuy() {
        sale.buy.value(1 ether)();
    }

    function testBuyWithLimit() {
        sale.buyWithLimit.value(1 ether)(0, 2 ether);
        assertEq(sale.userBuys(0, address(this)), 1 ether);
    }

    function testFailBuyOverLimit() {
        user1.doBuy(1 ether);
        sale.buyWithLimit.value(1 ether)(0, 1.5 ether);
    }

    function testBuyOverLimitLaterWindow() {
        user1.doBuy(1 ether);
        sale.buyWithLimit.value(1 ether)(3, 1.5 ether);
    }

    function testBuyLaterWindow() {
        sale.buyWithLimit.value(1 ether)(3, 2 ether);
        assertEq(sale.userBuys(0, address(this)), 0);
        assertEq(sale.userBuys(2, address(this)), 0);
        assertEq(sale.userBuys(3, address(this)), 1 ether);
        assertEq(sale.userBuys(4, address(this)), 0);
    }

    function testFailBuyTooLate() {
        addTime();
        sale.buyWithLimit.value(1 ether)(0, 0);
    }

    function testBuyFirstDay() {
        sale.buy.value(1 ether)();
        sale.addTime(1 days);
        sale.claim(0);
        assertEq(EOS.balanceOf(this), 31.25 ether);
    }

    function testBuyFirstAndSecondDay() {
        sale.buy.value(1 ether)();
        sale.addTime(1 days);
        sale.claim(0);
        assertEq(EOS.balanceOf(this), 31.25 ether);

        sale.buy.value(1 ether)();
        sale.addTime(1 days);
        sale.claim(1);
        // 23 tokens issued per day after first day
        assertEq(EOS.balanceOf(this), 54.25 ether);
    }

    function testFailSaleOver() {
        sale.addTime(6 days);
        sale.buy.value(1 ether)();
    }

    function testFailSmallBuy() {
        nextRound(1 finney, 0, 0);
    }

    function testLargeBuy() {
        nextRound(1001 ether, 0, 0);
    }

    function testAllDistributed() {
        nextRound(1 ether, 0, 0);
        nextRound(1 ether, 0, 0);
        nextRound(1 ether, 0, 0);
        nextRound(1 ether, 0, 0);
        nextRound(1 ether, 0, 0);
        nextRound(1 ether, 0, 0);

        assertEq(EOS.balanceOf(this), 146.25 ether);
    }

    function testClaim() {
        nextRound(1 ether, 0, 0);
        assertEq(EOS.balanceOf(this), 31.25 ether);
    }

    function testClaimZeroContribution() {
        nextRound(0, 0, 0);
    }

    function testFailEarlyClaim() {
        sale.claim(2);
    }

    function testFailEarlyFreeze() {
        nextRound(1 ether, 0, 0);
        nextRound(1 ether, 0, 0);

        // try release at the start of the third round
        user1.doFreeze();
    }

    function testMultiUser() {
        nextRound(1 ether, 1 ether, 0);
        assertEq(EOS.balanceOf(this), 15.625 ether);
        assertEq(EOS.balanceOf(user1), 15.625 ether);
    }

    function testMultiUserAsymmetricBid() {
        nextRound(1 ether, 9 ether, 0);
        assertEq(EOS.balanceOf(this), 3.125 ether);
        assertEq(EOS.balanceOf(user1), 28.125 ether);
    }

    // is this an issue?
    function testRepeatingDecimalRoundUp() {
        nextRound(1 ether, 1 ether, 1 ether);
        assertEq(EOS.balanceOf(this), 10416666666666666667);
        assertEq(EOS.balanceOf(user1), 10416666666666666667);
        assertEq(EOS.balanceOf(user2), 10416666666666666667);
    }

    function testRepeatingDecimalRoundDown() {
        addTime();
        window++;

        nextRound(5 ether, 1 ether, 0);
        assertEq(EOS.balanceOf(this), 19166666666666666665);
        assertEq(EOS.balanceOf(user1), 3833333333333333333);
    }

    function testFreeze() {
        nextRound(1 ether, 0, 0);
        nextRound(1 ether, 0, 0);
        nextRound(1 ether, 0, 0);
        nextRound(1 ether, 0, 0);
        nextRound(1 ether, 0, 0);
        nextRound(1 ether, 0, 0);
        assertEq(EOS.balanceOf(this), 146.25 ether);

        // one extra day to trade
        addTime();

        user1.doFreeze();
    }

    function testCollect() {
        nextRound(1 ether, 0, 0);
        nextRound(1 ether, 0, 0);
        nextRound(1 ether, 0, 0);
        nextRound(1 ether, 0, 0);
        nextRound(1 ether, 0, 0);
        nextRound(1 ether, 0, 0);
        assertEq(EOS.balanceOf(this), 146.25 ether);

        owner.doCollect();
        assertEq(owner.balance, 6 ether);
    }

    function testMultiUserFinalize() {
        nextRound(1 ether, 1 ether, 0);
        nextRound(1 ether, 1 ether, 0);
        nextRound(1 ether, 1 ether, 0);
        nextRound(1 ether, 1 ether, 0);
        nextRound(1 ether, 1 ether, 0);
        nextRound(1 ether, 1 ether, 0);
        assertEq(EOS.balanceOf(this), 73.125 ether);
        assertEq(EOS.balanceOf(user1), 73.125 ether);
        addTime();

        owner.doCollect();
        assertEq(owner.balance, 12 ether);

        user1.doFreeze();
    }

    function testMultiUserAsymmetricBidFinalize() {
        nextRound(9 ether, 1 ether, 0);
        nextRound(4 ether, 1 ether, 0);
        nextRound(1 ether, 9 ether, 10 ether);
        nextRound(1 ether, 12 ether, 12 ether);
        nextRound(12 ether, 1 ether, 12 ether);
        nextRound(12 ether, 12 ether, 1 ether);
        assertEq(EOS.balanceOf(this), 70.675 ether);
        assertEq(EOS.balanceOf(user1), 41.075 ether);
        assertEq(EOS.balanceOf(user2), 34.5 ether);
        addTime();

        owner.doCollect();
        assertEq(owner.balance, 110 ether);

        user1.doFreeze();
    }

    function testClaimAfterFinalize() {
        sale.buy.value(1 ether)();
        addTime();
        addTime();
        addTime();
        addTime();
        addTime();

        owner.doCollect();

        assertEq(EOS.balanceOf(this), 0);

        sale.claim(0);

        assertEq(EOS.balanceOf(this), 31.25 ether);
    }

    function testClaimAll() {
        sale.buy.value(1 ether)();
        addTime();
        sale.buy.value(1 ether)();
        addTime();
        sale.buy.value(1 ether)();
        addTime();

        assertEq(EOS.balanceOf(this), 0);

        sale.claimAll();
        assertEq(EOS.balanceOf(this), 77.25 ether);
    }

    function testClaimAllZeroContribution() {
        sale.buy.value(1 ether)();
        addTime();
        addTime(); // skip a day
        sale.buy.value(1 ether)();
        addTime();
        sale.buy.value(1 ether)();
        addTime();

        assertEq(EOS.balanceOf(this), 0);

        sale.claimAll();
        assertEq(EOS.balanceOf(this), 77.25 ether);
    }

    function testRegister() {
        string memory x = new string(56);
        string memory y = new string(56);

        sale.register(x);
        sale.register(y);
    }

    function testFailRegister() {
        string memory x = new string(100);
        sale.register(x);
    }
}

contract EOSSalePreInitTests is DSTest {
    TestableEOSSale  sale;
    TestUser         user1;

    function setUp() {
        string memory x = new string(1);

        sale = new TestableEOSSale(
            5, 156.25 ether, now, block.timestamp + 1 days, 10 ether, x
        );

        user1 = new TestUser(sale);
        user1.transfer(100 ether);
        sale.addTime(now + 1);
    }

    // Ensure that initialize fails if the token has other authorized callers
    function testFailTokenAuthority() {
        DSToken EOS = new DSToken("EOS");
        EOS.setAuthority(new DSGuard());
        EOS.setOwner(sale);
        sale.initialize(EOS);
    }
}
