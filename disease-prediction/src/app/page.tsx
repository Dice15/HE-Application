import styles from "./page.module.css";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import AuthTopBar from "./_components/AuthTopBar";
import { getServerSession } from "next-auth/next";
import KidneyDiseasePrediction from "./_components/KidneyDiseasePrediction";

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <main className={styles.wrapper}>
      <div style={{ width: '100%', height: '30px' }}>
        <AuthTopBar isAuth={session !== null} />
      </div>
      <div style={{ width: '100%', height: 'calc(100% - 30px)' }}>
        <KidneyDiseasePrediction />
      </div>
    </main>
  );
}