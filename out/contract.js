// Author: Rui Deleterium
// Project: https://github.com/deleterium/SC-Simulator
// License: BSD 3-Clause License
import { Constants, Blockchain, } from './index.js';
import { utils } from './utils.js';
import { CPU } from './cpu.js';
export class CONTRACT {
    constructor(asm_sourcecode) {
        this.instructionPointer = 0;
        this.sleepUntilBlock = 0;
        this.previousBalance = 0n;
        this.frozen = false;
        this.running = true;
        this.stopped = false;
        this.finished = false;
        this.dead = false;
        this.activationAmount = Constants.activationAmount;
        this.creator = Constants.creatorID;
        this.contract = Constants.contractID;
        this.creationBlock = Blockchain.currentBlock;
        this.DataPages = Constants.contractDPages;
        this.UserStackPages = Constants.contractUSPages;
        this.CodeStackPages = Constants.contractUSPages;
        this.Memory = [];
        this.UserStack = [];
        this.CodeStack = [];
        this.enqueuedTX = [];
        this.exception = "";
        this.A = [0n, 0n, 0n, 0n];
        this.B = [0n, 0n, 0n, 0n];
        this.PCS = 0;
        this.ERR = null;
        this.sourceCode = asm_sourcecode.split("\n");
        CPU.cpu_deploy(this);
        while (Blockchain.accounts.find(acc => acc.id == this.contract) !== undefined) {
            this.contract++;
        }
    }
    run(bps = []) {
        var bp = null;
        var retCode = this.checkState();
        if (retCode !== "") {
            return retCode;
        }
        do {
            if (CPU.cpu(this) === null) {
                this.dead = true;
                this.exception = "Unknow instruction or End of file reached";
                return "ERROR: Unknow instruction or End of file reached";
            }
            bps.forEach(bpline => {
                if (this.instructionPointer == bpline)
                    bp = bpline;
            });
        } while (this.stopped === false &&
            this.finished === false &&
            this.dead === false &&
            this.frozen === false &&
            bp === null);
        if (bp !== null) {
            return "Stopped on breakpoint " + bp + ".";
        }
        else {
            return "Run end. Check status. Forge new block to continue.";
        }
    }
    /**
     * Runs only one instruction (step into)
     *
     * @return string indicating error/status. Empty string on success.
     */
    step(bps = []) {
        var cpu_exit;
        var bp = null;
        var retCode = this.checkState();
        if (retCode !== "") {
            return retCode;
        }
        do {
            cpu_exit = CPU.cpu(this);
        } while (cpu_exit === false);
        if (cpu_exit === null) {
            this.dead = true;
            this.exception = "Unknow instruction or End of file reached";
            return "ERROR: Unknow instruction or End of file reached";
        }
        bps.forEach(bpline => {
            if (this.instructionPointer == bpline) {
                bp = bpline;
            }
        });
        if (bp !== null) {
            return "Reached breakpoint " + bp + ".";
        }
        return "";
    }
    // Verifies if contract can be run
    checkState() {
        if (this.sleepUntilBlock > Blockchain.currentBlock) {
            return "Contract sleeping!";
        }
        if (this.dead === true ||
            this.stopped === true ||
            this.frozen === true ||
            this.finished === true ||
            this.instructionPointer === null) {
            return "Contract execution done on this round";
        }
        return "";
    }
    isPendingExecution() {
        if (this.frozen === false &&
            this.running === true) {
            return true;
        }
        return false;
    }
    /**
     * Triggered during new block forge. Handles activation of contract
     * and change contract state variables.
     *
     */
    forgeBlock() {
        // Activate contract if it was sleeping
        if (this.sleepUntilBlock > Blockchain.currentBlock) {
            return;
        }
        else if (this.sleepUntilBlock == Blockchain.currentBlock) {
            this.stopped = false;
            this.frozen = false;
            this.finished = false;
            this.running = true;
            return;
        }
        // find new incoming tx
        let incomingTX = Blockchain.transactions.find(TX => TX.recipient == this.contract
            && TX.processed == false
            && TX.amount >= this.activationAmount
            && TX.blockheight < Blockchain.currentBlock);
        if (incomingTX !== undefined) {
            this.stopped = false;
            this.frozen = false;
            this.finished = false;
            this.running = true;
            incomingTX.processed = true;
            return;
        }
        if (this.activationAmount == 0n) {
            //SmartContracts with zero activation amount never stop
            this.stopped = false;
            this.frozen = false;
            this.finished = false;
            this.running = true;
        }
    }
    /**
     * Triggered as last operations for current block height. Send
     * the messages created by contract on current block execution.
     */
    dispatchEnqueuedTX() {
        this.enqueuedTX.forEach(tx => {
            let recaccount = Blockchain.accounts.find(obj => obj.id == tx.recipient);
            if (recaccount === undefined) {
                Blockchain.accounts.push({ id: tx.recipient, balance: tx.amount });
            }
            else {
                recaccount.balance += tx.amount;
            }
            Blockchain.txHeight++;
            let messageHex = utils.messagearray2hexstring(tx.messageArr);
            Blockchain.transactions.push({
                sender: this.contract,
                recipient: tx.recipient,
                txid: utils.getRandom64bit(),
                amount: tx.amount,
                blockheight: Blockchain.currentBlock,
                timestamp: (BigInt(Blockchain.currentBlock) << 32n) + Blockchain.txHeight,
                messageArr: tx.messageArr,
                processed: false,
                messageHex: messageHex,
                messageText: utils.hexstring2string(messageHex),
            });
        });
        this.enqueuedTX = [];
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
    getNextInstructionLine(line = this.instructionPointer + 1) {
        let instr;
        for (; line < this.sourceCode.length; line++) {
            instr = this.sourceCode[line];
            if (/^\s*$/.exec(instr) !== null
                || /^\s*(\w+):\s*$/.exec(instr) !== null
                || /^\s*\^.*/.exec(instr) !== null) {
                continue;
            }
            break;
        }
        return line;
    }
}
