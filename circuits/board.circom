pragma circom 2.0.3;

include "../node_modules/circomlib/circuits/eddsamimcsponge.circom";

// determine whether or not a starting board adheres to all rules
template checkCorrectness() {
    signal input ships[5][3];
    signal input shipHash;
    signal input signature[3];
    signal input pubkey[2];

    signal output out;

    var board[10][10];
    var lengths[5] = [5, 4, 3, 3, 2];

    for (var i = 0; i < 5; i++) {
        // define ship
        var x = ships[i][0];
        var y = ships[i][1];
        var z = ships[i][2];
        // range checks
        assert(z == 0 || z == 1); // false for horizontal, true for vertical
        assert(x <= 9 && y <= 9);
        if (z == 0) {
            assert(x + lengths[i] <= 9);
        } else {
            assert(y + lengths[i] <= 9);
        }
        // collision checks
        for (var j = 0; j < lengths[i]; j++) {
            if (z == 0) {
                assert(board[x + j][y] == 0);
                board[x + j][y] = 1;
            } else {
                assert(board[x][y + j] == 0);
                board[x][y + j] = 1;
            }
        }
    }

    // authenticate hashed ship positions
    component hash = MiMCSponge(1, 220, 1);
    var num = 0;
    for (var i = 0; i < 5; i++) {
        num += ships[i][0] * (16**(i*3)) + ships[i][1] * (16**((i*3)+1)) + ships[i][2] * (16**((i*3)+2));
    }
    hash.ins[0] <== num;
    hash.k <== 0;
    hash.outs[0] === shipHash;

    // authenticate signature on ship hash
    component verifier = EdDSAMiMCSpongeVerifier();
    verifier.enabled <== 1;
    verifier.Ax <== pubkey[0];
    verifier.Ay <== pubkey[1];
    verifier.R8x <== signature[0];
    verifier.R8y <== signature[1];
    verifier.S <== signature[2];
    verifier.M <== shipHash;
    out <== 1;
}
component main = checkCorrectness();