import styles from "./PageContentGoal.module.css";


export default async function PageContentGoal() {
    // render
    return (
        <div className={styles.wrapper}>
            <div className={styles.introduce}>
                <h3 className={styles.title}>
                    목표
                </h3>
                <h1 className={styles.description}>
                    개인 정보를 암호화 하여,
                </h1>
                <h1 className={styles.description}>
                    여러 질병을 검사하는 플랫폼 개발
                </h1>
            </div>
        </div >
    );
}