import styles from "./page.module.css";
import PageTopIntroduce from "./_components/PageTopIntroduce";


export default async function Page() {
  return (
    <main className={styles.wrapper}>
      <div className={styles.top}>
        <PageTopIntroduce />
      </div>
    </main>
  );
}