// Author: Rui Deleterium
// Project: https://github.com/deleterium/SC-Simulator
// License: BSD 3-Clause License

import {
    Constants
} from './index.js'

import { utils } from './utils.js'

import { ContractDeployOptions, ContractTransactionObj, MapObj, MemoryObj, Token } from './objTypes.js'
import { CPU } from './cpu.js'
import { BLOCKCHAIN } from './blockchain.js'

export class CONTRACT {
    Blockchain: BLOCKCHAIN
    instructionPointer: number
    sleepUntilBlock: number
    balance: bigint
    previousBalance: bigint
    executionFee: bigint
    tokens: Token[]
    frozen: boolean
    running: boolean
    stopped: boolean
    finished: boolean
    dead: boolean
    activationAmount: bigint
    creator: bigint
    contract: bigint
    codeHashId: bigint
    creationBlock: number
    DataPages: number
    UserStackPages: number
    CodeStackPages: number
    Memory: MemoryObj[]
    UserStack: bigint[]
    CodeStack: number[]
    enqueuedTX: ContractTransactionObj []
    exception: string
    A: [ bigint, bigint, bigint, bigint ]
    B: [ bigint, bigint, bigint, bigint ]
    map: MapObj[]
    issuedAssets: bigint[]
    PCS: number
    ERR: number | null
    asmCodeArr: string[]
    cCodeArr: string[]
    cToAsmMap: number[]
    registersScopeMap: string[]

    constructor (Blockchain: BLOCKCHAIN, options: ContractDeployOptions) {
        this.Blockchain = Blockchain
        this.instructionPointer = 0
        this.sleepUntilBlock = 0
        this.balance = 0n
        this.previousBalance = 0n
        this.executionFee = 0n
        this.tokens = []
        this.frozen = false
        this.running = true
        this.stopped = false
        this.finished = false
        this.dead = false
        this.activationAmount = Constants.activationAmount
        this.creator = options.creatorID ?? Constants.creatorID
        this.contract = options.contractID ?? Constants.contractID
        this.codeHashId = options.codeHashId ?? 0n
        this.creationBlock = Blockchain.getCurrentBlock()
        this.DataPages = options.dataPages ?? Constants.contractDPages
        this.UserStackPages = options.userStackPages ?? Constants.contractUSPages
        this.CodeStackPages = options.codeStackPages ?? Constants.contractCSPages
        this.Memory = []
        this.UserStack = []
        this.CodeStack = []
        this.enqueuedTX = []
        this.exception = ''
        this.A = [0n, 0n, 0n, 0n]
        this.B = [0n, 0n, 0n, 0n]
        this.map = []
        this.issuedAssets = []
        this.PCS = 0
        this.ERR = null
        this.asmCodeArr = options.asmSourceCode.split('\n')
        this.cCodeArr = options.cSourceCode ? options.cSourceCode.split('\n') : ['']
        this.cToAsmMap = this.buildMap()
        this.registersScopeMap = this.buildScopeMap()
        CPU.cpuDeploy(this)
        while (Blockchain.accounts.find(acc => acc.id === this.contract) !== undefined) {
            this.contract++
        }
    }

    buildMap () : number[] {
        let currCLine = 1
        const cMap = this.asmCodeArr.map((line) => {
            const verboseAssembly = /^\s*\^comment line (\d+)\s+/.exec(line)
            if (verboseAssembly !== null) {
                currCLine = Number(verboseAssembly[1])
            }
            return currCLine
        })
        if (currCLine === 1) {
            // verboseAssembly not active, debug as assembly
            return this.asmCodeArr.map((line, idx) => idx)
        }
        return cMap
    }

    buildScopeMap () : string[] {
        let registers = ''
        const registerMap = this.asmCodeArr.map((line) => {
            const verboseScope = /^\s*\^comment scope ([\w,]+)(:\w+)?/.exec(line)
            if (verboseScope === null) {
                return registers
            }
            if (verboseScope[2] === undefined) {
                registers = verboseScope[1]
                return registers
            }
            registers = registers.replace(verboseScope[1], verboseScope[2])
            return registers
        })
        return registerMap
    }

    run (bps: number[] = []): string {
        let bp: number | null = null

        const retCode = this.checkState()
        if (retCode !== '') {
            return retCode
        }

        do {
            if (CPU.cpu(this) === null) {
                this.dead = true
                this.exception = 'Unknow instruction or End of file reached'
                return 'ERROR: Unknow instruction or End of file reached'
            }
            bps.forEach(bpline => {
                if (this.instructionPointer === bpline) {
                    bp = bpline
                }
            })
        } while (this.stopped === false &&
                this.finished === false &&
                this.dead === false &&
                this.frozen === false &&
                bp === null)
        if (bp !== null) {
            return `Stopped on breakpoint ${bp + 1}.`
        } else {
            return 'Run end. Check status. Forge new block to continue.'
        }
    }

    /**
     * Runs only one instruction (step into)
     *
     * @return string indicating error/status. Empty string on success.
     */
    step (bps: number[] = []): string {
        let cpuExitCode: boolean|null
        let bp: number|null = null

        const retCode = this.checkState()
        if (retCode !== '') {
            return retCode
        }

        do {
            cpuExitCode = CPU.cpu(this)
        } while (cpuExitCode === false)

        if (cpuExitCode === null) {
            this.dead = true
            this.exception = 'Unknow instruction or End of file reached'
            return 'ERROR: Unknow instruction or End of file reached'
        }
        bps.forEach(bpline => {
            if (this.instructionPointer === bpline) {
                bp = bpline
            }
        })
        if (bp !== null) {
            return `Reached breakpoint ${bp + 1}.`
        }
        return ''
    }

    // Verifies if contract can be run
    checkState (): string {
        if (this.sleepUntilBlock > this.Blockchain.getCurrentBlock()) {
            return 'Contract sleeping!'
        }

        if (this.dead === true ||
            this.stopped === true ||
            this.frozen === true ||
            this.finished === true ||
            this.instructionPointer === null) {
            return 'Contract execution done on this round'
        }

        return ''
    }

    /**
     * Sets the internal variables if contract is activated
     */
    private contractBlockStartUp () {
        this.stopped = false
        this.frozen = false
        this.finished = false
        this.running = true
        this.balance = this.Blockchain.getBalanceFrom(this.contract)
        this.previousBalance = this.balance
        this.tokens = utils.deepCopy(this.Blockchain.getAssetsFromId(this.contract))
        this.executionFee = 0n
    }

    isPendingExecution () {
        if (this.frozen === false &&
            this.running === true) {
            return true
        }
        return false
    }

    /**
     * Triggered during new block forge. Prepares the contract, sets flags and handles
     * activation of contract.
     *
     */
    preForgeBlock () {
        // Activation by sleeping
        const currentBlock = this.Blockchain.getCurrentBlock()
        if (this.sleepUntilBlock > currentBlock) {
            return
        }
        if (this.sleepUntilBlock === currentBlock) {
            this.contractBlockStartUp()
            return
        }

        // Activation by incoming tx
        const incomingTX = this.Blockchain.transactions.find(TX =>
            TX.recipient === this.contract &&
            TX.blockheight === currentBlock - 1 &&
            TX.amount >= this.activationAmount)
        if (incomingTX !== undefined) {
            this.contractBlockStartUp()
            return
        }

        // Activation by zero activationAmount
        if (this.activationAmount === 0n && this.Blockchain.getBalanceFrom(this.contract) > 0n) {
            // SmartContracts with zero activation amount never stop
            this.contractBlockStartUp()
        }
    }

    /**
     * Ensures the contract was fully executed and update the information in Blockchain
     *
     */
    postForgeBlock () {
        this.run()
        this.Blockchain.addTransactions(this.enqueuedTX)
        this.enqueuedTX = []
        this.Blockchain.saveMap(this.contract, this.map)
        this.Blockchain.burnBalance(this.contract, this.executionFee)
    }

    /**
     * Returns the next line with a valid instruction
     *
     * @param {?number} line - Line to start searching. If no one
     * supplied, start searching on current instructionPointer+1
     *
     * @returns Found line. If no one found, returns sourceCode length
     *  to trigger dead state on next execution try.
     */
    getNextInstructionLine (line: number = this.instructionPointer + 1): number {
        for (;line < this.asmCodeArr.length; line++) {
            const instr = this.asmCodeArr[line]
            if (/^\s*$/.exec(instr) !== null ||
                 /^\s*(\w+):\s*$/.exec(instr) !== null ||
                 /^\s*\^.*/.exec(instr) !== null) {
                continue
            }
            break
        }
        return line
    }

    /**
     * Get all current contract data
     */
    dumpContractData () {
        return utils.deepCopy({
            instructionPointer: this.instructionPointer,
            sleepUntilBlock: this.sleepUntilBlock,
            balance: this.balance,
            previousBalance: this.previousBalance,
            executionFee: this.executionFee,
            tokens: this.tokens,
            frozen: this.frozen,
            running: this.running,
            stopped: this.stopped,
            finished: this.finished,
            dead: this.dead,
            activationAmount: this.activationAmount,
            creator: this.creator,
            contract: this.contract,
            codeHashId: this.codeHashId,
            creationBlock: this.creationBlock,
            DataPages: this.DataPages,
            UserStackPages: this.UserStackPages,
            CodeStackPages: this.CodeStackPages,
            Memory: this.Memory,
            UserStack: this.UserStack,
            CodeStack: this.CodeStack,
            enqueuedTX: this.enqueuedTX,
            exception: this.exception,
            A: this.A,
            B: this.B,
            map: this.map,
            issuedAssets: this.issuedAssets,
            PCS: this.PCS,
            ERR: this.ERR,
            asmCodeArr: this.asmCodeArr,
            cCodeArr: this.cCodeArr,
            cToAsmMap: this.cToAsmMap,
            registersScopeMap: this.registersScopeMap
        })
    }
}
