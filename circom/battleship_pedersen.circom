include "circomlib/circuits/pedersen.circom";

template Battleship() {
    signal private input carrierX;
    signal private input carrierY;
    signal private input carrierO;
    signal private input battleshipX;
    signal private input battleshipY;
    signal private input battleshipO;
    signal private input cruiserX;
    signal private input cruiserY;
    signal private input cruiserO;
    signal private input submarineX;
    signal private input submarineY;
    signal private input submarineO;
    signal private input destroyerX;
    signal private input destroyerY;
    signal private input destroyerO;
    signal input shipHash[2];
    signal input targetX;
    signal input targetY;
    signal output out;

    signal isCarrierHit;
    signal isBattleshipHit;
    signal isCruiserHit;
    signal isSubmarineHit;
    signal isDestroyerHit;
    signal isHit;

    // hash check
    component hash = Pedersen(256);
    component n2b = Num2Bits(256);
    n2b.in <-- carrierX + carrierY * 16 + carrierO * (16**2) + battleshipX * (16**3) + battleshipY * (16**4) + battleshipO * (16**5) + cruiserX * (16**6) + cruiserY * (16**7) + cruiserO * (16**8) + submarineX * (16**9) + submarineY * (16**10) + submarineO * (16**11) + destroyerX * (16**12) + destroyerY * (16**13) + destroyerO * (16**14);
    for (var i = 0; i < 256; i++) {
        hash.in[i] <-- n2b.out[i];
    }
    shipHash[0] === hash.out[0];
    shipHash[1] === hash.out[1];

    // hit check
    isCarrierHit <-- (carrierO == 0 && targetX == carrierX && targetY >= carrierY && targetY <= carrierY + 4) || (carrierO == 1 && targetY == carrierY && targetX >= carrierX && targetX <= carrierX + 4);

    isBattleshipHit <-- (battleshipO == 0 && targetX == battleshipX && targetY >= battleshipY && targetY <= battleshipY + 3) || (battleshipO == 1 && targetY == battleshipY && targetX >= battleshipX && targetX <= battleshipX + 3);

    isCruiserHit <-- (cruiserO == 0 && targetX == cruiserX && targetY >= cruiserY && targetY <= cruiserY + 2) || (cruiserO == 1 && targetY == cruiserY && targetX >= cruiserX && targetX <= cruiserX + 2);

    isSubmarineHit <-- (submarineO == 0 && targetX == submarineX && targetY >= submarineY && targetY <= submarineY + 2) || (submarineO == 1 && targetY == submarineY && targetX >= submarineX && targetX <= submarineX + 2);

    isDestroyerHit <-- (destroyerO == 0 && targetX == destroyerX && targetY >= destroyerY && targetY <= destroyerY + 1) || (destroyerO == 1 && targetY == destroyerY && targetX >= destroyerX && targetX <= destroyerX + 1);

    isHit <-- (isCarrierHit || isBattleshipHit || isCruiserHit || isSubmarineHit || isDestroyerHit);
    out <== isHit;
}

component main = Battleship();
