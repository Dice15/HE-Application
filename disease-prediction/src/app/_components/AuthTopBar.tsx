"use client"

import { signIn, signOut } from "next-auth/react";

interface AuthFormProps {
    isAuth: boolean;
}

export default function AuthTopBar({ isAuth }: AuthFormProps) {
    return (
        <div>
            {isAuth
                ? <button onClick={() => { signOut() }}>
                    로그아웃
                </button>
                : <button onClick={() => { signIn() }}>
                    로그인
                </button>
            }
        </div>
    );
}