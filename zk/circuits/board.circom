pragma circom 2.0.3;

include "../../node_modules/circomlib/circuits/mimcsponge.circom";

// determine whether or not a starting board adheres to all rules
// proving:
//   - hash of ship placement that is valid (inbounds, no overlapping)
template board() {
    signal input ships[5][3];
    signal input hash;

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
    component hasher = MiMCSponge(15, 220, 1);
    for (var i = 0; i < 15; i++)
        hasher.ins[i] <== ships[i \ 3][i % 3];
    hasher.k <== 0;
    log(hash);
    log(hasher.outs[0]);
    hash === hasher.outs[0];
}

component main { public [hash] } = board();