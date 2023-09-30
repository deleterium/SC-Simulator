// Author: Rui Deleterium
// Project: https://github.com/deleterium/SC-Simulator
// License: BSD 3-Clause License
import { BlockchainTransactionObj, BLOCKCHAIN, BlockchainMapObj, AccountObj } from './blockchain.js'
import { SIMULATOR } from './simulator.js'
import { CONTRACT } from './contract.js'
import { SmartC } from 'smartc-signum-compiler'
export * from './objTypes'
export {
    BlockchainTransactionObj,
    BlockchainMapObj,
    AccountObj
}
export const Constants = {
    stepfee: 100000n, // default value from signum: 100000n
    deploy_add_balance: 0n, // added balance to contract when deploying it
    activationAmount: 10000000n, // contract activation amount
    creatorID: 555n, // Account ID of creator
    contractID: 999n, // Account ID of contract
    tokenID: 101010n, // Asset id to be used in Mint_Asset ()
    nextTokenID: 0n, // Asset id store next value for MintAsset() (ok, this is not constant...)
    contractDPages: 10, // Number of data pages of deployed contract
    contractUSPages: 1, // Number of user stack pages of deployed contract
    contractCSPages: 1, // Number of code stack pages of deployed contract
    getRandomSleepBlocks: 15, // Sleep blocks during API to get random ticket.

    build: '2022.07.31',

    // do not change these
    minus1: 18446744073709551615n, // -1 in 64-bit unsigned
    pow2to64: 18446744073709551616n, // 2^64
    maxPositive: 9223372036854775807n, // (2^63)-1
    numberMaxPositive: 9223372036854775000
}

export const Blockchain = new BLOCKCHAIN()
export const Contracts: CONTRACT[] = []
export const Simulator = new SIMULATOR()

export function reset () {
    Blockchain.reset()
    Contracts.splice(0, Contracts.length)
    Simulator.reset()
    Constants.nextTokenID = 0n
}

export { utils } from './utils'

/**
 * Compiles the given source code and deploys the resulting contract.
 *
 * @param {string} source - The source code of the contract to be compiled.
 * @return The Simulator instance.
 */
export function loadSmartContract (source: string) : SIMULATOR {
    let cCompilationResult = ''
    const cCompiler = new SmartC({ language: 'C', sourceCode: source + '\n#pragma verboseAssembly true\n' })
    try {
        cCompiler.compile()
    } catch (error: any) {
        cCompilationResult = error.message
    }
    if (cCompilationResult.length !== 0) {
        throw new Error('Compilation failed.\nC error: ' + cCompilationResult)
    }

    // Successful compiled c code
    Simulator.deploy(cCompiler.getAssemblyCode(), source)
    console.info('C contract successfully compiled and deployed with id ' +
        Contracts[Contracts.length - 1].contract.toString(10) +
        ' on slot ' +
        (Contracts.length - 1) +
        '. Ready to run'
    )

    return Simulator
}
