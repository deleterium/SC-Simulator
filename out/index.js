// Author: Rui Deleterium
// Project: https://github.com/deleterium/SC-Simulator
// License: BSD 3-Clause License
import { BLOCKCHAIN } from './blockchain.js';
import { SIMULATOR } from './simulator.js';
export const Constants = {
    stepfee: 73500n,
    deploy_add_balance: 200000000n,
    activationAmount: 10000000n,
    creatorID: 555n,
    contractID: 999n,
    contractDPages: 10,
    contractUSPages: 1,
    contractCSPages: 1,
    getRandomSleepBlocks: 15,
    //do not change these
    minus1: 18446744073709551615n,
    pow2to64: 18446744073709551616n, // 2^64
};
export var Blockchain = new BLOCKCHAIN();
export var Contracts = [];
export var Simulator = new SIMULATOR();
