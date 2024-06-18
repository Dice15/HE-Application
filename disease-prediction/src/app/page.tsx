import styles from "./page.module.css";
import Main from "./_components/Main";
import Top from "./_components/Top";


export default async function Home() {
  return (
    <main className={styles.wrapper}>
      <div className={styles.top}>
        <Top />
      </div>
      <div className={styles.main}>
        <Main />
      </div>
    </main>
  );
}