pragma circom 2.0.3;

include "../../node_modules/circomlib/circuits/mimcsponge.circom";

// determine whether or not a shot hit a given board arrangement
// proving:
//   - whether a given coordinate pair hits a ship placement
//   - shipHash is the hash of the placement
template shot() {
    signal input ships[5][3];
    signal input hash;
    signal input coords[2];
    signal input hit;

    // check ship hash
    component hasher = MiMCSponge(15, 220, 1);
    for (var i = 0; i < 15; i++)
        hasher.ins[i] <== ships[i \ 3][i % 3];
    hasher.k <== 0;
    hash === hasher.outs[0];
    // scan board for hit
    var board[10][10];
    var lengths[5] = [5, 4, 3, 3, 2];
    var isHit = 0;
    for (var i = 0; i < 5; i++) {
        var x = ships[i][0];
        var y = ships[i][1];
        var z = ships[i][2];
        for (var j = 0; j < lengths[i]; j++) {
            // if horizontal scan horizontal length of ship for hit
            if (z == 0 && x + j == coords[0] && y == coords[1])
                isHit = 1;
            // if vertical scan vertical length of ship for hit
            else if (z == 1 && x == coords[0] && y + j == coords[1])
                isHit = 1;
        }
    }
    if (isHit == 0)
        assert(hit == 0);
    else
        assert(hit == 1);
}

component main { public [hash, coords, hit] } = shot();