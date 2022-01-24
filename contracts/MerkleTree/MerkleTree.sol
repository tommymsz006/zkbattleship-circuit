pragma solidity >= 0.8.6;

// my very own recipe
contract IncrementalMerkleTree {

    // prime finite field
    uint256 internal constant SNARK_SCALAR_FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    // max of 200 turns per battleship game means max of 256 leaves
    uint8 constant DEPTH = 8;
    
    uint8 nonce;
    uint256 root;

    uint256[8] internal subtrees;

    mapping(uint256 => bool) historicalRoot;

    event Insertion(uint256 indexed _leaf, uint256 indexed _index);

    /**
     * The combined poseidon hash of the two 
     */
    constructor(uint256 _zero) {

    }
}