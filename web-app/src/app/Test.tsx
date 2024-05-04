"use client"

import { BFVSeal, BFVSealBuilder } from '@/core/modules/homomorphic-encryption/bfv';
import { NodeSealProvider } from '@/core/modules/homomorphic-encryption/node-seal';
import axios from 'axios';
import { CipherText } from 'node-seal/implementation/cipher-text';
import { useEffect, useState } from 'react';

function difference(seal: BFVSeal, patient_seq: CipherText, reference_seq: CipherText): CipherText {
    return seal.subtract(patient_seq, reference_seq);
}

export default function Test() {
    const [clientSeal, setClientSeal] = useState<BFVSeal>();
    const [serverSeal, setServerSeal] = useState<BFVSeal>();

    const patient_seq = "TTAGCACG";
    const reference_seq = {
        BRCA1: "__A_C__G",
        BRCA2: "_A_GC___",
    };

    useEffect(() => {
        (async () => {
            try {
                const node_seal = await NodeSealProvider.getSeal();
                const cSeal = new BFVSealBuilder().build(node_seal);
                const sSeal = new BFVSealBuilder().deserializePublicKey(cSeal.serializePublicKey()).build(node_seal);
                setClientSeal(cSeal);
                setServerSeal(sSeal);
            } catch (error) {
                console.error("An error occurred:", error);
            }
        })();
    }, []);


    useEffect(() => {
        if (clientSeal && serverSeal) {
            const cArray0 = clientSeal.encrypt([8, 8, 5, 7, 6, 5, 6, 7]);

            const response = axios.post(
                `/api/genetic/diseasePrediction`,
                {
                    patient_sequence: cArray0.save(),
                    serialized_publickey: clientSeal.serializePublicKey(),
                }
            ).then((result) => {
                const { message, predictionList } = result.data;
                console.log(message);
                console.log(clientSeal.decrypt(clientSeal.deserializeCipherText(predictionList[0])));
            });
        }
    }, [clientSeal, serverSeal]);

    return <>
    </>
}



