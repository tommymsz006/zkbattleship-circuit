//SPDX-License-Identifier: MIT
pragma solidity >=0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./IVerifier.sol";
import "hardhat/console.sol";

contract BattleshipGame is ERC721 {
    uint256 constant HIT_MAX = 17;

    event Started(uint256 _nonce);
    event Joined(uint256 _nonce);
    event Shot(uint256 _game, uint256 _turn, bool _hit);
    event Won(address _winner, uint256 _nonce);
    event Collected(uint256 _amount);

    uint256 gameIndex;
    address operator;

    mapping(uint256 => Game) public games;
    mapping(address => uint256) playing;

    IBoardVerifier bv; // verifier for proving initial board rule compliance
    IShotVerifier sv; // verifier for proving shot hit/ miss

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
        require(
            ticket.allowance(msg.sender, address(this)) >= 1 ether,
            "!Tickets"
        );
        require(playing[msg.sender] == 0, "Reentrant");
        _;
    }

    modifier myTurn(uint256 _game) {
        require(playing[msg.sender] == _game, "!Playing");
        address current = games[_game].nonce % 2 == 0
            ? games[_game].participants[0]
            : games[_game].participants[1];
        require(msg.sender == current, "oper");
        _;
    }

    /**
     * Make sure game is joinable
     * Will have more conditions once shooting phase is implemented
     *
     * @param _game uint256 - the nonce of the game to check validity for
     */
    modifier joinable(uint256 _game) {
        require(_game != 0 && _game <= gameIndex, "out-of-bounds");
        require(
            games[_game].participants[0] != address(0) &&
                games[_game].participants[1] == address(0),
            "!Open"
        );
        _;
    }

    /**
     * Construct new instance of Battleship manager
     *
     * @param _bv address - the address of the initial board validity prover
     * @param _sv address - the address of the shot hit/miss prover
     * @param _ticket address - the address of the ERC20 token required to be spent to play the game
     */
    constructor(address _bv, address _sv, address _ticket)
        ERC721("ZK Battleship Medal", "xZKBx")
    {
        bv = IBoardVerifier(_bv);
        sv = IShotVerifier(_sv);
        ticket = IERC20(_ticket);
        operator = msg.sender;
    }

    /**
     * Start a new board by uploading a valid board hash
     *
     * @param _boardHash uint256 - hash of ship placement on board
     */
    function newGame(
        uint256 _boardHash,
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c
    ) public canPlay {
        require(
            bv.verifyProof(a, b, c, [_boardHash]),
            "Invalid Board Config!"
        );
        ticket.transferFrom(msg.sender, address(this), 1 ether);
        gameIndex++;
        games[gameIndex].participants[0] = msg.sender;
        games[gameIndex].boards[0] = _boardHash;
        playing[msg.sender] = gameIndex;
        emit Started(gameIndex);
    }

    /**
     * Join existing game by uploading a valid board hash
     *
     */
    function joinGame(
        uint256 _game,
        uint256 _boardHash,
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c
    ) public canPlay joinable(_game) {
        require(
            bv.verifyProof(a, b, c, [_boardHash]),
            "Invalid Board Config!"
        );
        ticket.transferFrom(msg.sender, address(this), 1 ether);
        games[_game].participants[1] = msg.sender;
        games[_game].boards[1] = _boardHash;
        playing[msg.sender] = _game;
        emit Joined(_game);
    }

    /**
     * Player 0 can makes first shot without providing proof
     *
     * @param _game uint256 - the game nonce/ id
     * @param _shot uint256[2] - the (x,y) coordinate to fire at
     */
    function firstTurn(uint256 _game, uint256[2] memory _shot) public myTurn(_game) {
        Game storage game = games[_game];
        require(game.nonce == 0, "!Turn1");
        game.shots[game.nonce] = _shot;
        game.nonce++;
    }

    /**
     * Drive game to completion
     *
     * @param _game uint256 - the game nonce/ id
     * @param _hit bool - 1 if previous shot hit and 0 otherwise
     * @param _next uint256[2] - the (x,y) coordinate to fire at after proving hit/miss
     *    - ignored if proving hit forces game over
     */
    function turn(
        uint256 _game,
        bool _hit,
        uint256[2] memory _next,
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c
    ) public myTurn(_game) {
        Game storage game = games[_game];
        require(game.nonce != 0, "Turn1");
        // check proof
        uint256 boardHash = game.boards[game.nonce % 2];
        uint256[2] memory shot = game.shots[game.nonce - 1];
        uint256 hitInt;
        assembly { hitInt := _hit }
        require(
            sv.verifyProof(
                a,
                b,
                c,
                [boardHash, shot[0], shot[1], hitInt]
            ),
            "Invalid turn proof"
        );
        // update game state
        game.hits[game.nonce - 1] = _hit;
        if (_hit) game.hitNonce[(game.nonce - 1) % 2]++;
        emit Shot(_game, game.nonce - 1, _hit);
        // check if game over
        if (game.hitNonce[(game.nonce - 1) % 2] >= HIT_MAX) gameOver(_game);
        else {
            // add next shot
            game.shots[game.nonce] = _next;
            game.nonce++;
        }
    }

    function gameOver(uint256 _game) internal {
        Game storage game = games[_game];
        require(
            game.hitNonce[0] == HIT_MAX || game.hitNonce[1] == HIT_MAX,
            "!Over"
        );
        require(game.winner == address(0), "Over");
        game.winner = game.hitNonce[0] == HIT_MAX
            ? game.participants[0]
            : game.participants[1];
        _mint(game.winner, _game);
        emit Won(game.winner, _game);
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

struct Game {
    address[2] participants; // the two players in the game
    uint256[2] boards; // mimcsponge hash of board placement for each player
    uint256 nonce; // turn #
    mapping(uint256 => uint256[2]) shots; // map turn number to shot coordinates
    mapping(uint256 => bool) hits; // map turn number to hit/ miss
    uint256[2] hitNonce; // track # of hits player has made
    address winner; // game winner
}
