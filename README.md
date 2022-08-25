# ethernaut-solutions

The [Ethernaut](https://ethernaut.openzeppelin.com/) is a Web3/Solidity based wargame, played in the Ethereum Virtual Machine. Each level is a smart contract that needs to be 'hacked'.

In this repo there are solutions for each. Hardhat is used to deploy vulnerable contracts on a local network. So that contracts can be tested without having to spend real currency. Again using Hardhat and Chai Assertion Library there are tests on the various contracts with The hacking process explained in detail.

## Usage

### Pre Requisites

Proceed with installing dependencies:

```bash
npm install

```
### Run specific level

Replace LEVEL with the desired name level

```bash
npx hardhat test --grep LEVEL
```
