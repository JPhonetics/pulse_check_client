import { useState, useRef, useCallback } from 'react';
import Icon from '../ui/Icon';
import { useLocation } from '../../contexts/LocationContext';
import { searchLocations } from '../../data/locations';
import styles from './LocalRegionModal.module.css';

export default function LocalRegionModal({ onClose }) {
  const { setLocalRegion } = useLocation();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selected, setSelected] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleInput = useCallback((e) => {
    const val = e.target.value;
    setQuery(val);
    setSelected('');
    setError('');
    const results = searchLocations(val);
    setSuggestions(results);
    if (val.length >= 2 && results.length === 0) {
      setError("We couldn't find that location — check spelling or try a different city.");
    }
  }, []);

  const handleSelect = useCallback((loc) => {
    setSelected(loc);
    setQuery(loc);
    setSuggestions([]);
    setError('');
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!selected) return;
    setLocalRegion(selected);
    onClose?.();
  }, [selected, setLocalRegion, onClose]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Set local region">
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <Icon id="icon-close" size={20} />
        </button>

        <h2 className={styles.title}>Set your local region</h2>
        <p className={styles.subtitle}>Enter a city, state, or ZIP code</p>

        <form className={styles.form} onSubmit={handleSubmit} autoComplete="off">
          <div className={styles.inputWrap}>
            <input
              ref={inputRef}
              className={styles.input}
              type="text"
              placeholder="e.g. Los Angeles, CA"
              value={query}
              onChange={handleInput}
              autoFocus
              aria-label="Location search"
              aria-autocomplete="list"
              aria-controls="location-suggestions"
            />
            {suggestions.length > 0 && (
              <ul className={styles.suggestions} id="location-suggestions" role="listbox">
                {suggestions.map(loc => (
                  <li key={loc} role="option" aria-selected={selected === loc}>
                    <button
                      type="button"
                      className={styles.suggestion}
                      onClick={() => handleSelect(loc)}
                    >
                      <Icon id="icon-location" size={14} />
                      {loc}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button className={styles.submitBtn} type="submit" disabled={!selected}>
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}
