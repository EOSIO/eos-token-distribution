days   = 7
supply = $(shell seth --to-uint256 $$(seth --to-wei 1000000000 eth))
alloc  = $(shell seth --to-uint256 $$(seth --to-wei 100000000 eth))
open   = $(shell date +%s -d '10 minutes')
start  = $(shell date +%s -d '3 days')
key    = $(shell seth --from-ascii abcdefghijklmnopqrstuvwxyzABCDEFG)

all    :; dapp build
test   :; dapp test
clean  :; dapp clean

deploy :; ETH_GAS=4000000 dapp create EOSSale $(days) $(supply) \
$(open) $(start) $(alloc) $(key)
