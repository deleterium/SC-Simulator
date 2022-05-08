
// Author: Rui Deleterium
// Project: https://github.com/deleterium/SC-Simulator
// License: BSD 3-Clause License

import { CONTRACT } from './contract.js'

import { Constants, Blockchain } from './index.js'

import { utils } from './utils.js'
import { API_MICROCODE } from './api.js'

interface CPU_MICROCODE {
    name: string
    stepFee: bigint
    regex: RegExp
    execute (ContractState: CONTRACT, regexParts: RegExpExecArray): boolean
}

export class CPU {
// class CpuMicrocode implements CPU_MICROCODE[] {
    static cpuMicrocode: CPU_MICROCODE[] = [
        {
            name: 'blank',
            stepFee: 0n,
            regex: /^\s*$/,
            execute (ContractState, regexParts) {
                if (ContractState.instructionPointer >= ContractState.sourceCode.length) {
                    ContractState.instructionPointer = ContractState.PCS
                    return true
                }
                ContractState.instructionPointer = ContractState.getNextInstructionLine()
                return false
            }
        },
        {
            name: 'label',
            stepFee: 0n,
            regex: /^\s*(\w+):\s*$/,
            execute (ContractState, regexParts) {
                ContractState.instructionPointer = ContractState.getNextInstructionLine()
                return false
            }
        },
        {
            name: 'comment',
            stepFee: 0n,
            regex: /^\s*\^comment\s+(.*)/,
            execute (ContractState, regexParts) {
                ContractState.instructionPointer = ContractState.getNextInstructionLine()
                return false
            }
        },
        {
            name: 'declare',
            stepFee: 0n,
            regex: /^\s*\^declare\s+(\w+)\s*$/,
            execute (ContractState, regexParts) {
                if (ContractState.Memory.find(mem => mem.varName === regexParts[1]) === undefined) {
                    ContractState.Memory.push({ varName: regexParts[1], value: 0n })
                }
                ContractState.instructionPointer = ContractState.getNextInstructionLine()
                return false
            }
        },
        {
            name: 'const',
            stepFee: 0n,
            regex: /^\s*\^const\s+SET\s+@(\w+)\s+#([\da-f]{16})\b\s*$/,
            execute (ContractState, regexParts) {
                const variable = ContractState.Memory.find(mem => mem.varName === regexParts[1])
                if (variable === undefined) {
                // only happens in simulator
                    ContractState.dead = true
                    ContractState.exception = 'const directive but variable not found'
                    return true
                }
                variable.value = BigInt('0x' + regexParts[2])
                ContractState.instructionPointer = ContractState.getNextInstructionLine()
                return false
            }
        },
        {
            name: 'program',
            stepFee: 0n,
            regex: /^\s*\^program\s+(\w+)\s+([\s\S]+)$/,
            execute (ContractState, regexParts) {
                if (regexParts[1] === 'activationAmount') {
                    ContractState.activationAmount = BigInt(regexParts[2].trim())
                } else if (regexParts[1] === 'creator') {
                    ContractState.creator = BigInt(regexParts[2].trim())
                } else if (regexParts[1] === 'contract') {
                    ContractState.contract = BigInt(regexParts[2].trim())
                } else if (regexParts[1] === 'DataPages') {
                    ContractState.DataPages = Number(regexParts[2].trim())
                } else if (regexParts[1] === 'UserStackPages') {
                    ContractState.UserStackPages = Number(regexParts[2].trim())
                } else if (regexParts[1] === 'CodeStackPages') {
                    ContractState.CodeStackPages = Number(regexParts[2].trim())
                }
                ContractState.instructionPointer = ContractState.getNextInstructionLine()
                return false
            }
        },
        {
            name: 'SET_VAL',
            stepFee: 1n,
            regex: /^\s*SET\s+@(\w+)\s+#([\da-f]{16})\b\s*$/,
            execute (ContractState, regexParts) {
                const variable = ContractState.Memory.find(mem => mem.varName === regexParts[1])
                if (variable === undefined) {
                    ContractState.Memory.push({ varName: regexParts[1], value: BigInt('0x' + regexParts[2]) })
                } else {
                    variable.value = BigInt('0x' + regexParts[2])
                }
                ContractState.instructionPointer = ContractState.getNextInstructionLine()
                return true
            }
        },
        {
            name: 'SET_DAT',
            stepFee: 1n,
            regex: /^\s*SET\s+@(\w+)\s+\$(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const variable1 = ContractState.Memory.find(mem => mem.varName === regexParts[1])
                const variable2 = ContractState.Memory.find(mem => mem.varName === regexParts[2])
                let val: bigint
                if (variable2 === undefined) {
                    val = 0n
                } else {
                    val = variable2.value
                }
                if (variable1 === undefined) {
                    ContractState.Memory.push({ varName: regexParts[1], value: val })
                } else {
                    variable1.value = val
                }
                ContractState.instructionPointer = ContractState.getNextInstructionLine()
                return true
            }
        },
        {
            name: 'CLR',
            stepFee: 1n,
            regex: /^\s*CLR\s+@(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const variable1 = ContractState.Memory.find(mem => mem.varName === regexParts[1])
                if (variable1 === undefined) {
                    ContractState.Memory.push({ varName: regexParts[1], value: 0n })
                } else {
                    variable1.value = 0n
                }
                ContractState.instructionPointer = ContractState.getNextInstructionLine()
                return true
            }
        },
        {
            name: 'INC',
            stepFee: 1n,
            regex: /^\s*INC\s+@(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const variable1 = ContractState.Memory.find(mem => mem.varName === regexParts[1])
                if (variable1 === undefined) {
                    ContractState.Memory.push({ varName: regexParts[1], value: 1n })
                } else {
                    variable1.value = (variable1.value + 1n) % 18446744073709551616n
                }
                ContractState.instructionPointer = ContractState.getNextInstructionLine()
                return true
            }
        },
        {
            name: 'DEC',
            stepFee: 1n,
            regex: /^\s*DEC\s+@(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const variable1 = ContractState.Memory.find(mem => mem.varName === regexParts[1])
                if (variable1 === undefined) {
                    ContractState.Memory.push({ varName: regexParts[1], value: Constants.minus1 })
                } else {
                    if (variable1.value === 0n) {
                        variable1.value = Constants.minus1
                    } else {
                        variable1.value = variable1.value - 1n
                    }
                }
                ContractState.instructionPointer = ContractState.getNextInstructionLine()
                return true
            }
        },
        {
            name: 'ADD',
            stepFee: 1n,
            regex: /^\s*ADD\s+@(\w+)\s+\$(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const variable1 = ContractState.Memory.find(mem => mem.varName === regexParts[1])
                const variable2 = ContractState.Memory.find(mem => mem.varName === regexParts[2])
                let val: bigint
                if (variable2 === undefined) {
                    val = 0n
                } else {
                    val = variable2.value
                }
                if (variable1 === undefined) {
                    ContractState.Memory.push({ varName: regexParts[1], value: val })
                } else {
                    variable1.value = (variable1.value + val) % Constants.pow2to64
                }
                ContractState.instructionPointer = ContractState.getNextInstructionLine()
                return true
            }
        },
        {
            name: 'SUB',
            stepFee: 1n,
            regex: /^\s*SUB\s+@(\w+)\s+\$(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const variable1 = ContractState.Memory.find(mem => mem.varName === regexParts[1])
                const variable2 = ContractState.Memory.find(mem => mem.varName === regexParts[2])
                let val: bigint
                if (variable2 === undefined) {
                    val = 0n
                } else {
                    val = variable2.value
                }
                if (variable1 === undefined) {
                    val = (Constants.pow2to64 - val) % Constants.pow2to64
                    ContractState.Memory.push({ varName: regexParts[1], value: val })
                } else {
                    variable1.value = (Constants.pow2to64 + variable1.value - val) % Constants.pow2to64
                }
                ContractState.instructionPointer = ContractState.getNextInstructionLine()
                return true
            }
        },
        {
            name: 'MUL',
            stepFee: 1n,
            regex: /^\s*MUL\s+@(\w+)\s+\$(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const variable1 = ContractState.Memory.find(mem => mem.varName === regexParts[1])
                const variable2 = ContractState.Memory.find(mem => mem.varName === regexParts[2])
                let val: bigint
                if (variable2 === undefined) {
                    val = 0n
                } else {
                    val = variable2.value
                }
                if (variable1 === undefined) {
                    ContractState.Memory.push({ varName: regexParts[1], value: 0n })
                } else {
                    variable1.value = (variable1.value * val) % Constants.pow2to64
                }
                ContractState.instructionPointer = ContractState.getNextInstructionLine()
                return true
            }
        },
        {
            name: 'DIV',
            stepFee: 1n,
            regex: /^\s*DIV\s+@(\w+)\s+\$(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const variable1 = ContractState.Memory.find(mem => mem.varName === regexParts[1])
                const variable2 = ContractState.Memory.find(mem => mem.varName === regexParts[2])
                if (variable2 === undefined || variable2.value === 0n) {
                    if (ContractState.ERR === null) {
                        ContractState.dead = true
                        ContractState.exception = 'Division by zero'
                        return true
                    }
                    ContractState.instructionPointer = ContractState.ERR
                    return true
                }
                if (variable1 === undefined) {
                    ContractState.Memory.push({ varName: regexParts[1], value: 0n })
                } else {
                    const val1 = utils.unsigned2signed(variable1.value)
                    const val2 = utils.unsigned2signed(variable2.value)

                    variable1.value = utils.signed2unsigned(val1 / val2)
                }
                ContractState.instructionPointer = ContractState.getNextInstructionLine()
                return true
            }
        },
        {
            name: 'BOR / AND / XOR',
            stepFee: 1n,
            regex: /^\s*(BOR|AND|XOR)\s+@(\w+)\s+\$(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const variable1 = ContractState.Memory.find(mem => mem.varName === regexParts[2])
                const variable2 = ContractState.Memory.find(mem => mem.varName === regexParts[3])
                let val1: bigint, val2: bigint
                if (variable1 === undefined) {
                    val1 = 0n
                } else {
                    val1 = variable1.value
                }
                if (variable2 === undefined) {
                    val2 = 0n
                } else {
                    val2 = variable2.value
                }

                if (regexParts[1] === 'BOR') val1 |= val2
                else if (regexParts[1] === 'AND') val1 &= val2
                else val1 ^= val2

                if (variable1 === undefined) {
                    ContractState.Memory.push({ varName: regexParts[2], value: val1 })
                } else {
                    variable1.value = val1
                }
                ContractState.instructionPointer = ContractState.getNextInstructionLine()
                return true
            }
        },
        {
            name: 'NOT',
            stepFee: 1n,
            regex: /^\s*NOT\s+@(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const variable1 = ContractState.Memory.find(mem => mem.varName === regexParts[1])
                if (variable1 === undefined) {
                    ContractState.Memory.push({ varName: regexParts[1], value: Constants.minus1 })
                } else {
                // using xor with 0xFFFFFFFFFFFFFFFF to emulate 64bit operation
                    variable1.value = variable1.value ^ Constants.minus1
                }
                ContractState.instructionPointer = ContractState.getNextInstructionLine()
                return true
            }
        },
        {
            name: 'SET_IND',
            stepFee: 1n,
            regex: /^\s*SET\s+@(\w+)\s+\$\(\$(\w+)\)\s*$/,
            execute (ContractState, regexParts) {
                const variable1 = ContractState.Memory.find(mem => mem.varName === regexParts[1])
                const variable2 = ContractState.Memory.find(mem => mem.varName === regexParts[2])
                let addr : number
                if (variable2 === undefined) {
                    addr = 0
                } else {
                    addr = Number(variable2.value)
                }

                if (addr > 32 * ContractState.DataPages || addr < 0) {
                    if (ContractState.ERR === null) {
                        ContractState.dead = true
                        ContractState.exception = 'Variable address out of range'
                        return true
                    }
                    ContractState.instructionPointer = ContractState.ERR
                    return true
                }
                if (ContractState.Memory[addr] === undefined) {
                // only happens in simulator
                    ContractState.dead = true
                    ContractState.exception = 'Variable address not found'
                    return true
                }
                if (variable1 === undefined) {
                    ContractState.Memory.push({ varName: regexParts[1], value: ContractState.Memory[addr].value })
                } else {
                    variable1.value = ContractState.Memory[addr].value
                }
                ContractState.instructionPointer = ContractState.getNextInstructionLine()
                return true
            }
        },
        {
            name: 'SET_IDX',
            stepFee: 1n,
            regex: /^\s*SET\s+@(\w+)\s+\$\(\$(\w+)\s*\+\s*\$(\w+)\)\s*$/,
            execute (ContractState, regexParts) {
                const variable1 = ContractState.Memory.find(mem => mem.varName === regexParts[1])
                const variable2 = ContractState.Memory.find(mem => mem.varName === regexParts[2])
                const variable3 = ContractState.Memory.find(mem => mem.varName === regexParts[3])
                let val2: bigint, val3: bigint
                if (variable2 === undefined) val2 = 0n
                else val2 = variable2.value
                if (variable3 === undefined) val3 = 0n
                else val3 = variable3.value
                const addr = Number(val2 + val3)

                if (addr > 32 * ContractState.DataPages || addr < 0) {
                    if (ContractState.ERR === null) {
                        ContractState.dead = true
                        ContractState.exception = 'Variable address out of range'
                        return true
                    }
                    ContractState.instructionPointer = ContractState.ERR
                    return true
                }
                if (ContractState.Memory[addr] === undefined) {
                // Error only in simulator.
                    ContractState.dead = true
                    ContractState.exception = 'Variable address not found'
                    return true
                }

                if (variable1 === undefined) {
                    ContractState.Memory.push({ varName: regexParts[1], value: ContractState.Memory[addr].value })
                } else {
                    variable1.value = ContractState.Memory[addr].value
                }
                ContractState.instructionPointer = ContractState.getNextInstructionLine()
                return true
            }
        },
        {
            name: 'PSH',
            stepFee: 1n,
            regex: /^\s*PSH\s+\$(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const variable1 = ContractState.Memory.find(mem => mem.varName === regexParts[1])
                let val1: bigint
                if (variable1 === undefined) val1 = 0n
                else val1 = variable1.value

                ContractState.UserStack.push(val1)
                if (ContractState.UserStack.length > 16 * ContractState.UserStackPages) {
                    if (ContractState.ERR === null) {
                        ContractState.dead = true
                        ContractState.exception = 'User Stack buffer overflow'
                        return true
                    }
                    ContractState.instructionPointer = ContractState.ERR
                    return true
                }

                ContractState.instructionPointer = ContractState.getNextInstructionLine()
                return true
            }
        },
        {
            name: 'POP',
            stepFee: 1n,
            regex: /^\s*POP\s+@(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const variable1 = ContractState.Memory.find(mem => mem.varName === regexParts[1])

                const val1 = ContractState.UserStack.pop()
                if (val1 === undefined) {
                    if (ContractState.ERR === null) {
                        ContractState.dead = true
                        ContractState.exception = 'User Stack buffer underflow'
                        return true
                    }
                    ContractState.instructionPointer = ContractState.ERR
                    return true
                }
                if (variable1 === undefined) {
                    ContractState.Memory.push({ varName: regexParts[1], value: val1 })
                } else {
                    variable1.value = val1
                }

                ContractState.instructionPointer = ContractState.getNextInstructionLine()
                return true
            }
        },
        {
            name: 'JMP_SUB',
            stepFee: 1n,
            regex: /^\s*JSR\s+:(\w+)\s*$/,
            execute (ContractState, regexParts) {
                ContractState.CodeStack.push(ContractState.getNextInstructionLine())
                if (ContractState.CodeStack.length > 16 * ContractState.CodeStackPages) {
                    if (ContractState.ERR === null) {
                        ContractState.dead = true
                        ContractState.exception = 'Code Stack buffer overflow'
                        return true
                    }
                    ContractState.instructionPointer = ContractState.ERR
                    return true
                }

                const customRegex = new RegExp('^\\s*(' + regexParts[1] + '):\\s*$')
                const destination = ContractState.sourceCode.findIndex(line => customRegex.exec(line) !== null)
                if (destination === -1) {
                    ContractState.dead = true
                    ContractState.exception = "Jump Subroutine destination label '" + regexParts[1] + "' not found"
                    return true
                }

                ContractState.instructionPointer = ContractState.getNextInstructionLine(destination)
                return true
            }
        },
        {
            name: 'RET_SUB',
            stepFee: 1n,
            regex: /^\s*RET\s*$/,
            execute (ContractState, regexParts) {
                const val = ContractState.CodeStack.pop()
                if (val === undefined) {
                    if (ContractState.ERR === null) {
                        ContractState.dead = true
                        ContractState.exception = 'Code Stack buffer underflow'
                        return true
                    }
                    ContractState.instructionPointer = ContractState.ERR
                    return true
                }

                ContractState.instructionPointer = val
                return true
            }
        },
        {
            name: 'IND_DAT',
            stepFee: 1n,
            regex: /^\s*SET\s+@\(\$(\w+)\)\s+\$(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const variable1 = ContractState.Memory.find(mem => mem.varName === regexParts[1])
                const variable2 = ContractState.Memory.find(mem => mem.varName === regexParts[2])
                let val1: bigint, val2: bigint
                if (variable1 === undefined) val1 = 0n
                else val1 = variable1.value
                if (variable2 === undefined) val2 = 0n
                else val2 = variable2.value

                const addr = Number(val1)

                if (addr > 32 * ContractState.DataPages || addr < 0) {
                    if (ContractState.ERR === null) {
                        ContractState.dead = true
                        ContractState.exception = 'Variable address out of range'
                        return true
                    }
                    ContractState.instructionPointer = ContractState.ERR
                    return true
                }
                if (ContractState.Memory[addr] === undefined) {
                // only happens in simulator
                    ContractState.dead = true
                    ContractState.exception = 'Variable address not found'
                    return true
                }

                ContractState.Memory[addr].value = val2

                ContractState.instructionPointer = ContractState.getNextInstructionLine()
                return true
            }
        },
        {
            name: 'IDX_DAT',
            stepFee: 1n,
            regex: /^\s*SET\s+@\(\$(\w+)\s*\+\s*\$(\w+)\)\s+\$(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const variable1 = ContractState.Memory.find(mem => mem.varName === regexParts[1])
                const variable2 = ContractState.Memory.find(mem => mem.varName === regexParts[2])
                const variable3 = ContractState.Memory.find(mem => mem.varName === regexParts[3])
                let val1: bigint, val2: bigint, val3: bigint
                if (variable1 === undefined) val1 = 0n
                else val1 = variable1.value
                if (variable2 === undefined) val2 = 0n
                else val2 = variable2.value
                if (variable3 === undefined) val3 = 0n
                else val3 = variable3.value

                const addr = Number(val1 + val2)

                if (addr > 32 * ContractState.DataPages || addr < 0) {
                    if (ContractState.ERR === null) {
                        ContractState.dead = true
                        ContractState.exception = 'Variable address out of range'
                        return true
                    }
                    ContractState.instructionPointer = ContractState.ERR
                    return true
                }
                if (ContractState.Memory[addr] === undefined) {
                // only happens in simulator
                    ContractState.dead = true
                    ContractState.exception = 'Variable address not found'
                    return true
                }

                ContractState.Memory[addr].value = val3

                ContractState.instructionPointer = ContractState.getNextInstructionLine()
                return true
            }
        },
        {
            name: 'MOD_DAT',
            stepFee: 1n,
            regex: /^\s*MOD\s+@(\w+)\s+\$(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const variable1 = ContractState.Memory.find(mem => mem.varName === regexParts[1])
                const variable2 = ContractState.Memory.find(mem => mem.varName === regexParts[2])
                let val1: bigint, val2: bigint
                if (variable1 === undefined) {
                    val1 = 0n
                } else {
                    val1 = utils.unsigned2signed(variable1.value)
                }
                if (variable2 === undefined) {
                    val2 = 0n
                } else {
                    val2 = utils.unsigned2signed(variable2.value)
                    if (val2 === 0n) {
                        if (ContractState.ERR === null) {
                            ContractState.dead = true
                            ContractState.exception = 'Division by zero ( mod 0 )'
                            return true
                        }
                        ContractState.instructionPointer = ContractState.ERR
                        return true
                    }
                }

                val1 = utils.signed2unsigned(val1 % val2)

                if (variable1 === undefined) {
                    ContractState.Memory.push({ varName: regexParts[2], value: val1 })
                } else {
                    variable1.value = val1
                }

                ContractState.instructionPointer = ContractState.getNextInstructionLine()
                return true
            }
        },
        {
            name: 'SHL / SHR',
            stepFee: 1n,
            regex: /^\s*(SHL|SHR)\s+@(\w+)\s+\$(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const variable1 = ContractState.Memory.find(mem => mem.varName === regexParts[2])
                const variable2 = ContractState.Memory.find(mem => mem.varName === regexParts[3])
                let val1: bigint, val2: bigint
                if (variable1 === undefined) {
                    val1 = 0n
                } else {
                    val1 = variable1.value
                }
                if (variable2 === undefined) {
                    val2 = 0n
                } else {
                    val2 = utils.unsigned2signed(variable2.value)
                    if (val2 < 0) {
                        val2 = 0n
                    } else if (val2 > 63) {
                        val2 = 63n
                    }
                }

                if (regexParts[1] === 'SHL') {
                    val1 = (val1 << val2) % Constants.pow2to64
                } else {
                    val1 = (val1 >> val2) % Constants.pow2to64
                }

                if (variable1 === undefined) {
                    ContractState.Memory.push({ varName: regexParts[2], value: val1 })
                } else {
                    variable1.value = val1
                }

                ContractState.instructionPointer = ContractState.getNextInstructionLine()
                return true
            }
        },
        {
            name: 'POW_DAT',
            stepFee: 1n,
            regex: /^\s*POW\s+@(\w+)\s+\$(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const variable1 = ContractState.Memory.find(mem => mem.varName === regexParts[1])
                const variable2 = ContractState.Memory.find(mem => mem.varName === regexParts[2])
                let val1: number, val2: number
                let result = 0
                if (variable1 === undefined) val1 = 0
                else val1 = Number(utils.unsigned2signed(variable1.value))
                if (variable2 === undefined) val2 = 0
                else val2 = Number(utils.unsigned2signed(variable2.value)) / 1.0E8
                if (val1 > 0) {
                    result = Math.pow(val1, val2)
                    if (Number.isNaN(result) || result > Constants.numberMaxPositive) {
                        result = 0
                    }
                }
                result = Math.trunc(result)
                if (variable1 === undefined) {
                    ContractState.Memory.push({ varName: regexParts[1], value: BigInt(result) })
                } else {
                    variable1.value = BigInt(result)
                }
                ContractState.instructionPointer = ContractState.getNextInstructionLine()
                return true
            }
        },
        {
            name: 'JMP_ADR',
            stepFee: 1n,
            regex: /^\s*JMP\s+:(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const customRegex = new RegExp('^\\s*(' + regexParts[1] + '):\\s*$')
                const destination = ContractState.sourceCode.findIndex(line => customRegex.exec(line) !== null)
                if (destination === -1) {
                // only happens in simulator
                    ContractState.dead = true
                    ContractState.exception = "Jump destination label '" + regexParts[1] + "' not found"
                    return true
                }
                ContractState.instructionPointer = ContractState.getNextInstructionLine(destination)
                return true
            }
        },
        {
            name: 'BZR / BNZ',
            stepFee: 1n,
            regex: /^\s*(BZR|BNZ)\s+\$(\w+)\s+:(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const variable = ContractState.Memory.find(mem => mem.varName === regexParts[2])
                let val: bigint
                if (variable === undefined) {
                    val = 0n
                } else {
                    val = variable.value
                }

                const customRegex = new RegExp('^\\s*(' + regexParts[3] + '):\\s*$')
                const destination = ContractState.sourceCode.findIndex(line => customRegex.exec(line) !== null)
                if (destination === -1) {
                    ContractState.dead = true
                    ContractState.exception = "Jump destination label '" + regexParts[3] + "' not found"
                    return true
                }

                if ((regexParts[1] === 'BZR' && val === 0n) || (regexParts[1] === 'BNZ' && val !== 0n)) {
                    ContractState.instructionPointer = ContractState.getNextInstructionLine(destination)
                } else {
                    ContractState.instructionPointer = ContractState.getNextInstructionLine()
                }

                return true
            }
        },
        {
            name: 'BGT / BLT / BGE / BLE / BEQ / BNE',
            stepFee: 1n,
            regex: /^\s*(BGT|BLT|BGE|BLE|BEQ|BNE)\s+\$(\w+)\s+\$(\w+)\s+:(\w+)\s*$/,
            execute (ContractState, regexParts) {
                let variable = ContractState.Memory.find(mem => mem.varName === regexParts[2])
                let val1: bigint, val2: bigint
                if (variable === undefined) {
                    val1 = 0n
                } else {
                    val1 = utils.unsigned2signed(variable.value)
                }
                variable = ContractState.Memory.find(mem => mem.varName === regexParts[3])
                if (variable === undefined) {
                    val2 = 0n
                } else {
                    val2 = utils.unsigned2signed(variable.value)
                }

                const customRegex = new RegExp('^\\s*(' + regexParts[4] + '):\\s*$')
                const destination = ContractState.sourceCode.findIndex(line => customRegex.exec(line) !== null)
                if (destination === -1) {
                    ContractState.dead = true
                    ContractState.exception = "Jump destination label '" + regexParts[3] + "' not found"
                    return true
                }

                if ((regexParts[1] === 'BGT' && val1 > val2) ||
                 (regexParts[1] === 'BLT' && val1 < val2) ||
                 (regexParts[1] === 'BGE' && val1 >= val2) ||
                 (regexParts[1] === 'BLE' && val1 <= val2) ||
                 (regexParts[1] === 'BEQ' && val1 === val2) ||
                 (regexParts[1] === 'BNE' && val1 !== val2)) {
                    ContractState.instructionPointer = ContractState.getNextInstructionLine(destination)
                } else {
                    ContractState.instructionPointer = ContractState.getNextInstructionLine()
                }

                return true
            }
        },
        {
            name: 'SLP_DAT',
            stepFee: 1n,
            regex: /^\s*SLP\s+\$(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const variable = ContractState.Memory.find(mem => mem.varName === regexParts[1])
                let val1: bigint
                if (variable === undefined) {
                    val1 = 0n
                } else {
                    val1 = utils.unsigned2signed(variable.value)
                }

                if (val1 < 1) {
                    val1 = 1n
                }

                ContractState.frozen = false
                ContractState.running = false
                ContractState.stopped = true
                ContractState.finished = false
                ContractState.previousBalance = Blockchain.getBalanceFrom(ContractState.contract)
                ContractState.sleepUntilBlock = Blockchain.currentBlock + Number(val1)
                ContractState.instructionPointer = ContractState.getNextInstructionLine()
                return true
            }
        },
        {
            name: 'SLP_IMD',
            stepFee: 1n,
            regex: /^\s*SLP\s*$/,
            execute (ContractState, regexParts) {
                ContractState.frozen = false
                ContractState.running = false
                ContractState.stopped = true
                ContractState.finished = false
                ContractState.previousBalance = Blockchain.getBalanceFrom(ContractState.contract)
                ContractState.sleepUntilBlock = Blockchain.currentBlock + 1
                ContractState.instructionPointer = ContractState.getNextInstructionLine()
                return true
            }
        },
        {
            name: 'FIZ_DAT',
            stepFee: 1n,
            regex: /^\s*FIZ\s+\$(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const variable = ContractState.Memory.find(mem => mem.varName === regexParts[1])
                let val1: bigint
                if (variable === undefined) {
                    val1 = 0n
                } else {
                    val1 = variable.value
                }

                if (val1 === 0n) {
                    ContractState.frozen = true
                    ContractState.running = false
                    ContractState.stopped = false
                    ContractState.finished = true
                    ContractState.previousBalance = Blockchain.getBalanceFrom(ContractState.contract)
                    ContractState.instructionPointer = ContractState.PCS
                } else {
                    ContractState.instructionPointer = ContractState.getNextInstructionLine()
                }
                return true
            }
        },
        {
            name: 'STZ_DAT',
            stepFee: 1n,
            regex: /^\s*STZ\s+\$(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const variable = ContractState.Memory.find(mem => mem.varName === regexParts[1])
                let val1: bigint
                if (variable === undefined) {
                    val1 = 0n
                } else {
                    val1 = variable.value
                }

                if (val1 === 0n) {
                    ContractState.frozen = true
                    ContractState.running = false
                    ContractState.stopped = true
                    ContractState.finished = false
                    ContractState.previousBalance = Blockchain.getBalanceFrom(ContractState.contract)
                }

                ContractState.instructionPointer = ContractState.getNextInstructionLine()
                return true
            }
        },
        {
            name: 'FIN_IMD',
            stepFee: 1n,
            regex: /^\s*FIN\s*$/,
            execute (ContractState, regexParts) {
                ContractState.frozen = true
                ContractState.running = false
                ContractState.stopped = false
                ContractState.finished = true
                ContractState.previousBalance = Blockchain.getBalanceFrom(ContractState.contract)
                ContractState.instructionPointer = ContractState.PCS
                return true
            }
        },
        {
            name: 'STP_IMD',
            stepFee: 1n,
            regex: /^\s*STP\s*$/,
            execute (ContractState, regexParts) {
                ContractState.frozen = true
                ContractState.running = false
                ContractState.stopped = true
                ContractState.finished = false
                ContractState.previousBalance = Blockchain.getBalanceFrom(ContractState.contract)
                ContractState.instructionPointer = ContractState.getNextInstructionLine()
                return true
            }
        },
        {
            name: 'ERR_ADR',
            stepFee: 1n,
            regex: /^\s*ERR\s+:(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const customRegex = new RegExp('^\\s*(' + regexParts[1] + '):\\s*$')
                const destination = ContractState.sourceCode.findIndex(line => customRegex.exec(line) !== null)
                if (destination === -1) {
                    ContractState.dead = true
                    ContractState.exception = "ERR destination label '" + regexParts[1] + "' not found"
                    return true
                }
                ContractState.ERR = ContractState.getNextInstructionLine(destination)
                ContractState.instructionPointer = ContractState.getNextInstructionLine()
                return true
            }
        },
        {
            name: 'SET_PCS',
            stepFee: 1n,
            regex: /^\s*PCS\s*$/,
            execute (ContractState, regexParts) {
                ContractState.instructionPointer = ContractState.getNextInstructionLine()
                ContractState.PCS = ContractState.instructionPointer
                return true
            }
        },
        {
            name: 'MDV_DAT',
            stepFee: 1n,
            regex: /^\s*MDV\s+@(\w+)\s+\$(\w+)\s+\$(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const variable1 = ContractState.Memory.find(mem => mem.varName === regexParts[1])
                const variable2 = ContractState.Memory.find(mem => mem.varName === regexParts[2])
                const variable3 = ContractState.Memory.find(mem => mem.varName === regexParts[3])
                let val1: bigint, val2: bigint, val3: bigint, result: bigint
                if (variable1 === undefined) val1 = 0n
                else val1 = utils.unsigned2signed(variable1.value)
                if (variable2 === undefined) val2 = 0n
                else val2 = utils.unsigned2signed(variable2.value)
                if (variable3 === undefined) val3 = 0n
                else val3 = utils.unsigned2signed(variable3.value)

                if (val3 === 0n) {
                    result = 0n
                } else {
                    const bigVal = (val1 * val2) / val3
                    // Converting to 64-bit long
                    result = bigVal & Constants.minus1
                }
                if (variable1 === undefined) {
                    ContractState.Memory.push({ varName: regexParts[1], value: result })
                } else {
                    variable1.value = result
                }

                ContractState.instructionPointer = ContractState.getNextInstructionLine()
                return true
            }
        },
        {
            name: 'EXT_FUN',
            stepFee: 10n,
            regex: /^\s*FUN\s+(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const Api = API_MICROCODE.EXT_FUN.find(Obj => Obj.funName === regexParts[1])
                if (Api === undefined) {
                    ContractState.dead = true
                    ContractState.exception = 'Unknow API Function ' + regexParts[2] + '.'
                    return true
                }

                Api.execute(ContractState)

                ContractState.instructionPointer = ContractState.getNextInstructionLine()
                return true
            }
        },
        {
            name: 'EXT_FUN_DAT',
            stepFee: 10n,
            regex: /^\s*FUN\s+(\w+)\s+\$(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const Api = API_MICROCODE.EXT_FUN_DAT.find(Obj => Obj.funName === regexParts[1])
                if (Api === undefined) {
                    ContractState.dead = true
                    ContractState.exception = 'Unknow API Function ' + regexParts[2] + '.'
                    return true
                }
                const variable1 = ContractState.Memory.find(mem => mem.varName === regexParts[2])
                let val1: bigint

                if (variable1 === undefined) {
                    val1 = 0n
                } else {
                    val1 = variable1.value
                }

                Api.execute(ContractState, val1)

                ContractState.instructionPointer = ContractState.getNextInstructionLine()
                return true
            }
        },
        {
            name: 'EXT_FUN_DAT_2',
            stepFee: 10n,
            regex: /^\s*FUN\s+(\w+)\s+\$(\w+)\s+\$(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const Api = API_MICROCODE.EXT_FUN_DAT_2.find(Obj => Obj.funName === regexParts[1])
                if (Api === undefined) {
                    ContractState.dead = true
                    ContractState.exception = 'Unknow API Function ' + regexParts[1] + '.'
                    return true
                }
                const variable1 = ContractState.Memory.find(mem => mem.varName === regexParts[2])
                const variable2 = ContractState.Memory.find(mem => mem.varName === regexParts[3])
                let val1: bigint, val2: bigint

                if (variable1 === undefined) val1 = 0n
                else val1 = variable1.value
                if (variable2 === undefined) val2 = 0n
                else val2 = variable2.value

                Api.execute(ContractState, val1, val2)

                ContractState.instructionPointer = ContractState.getNextInstructionLine()
                return true
            }
        },
        {
            name: 'EXT_FUN_RET',
            stepFee: 10n,
            regex: /^\s*FUN\s+@(\w+)\s+(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const Api = API_MICROCODE.EXT_FUN_RET.find(Obj => Obj.funName === regexParts[2])
                if (Api === undefined) {
                    ContractState.dead = true
                    ContractState.exception = 'Unknow API Function ' + regexParts[2] + '.'
                    return true
                }
                const variable1 = ContractState.Memory.find(mem => mem.varName === regexParts[1])

                const val1 = Api.execute(ContractState)

                if (regexParts[2] === 'get_Ticket_Id_for_Tx_in_A' && ContractState.sleepUntilBlock > Blockchain.currentBlock) {
                // do no advance instruction pointer. Resume contract in same instruction to get result.
                    return true
                }
                if (variable1 === undefined) {
                    ContractState.Memory.push({ varName: regexParts[1], value: val1 })
                } else {
                    variable1.value = val1
                }
                ContractState.instructionPointer = ContractState.getNextInstructionLine()
                return true
            }
        },
        {
            name: 'EXT_FUN_RET_DAT',
            stepFee: 10n,
            regex: /^\s*FUN\s+@(\w+)\s+(\w+)\s+\$(\w+)\s*$/,
            execute (ContractState, regexParts) {
                ContractState.dead = true
                ContractState.exception = 'Unknown API Function'
                return true
            }
        },
        {
            name: 'EXT_FUN_RET_DAT_2',
            stepFee: 10n,
            regex: /^\s*FUN\s+@(\w+)\s+(\w+)\s+\$(\w+)\s+\$(\w+)\s*$/,
            execute (ContractState, regexParts) {
                const Api = API_MICROCODE.EXT_FUN_RET_DAT_2.find(Obj => Obj.funName === regexParts[2])
                if (Api === undefined) {
                    ContractState.dead = true
                    ContractState.exception = 'Unknow API Function ' + regexParts[2] + '.'
                    return true
                }
                const variable1 = ContractState.Memory.find(mem => mem.varName === regexParts[1])
                const variable2 = ContractState.Memory.find(mem => mem.varName === regexParts[2])
                const variable3 = ContractState.Memory.find(mem => mem.varName === regexParts[3])
                let val2: bigint, val3: bigint

                if (variable2 === undefined) val2 = 0n
                else val2 = variable2.value
                if (variable3 === undefined) val3 = 0n
                else val3 = variable3.value

                const val1 = Api.execute(ContractState, val2, val3)

                if (variable1 === undefined) {
                    ContractState.Memory.push({ varName: regexParts[1], value: val1 })
                } else {
                    variable1.value = val1
                }
                ContractState.instructionPointer = ContractState.getNextInstructionLine()
                return true
            }
        },
        {
            name: 'NOP',
            stepFee: 1n,
            regex: /^\s*NOP\s*$/,
            execute (ContractState, regexParts) {
                ContractState.instructionPointer = ContractState.getNextInstructionLine()
                return true
            }
        }
    ]

    // Process one line of assembly code.
    //  Return true if something was executed
    //  false if line is valid but nothing executed
    //  or null if invalid line
    static cpu (ContractState: CONTRACT) {
        const currLine = ContractState.sourceCode[ContractState.instructionPointer]

        const InstructionObj = this.cpuMicrocode.find(currCode => {
            if (currCode.regex.exec(currLine) === null) {
                return false
            }
            return true
        })

        if (InstructionObj === undefined) {
            return null
        }
        const currParts = InstructionObj.regex.exec(currLine)

        const account = Blockchain.accounts.find(obj => obj.id === ContractState.contract)
        if (account === undefined || currParts === null) {
            return null
        }
        account.balance -= Constants.stepfee * InstructionObj.stepFee
        if (account.balance < 0) {
            ContractState.frozen = true
            account.balance += Constants.stepfee * InstructionObj.stepFee
            ContractState.previousBalance = account.balance
            return true
        }
        return InstructionObj.execute(ContractState, currParts)
    }

    /**
     * Loop all lines colecting assembly directives and put
     * instruction pointer at first instruction
     *
     * @param {CONTRACT} ContractState - Contract to execute function
     * */
    static cpuDeploy (ContractState: CONTRACT) {
        let lastExecResult: RegExpExecArray | null, currCode: CPU_MICROCODE | undefined

        ContractState.sourceCode.forEach(line => {
            if (/^\s*\^.*/.exec(line) !== null) {
                // visit all compiler directives to deploy contract
                currCode = CPU.cpuMicrocode.find(instr => {
                    lastExecResult = instr.regex.exec(line)
                    if (lastExecResult === null) {
                        return false
                    }
                    return true
                })
                if (currCode !== undefined && lastExecResult !== null) {
                    currCode.execute(ContractState, lastExecResult)
                }
            }
        })
        ContractState.instructionPointer = ContractState.getNextInstructionLine(0)
        ContractState.PCS = ContractState.instructionPointer
    }
}
