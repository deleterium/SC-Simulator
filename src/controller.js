'use strict'

const Controller = {

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
}
