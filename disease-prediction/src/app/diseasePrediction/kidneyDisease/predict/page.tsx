import KidneyDiseasePrediction from "./_components/KidneyDiseasePrediction";
import PageTopKidneyDiseasePredict from "./_components/PageTopKidneyDiseasePredict";
import styles from "./page.module.css";
import { Suspense } from 'react';


export default async function Page() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.top}>
        <PageTopKidneyDiseasePredict />
      </div>
      <div className={styles.content}>
        <Suspense fallback={<div>Loading...</div>}>
          <KidneyDiseasePrediction />
        </Suspense>
      </div>
    </div>
  );
}