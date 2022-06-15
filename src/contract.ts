// Author: Rui Deleterium
// Project: https://github.com/deleterium/SC-Simulator
// License: BSD 3-Clause License

import {
    Constants,
    Blockchain
} from './index.js'

import { utils } from './utils.js'

import { MapObj, MemoryObj, Token } from './objTypes.js'
import { CPU } from './cpu.js'

/**
 * Object for transactions created by smart contracts
 *  @member {bigint} recipient
 *  @member {bigint} amount
 *  @member {bigint[]} messageArr
 */
interface ContractTransactionObj {
    recipient: bigint
    amount: bigint
    tokens: Token[]
    messageArr: bigint[]
}

export class CONTRACT {
    instructionPointer: number
    sleepUntilBlock: number
    previousBalance: bigint
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

    constructor (asmSourceCode: string, cSourceCode: string = '') {
        this.instructionPointer = 0
        this.sleepUntilBlock = 0
        this.previousBalance = 0n
        this.frozen = false
        this.running = true
        this.stopped = false
        this.finished = false
        this.dead = false
        this.activationAmount = Constants.activationAmount
        this.creator = Constants.creatorID
        this.contract = Constants.contractID
        this.codeHashId = 0n
        this.creationBlock = Blockchain.currentBlock
        this.DataPages = Constants.contractDPages
        this.UserStackPages = Constants.contractUSPages
        this.CodeStackPages = Constants.contractUSPages
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
        this.asmCodeArr = asmSourceCode.split('\n')
        this.cCodeArr = cSourceCode.split('\n')
        this.cToAsmMap = this.buildMap()
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
        if (this.sleepUntilBlock > Blockchain.currentBlock) {
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

    isPendingExecution () {
        if (this.frozen === false &&
            this.running === true) {
            return true
        }
        return false
    }

    /**
     * Triggered during new block forge. Handles activation of contract
     * and change contract state variables.
     *
     */
    forgeBlock () {
        // Activate contract if it was sleeping
        if (this.sleepUntilBlock > Blockchain.currentBlock) {
            return
        } else if (this.sleepUntilBlock === Blockchain.currentBlock) {
            this.stopped = false
            this.frozen = false
            this.finished = false
            this.running = true
            return
        }

        // find new incoming tx
        const incomingTX = Blockchain.transactions.find(TX => TX.recipient === this.contract &&
            TX.processed === false &&
            TX.amount >= this.activationAmount)
        if (incomingTX !== undefined) {
            this.stopped = false
            this.frozen = false
            this.finished = false
            this.running = true
            incomingTX.processed = true
            return
        }
        if (this.activationAmount === 0n) {
            // SmartContracts with zero activation amount never stop
            this.stopped = false
            this.frozen = false
            this.finished = false
            this.running = true
        }
    }

    /**
     * Triggered as last operations for current block height. Send
     * the messages created by contract on current block execution.
     */
    dispatchEnqueuedTX () {
        this.enqueuedTX.forEach(tx => {
            const recaccount = Blockchain.getAccountFromId(tx.recipient)
            recaccount.balance += tx.amount
            Blockchain.txHeight++

            const messageHex = utils.messagearray2hexstring(tx.messageArr)

            let type = 22
            if (tx.tokens.length !== 0) {
                type = 2
                tx.tokens.forEach(Tkn => {
                    const accountAsset = Blockchain.getAssetFromId(tx.recipient, Tkn.asset)
                    accountAsset.quantity += Tkn.quantity
                })
            }

            Blockchain.transactions.push({
                type,
                sender: this.contract,
                recipient: tx.recipient,
                txid: utils.getRandom64bit(),
                amount: tx.amount,
                tokens: tx.tokens,
                blockheight: Blockchain.currentBlock,
                timestamp: (BigInt(Blockchain.currentBlock) << 32n) + Blockchain.txHeight,
                messageArr: tx.messageArr,
                processed: false,
                messageHex: messageHex,
                messageText: utils.hexstring2string(messageHex)
            })
        })
        this.enqueuedTX = []
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

    saveMapOnBlockchain () {
        const oldValues = Blockchain.maps.find(obj => obj.id === this.contract)
        if (oldValues === undefined) {
            Blockchain.maps.push({
                id: this.contract,
                map: utils.deepCopy(this.map)
            })
            return
        }
        oldValues.map = utils.deepCopy(this.map)
    }
}
