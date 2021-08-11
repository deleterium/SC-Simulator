import { Blockchain, Contracts, Simulator } from "./out/index.js";
import {utils} from './out/utils.js'
import {AsmHighlight} from './out/asm_highlight.js'

// Author: Rui Deleterium
// Project: https://github.com/deleterium/SC-Simulator
// License: BSD 3-Clause License

/* Global variable */
var auto_step_timer=undefined
var auto_step_running=false
var auto_step_delay=200


/* Functions for user interface */

window.onload = function () {
    var scode = document.getElementById("source-code");

    scode.addEventListener('keyup',textKeyUp);
    scode.addEventListener('keydown',textKeyUp);
    scode.addEventListener('click',textKeyUp);
    scode.addEventListener('mouseup',textKeyUp);
    scode.addEventListener('paste',textKeyUp);

    document.getElementById("step").addEventListener('click', stepContract);
    document.getElementById("forge").addEventListener('click', forgeBlock);
    document.getElementById("deploy").addEventListener('click', deploy);
    document.getElementById("addbp").addEventListener('click', addBreakPoint);
    document.getElementById("run").addEventListener('click', runContract);
    document.getElementById("loadExample").addEventListener('click', loadExample);
    document.getElementById("autostep").addEventListener('click',auto_stepContract,false);
    document.getElementById("togSource").addEventListener('click', toggleSource);
    document.getElementById("loadSlot").addEventListener('click', loadSlot);
    
    document.getElementById("source_legend").addEventListener('click',detachSource);
    document.getElementById("actions_legend").addEventListener('click',detachActions);
    document.getElementById("memory_legend").addEventListener('click',detachMemory);
    document.getElementById("blockchain_legend").addEventListener('click',detachBlockchain);
    document.getElementById("transaction_legend").addEventListener('click',detachTransaction);

    textKeyUp()
}

// Adds manual breakpoint
function addBreakPoint(){
    
    if (Contracts.length == 0) {
        inform("Deploy contract before adding a breakpoint..")
        return
    }

    var newbp = prompt("Line?")
    var linediv = document.getElementById("codeline"+newbp)
    if (linediv === undefined) {
        inform("Line not found. Breakpoint NOT added")
        return
    }
    let result = Simulator.toggleBreakpoint(Number(newbp))
    if (result === "ADDED") {
        linediv.className+=" breakpoint"
        inform("Breakpoint "+newbp+" added")
    } else if (result === "REMOVED") {
        linediv.className= linediv.className.replace("breakpoint","")
        inform("Breakpoint "+newbp+" removed")
    }
    inform(result)
}

// Handles click do add/remove breakpoint
function clickBreakpoint()
{
    var e = window.event
    var newbp = e.currentTarget.id.slice(8)
    var linediv = document.getElementById("codeline"+newbp)
    if (linediv === undefined) {
        return
    }
    let result = Simulator.toggleBreakpoint(newbp)
    if (result === "ADDED") {
        linediv.className+=" breakpoint"
        inform("Breakpoint "+newbp+" added")
    } else if (result === "REMOVED") {
        linediv.className= linediv.className.replace("breakpoint","")
        inform("Breakpoint "+newbp+" removed")
    }
    inform(result)
}

// Runs contract for current block (until end or breakpoint found)
function runContract ()
{
    auto_step_running=false
    clearTimeout(auto_step_timer)

    var retString=Simulator.runSlotContract()
    inform(retString)
    updatePage()
}

// Runs only one instruction
function stepContract()
{
    auto_step_running=false
    clearTimeout(auto_step_timer)

    var retString = Simulator.stepSlotContract()
    if (retString === "") {
        inform("Step done.")
    } else {
        inform(retString)
    }
    updatePage()
}

// Runs steps with timeInterval
function auto_stepContract(click)
{
    if (Simulator.getNumberOfContracts() == -1) {
        inform("Deploy contract before auto-stepping..")
        return
    }
    if( click !== undefined) {
        auto_step_running = !auto_step_running
    }
    if (auto_step_running === false) {
        clearTimeout(auto_step_timer)
        inform("Auto-step interrupted")
        return
    }
    var retString = Simulator.stepSlotContract()
    if (retString === "") {
        auto_step_timer=setTimeout(auto_stepContract, auto_step_delay)
        inform("Auto-stepping...")
    } else {
        auto_step_running=false
        inform(retString)
    }
    updatePage()
}

// Simulate forging one block
function forgeBlock()
{

    let rcString = Simulator.forgeBlock(document.getElementById("transactions").value)
    inform(rcString)
    updatePage()
}

function setColorSource(){
    let sourceDOM = document.getElementById("source-code")
    let colorDOM = document.getElementById('color_code')
    if (Simulator.currSlotContract === undefined) {
        inform("No contract deployed.")
        return
    }
    colorDOM.innerHTML=AsmHighlight.toHTML(Contracts[Simulator.currSlotContract].sourceCode.join("\n"));
    sourceDOM.style.display="none"
    colorDOM.style.display="block"
    var collection = document.getElementsByClassName('asmVariable');
    for(let i = 0; i < collection.length; i++) {
        collection[i].addEventListener("mouseover", showInspector)
        collection[i].addEventListener("mouseout", hideInspector)
    }
    collection = document.getElementsByClassName('asmNumber');
    for(let i = 0; i < collection.length; i++) {
        collection[i].addEventListener("mouseover", showInspector)
        collection[i].addEventListener("mouseout", hideInspector)
    }
    collection = document.getElementsByClassName('asmLabel');
    for(let i = 0; i < collection.length; i++) {
        collection[i].addEventListener("mouseover", showLabel)
        collection[i].addEventListener("mouseout", hideInspector)
    }
    collection = document.getElementsByClassName('line');
    for(let i = 0; i < collection.length; i++) {
        collection[i].addEventListener("click", clickBreakpoint)
    }
    updatePage()
}
function setSourceCode(){
    let sourceDOM = document.getElementById("source-code")
    let colorDOM = document.getElementById('color_code')
    if (Simulator.currSlotContract === undefined) {
        inform("No contract deployed.")
        return
    }
    colorDOM.innerHTML=""
    colorDOM.style.display="none"
    sourceDOM.style.display="block"
    sourceDOM.value=Contracts[Simulator.currSlotContract].sourceCode.join("\n")
    inform("You can edit/change source code.")
    textKeyUp()
}
// Toggle source code or code highlighted for debug
function toggleSource(){
    let colorDOM = document.getElementById('color_code')
    if (Contracts.length==0) {
        inform("No contract deployed.")
        return
    }
    if (colorDOM.style.display === "block") {
        setSourceCode()
        return
    }
    setColorSource()
}

function loadSlot() {
    let numCc = Simulator.getNumberOfContracts()
    if (numCc == -1) {
        return
    }
    let slot = Number(prompt("Which contract? 0.."+numCc))

    if (slot <0 && slot > numCc) {
        inform("Invalid slot number.")
        return
    }
    Simulator.currSlotContract = slot
    setColorSource()
}

// Deploy contract and sets all variables to default
function deploy()
{
    let sourceDOM = document.getElementById("source-code")
    let source = sourceDOM.value
    if (source.length<=1) {
        inform("Could not load an empty contract.")
        return
    }
    Simulator.deploy(source)
    inform("Contract id "+Contracts[Contracts.length-1].contract.toString(10)+" deployed on slot "+(Contracts.length-1)+". Ready to run")
}

// Handles apearing/hiding inspector floating div and update its contents (for variables/numbers)
function hideInspector()
{
    document.getElementById("inspectorID").style.display="none"
}

// Handles apearing/hiding inspector floating div and update its contents (for variables/numbers)
function showInspector()
{
    var e = window.event
    let asmVar = e.currentTarget.innerText.slice(1).trim()
    if (Contracts.length == 0){
        return
    }
    let mydiv = document.getElementById("inspectorID")
    if (mydiv.style.display==="block") {
        mydiv.style.display="none"
        return
    }
    let ContractState = Contracts[Contracts.length - 1]
    let variable = ContractState.Memory.find(mem => mem.varName == asmVar)
    let value
    if (variable !== undefined) {
        value = variable.value
    } else if (/[\da-f]{16}/.exec(asmVar) !== null) {
        value = BigInt("0x"+asmVar)
    } else {
        return
    }

    let content = '<table><tbody><tr><th colspan="2">'+asmVar+'</th></tr>'
            + '<tr><td>Hex: </td><td>'
            + "0x"+value.toString(16)
            + '</td></tr><tr><td>String: </td><td>"'
            + utils.long2string(value)
            + '"</td></tr><tr><td>uDec: </td><td>'
            + value.toString(10)
            + '</td></tr><tr><td>sDec: </td><td>'
            + utils.unsigned2signed(value).toString(10)
            +'</td></tr></tbody></table>'
    mydiv.innerHTML = content
    mydiv.style.left = (e.layerX+20)+'px';
    mydiv.style.top = (e.layerY+20)+'px';
    mydiv.style.display="block"
}

// Handles apearing/hiding inspector floating div and update its contents (for labels)
function showLabel()
{
    var e = window.event
    let textLabel = e.currentTarget.innerText.trim().replace(":","")
    if (Contracts.length == 0){
        return
    }
    let ContractState = Contracts[Contracts.length - 1]
    let mydiv = document.getElementById("inspectorID")
    if (mydiv.style.display==="block") {
        mydiv.style.display="none"
        return
    }
    let custom_regex = new RegExp("^\\s*("+textLabel+"):\\s*$")
    let destination = ContractState.sourceCode.findIndex( line => custom_regex.exec(line) !== null)
    let content = '<table><tbody><tr><th>'+textLabel+'</th></tr>'
            +'<tr><td>Line '+destination+'</td></tr>'
            +'</tbody></table>'
    mydiv.innerHTML = content
    mydiv.style.left = (e.layerX+20)+'px';
    mydiv.style.top = (e.layerY+20)+'px';
    mydiv.style.display="block"
}


// Update simulator message
function inform(message)
{
    document.getElementById("simsaid").innerText=message
}

// Handle showing memory/registers table with all values
function updatePage()
{
    let output = ""
    let currVal

    if (Simulator.currSlotContract === undefined){
        return
    }
    let ContractState = Contracts[Simulator.currSlotContract]
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
    output += '<td colspan="2"  class="taleft">Balance: '+utils.long2stringBalance(Blockchain.getBalanceFrom(ContractState.contract)) + '</td>'
    output += '<td title="Instruction pointer (next line)">IP: '+ContractState.instructionPointer.toString() + '</td>'
    output += '<td> '+'' + '</td>'
    /*output += '<td>: '+'' + '</td>'*/
    output += '<td> '+'' + '</td>'
    output += '</tr></tbody></table>'

    output += '<table class="table-all"><tbody><tr><th>#</th><th class="taleft">Variable</th><th>Hex</th>'+
              '<th>String</th><th>Unsigned dec</th><th>Signed dec</th></tr>'
    for (let idx = 0; idx<ContractState.Memory.length; idx++){
        currVal = ContractState.Memory[idx].value
        if (Simulator.lastUpdateMemory[idx] !== undefined && currVal == Simulator.lastUpdateMemory[idx].value) {
            output +='<tr><td>'
        } else {
            output +='<tr class="updatedVal"><td>'
        }
        output += idx + '</td><td class="taleft">'
               + ContractState.Memory[idx].varName
               + '</td><td>'
               + "0x"+currVal.toString(16)
               + '</td><td>'
               + utils.long2string(currVal)
               + '</td><td>'
               + currVal.toString(10)
               + '</td><td>'
               + utils.unsigned2signed(currVal).toString(10)
               +'</td></tr>'

    }
    // A register
    for (let idx = 0; idx<4; idx++){
        currVal = ContractState.A[idx]
        if (Simulator.lastA !== undefined && currVal == Simulator.lastA[idx]) {
            output +='<tr><td>'
        } else {
            output +='<tr class="updatedVal"><td>'
        }
        output += '</td><td class="taleft">'
               + "<strong>A"+(idx+1)+"</strong>"
               + '</td><td>'
               + "0x"+currVal.toString(16)
               + '</td><td>'
               + utils.long2string(currVal)
               + '</td><td>'
               + currVal.toString(10)
               + '</td><td>'
               + utils.unsigned2signed(currVal).toString(10)
               +'</td></tr>'
    }
    // B register
    for (let idx = 0; idx<4; idx++){
        currVal = ContractState.B[idx]
        if (Simulator.lastB !== undefined && currVal == Simulator.lastB[idx]) {
            output +='<tr><td>'
        } else {
            output +='<tr class="updatedVal"><td>'
        }
        output += '</td><td class="taleft">'
               + "<strong>B"+(idx+1)+"</strong>"
               + '</td><td>'
               + "0x"+currVal.toString(16)
               + '</td><td>'
               + utils.long2string(currVal)
               + '</td><td>'
               + currVal.toString(10)
               + '</td><td>'
               + utils.unsigned2signed(currVal).toString(10)
               +'</td></tr>'
    }
    output += '</tbody></table>'

    // Other properties
    output +='<pre>'
    output += JSON.stringify(ContractState,stringifyReplacer,"   ")
    output += '\n</pre>'
    document.getElementById("memory_window").innerHTML = output

    // Highlighted line
    let line = document.getElementsByClassName("activeline")
    if (line[0] !== undefined)
        line[0].className=line[0].className.replace("activeline","")
    line = document.getElementById("codeline"+(ContractState.instructionPointer))
    if (line !== null) {
        line.className+=" activeline"
    }

    // Blockchain status
    document.getElementById("blockchain_output").innerHTML = JSON.stringify(Blockchain.accounts, stringifyReplacer, "   ")+JSON.stringify(Blockchain.transactions, stringifyReplacer, "   ")

    // Save last memory state
    Simulator.updateLastMemoryValues()

}

// grows text area
function textKeyUp ()
{
    var elem = document.getElementById("source-code");
    var text = elem.value;
    var newrow = (text.match(/\n/g) || '').length + 5;
    elem.rows = newrow;
 }

// Handles showing objects
function stringifyReplacer(key, value)
{
    if (   key == "Memory"
        || key == "sourceCode"
        || key == "frozen"
        || key == "running"
        || key == "stopped"
        || key == "finished"
        || key == "dead"
        || key == "A"
        || key == "B"
        || key == "instructionPointer" ) {
        return
    }
    if (key === "balance" || key === "amount") {
        return utils.long2stringBalance(value) + 'n';
    }
    if (typeof value === 'bigint') {
        return value.toString(10) + 'n';
    } else if (typeof value === 'number'){
        return value.toString(10);
    } else {
        return value;
    }
}

// functions for windows control
function detachSource(){
    new WinBox("Source code", {
        height: "50%",
        x: "0%",
        mount: document.getElementById("source_window"),
        onclose: function () {
            document.getElementById("source_fieldset").style.display="block";
        }
    });
    document.getElementById("source_fieldset").style.display="none";
}
function detachMemory(){
    new WinBox("Memory", {
        mount: document.getElementById("memory_window"),
        height: "50%",
        width: "50%",
        x: "50%",
        y: "25%",
        onclose: function () {
            document.getElementById("memory_fieldset").style.display="block";
        }
    });
    document.getElementById("memory_fieldset").style.display="none";
}
function detachActions(){
    new WinBox("Actions", {
        mount: document.getElementById("actions_window"),
        height: "25%",
        width: "50%",
        x: "50%",
        y: "0%",
        onclose: function () {
            document.getElementById("actions_fieldset").style.display="block";
        }
    });
    document.getElementById("actions_fieldset").style.display="none";
}
function detachTransaction(){
    var ret = new WinBox("Transactions", {
        mount: document.getElementById("transaction_window"),
        height: "25%",
        width: "50%",
        x: "50%",
        y: "75%",
        onclose: function () {
            document.getElementById("transaction_fieldset").style.display="block";
        }
    });
    document.getElementById("transaction_fieldset").style.display="none";
    return ret;
}
function detachBlockchain(){
    new WinBox("Blockchain", {
        mount: document.getElementById("blockchain_window"),
        height: "50%",
        width: "50%",
        x: "0%",
        y: "50%",
        onclose: function () {
            document.getElementById("blockchain_fieldset").style.display="block";
        }
    });
    document.getElementById("blockchain_fieldset").style.display="none";
}

var SIMul
// Function to load a simple example
function loadExample() {

    if (Simulator.currSlotContract!==undefined) {
        inform("Can not load example if contract is deployed...")
        return
    }

    document.getElementById("source-code").value = "\
^declare r0\n\
^declare r1\n\
^declare n8\n\
^declare n10\n\
^declare n0xff\n\
^declare numbers\n\
^const SET @numbers #0000000000000006\n\
^declare numbers_0\n\
^declare numbers_1\n\
^declare numbers_2\n\
^declare numbers_3\n\
^declare text\n\
^const SET @text #000000000000000b\n\
^declare text_0\n\
^declare text_1\n\
^declare text_2\n\
^declare text_3\n\
^declare i\n\
^declare atoi_val\n\
^declare atoi_ret\n\
^declare atoi_chr\n\
\n\
SET @n8 #0000000000000008\n\
SET @n10 #000000000000000a\n\
SET @n0xff #00000000000000ff\n\
^const SET @text_0 #0000000000373231\n\
^const SET @text_1 #0000000039393939\n\
^const SET @text_2 #0000000030313031\n\
^const SET @text_3 #0000363534333231\n\
JMP :__fn_main\n\
\n\
__fn_atoi:\n\
POP @atoi_val\n\
CLR @atoi_ret\n\
__loop1_continue:\n\
SET @atoi_chr #00000000000000ff\n\
AND @atoi_chr $atoi_val\n\
SET @r0 #0000000000000030\n\
SUB @atoi_chr $r0\n\
CLR @r0\n\
BLT $atoi_chr $r0 :__if2_start\n\
BGE $atoi_chr $n10 :__if2_start\n\
JMP :__if2_endif\n\
__if2_start:\n\
JMP :__loop1_break\n\
__if2_endif:\n\
MUL @atoi_ret $n10\n\
ADD @atoi_ret $atoi_chr\n\
SHR @atoi_val $n8\n\
JMP :__loop1_continue\n\
__loop1_break:\n\
PSH $atoi_ret\n\
RET\n\
\n\
__fn_main:\n\
PCS\n\
CLR @i\n\
__loop4_condition:\n\
SET @r0 #0000000000000004\n\
BGE $i $r0 :__loop4_break\n\
__loop4_start:\n\
SET @r0 $($text + $i)\n\
PSH $r0\n\
JSR :__fn_atoi\n\
POP @r0\n\
SET @($numbers + $i) $r0\n\
STP\n\
__loop4_continue:\n\
INC @i\n\
JMP :__loop4_condition\n\
__loop4_break:\n\
CLR @i\n\
__loop5_condition:\n\
SET @r0 #0000000000000004\n\
BGE $i $r0 :__loop5_break\n\
__loop5_start:\n\
CLR @r0\n\
SET @($numbers + $i) $r0\n\
__loop5_continue:\n\
INC @i\n\
JMP :__loop5_condition\n\
__loop5_break:\n\
FIN"
    textKeyUp()
}
