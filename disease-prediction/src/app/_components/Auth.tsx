"use client"

import { signIn, signOut } from "next-auth/react";
import React, { ReactElement } from "react";

interface AuthProps {
    isAuth: boolean;
    authButtons: {
        signInButton: ReactElement;
        signOutButton: ReactElement;
    };
}

export default function Auth({ isAuth, authButtons }: AuthProps) {
    const authButton = React.cloneElement(
        isAuth ? authButtons.signOutButton : authButtons.signInButton,
        {
            onClick: isAuth ? () => signOut() : () => signIn()
        }
    );

    return (<>{authButton}</>);
}