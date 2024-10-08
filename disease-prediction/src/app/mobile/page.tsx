import { headers } from "next/headers";
import ServerSideWeblog from "../_classes/ServerSideWeblog";
import styles from "./page.module.css";


export default async function Page() {
  ServerSideWeblog.saveConnectionUrl(headers(), '/mobile');

  return (
    <main className={styles.wrapper}>
      <h3 className={styles.main}>
        현재 서비스는
      </h3>
      <h3 className={styles.main}>
        모바일 기기를 지원하지 않습니다.
      </h3>
    </main>
  );
}