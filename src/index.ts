
// Author: Rui Deleterium
// Project: https://github.com/deleterium/SC-Simulator
// License: BSD 3-Clause License

import { BLOCKCHAIN } from './blockchain.js'
import { SIMULATOR } from './simulator.js'
import { CONTRACT } from './contract.js'

export const Constants = {
    stepfee: 100000n, // default value from signum: 73500n
    deploy_add_balance: 300000000n, // added balance to contract when deploying it
    activationAmount: 10000000n, // contract activation amount
    creatorID: 555n, // Account ID of creator
    contractID: 999n, // Account ID of contract
    tokenID: 101010n, // Asset id to be used in Mint_Asset ()
    contractDPages: 10, // Number of data pages of deployed contract
    contractUSPages: 1, // Number of user stack pages of deployed contract
    contractCSPages: 1, // Number of code stack pages of deployed contract
    getRandomSleepBlocks: 15, // Sleep blocks during API to get random ticket.

    // do not change these
    minus1: 18446744073709551615n, // -1 in 64-bit unsigned
    pow2to64: 18446744073709551616n, // 2^64
    maxPositive: 9223372036854775807n, // (2^63)-1
    numberMaxPositive: 9223372036854775000
}

export const Blockchain = new BLOCKCHAIN()
export const Contracts: CONTRACT[] = []
export const Simulator = new SIMULATOR()
