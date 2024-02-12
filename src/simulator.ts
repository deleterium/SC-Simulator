import {
    MemoryObj
} from './objTypes.js'

import { CONTRACT } from './contract.js'
import { BLOCKCHAIN } from './blockchain.js'

export class SIMULATOR {
    private breakpoints: number[]
    lastUpdateMemory: MemoryObj[]
    lastA: [bigint, bigint, bigint, bigint ]
    lastB: [bigint, bigint, bigint, bigint ]
    CurrentContract: CONTRACT | undefined
    Blockchain: BLOCKCHAIN

    constructor (Blockchain: BLOCKCHAIN) {
        this.Blockchain = Blockchain
        this.breakpoints = []
        this.lastUpdateMemory = []
        this.lastA = [0n, 0n, 0n, 0n]
        this.lastB = [0n, 0n, 0n, 0n]
    }

    /** Resets Simulator class */
    reset () {
        this.CurrentContract = undefined
        this.breakpoints = []
        this.lastUpdateMemory = []
        this.lastA = [0n, 0n, 0n, 0n]
        this.lastB = [0n, 0n, 0n, 0n]
    }

    /**
     * Activate/deactivate a breakpoint
     *
     * @param bpline string with breakpoint line number
     *
     * @returns string "ADDED" or "REMOVED" or error
     */
    toggleBreakpoint (bpline: number) {
        if (this.CurrentContract === undefined) {
            return 'No contract deployed..'
        }
        let assembly = true
        if (this.CurrentContract.cCodeArr.length > 1) {
            assembly = false
        }
        if (assembly) {
            bpline--
            if (this.CurrentContract.getNextInstructionLine(bpline) !== bpline) {
                return `Line ${bpline} is not an instruction. Breakpoint NOT added.`
            }
        } else {
            const instrLine = this.CurrentContract.cToAsmMap.findIndex(cline => cline === bpline)
            if (instrLine === -1) {
                return `No instruction found on line ${bpline}. Breakpoint NOT added.`
            }
            const validInstruction = this.CurrentContract.getNextInstructionLine(instrLine)
            if (this.CurrentContract.cToAsmMap[validInstruction] !== bpline) {
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
        if (this.CurrentContract === undefined) {
            return 'Deploy contract before run...'
        }
        return this.CurrentContract.run(this.breakpoints)
    }

    /**
     * Steps contract currently debuggable
     */
    stepIntoSlotContract () {
        if (this.CurrentContract === undefined) {
            return 'Deploy contract before step...'
        }
        let execResult: string
        const startingCLine = this.CurrentContract.cToAsmMap[this.CurrentContract.instructionPointer]
        do {
            execResult = this.CurrentContract.step(this.breakpoints)
        } while (execResult === '' && startingCLine === this.CurrentContract.cToAsmMap[this.CurrentContract.instructionPointer])
        return execResult
    }

    /**
     * Steps contract currently debuggable
     */
    stepOverSlotContract () {
        if (this.CurrentContract === undefined) {
            return 'Deploy contract before step...'
        }
        let execResult: string
        const startingCLine = this.CurrentContract.cToAsmMap[this.CurrentContract.instructionPointer]
        const startingStackLength = this.CurrentContract.CodeStack.length
        do {
            execResult = this.CurrentContract.step(this.breakpoints)
        } while (execResult === '' && (
            startingCLine === this.CurrentContract.cToAsmMap[this.CurrentContract.instructionPointer] ||
            this.CurrentContract.CodeStack.length !== startingStackLength))
        return execResult
    }

    /**
     * Steps contract currently debuggable
     */
    stepOutSlotContract () {
        if (this.CurrentContract === undefined) {
            return 'Deploy contract before step...'
        }
        let execResult: string
        const startingStackLength = this.CurrentContract.CodeStack.length
        do {
            execResult = this.CurrentContract.step(this.breakpoints)
        } while (execResult === '' && this.CurrentContract.CodeStack.length >= startingStackLength)
        return execResult
    }

    /**
     *
     * @returns The contract currently debuggable or undefined if no contract was deployed
     */
    getCurrentSlotContract () {
        return this.CurrentContract
    }

    /**
     * @returns a copy of variables from current contract in simulation
     */
    dumpCurrentContractData () {
        if (this.CurrentContract === undefined) {
            throw new Error('Invalid use. No contract deployed')
        }
        return this.CurrentContract.dumpContractData()
    }

    /**
     *
     * @returns True if contract is ready for debug
     */
    isReady () {
        return !!this.CurrentContract
    }

    /**
     *
     * @returns Changes the current contract on 'slot'. Returns the new contract, or undefined if error
     */
    setCurrentSlotContract (address: bigint) {
        const nextContract = this.Blockchain.getContract(address)
        if (nextContract) {
            this.reset()
            this.CurrentContract = nextContract
        }
        return nextContract
    }

    /**
     * Deploy a new contract and set it to current slot
     *
     * @param asmSourceCode new contract source code to be deployed
     */
    updateLastMemoryValues () {
        if (this.CurrentContract === undefined) {
            return
        }
        this.lastUpdateMemory = []
        this.CurrentContract.Memory.forEach(item => {
            this.lastUpdateMemory.push({ varName: item.varName, value: item.value })
        })
        for (let i = 0; i < 4; i++) {
            this.lastA[i] = this.CurrentContract.A[i]
            this.lastB[i] = this.CurrentContract.B[i]
        }
    }
}
