import PageContentKidneyDisease from "./_components/PageContentKidneyDisease";
import PageContentSampleData from "./_components/PageContentSampleData";
import PageTopKidneyDisease from "./_components/PageTopKidneyDisease";
import styles from "./page.module.css";


export default async function Page() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.top}>
        <PageTopKidneyDisease />
      </div>
      <div className={styles.content}>
        <PageContentKidneyDisease />
      </div>
      <div className={styles.content}>
        <PageContentSampleData />
      </div>
    </div>
  );
}