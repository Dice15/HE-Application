import { ReceiverCKKSBuilder, SenderCKKSBuilder } from "./modules/node-ckks/ckks-builder";
import { ReceiverCKKSBuilderAuto, SenderCKKSBuilderAuto } from "./modules/node-ckks/ckks-builder-auto";


// const registry = new FinalizationRegistry((deleteFunction: () => void) => {
//     deleteFunction();
// });

// abstract class AbstractResource {
//     constructor(protected id: number) {
//         registry.register(this, this.delete.bind(this));
//     }

//     protected delete() {
//         console.log(`super${this.id} has been deleted`);
//     }
// }


// class Resource extends AbstractResource {
//     constructor(id: number) {
//         super(id);
//     }

//     protected override delete() {
//         super.delete();
//         console.log(`extended${this.id} has been deleted`);
//     }
// }


// for (let i = 0; i < 10; i++) {
//     new Resource(i);
// }

// setTimeout(() => {

// }, 5000);



const func = async () => {
    // const senderCKKS = await new SenderCKKSBuilder()
    //     .setPolyModulusDegree("2^11")
    //     .setSecurityLevel("tc128")
    //     .setBitSizes([19, 16, 19])
    //     .setScale("2^16")
    //     .build();

    // const senderCKKS = await new SenderCKKSBuilder()
    //     .setPolyModulusDegree("2^12")
    //     .setSecurityLevel("tc128")
    //     .setBitSizes([39, 30, 39])
    //     .setScale("2^30")
    //     .setBitSizes([24, 20, 20, 20, 24])
    //     .setScale("2^20")
    //     .build();


    // const senderCKKS = await new SenderCKKSBuilder()
    //     .setPolyModulusDegree("2^13")
    //     .setSecurityLevel("tc128")
    //     .setBitSizes([59, 50, 50, 59])
    //     .setScale("2^50")
    //     .setBitSizes([49, 40, 40, 40, 49])
    //     .setScale("2^40")
    //     .setBitSizes([34, 30, 30, 30, 30, 30, 34])
    //     .setScale("2^30")
    //     .build();



    // const senderCKKS = await new SenderCKKSBuilder()
    //     .setPolyModulusDegree("2^14")
    //     .setSecurityLevel("tc128")
    //     .setBitSizes([60, 50, 50, 50, 50, 50, 50, 60])
    //     .setScale("2^50")
    //     .setBitSizes([50, 40, 40, 40, 40, 40, 40, 40, 40, 50])
    //     .setScale("2^40")
    //     .setBitSizes([39, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 39])
    //     .setScale("2^30")
    //     .build();


    // const senderCKKS = await new SenderCKKSBuilder()
    //     .setPolyModulusDegree("2^15")
    //     .setSecurityLevel("tc128")
    //     .setBitSizes([60, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 60])
    //     .setScale("2^50")
    //     .setBitSizes([50, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 50])
    //     .setScale("2^40")
    //     .setBitSizes([40, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 40])
    //     .setScale("2^30")
    //     .build();


    /**
     * Test Code: Cross-Instance Encryption and Decryption
     * 
     * Description:
     * This test demonstrates the interoperability between two instances of SenderCKKSBuilder
     * created using the same secret key, and two instances of ReceiverCKKSBuilder
     * created using the corresponding public key, relinearization keys, and Galois keys.
     * 
     * The goal is to verify that ciphertexts encrypted by one sender can be correctly
     * decrypted by another sender instance that shares the same secret key.
     * 
     * Test Steps:
     * 1. Create a `senderCKKS1` instance with encryption parameters.
     * 2. Create a `senderCKKS2` instance using the secret key from `senderCKKS1`.
     * 3. Create a `receiverCKKS1` instance using the public key, relinearization keys, and Galois keys from `senderCKKS1`.
     * 4. Create a `receiverCKKS2` instance using the public key, relinearization keys, and Galois keys from `senderCKKS2`.
     * 
     * Verification:
     * 1. Encrypt a vector [2, 4, 6, 8, 10] using `senderCKKS1` and `receiverCKKS1`.
     * 2. Add the two ciphertexts using `receiverCKKS2`.
     * 3. Decrypt the resulting ciphertext using `senderCKKS2`.
     * 4. Check if the decrypted result matches the expected sum of the two input vectors.
     * 
     * Expected Result:
     * [4, 8, 12, 16, 20]
     * 
     * Actual Result:
     * [4.000000000001489, 7.999999999999787, 12.000000000001025, 16.00000000000195, 20.0000000000001]
     * 
     * Conclusion:
     * The slight discrepancies in the 12th to 13th decimal places are within the acceptable error range of CKKS.
     * Therefore, the actual results are considered accurate. The test is successful.
     */
    // const senderCKKS1 = await new SenderCKKSBuilder()
    //     .setPolyModulusDegree("2^13")
    //     .setSecurityLevel("tc128")
    //     .setBitSizes([59, 50, 50, 59])
    //     .setScale("2^50")
    //     .setVectorSize(5)
    //     .build();


    // const senderCKKS2 = await new SenderCKKSBuilder()
    //     .setPolyModulusDegree("2^13")
    //     .setSecurityLevel("tc128")
    //     .setBitSizes([59, 50, 50, 59])
    //     .setScale("2^50")
    //     .setVectorSize(5)
    //     .build(senderCKKS1.serializeSecretKey());


    // const receiverCKKS1 = await new ReceiverCKKSBuilder()
    //     .setPolyModulusDegree("2^13")
    //     .setSecurityLevel("tc128")
    //     .setBitSizes([59, 50, 50, 59])
    //     .setScale("2^50")
    //     .setVectorSize(5)
    //     .build(senderCKKS1.serializePublicKey(), senderCKKS1.serializeRelinKeys(), senderCKKS1.serializeGaloisKey());


    // const receiverCKKS2 = await new ReceiverCKKSBuilder()
    //     .setPolyModulusDegree("2^13")
    //     .setSecurityLevel("tc128")
    //     .setBitSizes([59, 50, 50, 59])
    //     .setScale("2^50")
    //     .setVectorSize(5)
    //     .build(senderCKKS2.serializePublicKey(), senderCKKS2.serializeRelinKeys(), senderCKKS2.serializeGaloisKey());


    // const cipherText1 = senderCKKS1.encrypt([2, 4, 6, 8, 10]);
    // const cipherText2 = receiverCKKS1.encrypt([2, 4, 6, 8, 10]);
    // const cipherText3 = receiverCKKS2.add(cipherText1, cipherText2);
    // console.log(senderCKKS2.decrypt(cipherText3));



    /**
     * Test Code: Cross-Instance Encryption and Decryption
     * 
     * Description:
     * This test demonstrates the interoperability between two instances of SenderCKKSBuilder
     * created using the same secret key, and two instances of ReceiverCKKSBuilder
     * created using the corresponding public key, relinearization keys, and Galois keys.
     * 
     * The goal is to verify that ciphertexts encrypted by one sender can be correctly
     * decrypted by another sender instance that shares the same secret key.
     * 
     * Test Steps:
     * 1. Create a `senderCKKS1` instance with encryption parameters.
     * 2. Create a `senderCKKS2` instance using the secret key from `senderCKKS1`.
     * 3. Create a `receiverCKKS1` instance using the public key, relinearization keys, and Galois keys from `senderCKKS1`.
     * 4. Create a `receiverCKKS2` instance using the public key, relinearization keys, and Galois keys from `senderCKKS2`.
     * 
     * Verification:
     * 1. Encrypt a vector [2, 4, 6, 8, 10] using `senderCKKS1` and `receiverCKKS1`.
     * 2. Add the two ciphertexts using `receiverCKKS2`.
     * 3. Decrypt the resulting ciphertext using `senderCKKS2`.
     * 4. Check if the decrypted result matches the expected sum of the two input vectors.
     * 
     * Expected Result:
     * [4, 8, 12, 16, 20]
     * 
     * Actual Result:
     * [4.000000000001489, 7.999999999999787, 12.000000000001025, 16.00000000000195, 20.0000000000001]
     * 
     * Conclusion:
     * The slight discrepancies in the 12th to 13th decimal places are within the acceptable error range of CKKS.
     * Therefore, the actual results are considered accurate. The test is successful.
     */
    // const senderCKKS1 = await new SenderCKKSBuilderAuto("higher", "2")
    //     .setVectorSize(5)
    //     .build();


    // const senderCKKS2 = await new SenderCKKSBuilderAuto("higher", "2")
    //     .setVectorSize(5)
    //     .build(senderCKKS1.serializeSecretKey());


    // const receiverCKKS1 = await new ReceiverCKKSBuilderAuto("higher", "2")
    //     .setVectorSize(5)
    //     .build(senderCKKS1.serializePublicKey(), senderCKKS1.serializeRelinKeys(), senderCKKS1.serializeGaloisKey());


    // const receiverCKKS2 = await new ReceiverCKKSBuilderAuto("higher", "2")
    //     .setVectorSize(5)
    //     .build(senderCKKS2.serializePublicKey(), senderCKKS2.serializeRelinKeys(), senderCKKS2.serializeGaloisKey());


    // const receiverCKKS3 = await new ReceiverCKKSBuilderAuto("higher", "2")
    //     .setVectorSize(5)
    //     .build(receiverCKKS1.serializePublicKey(), receiverCKKS1.serializeRelinKeys(), receiverCKKS1.serializeGaloisKey());


    // const cipherText1 = senderCKKS1.encrypt([2, 4, 6, 8, 10]);
    // const cipherText2 = receiverCKKS1.encrypt([2, 4, 6, 8, 10]);
    // const cipherText3 =
    //     receiverCKKS3.add(
    //         receiverCKKS2.multiply(cipherText1, cipherText2),
    //         receiverCKKS2.multiply(cipherText1, cipherText2),
    //         { deleteCipherText1: true, deleteCipherText2: true }
    //     );
    // console.log(senderCKKS2.decrypt(cipherText3));
    // console.log(senderCKKS2.decrypt(cipherText1));
    // console.log(senderCKKS2.decrypt(cipherText2));



    const tLabel = `Total `;
    console.time(tLabel);
    for (let i = 1; i <= 100; i++) {
        console.log(i);
        await new SenderCKKSBuilderAuto("higher", "6").setVectorSize(i).build();
        //(await new SenderCKKSBuilderAuto("higher", "6").build()).delete();
        global.gc();
    }
    console.timeEnd(tLabel);

    //     setTimeout(() => {

    // }, 10000);

    // const tLabel = `Total `;
    // console.time(tLabel);
    // const temp = await new SenderCKKSBuilderAuto("higher", "2").setVectorSize(1).build();
    // console.timeEnd(tLabel);

    // setTimeout(() => {

    // }, 10000);


    //console.log(Int32Array.from({ length: Math.ceil(Math.log2(4097) / 2) }, (_, k) => Math.pow(4, k)))

    // let c0 = senderCKKS.encryptMany([[1, 1, 1]]);
    // let c1 = senderCKKS.encryptMany([[1, 1, 1]]);
    // let c2 = senderCKKS.encryptMany([[2, 2, 2]]);
    // console.log(senderCKKS.decrypt(c0)[0]);

    // for (let i = 0; i < 15; i++) {
    //     const label = `Iteration ${i}`;
    //     console.time(label);
    //     c0 = senderCKKS.multiply(c0, c2);
    //     console.timeEnd(label);
    // }
    // console.log(senderCKKS.decrypt(c0)[0]);


    // const c1 = senderCKKS.encryptMany([
    //     Array.from({ length: 3731 }, (_, k) => k + 1),
    //     Array.from({ length: 3731 }, (_, k) => k + 1),
    // ]);

    // const c2 = senderCKKS.encryptMany([
    //     Array.from({ length: 3731 }, (_, k) => 0),
    //     Array.from({ length: 3731 }, (_, k) => k + 1),
    // ]);

    // const c3 = senderCKKS.encryptMany([
    //     Array.from({ length: 3731 }, (_, k) => 1),
    //     Array.from({ length: 3731 }, (_, k) => 2),
    // ]);


    // const c4 = senderCKKS.add(senderCKKS.multiply(senderCKKS.add(c1, c2), c3), c2);


    /**
     * 암호문 끼리의 연산 메모리 최적화
     */
    // const senderCKKS = await new SenderCKKSBuilderAuto("higher", "2").setVectorSize(5).build();
    // let c1 = senderCKKS.encrypt([0]);
    // let c2 = senderCKKS.encrypt([1]);

    // const tLabel = `Total `;
    // console.time(tLabel);
    // for (let i = 0; i < 30000; i++) {
    //     //c1 = senderCKKS.add(senderCKKS.add(senderCKKS.add(senderCKKS.add(senderCKKS.add(c1, c2), c2), c2), c2), c2);
    //     // c1 = senderCKKS.add(
    //     //     senderCKKS.add(
    //     //         senderCKKS.add(
    //     //             senderCKKS.add(
    //     //                 senderCKKS.add(c1, c2),
    //     //                 c2,
    //     //                 { deleteCipherText1: true }
    //     //             ),
    //     //             c2,
    //     //             { deleteCipherText1: true }
    //     //         ),
    //     //         c2,
    //     //         { deleteCipherText1: true }
    //     //     ),
    //     //     c2,
    //     //     { deleteCipherText1: true }
    //     // );
    //     // c1.move(
    //     //     senderCKKS.add(
    //     //         senderCKKS.add(
    //     //             senderCKKS.add(
    //     //                 senderCKKS.add(
    //     //                     senderCKKS.add(c1, c2),
    //     //                     c2,
    //     //                     { deleteCipherText1: true }
    //     //                 ),
    //     //                 c2,
    //     //                 { deleteCipherText1: true }
    //     //             ),
    //     //             c2,
    //     //             { deleteCipherText1: true }
    //     //         ),
    //     //         c2,
    //     //         { deleteCipherText1: true }
    //     //     )
    //     // );
    // }
    // console.log(senderCKKS.decrypt(c1)[0]);
    // console.timeEnd(tLabel);



    /**
     * 암호문과 평문의 연산 메모리 최적화
     */
    // let cipherText1 = senderCKKS.encrypt([0]);
    // let plainText1 = senderCKKS.encode([1]);

    // const tLabel = `Total `;
    // console.time(tLabel);
    // for (let i = 0; i < 30000; i++) {
    //     //c1 = senderCKKS.add(senderCKKS.add(senderCKKS.add(senderCKKS.add(senderCKKS.add(c1, c2), c2), c2), c2), c2);
    //     // cipherText1 = senderCKKS.addPlain(
    //     //     senderCKKS.addPlain(
    //     //         senderCKKS.addPlain(
    //     //             senderCKKS.addPlain(
    //     //                 senderCKKS.addPlain(
    //     //                     cipherText1,
    //     //                     plainText1
    //     //                 ),
    //     //                 plainText1,
    //     //                 { deleteCipherText: true }
    //     //             ),
    //     //             plainText1,
    //     //             { deleteCipherText: true }
    //     //         ),
    //     //         plainText1,
    //     //         { deleteCipherText: true }
    //     //     ),
    //     //     plainText1,
    //     //     { deleteCipherText: true }
    //     // );
    //     // cipherText1.move(
    //     //     senderCKKS.addPlain(
    //     //         senderCKKS.addPlain(
    //     //             senderCKKS.addPlain(
    //     //                 senderCKKS.addPlain(
    //     //                     senderCKKS.addPlain(
    //     //                         cipherText1,
    //     //                         plainText1
    //     //                     ),
    //     //                     plainText1,
    //     //                     { deleteCipherText: true }
    //     //                 ),
    //     //                 plainText1,
    //     //                 { deleteCipherText: true }
    //     //             ),
    //     //             plainText1,
    //     //             { deleteCipherText: true }
    //     //         ),
    //     //         plainText1,
    //     //         { deleteCipherText: true }
    //     //     )
    //     // );
    // }
    // console.log(senderCKKS.decrypt(cipherText1)[0]);
    // console.timeEnd(tLabel);



    // /**
    //  * 암호화 및 복호화 메모리 최적화
    //  */
    // const tLabel = `Total `;
    // console.time(tLabel);
    // for (let i = 0; i < 30000; i++) {
    //     //senderCKKS.decrypt(senderCKKS.encrypt([1, 2, 3]));
    //     senderCKKS.decrypt(senderCKKS.encrypt([1, 2, 3]), { deleteCipherText: true });
    // }
    // console.timeEnd(tLabel);


    /**
     * 평문 encode 및 decode 메모리 최적화
     */
    // const tLabel = `Total `;
    // console.time(tLabel);
    // for (let i = 0; i < 30000; i++) {
    //     //     senderCKKS.decode(senderCKKS.encode([1, 2, 3]));
    //     senderCKKS.decode(senderCKKS.encode([1, 2, 3]), { deletePlainText: true });
    // }
    // console.timeEnd(tLabel);




    // [63, 64, 127].forEach((value, index) => {
    //     const label = `Iteration ${index}`;
    //     console.time(label);
    //     console.log(senderCKKS.decrypt(senderCKKS.rotate(c1, value)).slice(0, 5).join(', '));
    //     console.timeEnd(label);
    // });



    //  console.log(...senderCKKS.decryptMany(c0, 2));

    //     console.log(senderCKKS.serializeGaloisKey().length);

    //     let p0 = senderCKKS.encodeMany([[1], [1]], 0, 2);
    //     let c0 = senderCKKS.encryptMany([[1], [1]], 0, 2);
    //     let c1 = senderCKKS.encryptMany([[1], [1]], 0, 2);
    //     let c2 = senderCKKS.encryptMany([[2], [3]], 0, 2);

    //     console.log(...senderCKKS.decryptMany(c0, 2));
    //     for (let i = 0; i < 13; i++) {
    //         c0 = senderCKKS.multiply(c0, c2);
    //     }
    //     // for (let i = 0; i < 50; i++) {
    //     //     c0 = senderCKKS.add(c0, c1);
    //     // }
    //     // for (let i = 0; i < 2; i++) {
    //     //     c0 = senderCKKS.multiply(c0, c1);
    //     // }
    //     // for (let i = 0; i < 50; i++) {
    //     //     c0 = senderCKKS.addPlain(c0, p0);
    //     // }
    //     // for (let i = 0; i < 2; i++) {
    //     //     c0 = senderCKKS.multiply(c0, c1, false);
    //     // }
    //     // for (let i = 0; i < 50; i++) {
    //     //     c0 = senderCKKS.addPlain(c0, p0);
    //     // }
    //     console.log(...senderCKKS.decryptMany(c0, 2));




    // const p1 = senderCKKS.encodeMany([[1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1]], 0, 2);

    // const c1 = senderCKKS.encryptMany([[1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1]], 0, 2);
    // const c2 = senderCKKS.encryptMany([[2, 2, 2, 2, 2, 2], [3, 3, 3, 3, 3, 3]], 0, 2);

    // const c3 = senderCKKS.multiply(c1, c2);
    // const c4 = senderCKKS.multiply(c3, c2);

    // console.log(...senderCKKS.decryptMany(senderCKKS.addPlain(c1, p1), 2));
    // console.log(Math.log2(p1.scale));
    // console.log(...senderCKKS.decryptMany(senderCKKS.addPlain(c2, p1), 2));
    // console.log(Math.log2(p1.scale));
    // console.log(...senderCKKS.decryptMany(senderCKKS.addPlain(c3, p1), 2));
    // console.log(Math.log2(p1.scale));
    // console.log(...senderCKKS.decryptMany(senderCKKS.addPlain(c4, p1), 2));
    // console.log(Math.log2(p1.scale));
};

func();