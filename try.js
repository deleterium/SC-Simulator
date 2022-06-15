import { Blockchain, Contracts, Simulator } from './src/index'
import { utils } from './src/utils'
import sah from 'smartc-assembly-highlight'
import { SmartC } from 'smartc-signum-compiler'

// Author: Rui Deleterium
// Project: https://github.com/deleterium/SC-Simulator
// License: BSD 3-Clause License

/* WinBox global is defined on file ./3rd-party/winbox.bundle.js
   hljs is defined on file ./3rd-party/highligth.min.js */
/* global WinBox hljs */

sah.Config.preLine = "<div id='codeline%line%' class='line'>"
sah.Config.postLine = '</div>'
/* Functions for user interface */

window.onload = function () {
    const scode = document.getElementById('source-code')

    scode.addEventListener('keyup', textKeyUp)
    scode.addEventListener('keydown', textKeyUp)
    scode.addEventListener('click', textKeyUp)
    scode.addEventListener('mouseup', textKeyUp)
    scode.addEventListener('paste', pasteEvent)

    document.getElementById('stepinto').addEventListener('click', stepIntoContract)
    document.getElementById('forge').addEventListener('click', forgeBlock)
    document.getElementById('deploy').addEventListener('click', deploy)
    document.getElementById('addbp').addEventListener('click', addBreakPoint)
    document.getElementById('run').addEventListener('click', runContract)
    document.getElementById('stepout').addEventListener('click', stepOutContract)
    document.getElementById('stepover').addEventListener('click', stepOverContract)
    document.getElementById('togSource').addEventListener('click', toggleSource)
    document.getElementById('loadSlot').addEventListener('click', loadSlot)

    document.getElementById('source_legend').addEventListener('click', detachSource)
    document.getElementById('actions_legend').addEventListener('click', detachActions)
    document.getElementById('memory_legend').addEventListener('click', detachMemory)
    document.getElementById('blockchain_legend').addEventListener('click', detachBlockchain)
    document.getElementById('transaction_legend').addEventListener('click', detachTransaction)
    document.getElementById('detachAll').addEventListener('click', detachAll)

    // Buttons to default
    document.getElementById('stepinto').disabled = true
    document.getElementById('togSource').disabled = false
    document.getElementById('forge').disabled = true
    document.getElementById('run').disabled = true
    document.getElementById('stepover').disabled = true
    document.getElementById('stepout').disabled = true
    document.getElementById('addbp').disabled = true
    document.getElementById('loadSlot').disabled = true

    hljs.addPlugin({
        'after:highlight': (result) => {
            let retString = ''
            const htmlLines = result.value.split('\n')
            let spanStack = []
            retString += htmlLines.map((content, index) => {
                let startSpanIndex, endSpanIndex
                let needle = 0
                content = spanStack.join('') + content
                spanStack = []
                do {
                    const remainingContent = content.slice(needle)
                    startSpanIndex = remainingContent.indexOf('<span')
                    endSpanIndex = remainingContent.indexOf('</span')
                    if (startSpanIndex === -1 && endSpanIndex === -1) {
                        break
                    }
                    if (endSpanIndex === -1 || (startSpanIndex !== -1 && startSpanIndex < endSpanIndex)) {
                        const nextSpan = /<span .+?>/.exec(remainingContent)
                        if (nextSpan === null) {
                            // never: but ensure no exception is raised if it happens.
                            break
                        }
                        spanStack.push(nextSpan[0])
                        needle += startSpanIndex + nextSpan[0].length
                    } else {
                        spanStack.pop()
                        needle += endSpanIndex + 1
                    }
                } while (true)
                if (spanStack.length > 0) {
                    content += Array(spanStack.length).fill('</span>').join('')
                }
                return `<div id="codeline${index + 1}" class="line">${content}</div>`
            }).join('')
            result.value = retString
        }
    })

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
    const retString = Simulator.runSlotContract()
    inform(retString)
    updatePage()
}

// Runs only one line stepping into calls
function stepIntoContract () {
    const retString = Simulator.stepIntoSlotContract()
    if (retString === '') {
        inform('Step done.')
    } else {
        inform(retString)
    }
    updatePage()
}

// Runs only one line stepping over calls
function stepOverContract (click) {
    const retString = Simulator.stepOverSlotContract()
    if (retString === '') {
        inform('Step done.')
    } else {
        inform(retString)
    }
    updatePage()
}

// Runs lines until turn back one level in code stack
function stepOutContract (click) {
    const retString = Simulator.stepOutSlotContract()
    if (retString === '') {
        inform('Step done.')
    } else {
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

    sourceDOM.style.display = 'none'
    colorDOM.style.display = 'block'
    document.getElementById('deploy').disabled = true
    document.getElementById('forge').disabled = false
    document.getElementById('run').disabled = false
    document.getElementById('stepover').disabled = false
    document.getElementById('stepinto').disabled = false
    document.getElementById('stepout').disabled = false
    document.getElementById('addbp').disabled = false

    let collection
    if (Contracts[Simulator.currSlotContract].cCodeArr.length > 1) {
        colorDOM.innerHTML = hljs.highlight(Contracts[Simulator.currSlotContract].cCodeArr.join('\n'), { language: 'c' }).value
    } else {
        colorDOM.innerHTML = sah.colorText(Contracts[Simulator.currSlotContract].asmCodeArr.join('\n'))

        collection = document.getElementsByClassName('asmVariable')
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
    document.getElementById('stepover').disabled = true
    document.getElementById('stepinto').disabled = true
    document.getElementById('stepout').disabled = true
    document.getElementById('addbp').disabled = true

    if (Contracts[Simulator.currSlotContract].cCodeArr.length > 1) {
        sourceDOM.value = Contracts[Simulator.currSlotContract].cCodeArr.join('\n')
    } else {
        sourceDOM.value = Contracts[Simulator.currSlotContract].asmCodeArr.join('\n')
    }
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
    let asmCompilationResult = ''
    let cCompilationResult = ''
    const asmCompiler = new SmartC({ language: 'Assembly', sourceCode: source })
    const cCompiler = new SmartC({ language: 'C', sourceCode: source + '\n#pragma verboseAssembly true\n' })
    try {
        asmCompiler.compile()
    } catch (error) {
        asmCompilationResult = error.message
    }
    try {
        cCompiler.compile()
    } catch (error) {
        cCompilationResult = error.message
    }
    if (cCompilationResult.length !== 0 && asmCompilationResult.length !== 0) {
        inform('Compilation failed. C error: ' +
            cCompilationResult.message +
            ' Assembly error: ' +
            asmCompilationResult
        )
        return
    }
    if (cCompilationResult.length === 0) {
        // Successful compiled c code
        Simulator.deploy(cCompiler.getAssemblyCode(), source)
        inform('C contract successfully compiled and deployed with id ' +
            Contracts[Contracts.length - 1].contract.toString(10) +
            ' on slot ' +
            (Contracts.length - 1) +
            '. Ready to run'
        )
    } else {
        Simulator.deploy(asmCompiler.getAssemblyCode())
        inform('Assembly contract successfully deployed with id ' +
            Contracts[Contracts.length - 1].contract.toString(10) +
            ' on slot ' +
            (Contracts.length - 1) +
            '. Ready to run'
        )
    }
    if (Contracts.length > 1) {
        document.getElementById('loadSlot').disabled = false
    }
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
    const destination = ContractState.asmCodeArr.findIndex(line => customRegex.exec(line) !== null)
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
    let assembly = true
    if (ContractState.cCodeArr.length > 1) {
        assembly = false
    }

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
    output += '<td title="Instruction pointer (next line)">IP: ' + (ContractState.instructionPointer + 1).toString()
    if (ContractState.cToAsmMap[ContractState.instructionPointer] !== ContractState.instructionPointer) {
        output += ' - line: ' + ContractState.cToAsmMap[ContractState.instructionPointer].toString(10)
    }
    output += '</td>'
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
    let lineToHighlight = ContractState.instructionPointer + 1
    if (assembly === false) {
        lineToHighlight = ContractState.cToAsmMap[ContractState.instructionPointer]
    }
    line = document.getElementById('codeline' + lineToHighlight)
    if (line !== null) {
        line.className += ' activeline'
        line.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    // Blockchain status
    document.getElementById('blockchain_output').innerHTML = 'Registered accounts = ' +
        JSON.stringify(Blockchain.accounts, stringifyReplacer, '   ') +
        '<br><br>Registered maps = ' +
        JSON.stringify(Blockchain.maps, stringifyReplacer, '   ') +
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
        key === 'asmCodeArr' ||
        key === 'frozen' ||
        key === 'running' ||
        key === 'stopped' ||
        key === 'finished' ||
        key === 'dead' ||
        key === 'A' ||
        key === 'B' ||
        key === 'instructionPointer' ||
        key === 'cToAsmMap' ||
        key === 'cCodeArr') {
        return
    }
    if (key === 'balance' || key === 'amount' || key === 'quantity') {
        return utils.long2stringBalance(value)
    }
    if (typeof value === 'bigint') {
        return value.toString(10)
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

function detachAll () {
    detachSource()
    detachActions()
    detachMemory()
    detachBlockchain()
    detachTransaction()
}
