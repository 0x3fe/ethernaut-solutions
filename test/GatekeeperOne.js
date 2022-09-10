const { expect } = require("chai");
const { ethers } = require("hardhat");

/**

░██████╗░░█████╗░████████╗███████╗██╗░░██╗███████╗███████╗██████╗░███████╗██████╗░░░░░░░░█████╗░███╗░░██╗███████╗
██╔════╝░██╔══██╗╚══██╔══╝██╔════╝██║░██╔╝██╔════╝██╔════╝██╔══██╗██╔════╝██╔══██╗░░░░░░██╔══██╗████╗░██║██╔════╝
██║░░██╗░███████║░░░██║░░░█████╗░░█████═╝░█████╗░░█████╗░░██████╔╝█████╗░░██████╔╝█████╗██║░░██║██╔██╗██║█████╗░░
██║░░╚██╗██╔══██║░░░██║░░░██╔══╝░░██╔═██╗░██╔══╝░░██╔══╝░░██╔═══╝░██╔══╝░░██╔══██╗╚════╝██║░░██║██║╚████║██╔══╝░░
╚██████╔╝██║░░██║░░░██║░░░███████╗██║░╚██╗███████╗███████╗██║░░░░░███████╗██║░░██║░░░░░░╚█████╔╝██║░╚███║███████╗
░╚═════╝░╚═╝░░╚═╝░░░╚═╝░░░╚══════╝╚═╝░░╚═╝╚══════╝╚══════╝╚═╝░░░░░╚══════╝╚═╝░░╚═╝░░░░░░░╚════╝░╚═╝░░╚══╝╚══════╝
 
 * Goal: 
 * 
 * Make it past the gatekeeper and register as an entrant to pass this level.
 * 
 * Solution:
 * 
 * To solve this level, you will need to bypass all the gates modifiers in the enter function. 
 * 
 * 1. Gate One
 * to pass the first gate, the caller must be different from the origin caller. This will 
 * be done by simply calling the enter function from another smart contract, as we had seen 
 * in the Telephone level.
 * 
 * 2. Gate Three
 * Before we look at Gate Two, let's look directly at Gate Three.
 * We need an hexadecimal key that will be passed to the enter function. This key will have to 
 * pass some casting checks. To understand, let us see the flow with different gateKey:
 * 
 * [recommendation: check the notes below before proceeding].
 * 
 * eg. the wrong _gateKey = 0x1122334455667788 (hex - bytes8)
 * eg. player address = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (hex - bytes20)
 * 
 * 1) uint32(uint64(_gateKey)) == uint16(uint64(_gateKey)
 * 
 *          0x55667788 == 0x7788 --> FAIL, because their decimals value are different.
 * 
 * 2) uint32(uint64(_gateKey)) != uint64(_gateKey)
 * 
 *          0x55667788 != 0x1122334455667788 --> SUCCESS, because their decimals value are different.
 * 
 * 3) uint32(uint64(_gateKey)) == uint16(tx.origin)
 * 
 *          0x55667788 == 0x79C8 --> FAIL, because their decimals value are different
 * note that 0x79C8 is the fragment of player address (uint16 - last 16 bit / 4 byte)
 * 
 * SOLUTION:
 * As we can see, the 0x1122334455667788 key doesn't pass all requirements.
 * Since we use a smart contract, the tx.origin will be the player address / caller of 
 * attacker contract's function. So, let's start from the last require that needs the origin. 
 * 
 * 1) uint32(uint64(_gateKey)) == uint16(tx.origin)
 * Our key must have the same lower bits (last 16 bits) of player address.
 * To pass this we have to mask the player address casted (because we need a bytes8 key)
 * like this bytes8(uint64(originCaller)) AND 0x000000000000FFFF
 * Where 0xF is 1111 (binary), with AND logic operator we can mask the last 16 bits and set
 * to zero the others. In this way we have the follow gateKey:
 * 
 *                                      0x70997970C51812dc AND
 *                                      0x000000000000FFFF = 
 *                                      0x00000000000012dc
 * 
 *          0x000012dc == 0x12dc --> SUCCESS, because their decimals value are equals.
 * 
 * 2) uint32(uint64(_gateKey)) != uint64(_gateKey)
 * In this require, we need to modify the mask a little bit. 
 * We have to remember that the mask required for gate3 is 0x000000000000FFFF.
 * But with this mask the first argument of condition is 0x000012dc, while 0x00000000000012dc
 * the second. As we can see, both have the same decimal value. To solve this we need to mask
 * also the upper 32 bits. In this way we have:
 * 
 *                                      0x70997970C51812dc AND
 *                                      0xFFFFFFFF0000FFFF = 
 *                                      0x70997970000012dc
 * 
 *          0x000012dc != 0x70997970000012dc --> SUCCESS, because their decimals value are different.
 * 
 * 3) uint32(uint64(_gateKey)) == uint16(uint64(_gateKey)
 * For this case we don't have any problems.
 * 
 *          0x000012dc == 0x12dc --> SUCCESS, because their decimals value are equals.
 * 
 * 3. Gate Two
 * To pass this gate we have to use a specific gas limit. We have to ensure that the remaining gas gives 
 * 0 from the 8191 module, at the particular moment when the require is executed in the call stack.
 * 
 * There are several solutions. The solution that we use is to keep calling the function 
 * until it passes the check (brute force). 
 * To do this, each call would cost gas and we don't know how many iterations our loop will do. 
 * So we write a function that in one transaction calls the enter and revert the function in case 
 * it fails. By doing this, we can call our function any times via STATIC calls 
 * without changing the contract storage and thus without spending fees. 
 * If the transaction does not revert, it means that it has passed all the gates and it is 
 * possible to call the attacking function with a REGULAR call, thus paying fees only once. 
 * All of this is handled with a simple try catch off-chain.
 *
 * Note:
 * 
 * For this level, we need to know the type casting very well. see the solidity documentation.
 * We also need to know how the conversion works between the follow numbers systems: 
 * binary, hexadecimal, decimal, ...
 *
 * Here are some examples...
 * --> 1 byte = 8 bit = eg. 01010101
 * --> 8 byte = 64 bit = eg. 0101010101010101010101010101010101010101010101010101010101010101
 * 
 * --> 0x0 (hex) = 0000 (binary) = 0 (dec - uint)
 * --> 0x1 (hex) = 0001 (binary) = 1 (dec - uint)
 * --> ...
 * --> 0xF (hex) = 1111 (binary) = 15 (dec - uint)
 * 
 * AND logic -> the result is 1 only if both are 1, 0 otherwise.
 * 
 *                                      0 1 1 0 AND
 *                                      0 1 1 1 =
 *                                      -------
 *                                      0 1 1 0
 * 
 * Necessary for the bit masking.
 * 
 */
describe("GatekeeperOne", function () {
    let gatekeeperOne, gatekeeperOneAttacker, owner, player;

    before(async function () {
        [owner, player] = await ethers.getSigners();
    });

    describe("Attack", async function () {
        before(async function () {
            const GatekeeperOne = await ethers.getContractFactory("contracts/GatekeeperOne/GatekeeperOne.sol:GatekeeperOne");
            gatekeeperOne = await GatekeeperOne.connect(owner).deploy();

            const GatekeeperOneAttacker = await ethers.getContractFactory("contracts/GatekeeperOne/GatekeeperOneAttacker.sol:GatekeeperOneAttacker");
            gatekeeperOneAttacker = await GatekeeperOneAttacker.connect(player).deploy(gatekeeperOne.address);
        });

        it("Should bypass all gates", async function () {
            console.log(player.address);
            expect(await gatekeeperOne.connect(player).entrant()).to.be.eq(ethers.constants.AddressZero); // no one has achieved the goal
            console.log("Brute force in progress...");

            // TODO: improve the loop iterations and the initial gas limit
            for (let i = 0; i < 8191; i += 2) {
                // +2 to be more fast
                try {
                    await gatekeeperOneAttacker.connect(player).callStatic.enter(100000 + i); // try until found the correct gas amount
                } catch (err) {
                    continue;
                }
                console.log("Gas amount found! tx executed!");
                await gatekeeperOneAttacker.connect(player).enter(100000 + i); // execute effect
                break;
            }

            expect(await gatekeeperOne.connect(player).entrant()).to.be.eq(player.address); // correctly registered
        });
    });
});
