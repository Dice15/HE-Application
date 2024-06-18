import KidneyDiseasePrediction from "./_components/KidneyDiseasePrediction";
import styles from "./page.module.css";


export default async function Page() {
  return (
    <div className={styles.wrapper}>
      <KidneyDiseasePrediction />
    </div>
  );
}