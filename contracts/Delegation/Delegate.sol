// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract Delegate {

  address public owner;

  constructor(address _owner) {
    owner = _owner;
  }

  function pwn() public {
    owner = msg.sender;
  }
}
