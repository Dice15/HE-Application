"use client"

import { signIn, signOut } from "next-auth/react";

interface AuthFormProps {
    isAuth: boolean;
}

export default function AuthTopBar({ isAuth }: AuthFormProps) {
    return (
        <div style={{ width: '100%', height: '100%', backgroundColor: 'white', display: "flex", flexDirection: "column", justifyContent: 'center', alignItems: 'center', }}>

            <p style={{ fontSize: '3em', fontWeight: 'bold' }}>개별연구3 (CSC Privacy Enhacing Technology 심화 연구1)</p>
            <p style={{ fontSize: '2em', fontWeight: 'bold', marginTop: '1%' }}>Disease Prediction with Homomorphic Encryption</p>

            {!isAuth &&
                <button onClick={() => { signIn() }} style={{ width: '30%', height: '15%', marginTop: '5%', marginBottom: '10%', border: '2px solid black', fontSize: '3em', fontWeight: 'bold' }}>
                    시작하기
                </button>
            }
        </div>
    );
}