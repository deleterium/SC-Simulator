import { Blockchain, Contracts, Simulator } from './out/index.js'
import { utils } from './out/utils.js'
import { AsmHighlight } from './out/asm_highlight.js'

// Author: Rui Deleterium
// Project: https://github.com/deleterium/SC-Simulator
// License: BSD 3-Clause License

/* WinBox global is defined on file ./3rd-party/winbox.bundle.js */
/* global WinBox */

let autoStepTimer
let autoStepRunning = false
const autoStepDelay = 200

/* Functions for user interface */

window.onload = function () {
    const scode = document.getElementById('source-code')

    scode.addEventListener('keyup', textKeyUp)
    scode.addEventListener('keydown', textKeyUp)
    scode.addEventListener('click', textKeyUp)
    scode.addEventListener('mouseup', textKeyUp)
    scode.addEventListener('paste', pasteEvent)

    document.getElementById('step').addEventListener('click', stepContract)
    document.getElementById('forge').addEventListener('click', forgeBlock)
    document.getElementById('deploy').addEventListener('click', deploy)
    document.getElementById('addbp').addEventListener('click', addBreakPoint)
    document.getElementById('run').addEventListener('click', runContract)
    document.getElementById('loadExample').addEventListener('click', loadExample)
    document.getElementById('autostep').addEventListener('click', autoStepContract, false)
    document.getElementById('togSource').addEventListener('click', toggleSource)
    document.getElementById('loadSlot').addEventListener('click', loadSlot)

    document.getElementById('source_legend').addEventListener('click', detachSource)
    document.getElementById('actions_legend').addEventListener('click', detachActions)
    document.getElementById('memory_legend').addEventListener('click', detachMemory)
    document.getElementById('blockchain_legend').addEventListener('click', detachBlockchain)
    document.getElementById('transaction_legend').addEventListener('click', detachTransaction)

    // Buttons to default
    document.getElementById('step').disabled = true
    document.getElementById('togSource').disabled = false
    document.getElementById('forge').disabled = true
    document.getElementById('run').disabled = true
    document.getElementById('autostep').disabled = true
    document.getElementById('addbp').disabled = true
    document.getElementById('loadExample').disabled = false
    document.getElementById('loadSlot').disabled = true

    textKeyUp()
}

// Event handler to be used only in first paste
function pasteEvent (e) {
    if (e.target.value !== '') {
        // Disregard this function
        return
    }
    // add 'pasted:' to pasted text
    const paste = (e.clipboardData || window.clipboardData).getData('text')
    e.target.value = paste
    // stop default paste
    e.preventDefault()
    // Update textarea height
    textKeyUp()
}

// Adds manual breakpoint
function addBreakPoint () {
    if (Contracts.length === 0) {
        inform('Deploy contract before adding a breakpoint..')
        return
    }

    const newbp = prompt('Line?')
    const linediv = document.getElementById('codeline' + newbp)
    if (linediv === undefined) {
        inform('Line not found. Breakpoint NOT added')
        return
    }
    const result = Simulator.toggleBreakpoint(Number(newbp))
    if (result === 'ADDED') {
        linediv.className += ' breakpoint'
        inform('Breakpoint ' + newbp + ' added')
    } else if (result === 'REMOVED') {
        linediv.className = linediv.className.replace('breakpoint', '')
        inform('Breakpoint ' + newbp + ' removed')
    }
    inform(result)
}

// Handles click do add/remove breakpoint
function clickBreakpoint () {
    const e = window.event
    const newbp = e.currentTarget.id.slice(8)
    const linediv = document.getElementById('codeline' + newbp)
    if (linediv === undefined) {
        return
    }
    const result = Simulator.toggleBreakpoint(Number(newbp))
    if (result === 'ADDED') {
        linediv.className += ' breakpoint'
        inform('Breakpoint ' + newbp + ' added')
    } else if (result === 'REMOVED') {
        linediv.className = linediv.className.replace('breakpoint', '')
        inform('Breakpoint ' + newbp + ' removed')
    }
    inform(result)
}

// Runs contract for current block (until end or breakpoint found)
function runContract () {
    autoStepRunning = false
    clearTimeout(autoStepTimer)

    const retString = Simulator.runSlotContract()
    inform(retString)
    updatePage()
}

// Runs only one instruction
function stepContract () {
    autoStepRunning = false
    clearTimeout(autoStepTimer)

    const retString = Simulator.stepSlotContract()
    if (retString === '') {
        inform('Step done.')
    } else {
        inform(retString)
    }
    updatePage()
}

// Runs steps with timeInterval
function autoStepContract (click) {
    if (Simulator.getNumberOfContracts() === -1) {
        inform('Deploy contract before auto-stepping..')
        return
    }
    if (click !== undefined) {
        autoStepRunning = !autoStepRunning
    }
    if (autoStepRunning === false) {
        clearTimeout(autoStepTimer)
        inform('Auto-step interrupted')
        return
    }
    const retString = Simulator.stepSlotContract()
    if (retString === '') {
        autoStepTimer = setTimeout(autoStepContract, autoStepDelay)
        inform('Auto-stepping...')
    } else {
        autoStepRunning = false
        inform(retString)
    }
    updatePage()
}

// Simulate forging one block
function forgeBlock () {
    const rcString = Simulator.forgeBlock(document.getElementById('transactions').value)
    inform(rcString)
    updatePage()
}

function setColorSource () {
    const sourceDOM = document.getElementById('source-code')
    const colorDOM = document.getElementById('color_code')
    if (Simulator.currSlotContract === undefined) {
        inform('No contract deployed.')
        return
    }
    colorDOM.innerHTML = AsmHighlight.toHTML(Contracts[Simulator.currSlotContract].sourceCode.join('\n'))
    sourceDOM.style.display = 'none'
    colorDOM.style.display = 'block'
    document.getElementById('deploy').disabled = true
    document.getElementById('forge').disabled = false
    document.getElementById('run').disabled = false
    document.getElementById('autostep').disabled = false
    document.getElementById('step').disabled = false
    document.getElementById('addbp').disabled = false

    let collection = document.getElementsByClassName('asmVariable')
    for (let i = 0; i < collection.length; i++) {
        collection[i].addEventListener('mouseover', showInspector)
        collection[i].addEventListener('mouseout', hideInspector)
    }
    collection = document.getElementsByClassName('asmNumber')
    for (let i = 0; i < collection.length; i++) {
        collection[i].addEventListener('mouseover', showInspector)
        collection[i].addEventListener('mouseout', hideInspector)
    }
    collection = document.getElementsByClassName('asmLabel')
    for (let i = 0; i < collection.length; i++) {
        collection[i].addEventListener('mouseover', showLabel)
        collection[i].addEventListener('mouseout', hideInspector)
    }
    collection = document.getElementsByClassName('line')
    for (let i = 0; i < collection.length; i++) {
        collection[i].addEventListener('click', clickBreakpoint)
    }
    updatePage()

    Simulator.getBreakpoints().forEach(bpLine => {
        const linediv = document.getElementById('codeline' + bpLine)
        if (linediv === undefined) {
            return
        }
        linediv.className += ' breakpoint'
    })
}
function setSourceCode () {
    const sourceDOM = document.getElementById('source-code')
    const colorDOM = document.getElementById('color_code')
    if (Simulator.currSlotContract === undefined) {
        inform('No contract deployed.')
        return
    }
    colorDOM.innerHTML = ''
    colorDOM.style.display = 'none'
    sourceDOM.style.display = 'block'
    document.getElementById('deploy').disabled = false
    document.getElementById('forge').disabled = true
    document.getElementById('run').disabled = true
    document.getElementById('autostep').disabled = true
    document.getElementById('step').disabled = true
    document.getElementById('addbp').disabled = true

    sourceDOM.value = Contracts[Simulator.currSlotContract].sourceCode.join('\n')
    inform('You can edit/change source code.')
    textKeyUp()
}
// Toggle source code or code highlighted for debug
function toggleSource () {
    const colorDOM = document.getElementById('color_code')
    if (Contracts.length === 0) {
        inform('No contract deployed.')
        return
    }
    if (colorDOM.style.display === 'block') {
        setSourceCode()
        return
    }
    setColorSource()
}

function loadSlot () {
    const numCc = Simulator.getNumberOfContracts()
    if (numCc === -1) {
        return
    }
    const slot = Number(prompt('Which contract? 0..' + numCc))

    if (slot < 0 && slot > numCc) {
        inform('Invalid slot number.')
        return
    }
    Simulator.currSlotContract = slot
    Simulator.clearAllBreakpoints()
    setColorSource()
}

// Deploy contract and sets all variables to default
function deploy () {
    const sourceDOM = document.getElementById('source-code')
    const source = sourceDOM.value
    if (source.length <= 1) {
        inform('Could not load an empty contract.')
        return
    }
    Simulator.deploy(source)
    inform('Contract id ' + Contracts[Contracts.length - 1].contract.toString(10) + ' deployed on slot ' + (Contracts.length - 1) + '. Ready to run')

    if (Contracts.length > 1) {
        document.getElementById('loadSlot').disabled = false
    }
    document.getElementById('loadExample').disabled = true
}

// Handles apearing/hiding inspector floating div and update its contents (for variables/numbers)
function hideInspector () {
    document.getElementById('inspectorID').style.display = 'none'
}

// Handles apearing/hiding inspector floating div and update its contents (for variables/numbers)
function showInspector () {
    const e = window.event
    const asmVar = e.currentTarget.innerText.slice(1).trim()
    if (Contracts.length === 0) {
        return
    }
    const mydiv = document.getElementById('inspectorID')
    if (mydiv.style.display === 'block') {
        mydiv.style.display = 'none'
        return
    }
    const ContractState = Contracts[Simulator.currSlotContract]
    const variable = ContractState.Memory.find(mem => mem.varName === asmVar)
    let value
    if (variable !== undefined) {
        value = variable.value
    } else if (/[\da-f]{16}/.exec(asmVar) !== null) {
        value = BigInt('0x' + asmVar)
    } else {
        return
    }

    const content = '<table><tbody><tr><th colspan="2">' + asmVar + '</th></tr>' +
            '<tr><td>Hex: </td><td>' +
            '0x' + value.toString(16) +
            '</td></tr><tr><td>String: </td><td>"' +
            utils.long2string(value) +
            '"</td></tr><tr><td>uDec: </td><td>' +
            value.toString(10) +
            '</td></tr><tr><td>sDec: </td><td>' +
            utils.unsigned2signed(value).toString(10) +
            '</td></tr></tbody></table>'
    mydiv.innerHTML = content
    mydiv.style.left = (e.layerX + 20) + 'px'
    mydiv.style.top = (e.layerY + 20) + 'px'
    mydiv.style.display = 'block'
}

// Handles apearing/hiding inspector floating div and update its contents (for labels)
function showLabel () {
    const e = window.event
    const textLabel = e.currentTarget.innerText.trim().replace(':', '')
    if (Contracts.length === 0) {
        return
    }
    const ContractState = Contracts[Contracts.length - 1]
    const mydiv = document.getElementById('inspectorID')
    if (mydiv.style.display === 'block') {
        mydiv.style.display = 'none'
        return
    }
    const customRegex = new RegExp('^\\s*(' + textLabel + '):\\s*$')
    const destination = ContractState.sourceCode.findIndex(line => customRegex.exec(line) !== null)
    const content = '<table><tbody><tr><th>' + textLabel + '</th></tr>' +
            '<tr><td>Line ' + destination + '</td></tr>' +
            '</tbody></table>'
    mydiv.innerHTML = content
    mydiv.style.left = (e.layerX + 20) + 'px'
    mydiv.style.top = (e.layerY + 20) + 'px'
    mydiv.style.display = 'block'
}

// Update simulator message
function inform (message) {
    document.getElementById('simsaid').innerText = message
}

// Handle showing memory/registers table with all values
function updatePage () {
    let output = ''
    let currVal

    if (Simulator.currSlotContract === undefined) {
        return
    }
    const ContractState = Contracts[Simulator.currSlotContract]
    // Boolean properties
    output += '<table class="table-all"><tbody><tr>'

    if (ContractState.frozen) output += '<td class="taleft updatedVal">Frozen: '
    else output += '<td class="taleft">Frozen: '
    output += ContractState.frozen.toString() + '</td>'

    if (ContractState.running) output += '<td class="updatedVal">Running: '
    else output += '<td>Running: '
    output += ContractState.running.toString() + '</td>'

    if (ContractState.stopped) output += '<td class="updatedVal">Stopped: '
    else output += '<td>Stopped: '
    output += ContractState.stopped.toString() + '</td>'

    if (ContractState.finished) output += '<td class="updatedVal">Finished: '
    else output += '<td>Finished: '
    output += ContractState.finished.toString() + '</td>'

    if (ContractState.dead) output += '<td class="updatedVal">Dead: '
    else output += '<td>Dead: '
    output += ContractState.dead.toString() + '</td>'

    output += '</tr><tr>'
    output += '<td colspan="2"  class="taleft">Balance: ' + utils.long2stringBalance(Blockchain.getBalanceFrom(ContractState.contract)) + '</td>'
    output += '<td title="Instruction pointer (next line)">IP: ' + ContractState.instructionPointer.toString() + '</td>'
    output += '<td> ' + '' + '</td>'
    /* output += '<td>: '+'' + '</td>' */
    output += '<td> ' + '' + '</td>'
    output += '</tr></tbody></table>'

    output += '<table class="table-all"><tbody><tr><th>#</th><th class="taleft">Variable</th><th>Hex</th>' +
              '<th>String</th><th>Unsigned dec</th><th>Signed dec</th></tr>'
    for (let idx = 0; idx < ContractState.Memory.length; idx++) {
        currVal = ContractState.Memory[idx].value
        if (Simulator.lastUpdateMemory[idx] !== undefined && currVal === Simulator.lastUpdateMemory[idx].value) {
            output += '<tr><td>'
        } else {
            output += '<tr class="updatedVal"><td>'
        }
        output += idx + '</td><td class="taleft">' +
               ContractState.Memory[idx].varName +
               '</td><td>' +
               '0x' + currVal.toString(16) +
               '</td><td>' +
               utils.long2string(currVal) +
               '</td><td>' +
               currVal.toString(10) +
               '</td><td>' +
               utils.unsigned2signed(currVal).toString(10) +
               '</td></tr>'
    }
    // A register
    for (let idx = 0; idx < 4; idx++) {
        currVal = ContractState.A[idx]
        if (Simulator.lastA !== undefined && currVal === Simulator.lastA[idx]) {
            output += '<tr><td>'
        } else {
            output += '<tr class="updatedVal"><td>'
        }
        output += '</td><td class="taleft">' +
               '<strong>A' + (idx + 1) + '</strong>' +
               '</td><td>' +
               '0x' + currVal.toString(16) +
               '</td><td>' +
               utils.long2string(currVal) +
               '</td><td>' +
               currVal.toString(10) +
               '</td><td>' +
               utils.unsigned2signed(currVal).toString(10) +
               '</td></tr>'
    }
    // B register
    for (let idx = 0; idx < 4; idx++) {
        currVal = ContractState.B[idx]
        if (Simulator.lastB !== undefined && currVal === Simulator.lastB[idx]) {
            output += '<tr><td>'
        } else {
            output += '<tr class="updatedVal"><td>'
        }
        output += '</td><td class="taleft">' +
               '<strong>B' + (idx + 1) + '</strong>' +
               '</td><td>' +
               '0x' + currVal.toString(16) +
               '</td><td>' +
               utils.long2string(currVal) +
               '</td><td>' +
               currVal.toString(10) +
               '</td><td>' +
               utils.unsigned2signed(currVal).toString(10) +
               '</td></tr>'
    }
    output += '</tbody></table>'

    // Other properties
    output += '<pre>'
    output += JSON.stringify(ContractState, stringifyReplacer, '   ')
    output += '\n</pre>'
    document.getElementById('memory_window').innerHTML = output

    // Highlighted line
    let line = document.getElementsByClassName('activeline')
    if (line[0] !== undefined) {
        line[0].className = line[0].className.replace('activeline', '')
    }
    line = document.getElementById('codeline' + (ContractState.instructionPointer))
    if (line !== null) {
        line.className += ' activeline'
    }

    // Blockchain status
    document.getElementById('blockchain_output').innerHTML = 'Registered accounts = ' +
        JSON.stringify(Blockchain.accounts, stringifyReplacer, '   ') +
        '<br><br>Registered transactions = ' +
        JSON.stringify(Blockchain.transactions, stringifyReplacer, '   ') +
        '<br><br>Current blockheight = ' +
        Blockchain.currentBlock.toString(10)

    // Save last memory state
    Simulator.updateLastMemoryValues()
}

// grows text area
function textKeyUp () {
    const elem = document.getElementById('source-code')
    const text = elem.value
    const newrow = (text.match(/\n/g) || '').length + 5
    elem.rows = newrow
}

// Handles showing objects
function stringifyReplacer (key, value) {
    if (key === 'Memory' ||
        key === 'sourceCode' ||
        key === 'frozen' ||
        key === 'running' ||
        key === 'stopped' ||
        key === 'finished' ||
        key === 'dead' ||
        key === 'A' ||
        key === 'B' ||
        key === 'instructionPointer') {
        return
    }
    if (key === 'balance' || key === 'amount') {
        return utils.long2stringBalance(value) + 'n'
    }
    if (typeof value === 'bigint') {
        return value.toString(10) + 'n'
    } else if (typeof value === 'number') {
        return value.toString(10)
    } else {
        return value
    }
}

// functions for windows control
/* eslint-disable no-new */
function detachSource () {
    new WinBox('Source code', {
        height: '50%',
        x: '0%',
        mount: document.getElementById('source_window'),
        onclose: function () {
            document.getElementById('source_fieldset').style.display = 'block'
        }
    })
    document.getElementById('source_fieldset').style.display = 'none'
}
function detachMemory () {
    new WinBox('Memory', {
        mount: document.getElementById('memory_window'),
        height: '50%',
        width: '50%',
        x: '50%',
        y: '25%',
        onclose: function () {
            document.getElementById('memory_fieldset').style.display = 'block'
        }
    })
    document.getElementById('memory_fieldset').style.display = 'none'
}
function detachActions () {
    new WinBox('Actions', {
        mount: document.getElementById('actions_window'),
        height: '25%',
        width: '50%',
        x: '50%',
        y: '0%',
        onclose: function () {
            document.getElementById('actions_fieldset').style.display = 'block'
        }
    })
    document.getElementById('actions_fieldset').style.display = 'none'
}
function detachTransaction () {
    const ret = new WinBox('Transactions', {
        mount: document.getElementById('transaction_window'),
        height: '25%',
        width: '50%',
        x: '50%',
        y: '75%',
        onclose: function () {
            document.getElementById('transaction_fieldset').style.display = 'block'
        }
    })
    document.getElementById('transaction_fieldset').style.display = 'none'
    return ret
}
function detachBlockchain () {
    new WinBox('Blockchain', {
        mount: document.getElementById('blockchain_window'),
        height: '50%',
        width: '50%',
        x: '0%',
        y: '50%',
        onclose: function () {
            document.getElementById('blockchain_fieldset').style.display = 'block'
        }
    })
    document.getElementById('blockchain_fieldset').style.display = 'none'
}
/* eslint-enable no-new */

// Function to load a simple example
function loadExample () {
    if (Simulator.currSlotContract !== undefined) {
        inform('Can not load example if contract is deployed...')
        return
    }

    document.getElementById('source-code').value = `^declare r0
^declare r1
^declare n8
^declare n10
^declare n0xff
^declare numbers
^const SET @numbers #0000000000000006
^declare numbers_0
^declare numbers_1
^declare numbers_2
^declare numbers_3
^declare text
^const SET @text #000000000000000b
^declare text_0
^declare text_1
^declare text_2
^declare text_3
^declare i
^declare atoi_val
^declare atoi_ret
^declare atoi_chr

SET @n8 #0000000000000008
SET @n10 #000000000000000a
SET @n0xff #00000000000000ff
^const SET @text_0 #0000000000373231
^const SET @text_1 #0000000039393939
^const SET @text_2 #0000000030313031
^const SET @text_3 #0000363534333231
JMP :__fn_main

__fn_atoi:
POP @atoi_val
CLR @atoi_ret
__loop1_continue:
SET @atoi_chr #00000000000000ff
AND @atoi_chr $atoi_val
SET @r0 #0000000000000030
SUB @atoi_chr $r0
CLR @r0
BLT $atoi_chr $r0 :__if2_start
BGE $atoi_chr $n10 :__if2_start
JMP :__if2_endif
__if2_start:
JMP :__loop1_break
__if2_endif:
MUL @atoi_ret $n10
ADD @atoi_ret $atoi_chr
SHR @atoi_val $n8
JMP :__loop1_continue
__loop1_break:
PSH $atoi_ret
RET

__fn_main:
PCS
CLR @i
__loop4_condition:
SET @r0 #0000000000000004
BGE $i $r0 :__loop4_break
__loop4_start:
SET @r0 $($text + $i)
PSH $r0
JSR :__fn_atoi
POP @r0
SET @($numbers + $i) $r0
STP
__loop4_continue:
INC @i
JMP :__loop4_condition
__loop4_break:
CLR @i
__loop5_condition:
SET @r0 #0000000000000004
BGE $i $r0 :__loop5_break
__loop5_start:
CLR @r0
SET @($numbers + $i) $r0
__loop5_continue:
INC @i
JMP :__loop5_condition
__loop5_break:
FIN`
    textKeyUp()
}
