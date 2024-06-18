import Link from "next/link";
import styles from "./PageContentKidneyDisease.module.css";
import Image from "next/image";

export default async function PageContentKidneyDisease() {
    return (
        <div className={styles.wrapper}>
            <div className={styles.introduce}>
                <h3 className={styles.title}>
                    신장 질환 검사
                </h3>
                <h1 className={styles.description}>
                    질병 예측,
                </h1>
                <h1 className={styles.description}>
                    다양한 모델을 사용하여
                </h1>
            </div>

            <div className={styles.model}>
                <div className={styles.model_left}>
                    <Image
                        className={styles.model_image}
                        src="/images/kidney_disease_prediction_model1.png"
                        alt="kidney_disease_prediction_model1"
                        height={1538}
                        width={1047}
                        priority
                    />
                    <Link href={{
                        pathname: "/diseasePrediction/kidneyDisease/predict",
                        query: { model: "fast" }
                    }} prefetch={true}>
                        <button className={[styles.model_button, styles.model_left_button].join(' ')}>
                            빠른 검사 시작
                        </button>
                    </Link>
                </div>
                <div className={styles.model_right}>
                    <Image
                        className={styles.model_image}
                        src="/images/kidney_disease_prediction_model2.png"
                        alt="kidney_disease_prediction_model1"
                        height={1538}
                        width={1047}
                        priority
                    />
                    <Link href={{
                        pathname: "/diseasePrediction/kidneyDisease/predict",
                        query: { model: "accurate" } // 여기에 전달할 파라미터를 추가
                    }} prefetch={true}>
                        <button className={[styles.model_button, styles.model_right_button].join(' ')}>
                            정밀 검사 시작
                        </button>
                    </Link>
                </div>
            </div>


        </div >
    );
}