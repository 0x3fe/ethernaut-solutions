const { expect } = require("chai");
const { ethers } = require("hardhat");

/**

░██████╗░░█████╗░████████╗███████╗██╗░░██╗███████╗███████╗██████╗░███████╗██████╗░░░░░░░████████╗░██╗░░░░░░░██╗░█████╗░
██╔════╝░██╔══██╗╚══██╔══╝██╔════╝██║░██╔╝██╔════╝██╔════╝██╔══██╗██╔════╝██╔══██╗░░░░░░╚══██╔══╝░██║░░██╗░░██║██╔══██╗
██║░░██╗░███████║░░░██║░░░█████╗░░█████═╝░█████╗░░█████╗░░██████╔╝█████╗░░██████╔╝█████╗░░░██║░░░░╚██╗████╗██╔╝██║░░██║
██║░░╚██╗██╔══██║░░░██║░░░██╔══╝░░██╔═██╗░██╔══╝░░██╔══╝░░██╔═══╝░██╔══╝░░██╔══██╗╚════╝░░░██║░░░░░████╔═████║░██║░░██║
╚██████╔╝██║░░██║░░░██║░░░███████╗██║░╚██╗███████╗███████╗██║░░░░░███████╗██║░░██║░░░░░░░░░██║░░░░░╚██╔╝░╚██╔╝░╚█████╔╝
░╚═════╝░╚═╝░░╚═╝░░░╚═╝░░░╚══════╝╚═╝░░╚═╝╚══════╝╚══════╝╚═╝░░░░░╚══════╝╚═╝░░╚═╝░░░░░░░░░╚═╝░░░░░░╚═╝░░░╚═╝░░░╚════╝░
 
 * Goal: 
 * 
 * This gatekeeper introduces a few new challenges. Register as an entrant to pass this level.
 * 
 * Solution:
 * 
 * To solve this level, you will need to bypass all the gates modifiers in the enter function. 
 * 
 * 1. Gate One
 * to pass the first gate, the caller must be different from the origin caller. This will 
 * be done by simply calling the enter function from another smart contract, as we had seen 
 * in the Telephone level and Gatekeeper One.
 * 
 * 2. Gate Two
 * to pass the second gate, we must first understand the operation of "extcodesize". 
 * Is a low-level opcode/function, which given the address, returns as the name says, the size of the code.
 * It is then used to figure out whether the address we pass is a smart contract or an EOA (Externally Owned Accounts), 
 * i.e., a simple wallet. For our solution, as required by the first gate, we need a smart contract. 
 * So to avoid this check we will simply call the enter function inside the constructor. At build time extcodesize 
 * returns value 0. A contract does not have source code available during construction and thus comparing it to an EOA.
 * 
 * 3. Gate Three
 * To pass the third gate, one must know how the XOR logic operator works. (see notes)
 * Having done the necessary research, let's look at the following flow:
 * 
 * uint64 (dec) <--> bytes8 (hex)
 * 
 * uint64(0) - 1 == 2^64 - 1 == 18446744073709551615 (dec) == 0xFFFFFFFFFFFFFFFF (hex) = 1111111111...1111 (binary)
 * 
 * this is the result we need to come out of the XOR / ^ operation to pass the require.
 * So, to get all 1, we need to have A and B exactly opposites (see notes), as follow example:
 * 
 * eg.                                    A = 01001001100
 *                                        B = 10110110011
 * 
 * Our gateKey must be the opposite of first operator. To do this, given the table above, we will simply invert the bits 
 * of the first operator, using the logical NOT operator. eg. when A is 01001001100, B is 10110110011 (~A / NOT A)
 * In this way, we can obtain the follow result from operation:
 * 
 * eg.                                   A = 01001001100 XOR
 *                                       B = 10110110011
 *                                          -------------
 *                                           11111111111
 * 
 * That's it!
 * 
 * Note:
 * 
 * For this level we need to know how XOR operator works.
 * XOR logic -> the result is 1 only if both are different, 0 otherwise.
 * 
 *                                      0 0 1 1 XOR
 *                                      0 1 0 1 =
 *                                      -------
 *                                      0 1 1 0
 * 
 */
describe("GatekeeperTwo", function () {
    let gatekeeperTwo, gatekeeperTwoAttacker, owner, player;

    before(async function () {
        [owner, player] = await ethers.getSigners();
    });

    describe("Attack", async function () {
        before(async function () {
            const GatekeeperTwo = await ethers.getContractFactory("contracts/GatekeeperTwo/GatekeeperTwo.sol:GatekeeperTwo");
            gatekeeperTwo = await GatekeeperTwo.connect(owner).deploy();
        });

        it("Should bypass all gates", async function () {
            const GatekeeperTwoAttacker = await ethers.getContractFactory("contracts/GatekeeperTwo/GatekeeperTwoAttacker.sol:GatekeeperTwoAttacker");
            gatekeeperTwoAttacker = await GatekeeperTwoAttacker.connect(player).deploy(gatekeeperTwo.address, {gasLimit: 1000000}); // attack

            expect(await gatekeeperTwo.connect(player).entrant()).to.be.eq(player.address); // correctly registered
        });
    });
});
