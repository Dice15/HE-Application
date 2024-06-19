import styles from "./ContentModel.module.css";
import Image from "next/image";


export default async function ContentModel() {
    // render
    return (
        <div className={styles.wrapper}>
            <div className={styles.introduce}>
                <h3 className={styles.title}>
                    정확한 검사
                </h3>
                <h1 className={styles.description}>
                    많은 데이터로 학습된,
                </h1>
                <h1 className={styles.description}>
                    높은 정확도의 머신러닝 모델
                </h1>
            </div>

            <div className={styles.security}>
                <div className={styles.security_middle}>
                    <Image
                        className={styles.security_image}
                        src="/images/new_model.png"
                        alt="new_security"
                        height={2475}
                        width={4332}
                        priority
                    />
                </div>
            </div>
        </div >
    );
}