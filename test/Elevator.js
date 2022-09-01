const { expect } = require("chai");
const { ethers } = require("hardhat");

/**

███████╗██╗░░░░░███████╗██╗░░░██╗░█████╗░████████╗░█████╗░██████╗░
██╔════╝██║░░░░░██╔════╝██║░░░██║██╔══██╗╚══██╔══╝██╔══██╗██╔══██╗
█████╗░░██║░░░░░█████╗░░╚██╗░██╔╝███████║░░░██║░░░██║░░██║██████╔╝
██╔══╝░░██║░░░░░██╔══╝░░░╚████╔╝░██╔══██║░░░██║░░░██║░░██║██╔══██╗
███████╗███████╗███████╗░░╚██╔╝░░██║░░██║░░░██║░░░╚█████╔╝██║░░██║
╚══════╝╚══════╝╚══════╝░░░╚═╝░░░╚═╝░░╚═╝░░░╚═╝░░░░╚════╝░╚═╝░░╚═╝

 * Goal: 
 * 
 * This elevator won't let you reach the top of your building. Right?
 * 
 * Solution:
 *
 * The solution of this level is to create a malicious contract that implements
 * the Building interface with isLastFloor function.
 * our goal is to make the "top" variable a true value. To make this we need to 
 * pass, into the goTo(uint) Elevator function, the first check with false and then true.
 * So we use a boolean flag that help us to pass these checks, alternating the
 * boolean return value. see the follow flow.
 * 
 * initial state:
 * flag = false
 * 
 * 1st check: 
 *  - flag is false (always)
 *      - set flag = true (to pass 2nd check)
 *      - return false (pass 1st check)
 * 
 * 2nd check: 
 *  - flag is true (always)
 *      - set flag = false (to pass 1st check)
 *      - return true (pass 2nd check and set top = true)
 * 
 * Note:
 * 
 * The floor number passed on goTo(uint) Elevator functions is irrilevant because we used
 * a boolean variable trick. 
 * 
 */
describe("Elevator", function () {
    let elevator, buildingSolution, owner, player;

    before(async function () {
        [owner, player] = await ethers.getSigners();

        const Elevator = await ethers.getContractFactory("contracts/Elevator/Elevator.sol:Elevator");
        elevator = await Elevator.connect(owner).deploy();

        const BuildingSolution = await ethers.getContractFactory("contracts/Elevator/BuildingSolution.sol:BuildingSolution");
        buildingSolution = await BuildingSolution.connect(player).deploy(elevator.address);
    });

    describe("Reach the top", async function () {

        it("Should reach the top of the building", async function () {
            expect(await elevator.connect(player).top()).to.be.false;

            await buildingSolution.connect(player).goToTop();

            expect(await elevator.connect(player).top()).to.be.true;
        });
    });
});
