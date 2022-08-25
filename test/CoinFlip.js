const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");
/**

░█████╗░░█████╗░██╗███╗░░██╗███████╗██╗░░░░░██╗██████╗░
██╔══██╗██╔══██╗██║████╗░██║██╔════╝██║░░░░░██║██╔══██╗
██║░░╚═╝██║░░██║██║██╔██╗██║█████╗░░██║░░░░░██║██████╔╝
██║░░██╗██║░░██║██║██║╚████║██╔══╝░░██║░░░░░██║██╔═══╝░
╚█████╔╝╚█████╔╝██║██║░╚███║██║░░░░░███████╗██║██║░░░░░
░╚════╝░░╚════╝░╚═╝╚═╝░░╚══╝╚═╝░░░░░╚══════╝╚═╝╚═╝░░░░░
 
 * Goal: 
 * 
 * 1. This is a coin flipping game where you need to build up your winning streak by guessing 
 *    the outcome of a coin flip. To complete this level you'll need to use your psychic abilities 
 *    to guess the correct outcome 10 times in a row.
 *
 * Solution:
 *
 * To solve this level, we need to predict the result of division between 
 * the constant factor and the integer number of last block number mined.
 * There are two methods:
 * 1. Without creating a smart contract, simply calculating the division 
 *    before flip.
 * 2. Using a smart contract to calculate teh dvision directly on-chain, 
 *    finally calling the flip function.
 * 
 * Note:
 * 
 * In the locals networks we don't have any problems regarding the block number.
 * (beacause they will be mined after each transactions, or as we want with hardhat config)
 * in real networks the block is checked by flip function. 
 * If it's the same of previous flip, the transaction revert. 
 * To solve this, we need to wait until it will mined before predict the result.
 * All of this because we need the hash of the block.
 * Until it is undermined we don't have it.
 * 
 */
describe("CoinFlip", function () {
    let coinFlip, coinFlipPredicter, owner, player;
    const FACTOR = ethers.constants.MaxInt256; // max int 256 == 2^255-1 == 57896044618658097711785492504343953926634992332820282019728792003956564819968

    before(async function () {
        // Contracts are deployed using the first signer/account by default
        [owner, player] = await ethers.getSigners();
    });

    describe("Predict method 1 (without smart contract)", async function () {
        before(async function () {
            const CoinFlip = await ethers.getContractFactory("contracts/CoinFlip/CoinFlip.sol:CoinFlip");
            coinFlip = await CoinFlip.connect(owner).deploy();
        });

        for (let i = 1; i <= 10; i++) {
            it(`Launch No.${i} Win streak:${i}`, async () => {
                const block = await ethers.provider.getBlock(await ethers.provider.getBlockNumber()); // get last block mined
                const res = Math.floor(BigNumber.from(block.hash).div(FACTOR)) == 1 ? true : false; // checks if uint256(block.hash) == 1

                // pass the predicted result
                await coinFlip.connect(player).flip(res);
                const wins = await coinFlip.connect(player).consecutiveWins();

                expect(i).to.be.eq(wins);
            });
        }
    });

    describe("Predict method 2 (with smart contract)", async function () {
        before(async function () {
            const CoinFlip = await ethers.getContractFactory("contracts/CoinFlip/CoinFlip.sol:CoinFlip");
            coinFlip = await CoinFlip.connect(owner).deploy();

            const CoinFlipPredicter = await ethers.getContractFactory("contracts/CoinFlip/CoinFlipPredicter.sol:CoinFlipPredicter");
            coinFlipPredicter = await CoinFlipPredicter.connect(owner).deploy();
        });

        for (let i = 1; i <= 10; i++) {
            it(`Launch No.${i} Win streak:${i}`, async () => {
                await coinFlipPredicter.connect(player).predict(coinFlip.address);
                const wins = await coinFlip.connect(player).consecutiveWins();

                expect(i).to.be.eq(wins);
            });
        }
    });
});
