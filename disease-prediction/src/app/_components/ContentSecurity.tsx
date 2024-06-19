import styles from "./ContentSecurity.module.css";
import Image from "next/image";


export default async function ContentSecurity() {
    // render
    return (
        <div className={styles.wrapper}>
            <div className={styles.introduce}>
                <h3 className={styles.title}>
                    환자의 정보 보호
                </h3>
                <h1 className={styles.description}>
                    환자의 정보를 암호화 하여,
                </h1>
                <h1 className={styles.description}>
                    질병 검사
                </h1>
            </div>

            <div className={styles.security}>
                <div className={styles.security_middle}>
                    <Image
                        className={styles.security_image}
                        src="/images/new_security.png"
                        alt="new_security"
                        height={425}
                        width={425}
                        priority
                    />
                </div>
            </div>
        </div >
    );
}