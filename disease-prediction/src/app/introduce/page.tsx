import styles from "./page.module.css";
import PageTopIntroduce from "./_components/PageTopIntroduce";
import PageContentSystemProcess from "./_components/PageContentSystemProcess";
import PageContentGoal from "./_components/PageContentGoal";
import PageContentProfile from "./_components/PageContentProfile";
import ServerSideWeblog from "../_classes/ServerSideWeblog";
import { headers } from "next/headers";


export default async function Page() {
  ServerSideWeblog.saveConnectionUrl(headers(), '/introduce');

  return (
    <main className={styles.wrapper}>
      <div className={styles.top}>
        <PageTopIntroduce />
      </div>
      <div className={styles.content}>
        <PageContentGoal />
      </div>
      <div className={styles.content}>
        <PageContentSystemProcess />
      </div>
      <div className={styles.content}>
        <PageContentProfile />
      </div>
    </main>
  );
}