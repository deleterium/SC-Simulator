// Author: Rui Deleterium
// Project: https://github.com/deleterium/SC-Simulator
// License: BSD 3-Clause License
import { BlockchainTransactionObj, BLOCKCHAIN, BlockchainMapObj, AccountObj } from './blockchain.js'
import { SIMULATOR } from './simulator.js'
import { SmartC } from 'smartc-signum-compiler'
import { TransactionObj } from './objTypes'
import { utils } from './utils'

export * from './objTypes'
export {
    BlockchainTransactionObj,
    BlockchainMapObj,
    AccountObj
}
export { utils } from './utils'
export { CONTRACT } from './contract.js'

export const Constants = {
    stepfee: 100000n, // default value from signum: 100000n
    maxStepsEachBlock: 1000000n, // default value from signum: 1000000n
    deploy_add_balance: 0n, // added balance to contract when deploying it
    activationAmount: 10000000n, // contract activation amount
    creatorID: 555n, // Account ID of creator
    contractID: 999n, // Account ID of contract
    firstTokenID: 101010n, // First asset id to be used in Mint_Asset ()
    contractDPages: 10, // Number of data pages of deployed contract
    contractUSPages: 1, // Number of user stack pages of deployed contract
    contractCSPages: 1, // Number of code stack pages of deployed contract
    getRandomSleepBlocks: 15, // Sleep blocks during API to get random ticket.

    build: '2024.02.12',

    // do not change these
    minus1: 18446744073709551615n, // -1 in 64-bit unsigned
    pow2to64: 18446744073709551616n, // 2^64
    maxPositive: 9223372036854775807n, // (2^63)-1
    numberMaxPositive: 9223372036854775000
}

export class SimNode {
    Blockchain: BLOCKCHAIN
    Simulator: SIMULATOR
    scenarioTransactions: TransactionObj[]

    constructor () {
        this.scenarioTransactions = []
        this.Blockchain = new BLOCKCHAIN()
        this.Simulator = new SIMULATOR(this.Blockchain)
    }

    reset () {
        this.scenarioTransactions = []
        this.Blockchain.reset()
        this.Simulator.reset()
    }

    /**
     * Compiles the given source code and deploys the resulting contract.
     *
     * @param {string} source - The source code of the contract to be compiled.
     * @return The Simulator instance for debugging purposes.
     */
    loadSmartContract (source: string, creatorID: bigint, contractID?: bigint) {
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

        const programProps = cCompiler.getMachineCode()
        // Successful compiled c code
        const newContract = this.Blockchain.deployContract({
            contractID,
            creatorID,
            dataPages: programProps.DataPages,
            codeStackPages: programProps.CodeStackPages,
            userStackPages: programProps.UserStackPages,
            codeHashId: BigInt(programProps.MachineCodeHashId),
            asmSourceCode: programProps.AssemblyCode,
            cSourceCode: source
        })
        console.info('C contract successfully compiled and deployed at address ' +
            newContract.contract.toString(10) + '. Ready to run'
        )

        return this.Simulator.setCurrentSlotContract(newContract.contract)
    }

    /**
     * Verifies and parse upcoming transactions
     *
     * @param JSONstring string containing JSON object with transactions to be
     * processed
     * @return string indicating error. 'OK' on success
     */
    parseUpcomingTransactions (JSONstring: string): {
        status: 'ok' | 'error',
        value: string,
        TXs?: TransactionObj[]
    } {
        try {
            // Remove single lines comments. Not standard!
            JSONstring = JSONstring.replace(/\/\/.+$/gm, '')
            const TXArray = JSON.parse(JSONstring, utils.parseTransactionObj)
            return {
                status: 'ok',
                value: '',
                TXs: TXArray
            }
        } catch (error) {
            return {
                status: 'error',
                value: "Could not parse transactions JSON text. Atention on ','!!! " + error
            }
        }
    }

    /**
     * Updates all scenario transactions to new ones
     *
     * @param transactionsString string containing JSON object with transactions to be
     * added
     * @return Object with current scenario transactions and errors if any
     */
    setScenario (transactionsString: string) : {
        errorCode?: number,
        errorDescription?: string,
        scenarioTransactions: TransactionObj[]
    } {
        this.scenarioTransactions = []
        const result = this.parseUpcomingTransactions(transactionsString)
        if (result.status === 'ok' && result.TXs) {
            this.scenarioTransactions = result.TXs
            return {
                scenarioTransactions: this.scenarioTransactions
            }
        }
        return {
            errorCode: 1,
            errorDescription: result.value,
            scenarioTransactions: this.scenarioTransactions
        }
    }

    /**
     * Append current scenario transactions with more ones
     *
     * @param transactionsString string containing JSON object with transactions to be
     * added
     * @return Object with current scenario transactions and errors if any
     */
    appendScenario (transactionsString: string) : {
        errorCode?: number,
        errorDescription?: string,
        scenarioTransactions: TransactionObj[]
    } {
        const result = this.parseUpcomingTransactions(transactionsString)
        if (result.status === 'ok' && result.TXs) {
            this.scenarioTransactions.push(...result.TXs)
            return {
                scenarioTransactions: this.scenarioTransactions
            }
        }
        return {
            errorCode: 1,
            errorDescription: result.value,
            scenarioTransactions: this.scenarioTransactions
        }
    }

    /**
     * Handle process of forging one block. Remember the forging in this simulation
     * is paused after transactions inserted in blockchain but before smart contracts
     * exection, to allow debugging them.
     *
     * @return Current blockheight
     */
    forgeBlock () {
        // Runs all contracts for current blockheight
        this.Blockchain.Contracts.forEach(curContract => {
            curContract.postForgeBlock()
        })
        // Includes user transactions in blockchain.
        this.Blockchain.addTransactions(this.scenarioTransactions)
        // This actually increases blockheigth count.
        this.Blockchain.forgeBlock()
        // Checks and activates contracts at this blockheight
        this.Blockchain.Contracts.forEach(curContract => {
            curContract.preForgeBlock()
        })
        return this.Blockchain.getCurrentBlock()
    }

    /**
     * Forges N blocks as given in howMany
     * @param howMany blocks
     * @returns Current blockheight
     */
    forgeBlocks (howMany: number) {
        for (let i = 0; i < howMany; i++) {
            this.forgeBlock()
        }
        return this.Blockchain.getCurrentBlock()
    }

    /**
     * Forges blocks until the requested blockheight
     * @param height
     * @returns Current blockheight
     */
    forgeUntilBlock (height: number) {
        while (this.Blockchain.getCurrentBlock() < height) {
            this.forgeBlock()
        }
        return this.Blockchain.getCurrentBlock()
    }
}
