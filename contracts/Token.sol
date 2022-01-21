//SPDX-License-Identifier: MIT
pragma solidity >= 0.8.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {

    constructor() ERC20("Battleship Ticket", "ZKB") {}

    function mint(address _address, uint256 _amount) public {
        _mint(_address, _amount);
    }
}