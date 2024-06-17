import styles from "./page.module.css";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import AuthTopBar from "./_components/AuthTopBar";
import { getServerSession } from "next-auth/next";
import KidneyDiseasePrediction from "./diseasePrediction/kidneyDisease/_components/KidneyDiseasePrediction";

export default async function Home() {
  const isAuth = await getServerSession(authOptions) !== null;

  return (
    <main className={styles.wrapper}>
      <div style={{ width: '100%', height: '100%' }}>
        {isAuth ? <KidneyDiseasePrediction /> : <AuthTopBar isAuth={isAuth} />}
      </div>
    </main>
  );
}