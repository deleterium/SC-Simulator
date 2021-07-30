# SC-Simulator
Smart contracts simulator and debugger for Signum

## Usage
Download project and open file `try.html` in your browser. Or just [run it](https://deleterium.github.io/SC-Simulator/try.html) on gitpages. Load example to try it with a simple contract.

## Limitations
* Currently no API functions are implemented. Simulator will put contract in **dead** state if function instructions are found.
* Everytime a new block is forged, it is simulated an incoming transaction to activate contract.
* Pointer operations can lead to *false dead state* in simulator. Please declare all variables if using these instructions.

## Configuration
It is possible to set other values for constants. Edit file try.js with your desired value.
* auto_step_delay: Delay in milliseconds between auto-steps
* stepfee: Value discounted from contract everytime an instruction is executed. Set to zero if to avoid contract to be frozen due to "out-of-gas"
* forge_add_balance: Added balance to contract when forging block
* deploy_add_balance: Added balance to contract when deploying it
* contractDPages: Number of data pages of deployed contract
* contractUSPages: Number of user stack pages of deployed contract
* contractCSPages: Number of code stack pages of deployed contract
* creatorID: Account ID of creator
* contractID: Account ID of contract

## How to run from bytecode?
SC Simulator is an assembly interpreter. It is not possible to run directly the bytecode. Use a decompiler (like  [Signum D`Or](https://github.com/deleterium/Signum-D-Or) to generate an assembly output.
