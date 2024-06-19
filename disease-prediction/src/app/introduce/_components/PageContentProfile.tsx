import Image from "next/image";
import styles from "./PageContentProfile.module.css";


export default async function PageContentProfile() {
    // render
    return (
        <div className={styles.wrapper}>
            <div className={styles.introduce}>
                <h3 className={styles.title}>
                    프로필
                </h3>
            </div>

            <div className={styles.profile}>
                <div className={styles.profile_left}>
                    <Image
                        className={styles.profile_image}
                        src="/images/new_resume_photo.jpg"
                        alt="new_resume_photo"
                        height={1964}
                        width={1476}
                        priority
                    />
                </div>
                <div className={styles.profile_right}>
                    <h1 className={styles.description}>
                        Name - JeongHun, Moon
                    </h1>
                    <h1 className={styles.description}>
                        Degree - Bachelor of Science in Computer Science and Engineering, Dongguk University
                    </h1>
                    <h1 className={styles.description}>
                        Email - java_script@kakao.com
                    </h1>
                    <h1 className={styles.description}>
                        Github - https://github.com/Dice15
                    </h1>
                    <h1 className={styles.description}>
                        Blog - https://blog.naver.com/jqkt15
                    </h1>
                </div>
            </div>
        </div >
    );
}