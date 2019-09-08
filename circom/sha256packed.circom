include "circomlib/circuits/bitify.circom";
include "circomlib/circuits/sha256/sha256compression.circom";

template Sha256packed() {
	signal input inp;		// 1 * 128 bits
	//signal input inp[4];	// 4 * 128 bits
	signal output out[2];	// 2 * 128 bits

	// break 4 * 128-bit inputs into 512 bits
	//component sha256c = Sha256compression();
	//component n2b[4];
	//for (var i = 0; i < 4; i++) {
	//	n2b[i] = Num2Bits(128);
	//	n2b[i].in <== inp[i];
	//	for (var j = 0; j < 128; j++) {
	//		sha256c.inp[j + i * 128] <== n2b[i].out[j];
	//	}
	//}

	// break 1 * 128-bit input into 512 bits
	component sha256c = Sha256compression();
	component n2b = Num2Bits(128);
	n2b.in <== inp;
	for (var j = 0; j < 384; j++) {
		sha256c.inp[j] <== 0;
	}
	for (var j = 0; j < 128; j++) {
		sha256c.inp[j + 384] <== n2b.out[j];
	}

	// merge the 256 bits into 2 * 128-bit outputs
	component b2n[2];
	for (var i = 0; i < 2; i++) {
		b2n[i] = Bits2Num(128);
		for (var j = 0; j < 128; j++) {
			b2n[i].in[j] <-- sha256c.out[j + i * 128];
		}
		out[i] <-- b2n[i].out;
	}
}

//component main = Sha256packed();