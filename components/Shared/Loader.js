import styles from './Loader.module.css';

const Loader = ({ text = "Loading..." }) => {
    return (
        <div className={styles.loaderContainer}>
            <div className={styles.spinner}></div>
            {text && <span className={styles.loadingText}>{text}</span>}
        </div>
    );
};

export default Loader;
