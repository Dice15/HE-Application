import Image from "next/image";
import styles from "./page.module.css";
import Test from "./Test";

export default function Home() {
  return (
    <main className={styles.wrapper}>
      <Test />
    </main>
  );
}
