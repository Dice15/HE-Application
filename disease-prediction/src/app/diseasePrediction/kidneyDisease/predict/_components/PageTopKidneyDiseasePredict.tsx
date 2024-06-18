import Image from "next/image";
import styles from "./PageTopKidneyDiseasePredict.module.css";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import Auth from "@/app/_components/Auth";

export default async function PageTopKidneyDiseasePredict() {
    // const
    const isAuth = (await getServerSession(authOptions)) !== null;


    // render
    return (
        <div className={styles.wrapper}>
            <div className={styles.manu}>
                <Link href={"/"} prefetch={true} style={{ textDecoration: "none" }}>
                    <div className={styles.logo_field}>
                        <div className={styles.logo}>
                            <Image src="/images/new_logo.png" alt="new_logo" fill priority />
                        </div>

                        <div className={styles.logo_text}>
                            Safe Diagnosis
                        </div>
                    </div>
                </Link>

                <div className={styles.manu_field}>
                    <Link href={"/"} prefetch={true}>
                        <button className={styles.manu_button}>
                            소개
                        </button>
                    </Link>
                    <Link href={"/diseasePrediction/kidneyDisease"} prefetch={true}>
                        <button className={styles.manu_button}>
                            신장 질환 검사
                        </button>
                    </Link>
                </div>

                <div className={styles.auth_field}>
                    <Auth
                        isAuth={isAuth}
                        authButtons={{
                            signInButton: <button className={[styles.auth_button, styles.auth_in].join(' ')}>로그인</button>,
                            signOutButton: <button className={[styles.auth_button, styles.auth_out].join(' ')}>로그아웃</button>
                        }}
                    />
                </div>
            </div>
        </div >
    );
}