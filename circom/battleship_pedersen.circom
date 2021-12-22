include "../node_modules/circomlib/circuits/pedersen.circom";

template Battleship() {
    signal input carrierX;
    signal input carrierY;
    signal input carrierO;
    signal input battleshipX;
    signal input battleshipY;
    signal input battleshipO;
    signal input cruiserX;
    signal input cruiserY;
    signal input cruiserO;
    signal input submarineX;
    signal input submarineY;
    signal input submarineO;
    signal input destroyerX;
    signal input destroyerY;
    signal input destroyerO;
    signal input shipHash[2];
    signal input targetX;
    signal input targetY;
    signal output out;

    signal isInRange;
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
    // // shipHash[0] === hash.out[0];
    // // shipHash[1] === hash.out[1];

    // // map check
    // isInRange <-- (targetX >= 0 && targetX <= 9 && targetY >= 0 && targetY <= 9);
    // isInRange === 1;

    // // hit check
    // isCarrierHit <-- (carrierO == 0 && targetX == carrierX && targetY >= carrierY && targetY <= carrierY + 4) || (carrierO == 1 && targetY == carrierY && targetX >= carrierX && targetX <= carrierX + 4);

    // isBattleshipHit <-- (battleshipO == 0 && targetX == battleshipX && targetY >= battleshipY && targetY <= battleshipY + 3) || (battleshipO == 1 && targetY == battleshipY && targetX >= battleshipX && targetX <= battleshipX + 3);

    // isCruiserHit <-- (cruiserO == 0 && targetX == cruiserX && targetY >= cruiserY && targetY <= cruiserY + 2) || (cruiserO == 1 && targetY == cruiserY && targetX >= cruiserX && targetX <= cruiserX + 2);

    // isSubmarineHit <-- (submarineO == 0 && targetX == submarineX && targetY >= submarineY && targetY <= submarineY + 2) || (submarineO == 1 && targetY == submarineY && targetX >= submarineX && targetX <= submarineX + 2);

    // isDestroyerHit <-- (destroyerO == 0 && targetX == destroyerX && targetY >= destroyerY && targetY <= destroyerY + 1) || (destroyerO == 1 && targetY == destroyerY && targetX >= destroyerX && targetX <= destroyerX + 1);

    // isHit <-- (isCarrierHit || isBattleshipHit || isCruiserHit || isSubmarineHit || isDestroyerHit);
    // out <== isHit;
}

component main = Battleship();
