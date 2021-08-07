# SC-Simulator
Smart contracts simulator and debugger for Signum

## Usage
Download project and open file `try.html` in your browser. Or just [run it](https://deleterium.github.io/SC-Simulator/try.html) on gitpages. Load example to try it with a simple contract. Transactions are JSON text to be parsed every time a block is forged and an example is provided on first load. You can prepare all transactions or can edit many times the same to get desired result. Remember to match tx.blockheight to Blockchain.currentBlock plus one. Note shortcuts for buttons via accesskeys. For big programs it is possible to detach all fieldsets to have a different view, more static.
### Breakpoints
Contract execution will halt on breakpoints. Toggle manually using the button and enter the line to stop. It is possible to double-click a line to toggle breakpoint state.
### Memory inspector
You can check current memory values on table or pointing mouse over a variable name on code. Special attention to current contract states (stopped, frozen, finished, running or dead). Its is possible to check values for 256-bit pseudo-register A and B as its four longs parts A1..A4 and B1..B4. Lastly is presented other values for contract state, maybe it worth to check code/user stack.

## Limitations
* Pointer operations can lead to *false dead state* in simulator. Please declare all variables if using these instructions.
* No check on balance. Balance can go negative for regular accounts, but not for Smart Contract.
* Only one contract can be deployed and it must be in blockheight #1
* Messages sent by contract only appears in blockchain when forging next block. This is to simulate actual signum, where only one tx is sent for each account during one block execution.

## Configuration
It is possible to set other values for constants. Edit file try.js with your desired value.
* auto_step_delay: Delay in milliseconds between auto-steps
* stepfee: Value discounted from contract everytime an instruction is executed. Set to zero if to avoid contract to be frozen due to "out-of-gas"
* activationAmount: Default contract activation amount. Value can be override by `^program activationAmount NNNNNN` directive.
* deploy_add_balance: Added balance to contract when deploying it. Actualy is zero, but it is annoying sending a message only to first run.
* contractDPages: Number of data pages of deployed contract
* contractUSPages: Number of user stack pages of deployed contract
* contractCSPages: Number of code stack pages of deployed contract
* creatorID: Account ID of creator
* contractID: Account ID of contract
* getRandomSleepBlocks: Sleep blocks during API to get random ticket. Main net: 15 blocks, testnet 2 blocks.

## How to run from bytecode?
SC Simulator is an assembly interpreter. It is not possible to run directly the bytecode. Use a decompiler (like  [Signum D`Or](https://github.com/deleterium/Signum-D-Or) to generate an assembly output.
