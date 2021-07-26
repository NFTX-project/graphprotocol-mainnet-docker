#!/bin/bash

EPOCH=193
SUBGRAPH=QmNRkaVUwUQAwPwWgdQHYvw53A5gh3CP3giWnWQZdA2BTE
INDEXER=0xa3276e7ab0a162f6a3b5aa6b3089accbaa65d12e

QUERY_NODE_STATUS_ENDPOINT=http://query-node-0:8030/graphql

START_BLOCK=$(http -b post https://gateway.network.thegraph.com/network query='query epoch($epoch: ID!) { epoch(id: $epoch) { startBlock } }' variables:="{ \"epoch\": \"$((($EPOCH)))\" }" | jq .data.epoch.startBlock)
START_BLOCK_HEX=$(printf '%x' $START_BLOCK)

BLOCK_DATA=$(http -b post https://mainnet.infura.io/v3/193af9e5c12a46249e900a646cf375bc jsonrpc="2.0" id="1" method="eth_getBlockByNumber" params:="[\"0x$START_BLOCK_HEX\", false]" | jq -c '.result | { number, hash }')

HASH=$(echo $BLOCK_DATA | jq '.hash')
NON_HEX_NUMBER=$(echo "$BLOCK_DATA" | jq '.number' | xargs printf '%d')
    
DEPLOYMENT=$(echo "$SUBGRAPH" | base58 -d | hexdump -s 2 -v -e '/1 "%02X"' | sed -e 's/\(.*\)/\L\1/' | sed -e 's/^/0x/')

VARIABLES="{\"number\": $NON_HEX_NUMBER, \"hash\": $HASH, \"indexer\": \"$INDEXER\", \"subgraph\": \"$SUBGRAPH\"}"

VERIFICATION=$(http -b post $QUERY_NODE_STATUS_ENDPOINT \
query='query poi($number: Int!, $hash: String!, $indexer: String!, $subgraph: String!) { proofOfIndexing(subgraph: $subgraph, blockNumber: $number, blockHash: $hash, indexer: $indexer) }' \
variables:="$(echo $VARIABLES)")


echo $VERIFICATION
