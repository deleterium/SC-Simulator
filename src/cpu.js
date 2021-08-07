"use strict";

// Author: Rui Deleterium
// Project: https://github.com/deleterium/SC-Simulator
// License: BSD 3-Clause License

const cpu_microcode = [
    { name: "blank", stepFee: 0n,   regex:   /^\s*$/,
        execute: function () {
            MachineState.instructionPointer = utils.getNextInstructionLine(MachineState.instructionPointer+1)
            return false
        }
    },
    { name: "label", stepFee: 0n,   regex:   /^\s*(\w+):\s*$/,
        execute: function () {
            MachineState.instructionPointer = utils.getNextInstructionLine(MachineState.instructionPointer+1)
            return false
        }
    },
    { name: "comment", stepFee: 0n,   regex:   /^\s*\^comment\s+(.*)/,
        execute: function () {
            MachineState.instructionPointer = utils.getNextInstructionLine(MachineState.instructionPointer+1)
            return false
        }
    },
    { name: "declare", stepFee: 0n,   regex:   /^\s*\^declare\s+(\w+)\s*$/,
        execute: function (regexParts) {
            if (MachineState.Memory.find(mem => mem.name == regexParts[1]) === undefined){
                MachineState.Memory.push( { name:regexParts[1], value: 0n } )
            }
            MachineState.instructionPointer = utils.getNextInstructionLine(MachineState.instructionPointer+1)
            return false
        }
    },
    { name: "const", stepFee: 0n,    regex:   /^\s*\^const\s+SET\s+@(\w+)\s+#([\da-f]{16})\b\s*$/,
        execute: function (regexParts) {
            let variable = MachineState.Memory.find(mem => mem.name == regexParts[1])
            if (variable === undefined){
                //only happens in simulator
                MachineState.dead=true
                MachineState.exception="const directive but variable not found"
                return true
            }
            variable.value = BigInt("0x"+regexParts[2])
            MachineState.instructionPointer = utils.getNextInstructionLine(MachineState.instructionPointer+1)
            return false
        }
    },
    { name: "program", stepFee: 0n,   regex:   /^\s*\^program\s+(\w+)\s+([\s\S]+)$/,
        execute: function (regexParts) {
            if (regexParts[1] == "activationAmount"){
                MachineState.activationAmount = BigInt(regexParts[2].trim())
            }
            MachineState.instructionPointer = utils.getNextInstructionLine(MachineState.instructionPointer+1)
            return false
        }
    },
    { name: "SET_VAL", stepFee: 1n,   regex:   /^\s*SET\s+@(\w+)\s+#([\da-f]{16})\b\s*$/,
        execute: function (regexParts) {
            let variable = MachineState.Memory.find(mem => mem.name == regexParts[1])
            if (variable === undefined){
                MachineState.Memory.push( { name:regexParts[1], value: BigInt("0x"+regexParts[2]) } )
            } else {
                variable.value = BigInt("0x"+regexParts[2])
            }
            MachineState.instructionPointer = utils.getNextInstructionLine(MachineState.instructionPointer+1)
            return true
        }
    },
    { name: "SET_DAT", stepFee: 1n,   regex:   /^\s*SET\s+@(\w+)\s+\$(\w+)\s*$/,
        execute: function (regexParts) {
            let variable1 = MachineState.Memory.find(mem => mem.name == regexParts[1])
            let variable2 = MachineState.Memory.find(mem => mem.name == regexParts[2])
            let val
            if (variable2 === undefined){
                val = 0n
            } else {
                val = variable2.value
            }
            if (variable1 === undefined){
                MachineState.Memory.push( { name:regexParts[1], value: val } )
            } else {
                variable1.value = val
            }
            MachineState.instructionPointer = utils.getNextInstructionLine(MachineState.instructionPointer+1)
            return true
        }
    },
    { name: "CLR", stepFee: 1n,  regex:   /^\s*CLR\s+@(\w+)\s*$/,
        execute: function (regexParts) {
            let variable1 = MachineState.Memory.find(mem => mem.name == regexParts[1])
            if (variable1 === undefined){
                MachineState.Memory.push( { name:regexParts[1], value: 0n } )
            } else {
                variable1.value = 0n
            }
            MachineState.instructionPointer = utils.getNextInstructionLine(MachineState.instructionPointer+1)
            return true
        }
    },
    { name: "INC", stepFee: 1n,  regex:   /^\s*INC\s+@(\w+)\s*$/,
        execute: function (regexParts) {
            let variable1 = MachineState.Memory.find(mem => mem.name == regexParts[1])
            if (variable1 === undefined){
                MachineState.Memory.push( { name:regexParts[1], value: 1n } )
            } else {
                variable1.value =  (variable1.value + 1n) % 18446744073709551616n
            }
            MachineState.instructionPointer = utils.getNextInstructionLine(MachineState.instructionPointer+1)
            return true
        }
    },
    { name: "DEC", stepFee: 1n,  regex:   /^\s*DEC\s+@(\w+)\s*$/,
        execute: function (regexParts) {
            let variable1 = MachineState.Memory.find(mem => mem.name == regexParts[1])
            if (variable1 === undefined){
                MachineState.Memory.push( { name:regexParts[1], value: utils.minus1 } )
            } else {
                if (variable1.value == 0) {
                    variable1.value = utils.minus1
                } else {
                    variable1.value = variable1.value - 1n
                }
            }
            MachineState.instructionPointer = utils.getNextInstructionLine(MachineState.instructionPointer+1)
            return true
        }
    },
    { name: "ADD", stepFee: 1n, regex:   /^\s*ADD\s+@(\w+)\s+\$(\w+)\s*$/,
        execute: function (regexParts) {
            let variable1 = MachineState.Memory.find(mem => mem.name == regexParts[1])
            let variable2 = MachineState.Memory.find(mem => mem.name == regexParts[2])
            let val
            if (variable2 === undefined){
                val = 0n
            } else {
                val = variable2.value
            }
            if (variable1 === undefined){
                MachineState.Memory.push( { name:regexParts[1], value: val } )
            } else {
                variable1.value = (variable1.value + val) % utils.pow2to64
            }
            MachineState.instructionPointer = utils.getNextInstructionLine(MachineState.instructionPointer+1)
            return true
        }
    },
    { name: "SUB", stepFee: 1n, regex:   /^\s*SUB\s+@(\w+)\s+\$(\w+)\s*$/,
        execute: function (regexParts) {
            let variable1 = MachineState.Memory.find(mem => mem.name == regexParts[1])
            let variable2 = MachineState.Memory.find(mem => mem.name == regexParts[2])
            let val
            if (variable2 === undefined){
                val = 0n
            } else {
                val = variable2.value
            }
            if (variable1 === undefined){
                val = (utils.pow2to64 - val) % utils.pow2to64
                MachineState.Memory.push( { name:regexParts[1], value: val } )
            } else {
                variable1.value = (utils.pow2to64 + variable1.value - val) % utils.pow2to64
            }
            MachineState.instructionPointer = utils.getNextInstructionLine(MachineState.instructionPointer+1)
            return true
        }
    },
    { name: "MUL", stepFee: 1n, regex:   /^\s*MUL\s+@(\w+)\s+\$(\w+)\s*$/,
        execute: function (regexParts) {
            let variable1 = MachineState.Memory.find(mem => mem.name == regexParts[1])
            let variable2 = MachineState.Memory.find(mem => mem.name == regexParts[2])
            let val
            if (variable2 === undefined){
                val = 0n
            } else {
                val = variable2.value
            }
            if (variable1 === undefined){
                MachineState.Memory.push( { name:regexParts[1], value: 0n } )
            } else {
                variable1.value = (variable1.value * val) % utils.pow2to64
            }
            MachineState.instructionPointer = utils.getNextInstructionLine(MachineState.instructionPointer+1)
            return true
        }
    },
    { name: "DIV", stepFee: 1n,  regex:   /^\s*DIV\s+@(\w+)\s+\$(\w+)\s*$/,
        execute: function (regexParts) {
            let variable1 = MachineState.Memory.find(mem => mem.name == regexParts[1])
            let variable2 = MachineState.Memory.find(mem => mem.name == regexParts[2])
            if (variable2 === undefined || variable2.value == 0){
                if (MachineState.ERR === null) {
                    MachineState.dead=true
                    MachineState.exception="Division by zero"
                    return true
                }
                MachineState.instructionPointer = MachineState.ERR
                    return true
            }
            if (variable1 === undefined){
                MachineState.Memory.push( { name:regexParts[1], value: 0n } )
            } else {
                let val1 = utils.unsigned2signed(variable1.value)
                let val2 = utils.unsigned2signed(variable2.value)

                variable1.value = utils.signed2unsigned(val1 / val2)
            }
            MachineState.instructionPointer = utils.getNextInstructionLine(MachineState.instructionPointer+1)
            return true
        }
    },
    { name: "BOR / AND / XOR", stepFee: 1n,  regex:   /^\s*(BOR|AND|XOR)\s+@(\w+)\s+\$(\w+)\s*$/,
        execute: function (regexParts) {
            let variable1 = MachineState.Memory.find(mem => mem.name == regexParts[2])
            let variable2 = MachineState.Memory.find(mem => mem.name == regexParts[3])
            let val1, val2
            if (variable1 === undefined){
                val1 = 0n
            } else {
                val1 = variable1.value
            }
            if (variable2 === undefined){
                val2 = 0n
            } else {
                val2 = variable2.value
            }

            if (regexParts[1] == 'BOR') val1 |= val2
            else if (regexParts[1] == 'AND') val1 &= val2
            else val1 ^= val2

            if (variable1 === undefined){
                MachineState.Memory.push( { name:regexParts[2], value: val1 } )
            } else {
                variable1.value = val1
            }
            MachineState.instructionPointer = utils.getNextInstructionLine(MachineState.instructionPointer+1)
            return true
        }
    },
    { name: "NOT", stepFee: 1n,   regex:   /^\s*NOT\s+@(\w+)\s*$/,
        execute: function (regexParts) {
            let variable1 = MachineState.Memory.find(mem => mem.name == regexParts[1])
            if (variable1 === undefined){
                MachineState.Memory.push( { name:regexParts[1], value: utils.minus1 } )
            } else {
                //using xor with 0xFFFFFFFFFFFFFFFF to emulate 64bit operation
                variable1.value = variable1.value ^ utils.minus1
            }
            MachineState.instructionPointer = utils.getNextInstructionLine(MachineState.instructionPointer+1)
            return true
        }
    },
    { name: "SET_IND", stepFee: 1n,   regex:   /^\s*SET\s+@(\w+)\s+\$\(\$(\w+)\)\s*$/,
        execute: function (regexParts) {
            let variable1 = MachineState.Memory.find(mem => mem.name == regexParts[1])
            let variable2 = MachineState.Memory.find(mem => mem.name == regexParts[2])
            let addr
            if (variable2 === undefined){
                addr = 0n
            } else {
                addr = variable2.value
            }

            if (addr > 32 * MachineState.DataPages ||addr < 0) {
                if (MachineState.ERR === null) {
                    MachineState.dead=true
                    MachineState.exception="Variable address out of range"
                    return true
                }
                MachineState.instructionPointer = MachineState.ERR
                    return true
            }
            if ( MachineState.Memory[addr] === undefined){
                //only happens in simulator
                MachineState.dead=true
                MachineState.exception="Variable address not found"
                return true
            }
            if (variable1 === undefined){
                MachineState.Memory.push( { name:regexParts[1], value: MachineState.Memory[addr].value } )
            } else {
                variable1.value = MachineState.Memory[addr].value
            }
            MachineState.instructionPointer = utils.getNextInstructionLine(MachineState.instructionPointer+1)
            return true
        }
    },
    { name: "SET_IDX", stepFee: 1n, regex:   /^\s*SET\s+@(\w+)\s+\$\(\$(\w+)\s*\+\s*\$(\w+)\)\s*$/,
        execute: function (regexParts) {
            let variable1 = MachineState.Memory.find(mem => mem.name == regexParts[1])
            let variable2 = MachineState.Memory.find(mem => mem.name == regexParts[2])
            let variable3 = MachineState.Memory.find(mem => mem.name == regexParts[3])
            let val2, val3, addr
            if (variable2 === undefined) val2 = 0n
            else val2 = variable2.value
            if (variable3 === undefined) val3 = 0n
            else val3 = variable3.value
            addr = val2 + val3

            if (addr > 32 * MachineState || variable2.value < 0) {
                if (MachineState.ERR === null) {
                    MachineState.dead=true
                    MachineState.exception="Variable address out of range"
                    return true
                }
                MachineState.instructionPointer = MachineState.ERR
                    return true
            }
            if ( MachineState.Memory[addr] === undefined){
                //Error only in simulator.
                MachineState.dead=true
                MachineState.exception="Variable address not found"
                return true
            }

            if (variable1 === undefined){
                MachineState.Memory.push( { name:regexParts[1], value: MachineState.Memory[addr].value } )
            } else {
                variable1.value = MachineState.Memory[addr].value
            }
            MachineState.instructionPointer = utils.getNextInstructionLine(MachineState.instructionPointer+1)
            return true
        }
    },
    { name: "PSH", stepFee: 1n,  regex:   /^\s*PSH\s+\$(\w+)\s*$/,
        execute: function (regexParts) {
            let variable1 = MachineState.Memory.find(mem => mem.name == regexParts[1])
            let val1
            if (variable1 === undefined) val1 = 0n
            else val1 = variable1.value

            MachineState.UserStack.push( val1 )
            if (MachineState.UserStack.length > 16 * MachineState.UserStackPages) {
                if (MachineState.ERR === null) {
                    MachineState.dead=true
                    MachineState.exception="User Stack buffer overflow"
                    return true
                }
                MachineState.instructionPointer = MachineState.ERR
                    return true
            }

            MachineState.instructionPointer = utils.getNextInstructionLine(MachineState.instructionPointer+1)
            return true
        }
    },
    { name: "POP", stepFee: 1n,  regex:   /^\s*POP\s+@(\w+)\s*$/,
        execute: function (regexParts) {
            let variable1 = MachineState.Memory.find(mem => mem.name == regexParts[1])
            let val1
            if (MachineState.UserStack.length == 0) {
                if (MachineState.ERR === null) {
                    MachineState.dead=true
                    MachineState.exception="User Stack buffer underflow"
                    return true
                }
                MachineState.instructionPointer = MachineState.ERR
                    return true
            }
            val1 = MachineState.UserStack.pop()

            if (variable1 === undefined )
                MachineState.Memory.push( { name:regexParts[1], value:val1 } )
            else
                variable1.value = val1

            MachineState.instructionPointer = utils.getNextInstructionLine(MachineState.instructionPointer+1)
            return true
        }
    },
    { name: "JMP_SUB", stepFee: 1n,   regex:   /^\s*JSR\s+:(\w+)\s*$/,
        execute: function (regexParts) {

            MachineState.CodeStack.push( utils.getNextInstructionLine(MachineState.instructionPointer+1) )
            if (MachineState.CodeStack.length > 16 * MachineState.CodeStackPages) {
                if (MachineState.ERR === null) {
                    MachineState.dead=true
                    MachineState.exception="Code Stack buffer overflow"
                    return true
                }
                MachineState.instructionPointer = MachineState.ERR
                    return true
            }

            let custom_regex = new RegExp("^\\s*("+regexParts[1]+"):\\s*$")
            let destination = MachineState.sourceCode.findIndex( line => custom_regex.exec(line) !== null)
            if (destination == -1){
                MachineState.dead=true
                MachineState.exception="Jump Subroutine destination label '"+regexParts[1]+"' not found"
                return true
            }

            MachineState.instructionPointer = utils.getNextInstructionLine(destination)
            return true
        }
    },
    { name: "RET_SUB", stepFee: 1n,    regex:   /^\s*RET\s*$/,
        execute: function (regexParts) {

            if (MachineState.CodeStack.length == 0) {
                if (MachineState.ERR === null) {
                    MachineState.dead=true
                    MachineState.exception="Code Stack buffer underflow"
                    return true
                }
                MachineState.instructionPointer = MachineState.ERR
                    return true
            }

            MachineState.instructionPointer = MachineState.CodeStack.pop()
        }
    },
    { name: "IND_DAT", stepFee: 1n,  regex:   /^\s*SET\s+@\(\$(\w+)\)\s+\$(\w+)\s*$/,
        execute: function (regexParts) {
            let variable1 = MachineState.Memory.find(mem => mem.name == regexParts[1])
            let variable2 = MachineState.Memory.find(mem => mem.name == regexParts[2])
            let val1, val2, addr
            if (variable1 === undefined) val1 = 0n
            else val1 = variable1.value
            if (variable2 === undefined) val2 = 0n
            else val2 = variable2.value

            addr = val1

            if (addr > 32*MachineState.DataPages || addr < 0) {
                if (MachineState.ERR === null) {
                    MachineState.dead=true
                    MachineState.exception="Variable address out of range"
                    return true
                }
                MachineState.instructionPointer = MachineState.ERR
                    return true
            }
            if ( MachineState.Memory[addr] === undefined){
                //only happens in simulator
                MachineState.dead=true
                MachineState.exception="Variable address not found"
                return true
            }

            MachineState.Memory[addr].value = val2

            MachineState.instructionPointer = utils.getNextInstructionLine(MachineState.instructionPointer+1)
            return true
        }
    },
    { name: "IDX_DAT", stepFee: 1n,   regex:   /^\s*SET\s+@\(\$(\w+)\s*\+\s*\$(\w+)\)\s+\$(\w+)\s*$/,
        execute: function (regexParts) {
            let variable1 = MachineState.Memory.find(mem => mem.name == regexParts[1])
            let variable2 = MachineState.Memory.find(mem => mem.name == regexParts[2])
            let variable3 = MachineState.Memory.find(mem => mem.name == regexParts[3])
            let val1, val2, val3, addr
            if (variable1 === undefined) val1 = 0n
            else val1 = variable1.value
            if (variable2 === undefined) val2 = 0n
            else val2 = variable2.value
            if (variable3 === undefined) val3 = 0n
            else val3 = variable3.value

            addr = val1 + val2

            if (addr > 32*MachineState.DataPages || addr < 0) {
                if (MachineState.ERR === null) {
                    MachineState.dead=true
                    MachineState.exception="Variable address out of range"
                    return true
                }
                MachineState.instructionPointer = MachineState.ERR
                    return true
            }
            if ( MachineState.Memory[addr] === undefined){
                //only happens in simulator
                MachineState.dead=true
                MachineState.exception="Variable address not found"
                return true
            }

            MachineState.Memory[addr].value = val3

            MachineState.instructionPointer = utils.getNextInstructionLine(MachineState.instructionPointer+1)
            return true
        }
    },
    { name: "MOD_DAT", stepFee: 1n, regex:   /^\s*MOD\s+@(\w+)\s+\$(\w+)\s*$/,
        execute: function (regexParts) {
            let variable1 = MachineState.Memory.find(mem => mem.name == regexParts[1])
            let variable2 = MachineState.Memory.find(mem => mem.name == regexParts[2])
            let val1, val2
            if (variable1 === undefined){
                val1 = 0n
            } else {
                val1 = utils.unsigned2signed(variable1.value)
            }
            if (variable2 === undefined){
                val2 = 0n
            } else {
                val2 = utils.unsigned2signed(variable2.value)
                if (val2 == 0 ) {
                    if (MachineState.ERR === null) {
                        MachineState.dead=true
                        MachineState.exception="Division by zero ( mod 0 )"
                        return true
                    }
                    MachineState.instructionPointer = MachineState.ERR
                            return true
                }
            }

            val1 = utils.signed2unsigned(val1 % val2)

            if (variable1 == undefined)
                MachineState.Memory.push( { name:regexParts[2], value: val1 } )
            else
                variable1.value = val1

            MachineState.instructionPointer = utils.getNextInstructionLine(MachineState.instructionPointer+1)
            return true
        }
    },
    { name: "SHL / SHR", stepFee: 1n, regex:   /^\s*(SHL|SHR)\s+@(\w+)\s+\$(\w+)\s*$/,
        execute: function (regexParts) {
            let variable1 = MachineState.Memory.find(mem => mem.name == regexParts[2])
            let variable2 = MachineState.Memory.find(mem => mem.name == regexParts[3])
            let val1, val2
            if (variable1 === undefined){
                val1 = 0n
            } else {
                val1 = variable1.value
            }
            if (variable2 === undefined){
                val2 = 0n
            } else {
                val2 = utils.unsigned2signed(variable2.value)
                if (val2 < 0 ) {
                    val2 = 0n
                } else if (val2 > 63 ) {
                    val2 = 63n
                }
            }

            if (regexParts[1] == "SHL") {
                val1 = (val1 << val2) % utils.pow2to64
            } else {
                val1 = (val1 >> val2) % utils.pow2to64
            }

            if (variable1 == undefined)
                MachineState.Memory.push( { name:regexParts[2], value: val1 } )
            else
                variable1.value = val1

            MachineState.instructionPointer = utils.getNextInstructionLine(MachineState.instructionPointer+1)
            return true
        }
    },
    { name: "JMP_ADR", stepFee: 1n,   regex:   /^\s*JMP\s+:(\w+)\s*$/,
        execute: function (regexParts) {
            let custom_regex = new RegExp("^\\s*("+regexParts[1]+"):\\s*$")
            let destination = MachineState.sourceCode.findIndex( line => custom_regex.exec(line) !== null)
            if (destination == -1){
                //only happens in simulator
                MachineState.dead=true
                MachineState.exception="Jump destination label '"+regexParts[1]+"' not found"
                return true
            }
            destination = utils.getNextInstructionLine(destination)
            MachineState.instructionPointer = destination
            return true
        }
    },
    { name: "BZR / BNZ", stepFee: 1n, regex:   /^\s*(BZR|BNZ)\s+\$(\w+)\s+:(\w+)\s*$/,
        execute: function (regexParts) {
            let variable = MachineState.Memory.find(mem => mem.name == regexParts[2])
            let val
            if (variable === undefined) 
                val = 0n
            else
                val = variable.value

            let custom_regex = new RegExp("^\\s*("+regexParts[3]+"):\\s*$")
            let destination = MachineState.sourceCode.findIndex( line => custom_regex.exec(line) !== null)
            if (destination == -1){
                MachineState.dead=true
                MachineState.exception="Jump destination label '"+regexParts[3]+"' not found"
                return true
            }

            if ((regexParts[1]=="BZR" && val == 0) || regexParts[1]=="BNZ" && val != 0)
                MachineState.instructionPointer = utils.getNextInstructionLine(destination)
            else
                MachineState.instructionPointer = utils.getNextInstructionLine(MachineState.instructionPointer+1)

            return true
        }
    },
    { name: "BGT / BLT / BGE / BLE / BEQ / BNE", stepFee: 1n, regex:   /^\s*(BGT|BLT|BGE|BLE|BEQ|BNE)\s+\$(\w+)\s+\$(\w+)\s+:(\w+)\s*$/,
        execute: function (regexParts) {
            let variable = MachineState.Memory.find(mem => mem.name == regexParts[2])
            let val1, val2
            if (variable === undefined) 
                val1 = 0n
            else
                val1 = utils.unsigned2signed(variable.value)
            variable = MachineState.Memory.find(mem => mem.name == regexParts[3])
            if (variable === undefined) 
                val2 = 0n
            else
                val2 = utils.unsigned2signed(variable.value)
    
            let custom_regex = new RegExp("^\\s*("+regexParts[4]+"):\\s*$")
            let destination = MachineState.sourceCode.findIndex( line => custom_regex.exec(line) !== null)
            if (destination == -1){
                MachineState.dead=true
                MachineState.exception="Jump destination label '"+regexParts[3]+"' not found"
                return true
            }

            if (    regexParts[1]=="BGT" && val1 >  val2
                 || regexParts[1]=="BLT" && val1 <  val2
                 || regexParts[1]=="BGE" && val1 >= val2
                 || regexParts[1]=="BLE" && val1 <= val2
                 || regexParts[1]=="BEQ" && val1 == val2
                 || regexParts[1]=="BNE" && val1 != val2 )
            {
                MachineState.instructionPointer = utils.getNextInstructionLine(destination)
            } else { 
                MachineState.instructionPointer = utils.getNextInstructionLine(MachineState.instructionPointer+1)
            }

            return true
        }
    },
    { name: "SLP_DAT", stepFee: 1n,   regex:   /^\s*SLP\s+\$(\w+)\s*$/,
        execute: function (regexParts) {
            let variable = MachineState.Memory.find(mem => mem.name == regexParts[1])
            let val1
            if (variable === undefined) 
                val1 = 0n
            else
                val1 = variable.value

            MachineState.frozen=false
            MachineState.running=false
            MachineState.stopped=true
            MachineState.finished=false
            MachineState.previousBalance = BlockchainState.accounts.find(acc => acc.id == MachineState.contract).balance
            MachineState.sleepUntilBlock= BigInt(BlockchainState.currentBlock) + val1
            MachineState.instructionPointer = utils.getNextInstructionLine(MachineState.instructionPointer+1)
            return true
        }
    },
    { name: "FIZ_DAT", stepFee: 1n,   regex:   /^\s*FIZ\s+\$(\w+)\s*$/,
        execute: function (regexParts) {
            let variable = MachineState.Memory.find(mem => mem.name == regexParts[1])
            let val1
            if (variable === undefined) 
                val1 = 0n
            else
                val1 = variable.value

            if (val1 == 0) {
                MachineState.frozen= true
                MachineState.running=false
                MachineState.stopped=false
                MachineState.finished=true
                MachineState.previousBalance = BlockchainState.accounts.find(acc => acc.id == MachineState.contract).balance
                MachineState.instructionPointer = MachineState.PCS;
            } else {
                MachineState.instructionPointer = utils.getNextInstructionLine(MachineState.instructionPointer+1)
            }
                return true
        }
    },
    { name: "STZ_DAT", stepFee: 1n,   regex:   /^\s*STZ\s+\$(\w+)\s*$/,
        execute: function (regexParts) {
            let variable = MachineState.Memory.find(mem => mem.name == regexParts[1])
            let val1
            if (variable === undefined) 
                val1 = 0n
            else
                val1 = variable.value

            if (val1 == 0) {
                MachineState.frozen= true
                MachineState.running=false
                MachineState.stopped=true
                MachineState.finished=false
                MachineState.previousBalance = BlockchainState.accounts.find(acc => acc.id == MachineState.contract).balance
            }

            MachineState.instructionPointer = utils.getNextInstructionLine(MachineState.instructionPointer+1)
            return true
        }
    },
    { name: "FIN_IMD", stepFee: 1n,    regex:   /^\s*FIN\s*$/,
        execute: function (regexParts) {
            MachineState.frozen= true
            MachineState.running=false
            MachineState.stopped=false
            MachineState.finished=true
            MachineState.previousBalance = BlockchainState.accounts.find(acc => acc.id == MachineState.contract).balance
            MachineState.instructionPointer = MachineState.PCS;
            return true
        }
    },
    { name: "STP_IMD", stepFee: 1n,    regex:   /^\s*STP\s*$/,
        execute: function (regexParts) {
            MachineState.frozen= true
            MachineState.running=false
            MachineState.stopped=true
            MachineState.finished=false
            MachineState.previousBalance = BlockchainState.accounts.find(acc => acc.id == MachineState.contract).balance
            MachineState.instructionPointer = utils.getNextInstructionLine(MachineState.instructionPointer+1);
            return true
        }
    },
    { name: "ERR_ADR", stepFee: 1n,   regex:   /^\s*ERR\s+:(\w+)\s*$/,
        execute: function (regexParts) {
            let custom_regex = new RegExp("^\\s*("+regexParts[1]+"):\\s*$")
            let destination = MachineState.sourceCode.findIndex( line => custom_regex.exec(line) !== null)
            if (destination == -1){
                MachineState.dead=true
                MachineState.exception="ERR destination label '"+regexParts[1]+"' not found"
                return true
            }
            MachineState.ERR = utils.getNextInstructionLine(destination)
            MachineState.instructionPointer = utils.getNextInstructionLine(MachineState.instructionPointer+1);
            return true
        }
    },
    { name: "SET_PCS", stepFee: 1n,   regex:   /^\s*PCS\s*$/,
        execute: function (regexParts) {
            MachineState.instructionPointer = utils.getNextInstructionLine(MachineState.instructionPointer+1);
            MachineState.PCS = MachineState.instructionPointer
            return true
        }
    },
    { name: "EXT_FUN", stepFee: 10n,   regex:   /^\s*FUN\s+(\w+)\s*$/, 
        execute: function (regexParts) {
            let apiCode = API_microcode.find(CODE => CODE.op_code == 0x32 && CODE.name == regexParts[1])
            if (apiCode === undefined) {
                MachineState.dead=true
                MachineState.exception="Unknow API Function "+regexParts[2]+"."
                return true
            }

            apiCode.execute()

            MachineState.instructionPointer = utils.getNextInstructionLine(MachineState.instructionPointer+1)
            return true
        }
    },
    { name: "EXT_FUN_DAT", stepFee: 10n,  regex:   /^\s*FUN\s+(\w+)\s+\$(\w+)\s*$/,
        execute: function (regexParts) {
            let apiCode = API_microcode.find(CODE => CODE.op_code == 0x33 && CODE.name == regexParts[1])
            if (apiCode === undefined) {
                MachineState.dead=true
                MachineState.exception="Unknow API Function "+regexParts[2]+"."
                return true
            }
            let variable1 = MachineState.Memory.find(mem => mem.name == regexParts[2])
            let val1

            if (variable1 === undefined )
                val1=0n
            else
                val1 = variable1.value

            apiCode.execute(val1)

            MachineState.instructionPointer = utils.getNextInstructionLine(MachineState.instructionPointer+1)
            return true
        }
    },
    { name: "EXT_FUN_DAT_2", stepFee: 10n,  regex:   /^\s*FUN\s+(\w+)\s+\$(\w+)\s+\$(\w+)\s*$/,
        execute: function (regexParts) {
            let apiCode = API_microcode.find(CODE => CODE.op_code == 0x34 && CODE.name == regexParts[1])
            if (apiCode === undefined) {
                MachineState.dead=true
                MachineState.exception="Unknow API Function "+regexParts[1]+"."
                return true
            }
            let variable1 = MachineState.Memory.find(mem => mem.name == regexParts[2])
            let variable2 = MachineState.Memory.find(mem => mem.name == regexParts[3])
            let val1, val2

            if (variable1 === undefined ) val1=0n
            else val1 = variable1.value
            if (variable2 === undefined ) val2=0n
            else val2 = variable2.value

            apiCode.execute(val1, val2)

            MachineState.instructionPointer = utils.getNextInstructionLine(MachineState.instructionPointer+1)
            return true
        }
    },
    { name: "EXT_FUN_RET", stepFee: 10n,     regex:   /^\s*FUN\s+@(\w+)\s+(\w+)\s*$/,
        execute: function (regexParts) {
            let apiCode = API_microcode.find(CODE => CODE.op_code == 0x35 && CODE.name == regexParts[2])
            if (apiCode === undefined) {
                MachineState.dead=true
                MachineState.exception="Unknow API Function "+regexParts[2]+"."
                return true
            }
            let variable1 = MachineState.Memory.find(mem => mem.name == regexParts[1])
            let val1

            val1 = apiCode.execute()

            if (regexParts[2] == "get_Ticket_Id_for_Tx_in_A" && MachineState.sleepUntilBlock > BlockchainState.currentBlock) {
                //do no advance instruction pointer. Resume contract in same instruction to get result.
                return true
            }
            if (variable1 === undefined )
                MachineState.Memory.push( { name:regexParts[1], value:val1 } )
            else
                variable1.value = val1
            MachineState.instructionPointer = utils.getNextInstructionLine(MachineState.instructionPointer+1)
            return true
        }
    },
    { name: "EXT_FUN_RET_DAT", stepFee: 10n, regex:   /^\s*FUN\s+@(\w+)\s+(\w+)\s+\$(\w+)\s*$/,
        execute: function (regexParts) {
            MachineState.dead=true
            MachineState.exception="Unknown API Function"
            return true
        }
    },
    { name: "EXT_FUN_RET_DAT_2", stepFee: 10n,  regex:   /^\s*FUN\s+@(\w+)\s+(\w+)\s+\$(\w+)\s+\$(\w+)\s*$/,
        execute: function (regexParts) {
            let apiCode = API_microcode.find(CODE => CODE.op_code == 0x37 && CODE.name == regexParts[2])
            if (apiCode === undefined) {
                MachineState.dead=true
                MachineState.exception="Unknow API Function "+regexParts[2]+"."
                return true
            }
            let variable1 = MachineState.Memory.find(mem => mem.name == regexParts[1])
            let variable2 = MachineState.Memory.find(mem => mem.name == regexParts[2])
            let variable3 = MachineState.Memory.find(mem => mem.name == regexParts[3])
            let val1, val2, val3

            if (variable2 === undefined ) val2=0n
            else val2 = variable2.value
            if (variable3 === undefined ) val3=0n
            else val3 = variable3.value

            val1 = apiCode.execute(val2, val3)

            if (variable1 === undefined )
                MachineState.Memory.push( { name:regexParts[1], value:val1 } )
            else
                variable1.value = val1
            MachineState.instructionPointer = utils.getNextInstructionLine(MachineState.instructionPointer+1)
            return true
        }
    },
    { name: "NOP", stepFee: 1n,    regex: /^\s*NOP\s*$/,
        execute: function (regexParts) {
            MachineState.instructionPointer = utils.getNextInstructionLine(MachineState.instructionPointer+1);
            return true
        }
    },
]

//Process one line of assembly code.
//  Return true if something was executed
//  false if line is valid but nothing executed
//  or null if invalid line
function cpu()
{
    let lastRegexResult = null
    let currCode, account

    currCode = cpu_microcode.find(instr => (lastRegexResult = instr.regex.exec(MachineState.sourceCode[MachineState.instructionPointer])) !== null)
    if (currCode === undefined) {
        return null
    }

    account = BlockchainState.accounts.find(obj => obj.id == MachineState.contract)
    account.balance -= Constants.stepfee * currCode.stepFee
    if (account.balance < 0) {
        MachineState.frozen=true
        account.balance += Constants.stepfee * currCode.stepFee
        MachineState.previousBalance = account.balance
        return false
    }

    return currCode.execute(lastRegexResult)
}

//Loop all lines colecting assembly directives
//  and put instruction pointer at first instruction
function cpu_deploy()
{
    let lastRegexResult, currCode
    MachineState.sourceCode.forEach(function (line){
        if (/^\s*\^.*/.exec(line) !== null){
            //visit all compiler directives to deploy contract
            currCode = cpu_microcode.find(instr => (lastRegexResult = instr.regex.exec(line)) != null)
            currCode.execute(lastRegexResult)
        }
    })
    MachineState.instructionPointer=utils.getNextInstructionLine(0)
    MachineState.PCS=MachineState.instructionPointer
}
