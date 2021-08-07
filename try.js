'use strict'

/* Global variable */
var auto_step_timer=undefined
var auto_step_running=false

const MachineState = {}

const BlockchainState =  {
    currentBlock: 1,
    txHeight: 0n,
    accounts: [],
    transactions: [],
}

const SimulatorState = {
    breakpoints: [ ],
    lastUpdateMemory: []
}

const Constants = {
    stepfee: 73500n,  //default value from signum: 73500n
    auto_step_delay: 200, //in ms
    deploy_add_balance: 200000000n, //added balance to contract when deploying it
    activationAmount: 10000000n,   //contract activation amount
    creatorID: 555n,    //Account ID of creator
    contractID: 999n,   //Account ID of contract
    contractDPages: 10, // Number of data pages of deployed contract
    contractUSPages: 1, // Number of user stack pages of deployed contract
    contractCSPages: 1, // Number of code stack pages of deployed contract
    getRandomSleepBlocks: 15, //Sleep blocks during API to get random ticket.
}

var UpcomingTransactions = {}

/*
[
    {
        "sender": "10000n",
        "recipient": "999n",
        "amount": "100000000n",
        "blockheight": 2,
        "messageText": "text message to contract",
        "messageHex": "526166666c6520656e6465642e00000000000000000000000000000000000000"
    }
]
*/


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

    document.getElementById("source_legend").addEventListener('click',detachSource);
    document.getElementById("actions_legend").addEventListener('click',detachActions);
    document.getElementById("memory_legend").addEventListener('click',detachMemory);
    document.getElementById("blockchain_legend").addEventListener('click',detachBlockchain);
    document.getElementById("transaction_legend").addEventListener('click',detachTransaction);

    textKeyUp()
}

// Adds manual breakpoint
function addBreakPoint()
{
    if (MachineState.sourceCode===undefined) {
        inform("Deploy contract before adding a breakpoint..")
        return
    }
    var newbp = prompt("Line?")
    if ( SimulatorState.breakpoints.find(item => item == newbp) === undefined) {
        SimulatorState.breakpoints.push(newbp)
        let debug= document.getElementById("codeline"+newbp)
        debug.className+=" breakpoint"

    } else {
        SimulatorState.breakpoints = SimulatorState.breakpoints.filter(item => item != newbp)
        document.getElementById("codeline"+newbp).className=
            document.getElementById("codeline"+newbp).className.replace("breakpoint","")
    }
}

// Runs block for current block (until end or breakpoint found)
function runContract ()
{
    if (MachineState.sourceCode===undefined) {
        inform("Deploy contract before running..")
        return
    }
    var retCode=ContractController.run()
    inform(retCode)
    updatePage()
}

// Runs only one instruction
function stepContract()
{
    if (MachineState.sourceCode===undefined) {
        inform("Deploy contract before stepping..")
        return
    }
    var retCode = ContractController.step()
    if (retCode === undefined) {
        inform("Step done.")
    } else {
        inform(retCode)
    }
    updatePage()
}

// Runs steps with timeInterval
function auto_stepContract(click)
{
    if (MachineState.sourceCode===undefined) {
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
    var retCode = ContractController.step()
    if (retCode === undefined) {
        auto_step_timer=setTimeout(auto_stepContract, Constants.auto_step_delay)
        inform("Auto-stepping...")
    } else {
        auto_step_running=false
        inform(retCode)
    }
    updatePage()
}

// Simulate forging one block
function forgeBlock()
{
    if (MachineState.sourceCode===undefined) {
        inform("Deploy contract before forging a block..")
        return
    }
    try {
        UpcomingTransactions = JSON.parse(document.getElementById("transactions").value, (key, value) => {
            if (typeof value === "string") {
                if (/^[\d_]+n$/.test(value)) {
                    return BigInt(value.substr(0, value.length - 1).replaceAll("_",""));
                }
                if (/^0[xX][\da-fA-F_]+n$/.test(value)) {
                    return BigInt(value.substr(0, value.length - 1).replaceAll("_",""));
                }
                if (key === "blockheight") {
                    return Number(value);
                }
                if (key === "sender" || key === "recipient" || key === "amount") {
                    return BigInt(value.replaceAll("_",""));
                }
            }
            return value;
        })
    } catch (error) {
        inform("Could not parse transactions JSON text. Atention on ','!!! "+error)
        return
    }
    // Verify if ended execution this block
    if (MachineState.frozen === false &&
        MachineState.running === true) {
        inform("End contract execution on this block to continue.")
        return
    }
    ContractController.dispatchEnqueuedTX()
    BlockchainState.currentBlock++
    BlockchainState.txHeight = 0n
    BlockchainController.processBlock()
    ContractController.processBlock()
    inform("Block #"+BlockchainState.currentBlock+" forged!")
    updatePage()
}

// Deploy contract and sets all variables to default
function deploy()
{
    let sourceDOM = document.getElementById("source-code")
    let colorDOM = document.getElementById('color_code')
    let source = sourceDOM.value
    if (source.length<=1) {
        inform("Could not load an empty contract.")
        return
    }
    MachineState.instructionPointer= 0
    MachineState.sleepUntilBlock= 0
    MachineState.previousBalance= 0
    MachineState.frozen= false
    MachineState.running=true
    MachineState.stopped=false
    MachineState.finished=false
    MachineState.dead=false
    MachineState.activationAmount = Constants.activationAmount
    MachineState.creator= Constants.creatorID
    MachineState.contract= Constants.contractID
    MachineState.DataPages= Constants.contractDPages
    MachineState.UserStackPages= Constants.contractUSPages
    MachineState.CodeStackPages= Constants.contractUSPages
    MachineState.Memory= []
    MachineState.UserStack= []
    MachineState.CodeStack= []
    MachineState.A= [ 0n, 0n, 0n, 0n ]
    MachineState.B= [ 0n, 0n, 0n, 0n ]
    MachineState.PCS= null
    MachineState.ERR= null
    BlockchainState.currentBlock= 1
    BlockchainState.accounts= []
    BlockchainState.transactions= []
    BlockchainState.accounts.push( { id: Constants.contractID, balance: Constants.deploy_add_balance} )
    SimulatorState.breakpoints=[]
    if (MachineState.sourceCode !== undefined) {
        MachineState.sourceCode=undefined
        colorDOM.innerHTML=""
        colorDOM.style.display="none"
        sourceDOM.style.display="block"
        updatePage()
        inform("Contract unloaded")
        return
    }
    MachineState.sourceCode=source.split("\n")
    colorDOM.innerHTML=asm_highlight(source);
    sourceDOM.style.display="none"
    colorDOM.style.display="block"
    cpu_deploy()
    updatePage()
    inform("Contract deployed. Ready to run")
}

// Handles apearing/hiding inspector floating div and update its contents (for variables/numbers)
function showInspector(asmVar)
{
    asmVar = asmVar.trim()
    var e = window.event
    let variable = MachineState.Memory.find(mem => mem.name == asmVar)
    let value
    if (variable !== undefined) {
        value = variable.value
    } else if (/[\da-f]{16}/.exec(asmVar) !== null) {
        value = BigInt("0x"+asmVar)
    } else {
        return
    }
    let mydiv = document.getElementById("inspectorID")
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
    if (mydiv.style.display==="block") {
        mydiv.style.display="none"
    } else {
        mydiv.style.display="block"
    }
}

// Handles apearing/hiding inspector floating div and update its contents (for labels)
function showLabel(textLabel)
{
    textLabel = textLabel.trim()
    var e = window.event
    let custom_regex = new RegExp("^\\s*("+textLabel+"):\\s*$")
    let destination = MachineState.sourceCode.findIndex( line => custom_regex.exec(line) !== null)
    if (destination == -1){
        return
    }
    let mydiv = document.getElementById("inspectorID")
    let content = '<table><tbody><tr><th>'+textLabel+'</th></tr>'
            +'<tr><td>Line '+destination+'</td></tr>'
            +'</tbody></table>'
    mydiv.innerHTML = content
    mydiv.style.left = (e.layerX+20)+'px';
    mydiv.style.top = (e.layerY+20)+'px';
    if (mydiv.style.display==="block") {
        mydiv.style.display="none"
    } else {
        mydiv.style.display="block"
    }
}

// Handles click do add/remove breakpoint
function clickBreakpoint()
{
    var e = window.event
    var newbp = e.currentTarget.id.slice(8)
    if ( SimulatorState.breakpoints.find(item => item == newbp) === undefined) {
        SimulatorState.breakpoints.push(newbp)
        let debug= document.getElementById("codeline"+newbp)
        debug.className+=" breakpoint"
    } else {
        SimulatorState.breakpoints = SimulatorState.breakpoints.filter(item => item != newbp)
        document.getElementById("codeline"+newbp).className=
        document.getElementById("codeline"+newbp).className.replace("breakpoint","")
    }
}

// Update simulator message
function inform(message)
{
    document.getElementById("simsaid").innerText=message
}

// Handle showing memory/registers table with all values
function updatePage()
{
    function clone(aObject) {
        if (!aObject) {
          return aObject;
        }
        let v;
        let bObject = Array.isArray(aObject) ? [] : {};
        for (const k in aObject) {
          v = aObject[k];
          bObject[k] = (typeof v === "object") ? clone(v) : v;
        }
        return bObject;
    }

    let output = ""
    let currVal

    // Boolean properties
    output += '<table class="table-all"><tbody><tr>'

    if (MachineState.frozen) output += '<td class="taleft updatedVal">Frozen: '
    else output += '<td class="taleft">Frozen: '
    output += MachineState.frozen.toString() + '</td>'

    if (MachineState.running) output += '<td class="updatedVal">Running: '
    else output += '<td>Running: '
    output += MachineState.running.toString() + '</td>'

    if (MachineState.stopped) output += '<td class="updatedVal">Stopped: '
    else output += '<td>Stopped: '
    output += MachineState.stopped.toString() + '</td>'

    if (MachineState.finished) output += '<td class="updatedVal">Finished: '
    else output += '<td>Finished: '
    output += MachineState.finished.toString() + '</td>'

    if (MachineState.dead) output += '<td class="updatedVal">Dead: '
    else output += '<td>Dead: '
    output += MachineState.dead.toString() + '</td>'

    output += '</tr><tr>'
    output += '<td colspan="2"  class="taleft">Balance: '+utils.long2stringBalance(BlockchainState.accounts.find(obj => obj.id == MachineState.contract).balance) + '</td>'
    if (MachineState.instructionPointer === null)
        output += '<td title="Instruction pointer (next line)">IP: null</td>'
    else
        output += '<td title="Instruction pointer (next line)">IP: '+MachineState.instructionPointer.toString() + '</td>'
    output += '<td> '+'' + '</td>'
    /*output += '<td>: '+'' + '</td>'*/
    output += '<td> '+'' + '</td>'
    output += '</tr></tbody></table>'

    // Memory content
    if (SimulatorState.lastUpdateMemory.length == 0) {
        SimulatorState.lastUpdateMemory = clone(MachineState.Memory)
        SimulatorState.lastA = clone(MachineState.A)
        SimulatorState.lastB = clone(MachineState.B)
    }
    output += '<table class="table-all"><tbody><tr><th>#</th><th class="taleft">Variable</th><th>Hex</th>'+
              '<th>String</th><th>Unsigned dec</th><th>Signed dec</th></tr>'
    for (let idx = 0; idx<MachineState.Memory.length; idx++){
        currVal = MachineState.Memory[idx].value
        if (SimulatorState.lastUpdateMemory[idx] !== undefined && currVal == SimulatorState.lastUpdateMemory[idx].value) {
            output +='<tr><td>'
        } else {
            output +='<tr class="updatedVal"><td>'
        }
        output += idx + '</td><td class="taleft">'
               + MachineState.Memory[idx].name
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
        currVal = MachineState.A[idx]
        if (SimulatorState.lastA !== undefined && currVal == SimulatorState.lastA[idx]) {
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
        currVal = MachineState.B[idx]
        if (SimulatorState.lastB !== undefined && currVal == SimulatorState.lastB[idx]) {
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
    output += JSON.stringify(MachineState,stringifyReplacer,"   ")
    output += '\n</pre>'
    document.getElementById("memory_window").innerHTML = output


    // Highlighted line
    let line = document.getElementsByClassName("activeline")
    if (line[0] !== undefined)
        line[0].className=line[0].className.replace("activeline","")
    line = document.getElementById("codeline"+(MachineState.instructionPointer))
    if (line !== null) {
        line.className+=" activeline"
    }

    // Blockchain status
    document.getElementById("blockchain_output").innerHTML = JSON.stringify(BlockchainState, stringifyReplacer, "   ")

    // Save last memory state
    SimulatorState.lastUpdateMemory = clone(MachineState.Memory)
    SimulatorState.lastA = clone(MachineState.A)
    SimulatorState.lastB = clone(MachineState.B)

}

// grows text area
function textKeyUp ()
{
    var elem = document.getElementById("source-code");
    var text = elem.value;
    var newrow = (text.match(/\n/g) || '').length + 5;
    elem.rows = newrow;
 }

// Handles showing objects for MachineState object
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

// Function to load a simple example
function loadExample() {

    if (MachineState.sourceCode!==undefined) {
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
