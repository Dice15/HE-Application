import styles from "./page.module.css";
import Main from "./_components/Main";
import Top from "./_components/Top";
import ContentSecurity from "./_components/ContentSecurity";
import ContentModel from "./_components/ContentModel";


export default async function Home() {
  return (
    <main className={styles.wrapper}>
      <div className={styles.top}>
        <Top />
      </div>
      <div className={styles.main}>
        <Main />
      </div>
      <div className={styles.main}>
        <ContentSecurity />
      </div>
      <div className={styles.content}>
        <ContentModel />
      </div>
    </main>
  );
}