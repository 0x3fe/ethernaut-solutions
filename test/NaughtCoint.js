const { expect } = require("chai");
const { ethers } = require("hardhat");

/**

███╗░░██╗░█████╗░██╗░░░██╗░██████╗░██╗░░██╗████████╗  ░█████╗░░█████╗░██╗███╗░░██╗
████╗░██║██╔══██╗██║░░░██║██╔════╝░██║░░██║╚══██╔══╝  ██╔══██╗██╔══██╗██║████╗░██║
██╔██╗██║███████║██║░░░██║██║░░██╗░███████║░░░██║░░░  ██║░░╚═╝██║░░██║██║██╔██╗██║
██║╚████║██╔══██║██║░░░██║██║░░╚██╗██╔══██║░░░██║░░░  ██║░░██╗██║░░██║██║██║╚████║
██║░╚███║██║░░██║╚██████╔╝╚██████╔╝██║░░██║░░░██║░░░  ╚█████╔╝╚█████╔╝██║██║░╚███║
╚═╝░░╚══╝╚═╝░░╚═╝░╚═════╝░░╚═════╝░╚═╝░░╚═╝░░░╚═╝░░░  ░╚════╝░░╚════╝░╚═╝╚═╝░░╚══╝

 * Goal: 
 * 
 * NaughtCoin is an ERC20 token and you're already holding all of them. The catch is that you'll only be able 
 * to transfer them after a 10 year lockout period. Can you figure out how to get them out to another address 
 * so that you can transfer them freely? Complete this level by getting your token balance to 0.
 * 
 * Solution:
 *
 * As we can see, the coin `transfer` function is locked by a modifier that prevents the player from transferring 
 * their funds for a total of 10 years. To pass this check we would have to approve another operator (EOA or smart contract) 
 * for the transfer. The problem remains that the `transfer` makes the transfer from the sender (hardcoded) and the operator 
 * does not hold the player's funds. 
 * So to solve this layer we will need to know what other methods can transfer the funds. 
 * There is the `transferFrom` function, which like the `transfer`, wants the recipient and the amount, but in addition requires 
 * the address of the sender. 
 * To do this then the flow is as follows: the player will approve the operator, to handle his funds, which will call 
 * `transferFrom(playerAddress, operatorAddress, amount)`. 
 * But since both the 'transfer' and `transferFrom` functions call `_transfer` internally, we won't even need an operator and won't 
 * care about the coin `transfer` function, because the player can call `transferFrom` directly bypassing any kind of control 
 * (because transferFrom --> _transfer). 
 * Only the ovveridden coin `transfer` has restrictions.
 * 
 * Note:
 * 
 * ERC-20 introduces a standard for fungible tokens. In other words, these tokens have a property that makes each 
 * token exactly the same (in type and value) as another token. For example, an ERC-20 token works exactly like ETH, 
 * that is, 1 token is and will always be the same as all other tokens.
 * 
 */
describe("NaughtCoin", function () {
    let naughtCoin, owner, player, collab;

    beforeEach(async function () {
        [owner, player, collab] = await ethers.getSigners();

        const NaughtCoin = await ethers.getContractFactory("contracts/NaughtCoin/NaughtCoin.sol:NaughtCoin");
        naughtCoin = await NaughtCoin.connect(owner).deploy(player.address);
    });

    describe("Transfer all funds outside", async function () {
        it("Should correctly transfer all player funds to another address", async function () {
            // checks the balance before transfer all funds
            const playerBalance = await naughtCoin.connect(player).balanceOf(player.address);
            expect(playerBalance).to.be.eq(ethers.utils.parseEther("1000000"));
            expect(await naughtCoin.connect(player).balanceOf(collab.address)).to.be.eq(ethers.utils.parseEther("0"));
            
            await naughtCoin.connect(player).approve(player.address, playerBalance);
            expect(await naughtCoin.connect(player).allowance(player.address, player.address)).to.be.eq(ethers.utils.parseEther("1000000"));

            // uses directly the transferFrom function
            await naughtCoin.connect(player).transferFrom(player.address, collab.address, playerBalance);

            // checks the correct balance after transfer
            expect(await naughtCoin.connect(player).balanceOf(player.address)).to.be.eq(ethers.utils.parseEther("0"));
            expect(await naughtCoin.connect(player).balanceOf(collab.address)).to.be.eq(ethers.utils.parseEther("1000000"));
        });
    });
});
