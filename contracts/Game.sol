//SPDX-License-Identifier: MIT
pragma solidity >=0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./IVerifier.sol";

contract BattleshipGame is ERC721 {

    event Started(uint256 _nonce);
    event Joined(uint256 _nonce);
    event Collected(uint256 _amount);

    struct Game {
        address host;
        address guest;
        bytes32[2] hostBoardSig;
    }

    uint256 gameNonce;
    address operator;

    mapping(uint256 => Game) games;
    mapping(address => uint256) playing;

    IVerifier initVerifier;
    IERC20 ticket;

    /**
     * Ensure only contract owner can collect procedes/ administrate contract
     */
    modifier onlyOperator() {
        require(msg.sender == operator, "!Operator");
        _;
    }

    /**
     * Ensure an address has ZKB spendable tickets and is not currently playing
     */
    modifier canPlay() {
        require(ticket.allowance(msg.sender, address(this)) >= 1 ether, "!Tickets");
        require(playing[msg.sender] == 0, "Reentrant");
        _;
    }

    /**
     * Make sure game is joinable
     * Will have more conditions once shooting phase is implemented
     *
     * @param _game uint256 - the nonce of the game to check validity for
     */
    modifier joinable(uint256 _game) {
        require(_game != 0 && _game <= gameNonce, "out-of-bounds");
        require(
            games[_game].host != address(0) && games[_game].guest == address(0),
            "!Open"
        );
        _;
    }

    /**
     * Construct new instance of Battleship manager
     *
     * @param _initVerifier address - the address of the initial board validity proof
     * @param _ticket address - the address of the ERC20 token required to be spent to play the game
     */
    constructor(address _initVerifier, address _ticket)
        ERC721("ZK Battleship Medal", "xZKBx")
    {
        initVerifier = IVerifier(_initVerifier);
        ticket = IERC20(_ticket);
        operator = msg.sender;
    }

    function newGame(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[1] memory input
    ) public canPlay {
        require(initVerifier.verifyProof(a, b, c, input), "Invalid Board Config!");
        ticket.transferFrom(msg.sender, address(this), 1 ether);
        gameNonce++;
        games[gameNonce].host = msg.sender;
        playing[msg.sender] = gameNonce;
        emit Started(gameNonce);
    }

    function joinGame(
        uint256 _game,
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[1] memory input
    ) public canPlay joinable(_game) {
        require(initVerifier.verifyProof(a, b, c, input), "Invalid Board Config!");
        ticket.transferFrom(msg.sender, address(this), 1 ether);
        games[_game].guest = msg.sender;
        playing[msg.sender] = _game;
        emit Joined(_game);
    }

    /**
     * Collect the spent ZKB tickets
     *
     * @param _to address - the address the operator wants to receive tokens at
     */
    function collectProceeds(address _to) public onlyOperator {
        uint256 balance = ticket.balanceOf(address(this));
        emit Collected(balance);
        ticket.transfer(_to, balance);
    }
}

struct Turn {
    uint256 nonce;
    // reporting result for previous shot
    bytes32 prevTurnRoot; //merkle root for previous turn to provably link
    bool hit;
    bool lost;
    // send new shot
    uint8[2] shot;
}