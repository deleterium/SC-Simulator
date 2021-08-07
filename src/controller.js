'use strict'

// Author: Rui Deleterium
// Project: https://github.com/deleterium/SC-Simulator
// License: BSD 3-Clause License

const ContractController = {

    run: function (){

        var bp=false

        if (MachineState.sourceCode === null) {
            return "Deploy a contract first."
        }

        var retCode = this.checkState()
        if (retCode !== undefined){
            return retCode
        }
        
        do {
            if (cpu()===null) {
                MachineState.dead=true
                MachineState.exception="Unknow instruction or End of file reached"
                return "ERROR: Unknow instruction or End of file reached"
            }
            SimulatorState.breakpoints.forEach( function (bpline){
                if (MachineState.instructionPointer == bpline)
                    bp=bpline
            })
        } while (MachineState.stopped===false &&
                MachineState.finished===false &&
                MachineState.dead===false &&
                MachineState.frozen===false &&
                bp === false);
        if (bp !== false) {
            return "Stopped on breakpoint "+bp+"."
        } else {
            return "Run end. Check status. Forge new block to continue."
        }
    },

    step: function (){

        var cpu_exit
        var bp=false

        var retCode = this.checkState()
        if (retCode !== undefined){
            return retCode
        }
    
        do {
            cpu_exit = cpu()
        } while (cpu_exit === false)
    
        if (cpu_exit === null) {
            MachineState.dead=true
            MachineState.exception="Unknow instruction or End of file reached"
            return "ERROR: Unknow instruction or End of file reached"
        }

        SimulatorState.breakpoints.forEach( function (bpline){
            if (MachineState.instructionPointer == bpline)
                bp=bpline
        })
        if (bp !== false) {
            return "Stopped on breakpoint "+bp+"."
        }
    },

    // Verifies if contract can be run
    checkState: function(){
        if (MachineState.sourceCode === null) {
            return "Deploy a contract first."
        }
        
        if (MachineState.sleepUntilBlock > BlockchainState.currentBlock) {
            return "Contract sleeping!"
        }

        if (MachineState.dead === true ||
            MachineState.stopped === true ||
            MachineState.frozen === true ||
            MachineState.finished === true ||
            MachineState.instructionPointer === null) {
            return "Contract execution done on this round"
        }
    },

    // Queue TX for current block to contract
    processBlock: function () {

        // Activate contract if it was sleeping
        if (MachineState.sleepUntilBlock > BlockchainState.currentBlock) {
            return
        } else if (MachineState.sleepUntilBlock == BlockchainState.currentBlock) {
            MachineState.stopped = false
            MachineState.frozen = false
            MachineState.finished = false
            MachineState.running = true
            return
        }

        // find new incoming tx
        let incomingTX = BlockchainState.transactions.find(TX => TX.recipient == MachineState.contract
            && TX.processed === undefined
            && TX.amount >= MachineState.activationAmount
            && TX.blockheight < BlockchainState.currentBlock)
        if (incomingTX !== undefined) {
            MachineState.stopped = false
            MachineState.frozen = false
            MachineState.finished = false
            MachineState.running = true
            incomingTX.processed = true
            return
        }
        if (MachineState.activationAmount == 0n) {
            //SmartContracts with zero activation amount never stop
            MachineState.stopped = false
            MachineState.frozen = false
            MachineState.finished = false
            MachineState.running = true
        }
    },

    enqueuedTX: [],

    dispatchEnqueuedTX: function () {
        ContractController.enqueuedTX.forEach( function (tx){
            let recaccount = BlockchainState.accounts.find(obj => obj.id == tx.recipient)
            if (recaccount === undefined) {
                BlockchainState.accounts.push( { id: tx.recipient, balance: tx.amount })
            } else {
                recaccount.balance += tx.amount
            }
            BlockchainState.txHeight++
            tx.sender = MachineState.contract
            tx.timestamp = (BigInt(BlockchainState.currentBlock) << 32n) + BlockchainState.txHeight
            tx.txid = utils.getRandom64bit()
            tx.blockheight = BlockchainState.currentBlock
            tx.messageHex = utils.messagearray2hexstring(tx.messageArr)
            tx.messageText = utils.hexstring2string(tx.messageHex)

            BlockchainState.transactions.push(tx)
        })
        ContractController.enqueuedTX = []
    },
}

const BlockchainController = {
    processBlock: function (){
        let txs = UpcomingTransactions.filter(obj => obj.blockheight == BlockchainState.currentBlock)

        txs.forEach( curTX => {
            let account = BlockchainState.accounts.find(obj => obj.id == curTX.sender)
            if (account === undefined) {
                BlockchainState.accounts.push( { id: curTX.sender, balance: -curTX.amount })
            } else {
                account.balance -= curTX.amount
            }

            account = BlockchainState.accounts.find(obj => obj.id == curTX.recipient)
            if (account === undefined) {
                BlockchainState.accounts.push( { id: curTX.recipient, balance: curTX.amount })
            } else {
                account.balance += curTX.amount
            }
            BlockchainState.txHeight++
            curTX.timestamp = (BigInt(curTX.blockheight) << 32n) + BlockchainState.txHeight
            curTX.txid = utils.getRandom64bit()
            let txhexstring
            if (curTX.messageText !== undefined) {
                txhexstring = utils.string2hexstring(curTX.messageText)
            }
            if (curTX.messageHex !== undefined) {
                txhexstring = curTX.messageHex
            }
            curTX.messageArr = utils.hexstring2messagearray(txhexstring)

            BlockchainState.transactions.push(curTX)
        })
    },
}