pragma solidity >= 0.8.6;

import "../Poseidon.sol";

// my very own recipe
contract IncrementalMerkleTree {

    // prime finite field
    uint256 internal constant SNARK_SCALAR_FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    // max of 200 turns per battleship game means max of 256 leaves
    uint8 constant DEPTH = 8;
    
    uint8 nonce;
    uint256 root;
    address[2] participants;

    uint256[8] internal subtrees;
    uint256[9] internal zeros;

    mapping(uint256 => bool) historicalRoot;

    event Insertion(uint256 indexed _leaf, uint256 indexed _index);

    string constant ERR_LEAF_SIZE = "E01";
    string constant ERR_TREE_FULL = "E02";

    modifier snarkRange(uint256 _value) {
        require(_value < SNARK_SCALAR_FIELD, ERR_LEAF_SIZE);
        _;
    }

    /**
     * Construct new merkle tree for battleship game
     *
     * @param _zero uint256 - the nothing-up-my-sleeve value, should be hash of two game states
     */
    constructor(uint256 _zero, address[2] memory _participants) snarkRange(_zero) {
        participants = _participants;
        init(_zero);
    }

    /**
     * Initialize merkle tree with zero value and store root
     *
     * @param _zero uint256 - nothing-up-my-sleeve value for tree
     */
    function init(uint256 _zero) internal {
        zeros[0] = _zero;
        for (uint8 i = 1; i <= DEPTH; i++)
            zeros[i] = PoseidonT3.poseidon([zeros[i-1], zeros[i-1]]);
        root = zeros[DEPTH];
        historicalRoot[root] = true;
    }

    /**
     * Insert a new leaf into the tree at the current increment
     *
     * @param _leaf uint256 - the hash being inserted into the tree
     * @return uint256 - the leaf nonce/index
     */
    function insert(uint256 _leaf) public snarkRange(_leaf) returns (uint256) {
        uint8 currentNonce = nonce;
        uint256 currentHash = _leaf;
        uint256 left;
        uint256 right;
        for (uint8 i = 0; i < DEPTH; i++) {
            if (currentNonce % 2 == 0) {
                left = currentHash;
                right = zeros[i];
                subtrees[i] = currentHash;
            } else {
                left = subtrees[i];
                right = currentHash;
            }
            currentHash = PoseidonT3.poseidon([left, right]);
            currentNonce >>= 1;
        }
        root = currentHash;
        historicalRoot[root] = true;
        emit Insertion(_leaf, nonce);
        nonce++;
        return nonce - 1;
    }
}

// hash left right = PoseidonT3.poseidon([_left, _right]);