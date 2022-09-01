const { expect } = require("chai");
const { ethers } = require("hardhat");
const crypto = require("crypto");

/**

██████╗░██████╗░██╗██╗░░░██╗░█████╗░░█████╗░██╗░░░██╗
██╔══██╗██╔══██╗██║██║░░░██║██╔══██╗██╔══██╗╚██╗░██╔╝
██████╔╝██████╔╝██║╚██╗░██╔╝███████║██║░░╚═╝░╚████╔╝░
██╔═══╝░██╔══██╗██║░╚████╔╝░██╔══██║██║░░██╗░░╚██╔╝░░
██║░░░░░██║░░██║██║░░╚██╔╝░░██║░░██║╚█████╔╝░░░██║░░░
╚═╝░░░░░╚═╝░░╚═╝╚═╝░░░╚═╝░░░╚═╝░░╚═╝░╚════╝░░░░╚═╝░░░

 * Goal: 
 * 
 * The creator of this contract was careful enough to protect the sensitive areas of its storage.
 * Unlock this contract to beat the level.
 * 
 * Solution:
 *
 * To unlock this contract, you will need to know how contract storage works. 
 * Notice how the function to unlock the contract does a check on a variable saved in the storage.
 * The variable we are interested in is the array Data bytes32[] where the secret key is located 
 * (in the particular at position 2).As we know, even if the variables are private, the blockchain 
 * still remains transparent and it is possible to read the storage if we know the index of the slot 
 * where our variable is saved. 
 * In this case we also need to know how much storage the individual variables occupy. The state of 
 * a contract, in the storage, is saved in slots of 32 bytes each. 
 * This means that to find the secret key we have to go to the slot where it is located. T
 * he Privacy contract is smart because it takes advantage of a technique called "packing" 
 * where it saves multiple low-memory variables in a single slot. 
 * So if we follow this flow sequentially:
 * 
 * bool public locked = true;                   --> SLOT 0 (wasteful) --> 1 bytes --> 31 left
 * uint256 public ID = block.timestamp;         --> SLOT 1 --> 256 bits = 32 bytes
 * uint8 private flattening = 10;               |
 * uint8 private denomination = 255;            |-> SLOT 2 (packed, but wasteful) -> 8+8+16 = 32 bits = 4 bytes --> 28 left
 * uint16 private awkwardness = uint16(now);    |
 * bytes32[3] private data;                     --> SLOT 3, 4, 5 --> split data into 3 slots, 32 bytes for each
 * 
 * So, our secret key is located in the last slot, the 5th slot.
 * 
 * Note:
 * 
 * Everytime we make a variable in our solidity code, the evm stores it in a storage slot of 32 bytes (256 bits). 
 * That means that every time we have a uint (which is read as a uint256) we have packed a storage slot fully.
 * So lets look at some code:
 * 
 *      uint128 a; 
 *      uint256 b; 
 *      uint128 c;
 * 
 * What the evm does is try to fit everything into storage slots sequentially, but since variable b takes up an entire slot, 
 * it cannot fit in in the first one and needs to allocate a total of 3 32byte slots. If you instead order them so that the 
 * two smaller slots are next to each other, you can save one such storage operation. A more efficient code would look like this:
 * 
 *      uint128 a; 
 *      uint128 c; 
 *      uint256 b;
 * 
 * That would allow for the EVM to only need to allocate two storage slots and 'pack' your variables.
 * Finally look this:
 * 
 *      uint8 a;
 *      uint256 b;
 * 
 * It will be cheaper to make both variables uint256!
 * The reason for this is that the EVM reads 32 bytes at a time and will have to do some operations to make the data it is reading 
 * go down to 8 bits (1 byte) which is counter productive.
 * 
 * Now let's look at the size of some common data types in Solidity: 
 * - uint256 is 32 bytes 
 * - uint128 is 16 bytes 
 * - uint64 is 8 bytes 
 * - address (and address payable) is 20 bytes 
 * - bool is 1 byte 
 * - string is usually one byte per character
 * 
 */
describe("Privacy", function () {
    let privacy, owner, player, secretKey;

    before(async function () {
        [owner, player] = await ethers.getSigners();

        // generate random bytes32[] data and saved secret key (data[1] as per contract)
        const data = Array.apply(null, Array(3)).map(function (x, i) {
            const key = "0x" + crypto.randomBytes(32).toString("hex");
            if (i == 2) secretKey = key;
            return key;
        });

        const Privacy = await ethers.getContractFactory("contracts/Privacy/Privacy.sol:Privacy");
        privacy = await Privacy.connect(owner).deploy(data);
    });

    describe("Unlock the contract", async function () {
        let keyToUnlock;

        it("Should unlock the contract", async function () {
            keyToUnlock = await ethers.provider.getStorageAt(privacy.address, 5);

            expect(await privacy.connect(player).locked()).to.be.true;

            // take the first 33 characters to cast in bytes16
            await privacy.connect(player).unlock(keyToUnlock.slice(0, 34));

            expect(await privacy.connect(player).locked()).to.be.false; // unlocked
        });

        it("show the result", function () {
            console.table({ secretKey: secretKey.slice(0, 34), keyToUnlock: keyToUnlock.slice(0, 34) });
        });
    });
});
