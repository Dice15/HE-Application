import Image from "next/image";
import styles from "./PageContentSystemProcess.module.css";


export default async function PageContentSystemProcess() {
    // render
    return (
        <div className={styles.wrapper}>
            <div className={styles.introduce}>
                <h3 className={styles.title}>
                    시스템 구조
                </h3>
                <h1 className={styles.description}>
                    환자 데이터 업로드
                </h1>
            </div>

            <div className={styles.system}>
                <div className={styles.system_middle}>
                    <Image
                        className={styles.system_image}
                        src="/images/new_system_process1.png"
                        alt="new_system_process1"
                        height={2475}
                        width={4400}
                        priority
                    />
                </div>
            </div>

            <div className={styles.sub_introduce}>
                <h1 className={styles.description}>
                    환자 질병 검사
                </h1>
            </div>

            <div className={styles.system}>
                <div className={styles.system_middle}>
                    <Image
                        className={styles.system_image}
                        src="/images/new_system_process2.png"
                        alt="new_system_process2"
                        height={2475}
                        width={4400}
                        priority
                    />
                </div>
            </div>
        </div >
    );
}