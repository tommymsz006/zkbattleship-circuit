pragma circom 2.0.3;

include "../node_modules/circomlib/circuits/eddsamimcsponge.circom";

// determine whether or not a starting board adheres to all rules
// proving:
//   - knowledge of ship placement that is valid (inbounds, no overlapping)
//   - signature is of hash of ships by pubkey
template boardValidity() {
    signal input ships[5][3];
    signal input pubkey[2];
    signal input signature[3];

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
        if (z == 0)
            assert(x + lengths[i] <= 9);
        else
            assert(y + lengths[i] <= 9);
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
    // hash ship positions
    component hash = MiMCSponge(15, 220, 1);
    for (var i = 0; i < 15; i++)
        hash.ins[i] <== ships[i \ 3][i % 3];
    hash.k <== 0;
    // authenticate signature on ship hash
    component verifier = EdDSAMiMCSpongeVerifier();
    verifier.enabled <== 1;
    verifier.Ax <== pubkey[0];
    verifier.Ay <== pubkey[1];
    verifier.R8x <== signature[0];
    verifier.R8y <== signature[1];
    verifier.S <== signature[2];
    verifier.M <== hash.outs[0];
}
component main { public [signature] }= boardValidity();