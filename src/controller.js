'use strict'

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
        let incomingTX = BlockchainState.transactions.find(TX => TX.recipient == MachineState.contract && TX.processed === undefined)
        if (incomingTX !== undefined) {
            MachineState.stopped = false
            MachineState.frozen = false
            MachineState.finished = false
            MachineState.running = true
            MachineState.currentTX = incomingTX
            incomingTX.processed = true
        }
    },
}

const BlockchainController = {
    processBlock: function (){
        let txs = UpcomingTransactions.filter(obj => obj.blockheight == BlockchainState.currentBlock)
        let counter=0n

        txs.forEach( curTX => {
            let account = BlockchainState.accounts.find(obj => obj.id == curTX.sender)
            if (account == undefined) {
                BlockchainState.accounts.push( { id: curTX.sender, balance: -curTX.amount })
            } else {
                account.balance -= curTX.amount
            }

            account = BlockchainState.accounts.find(obj => obj.id == curTX.recipient)
            if (account == undefined) {
                BlockchainState.accounts.push( { id: curTX.sender, balance: curTX.amount })
            } else {
                account.balance += curTX.amount
            }
            counter++
            curTX.timestamp = (BigInt(curTX.blockheight) << 32n) + counter

            BlockchainState.transactions.push(curTX)
        })
    },
}