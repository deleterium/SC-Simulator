'use strict'

var auto_step_timer=undefined
var auto_step_running=false

const MachineState = {}

const BlockchainState =  {
    currentBlock: 1,
}

const SimulatorState = {
    breakpoints: [ ],
    lastUpdateMemory: []
}

const Constants = {
    stepfee: 73500n,  //default value from signum: 73500n
    auto_step_delay: 200, //in ms
    forge_add_balance: 100000000n, //added balance to contract when forging block
    deploy_add_balance: 100000000n, //added balance to contract when deploying it
    creatorID: 555n,    //Account ID of creator
    contractID: 999n,   //Account ID of contract
    contractDPages: 10, // Number of data pages of deployed contract
    contractUSPages: 1, // Number of user stack pages of deployed contract
    contractCSPages: 1, // Number of code stack pages of deployed contract

}


function onLoad() {
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

function addBreakPoint(){

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

function runContract (){
    var retCode=Controller.run()
    inform(retCode)
    updatePage()
}

function stepContract(){
    var retCode = Controller.step()
    if (retCode === undefined) {
        inform("Step done.")
    } else {
        inform(retCode)
    }
    updatePage()
}

function auto_stepContract(click){

    if( click !== undefined) {
        auto_step_running = !auto_step_running
    }

    if (auto_step_running === false) {
        clearTimeout(auto_step_timer)
        inform("Auto-step interrupted")
        return
    }

    var retCode = Controller.step()
    if (retCode === undefined) {
        auto_step_timer=setTimeout(auto_stepContract, Constants.auto_step_delay)
        inform("Auto-stepping...")
    } else {
        auto_step_running=false
        inform(retCode)
    }
    updatePage()
}

function forgeBlock(){

    // Verify if ended execution this block
    if (MachineState.frozen === false &&
        MachineState.running === true) {
        inform("End contract execution on this block to continue.")
        return
    }

    BlockchainState.currentBlock++

    // Activate contract if it is not sleeping
    if (MachineState.sleepUntilBlock <= BlockchainState.currentBlock) {
        MachineState.stopped = false
        MachineState.frozen = false
        MachineState.finished = false
        MachineState.running = true
    }

    // Adds signa to contract (simulating incoming TX)
    MachineState.balanceNQT += Constants.forge_add_balance
    inform("New block forged.")
    updatePage()
}

function deploy(){
    MachineState.instructionPointer= 0
    MachineState.sleepUntilBlock= 0
    MachineState.frozen= false
    MachineState.running=true
    MachineState.stopped=false
    MachineState.finished=false
    MachineState.dead=false
    MachineState.balanceNQT=Constants.deploy_add_balance
    MachineState.creator= Constants.creatorID
    MachineState.contract= Constants.contractID
    MachineState.DataPages= Constants.contractDPages
    MachineState.UserStackPages= Constants.contractUSPages
    MachineState.CodeStackPages= Constants.contractUSPages

    MachineState.Memory= []
    MachineState.UserStack= []
    MachineState.CodeStack= []
    MachineState.PCS= null
    MachineState.ERR= null

    SimulatorState.breakpoints=[]

    if (MachineState.sourceCode !== undefined) {
        MachineState.sourceCode=undefined
        document.getElementById('color_code').innerHTML=""
        document.getElementById('color_code').style.display="none"
        document.getElementById("source-code").style.display="block"
        updatePage()
        inform("Contract unloaded")
        return
    }
    MachineState.sourceCode=document.getElementById("source-code").value.split("\n")

    var source=document.getElementById("source-code")
    document.getElementById('color_code').innerHTML=asm_highlight(source.value);
    source.style.display="none"
    document.getElementById("color_code").style.display="block"

    cpu_deploy()
    updatePage()
    inform("Contract deployed. Ready to run")
}

function inform(message) {
    document.getElementById("simsaid").innerText=message
}


function updatePage(){

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
    output += '<td colspan="2"  class="taleft">Balance: '+MachineState.balanceNQT.toString(10) + '</td>'
    output += '<td title="Instruction pointer (next line)">IP: '+MachineState.instructionPointer.toString() + '</td>'
    output += '<td> '+'' + '</td>'
    /*output += '<td>: '+'' + '</td>'*/
    output += '<td> '+'' + '</td>'
    output += '</tr></tbody></table>'

    // Memory content
    if (SimulatorState.lastUpdateMemory.length == 0)
        SimulatorState.lastUpdateMemory = clone(MachineState.Memory)
    output += '<table class="table-all"><tbody><tr><th>#</th><th class="taleft">Variable</th><th>Hex</th>'+
              '<th>Unsigned dec</th><th>Signed dec</th></tr>'
    for (let idx = 0; idx<MachineState.Memory.length; idx++){
        currVal = MachineState.Memory[idx].value
        if (currVal == SimulatorState.lastUpdateMemory[idx].value) {
            output +='<tr><td>'
        } else {
            output +='<tr class="updatedVal"><td>'
        }
        output += idx + '</td><td class="taleft">'
               + MachineState.Memory[idx].name
               + '</td><td>'
               + "0x"+currVal.toString(16)
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
    document.getElementById("blockchain_output").innerHTML = JSON.stringify(BlockchainState, null,"   ")

    // Save last memory state
    SimulatorState.lastUpdateMemory = clone(MachineState.Memory)
}

function textKeyUp () {
    var elem = document.getElementById("source-code");
    var text = elem.value;

     // grows text area
    var newrow = (text.match(/\n/g) || '').length + 5;

    elem.rows = newrow;
 }


function stringifyReplacer(key, value) {
    if (   key == "Memory"
        || key == "sourceCode"
        || key == "frozen"
        || key == "running"
        || key == "stopped"
        || key == "finished"
        || key == "dead"
        || key == "instructionPointer"
        || key == "balanceNQT") {
        return
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
        height: "100%",
        top: 50,
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
        height: "25%",
        width: "50%",
        x: "50%",
        y: "75%",
        top: 50,
        onclose: function () {
            document.getElementById("memory_fieldset").style.display="block";
        }
    });
    document.getElementById("memory_fieldset").style.display="none";
}

function detachActions(){
    new WinBox("Actions", {
        mount: document.getElementById("actions_window"),
        height: "20%",
        width: "50%",
        x: "50%",
        y: "55%",
        top: 50,
        onclose: function () {
            document.getElementById("actions_fieldset").style.display="block";
        }
    });
    document.getElementById("actions_fieldset").style.display="none";
}

function detachTransaction(){
    var ret = new WinBox("Transactions", {
        mount: document.getElementById("transaction_window"),
        top: 50,
        height: "95%",
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
        x: "50%",
        y: "50",
        top: 50,
        onclose: function () {
            document.getElementById("blockchain_fieldset").style.display="block";
        }
    });
    document.getElementById("blockchain_fieldset").style.display="none";
}

function detachHelp(){
    var helpage = new WinBox("Help page", {
        url: "https://deleterium.github.io/SmartC/docs/",
        height: "70%",
        width: "70%",
        x: "center",
        y: "center",
        top: 50,
   });
   helpage.focus();
}

function loadExample() {
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