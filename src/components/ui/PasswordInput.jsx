import { useState } from 'react';
import Icon from './Icon';
import styles from './PasswordInput.module.css';

export default function PasswordInput({ id, name, placeholder, value, onChange, autoComplete, required }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={styles.wrap}>
      <input
        id={id}
        name={name}
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required={required}
        className={styles.input}
      />
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setVisible(v => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        tabIndex={-1}
      >
        <Icon id={visible ? 'icon-eye-off' : 'icon-eye'} size={17} />
      </button>
    </div>
  );
}
