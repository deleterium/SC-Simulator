
import {
    UserTransactionObj,
    MemoryObj
} from './objTypes.js'

import {
    Contracts,
    Blockchain,
    Constants
} from './index.js'

import { CONTRACT } from './contract.js'

export class SIMULATOR {
    currSlotContract: number | undefined
    private breakpoints: number[]
    lastUpdateMemory: MemoryObj[]
    lastA: [bigint, bigint, bigint, bigint ]
    lastB: [bigint, bigint, bigint, bigint ]
    UpcomingTransactions: UserTransactionObj[]

    constructor () {
        this.breakpoints = []
        this.lastUpdateMemory = []
        this.UpcomingTransactions = []
        this.lastA = [0n, 0n, 0n, 0n]
        this.lastB = [0n, 0n, 0n, 0n]
    }

    /** Resets Simulator class */
    reset () {
        this.currSlotContract = undefined
        this.breakpoints = []
        this.lastUpdateMemory = []
        this.UpcomingTransactions = []
        this.lastA = [0n, 0n, 0n, 0n]
        this.lastB = [0n, 0n, 0n, 0n]
    }

    /**
     * Verifies and parse upcoming transactions
     *
     * @param JSONobj string containing JSON object with transactions to be
     * processed
     *
     * @return string indicating error. Empty string on success
     */
    parseUpcomingTransactions (JSONobj: string): string {
        try {
            // Remove single lines comments. Not standard!
            JSONobj = JSONobj.replace(/\/\/.+$/gm, '')
            this.UpcomingTransactions = JSON.parse(JSONobj, (key, value) => {
                if (typeof value === 'string') {
                    value = value.replace(/_/g, '')
                    if (/^[\d_]+n$/.test(value)) {
                        return BigInt(value.slice(0, -1))
                    }
                    if (/^0[xX][\da-fA-F_]+n$/.test(value)) {
                        return BigInt(value.slice(0, -1))
                    }
                    if (key === 'blockheight') {
                        return Number(value)
                    }
                }
                if (key === 'sender' || key === 'recipient' || key === 'amount' ||
                    key === 'asset' || key === 'quantity') {
                    return BigInt(value)
                }
                return value
            })
        } catch (error) {
            return "Could not parse transactions JSON text. Atention on ','!!! " + error
        }
        return ''
    }

    /**
     * Handle process of forging one block
     *
     * @param nextTXs string containing JSON object with transactions to be
     * processed
     *
     * @return string indicating status or error.
     */
    forgeBlock (nextTXs: string) {
        let rcString = ''

        rcString = this.parseUpcomingTransactions(nextTXs)
        if (rcString !== '') {
            // Avoid any execution if object is malformed
            return rcString
        }

        // Runs all contracts for current blockheight
        Contracts.forEach(curContract => {
            curContract.run()
            curContract.dispatchEnqueuedTX()
            curContract.saveMapOnBlockchain()
        })
        // Includes user transactions in blockchain. So they were not processed by contracts
        //  at this height.
        Blockchain.addTransactions(this.UpcomingTransactions)
        // This actually increases blockheigth count.
        Blockchain.forgeBlock()
        // Checks and activates contracts at this blockheight
        Contracts.forEach(curContract => {
            curContract.forgeBlock()
        })
        return 'Block #' + Blockchain.currentBlock + ' forged!'
    }

    /**
     * Activate/deactivate a breakpoint
     *
     * @param bpline string with breakpoint line number
     *
     * @returns string "ADDED" or "REMOVED" or error
     */
    toggleBreakpoint (bpline: number) {
        if (this.currSlotContract === undefined) {
            return 'No contract deployed..'
        }
        let assembly = true
        const CurrContract = Contracts[this.currSlotContract]
        if (CurrContract.cCodeArr.length > 1) {
            assembly = false
        }
        if (assembly) {
            bpline--
            if (CurrContract.getNextInstructionLine(bpline) !== bpline) {
                return `Line ${bpline} is not an instruction. Breakpoint NOT added.`
            }
        } else {
            const instrLine = CurrContract.cToAsmMap.findIndex(cline => cline === bpline)
            if (instrLine === -1) {
                return `No instruction found on line ${bpline}. Breakpoint NOT added.`
            }
            const validInstruction = CurrContract.getNextInstructionLine(instrLine)
            if (CurrContract.cToAsmMap[validInstruction] !== bpline) {
                return `Line ${bpline} is not an instruction. Breakpoint NOT added.`
            }
            bpline = validInstruction
        }
        if (this.breakpoints.find(item => item === bpline) === undefined) {
            this.breakpoints.push(bpline)
            return 'ADDED'
        } else {
            this.breakpoints = this.breakpoints.filter(item => item !== bpline)
            return 'REMOVED'
        }
    }

    /**
     * Clear all breakpoints
     */
    clearAllBreakpoints () {
        this.breakpoints = []
    }

    /**
     * Get breakpoints
     */
    getBreakpoints () {
        return this.breakpoints
    }

    /**
     * Runs contract currently debuggable
     */
    runSlotContract () {
        if (this.currSlotContract === undefined) {
            return 'Deploy contract before run...'
        }
        return Contracts[this.currSlotContract].run(this.breakpoints)
    }

    /**
     * Steps contract currently debuggable
     */
    stepIntoSlotContract () {
        if (this.currSlotContract === undefined) {
            return 'Deploy contract before step...'
        }
        const thisContract = Contracts[this.currSlotContract]
        let execResult: string
        const startingCLine = thisContract.cToAsmMap[thisContract.instructionPointer]
        do {
            execResult = Contracts[this.currSlotContract].step(this.breakpoints)
        } while (execResult === '' && startingCLine === thisContract.cToAsmMap[thisContract.instructionPointer])
        return execResult
    }

    /**
     * Steps contract currently debuggable
     */
    stepOverSlotContract () {
        if (this.currSlotContract === undefined) {
            return 'Deploy contract before step...'
        }
        const thisContract = Contracts[this.currSlotContract]
        let execResult: string
        const startingCLine = thisContract.cToAsmMap[thisContract.instructionPointer]
        const startingStackLength = thisContract.CodeStack.length
        do {
            execResult = Contracts[this.currSlotContract].step(this.breakpoints)
        } while (execResult === '' && (
            startingCLine === thisContract.cToAsmMap[thisContract.instructionPointer] ||
            thisContract.CodeStack.length !== startingStackLength))
        return execResult
    }

    /**
     * Steps contract currently debuggable
     */
    stepOutSlotContract () {
        if (this.currSlotContract === undefined) {
            return 'Deploy contract before step...'
        }
        const thisContract = Contracts[this.currSlotContract]
        let execResult: string
        const startingStackLength = thisContract.CodeStack.length
        do {
            execResult = Contracts[this.currSlotContract].step(this.breakpoints)
        } while (execResult === '' && thisContract.CodeStack.length >= startingStackLength)
        return execResult
    }

    /**
     *
     * @returns Number of contracts currently deployed. -1 if none deployed
     */
    getNumberOfContracts () {
        return Contracts.length - 1
    }

    /**
     * Deploy a new contract
     *
     * @param asmSourceCode new contract source code to be deployed
     */
    deploy (asmSourceCode: string, cSourceCode?: string) {
        const newContract = new CONTRACT(asmSourceCode, cSourceCode)
        this.currSlotContract = Contracts.push(newContract) - 1
        Blockchain.addBalanceTo(newContract.contract, Constants.deploy_add_balance)
        newContract.forgeBlock()
        this.updateLastMemoryValues()
        this.clearAllBreakpoints()
    }

    updateLastMemoryValues () {
        if (this.currSlotContract === undefined) {
            return
        }
        this.lastUpdateMemory = []
        Contracts[this.currSlotContract].Memory.forEach(item => {
            this.lastUpdateMemory.push({ varName: item.varName, value: item.value })
        })
        for (let i = 0; i < 4; i++) {
            this.lastA[i] = Contracts[this.currSlotContract].A[i]
            this.lastB[i] = Contracts[this.currSlotContract].B[i]
        }
    }
}
