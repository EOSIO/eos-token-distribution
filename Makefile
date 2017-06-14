days   = 7
supply = $(shell seth --to-wei 1000000000 eth)
alloc  = $(shell seth --to-wei 100000000 eth)
open   = $(shell date +%s -d '10 minutes')
start  = $(shell date +%s -d '3 days')

all    :; dapp build
test   :; dapp test
clean  :; dapp clean

deploy :; dapp create EOSSale $(days) $(supply) \
$(open) $(start) $(alloc) $(key)
