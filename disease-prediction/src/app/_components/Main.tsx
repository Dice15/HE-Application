import styles from "./Main.module.css";
import Image from "next/image";

export default async function Main() {
    return (
        <div className={styles.wrapper}>
            <Image
                className={styles.main_image}
                src="/images/new_main.png"
                alt="new_main"
                height={2475}
                width={5776}
                priority
            />
        </div >
    );
}