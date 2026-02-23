import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './dropdown.module.css';

export default function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'Select',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPositioned, setIsPositioned] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const dropdownRef = useRef(null);
  const menuRef = useRef(null);
  const inputRef = useRef(null);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (isOpen && dropdownRef.current && menuRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const menuWidth = 200;
      const menuHeight = menuRef.current.offsetHeight;

      let left = rect.left;
      let top = rect.bottom + 4;

      if (left + menuWidth > viewportWidth) {
        left = rect.right - menuWidth;
      }

      if (top + menuHeight > viewportHeight) {

        top = rect.top - menuHeight - 4;
      }

      setMenuPosition({
        top,
        left,
        width: rect.width,
      });

      setIsPositioned(true);
    } else {
      setIsPositioned(false);
    }
  }, [isOpen, filteredOptions]);

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      if (dropdownRef.current) {
        const rect = dropdownRef.current.getBoundingClientRect();
        setMenuPosition((prev) => ({
          ...prev,
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width,
        }));
      }
    };

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event) {

      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (option) => {
    onChange(option.value);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchTerm('');
    }
  };

  const valueLabel = options.find((opt) => opt.value === value)?.label;

  return (
    <>
      <div className={styles.container} ref={dropdownRef}>
        <button
          type='button'
          onClick={handleToggle}
          className={styles.dropdownButton}
        >
          <span
            className={
              valueLabel ? styles.dropdownText : styles.dropdownPlaceholder
            }
          >
            {valueLabel ?? placeholder}
          </span>
          <svg
            className={`${styles.dropdownIcon} ${
              isOpen ? styles.dropdownIconOpen : ''
            }`}
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <polyline points='6 9 12 15 18 9' />
          </svg>
        </button>
      </div>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className={styles.dropdownMenu}
            style={{
              position: 'fixed',
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
              minWidth: `${menuPosition.width}px`,
              opacity: isPositioned ? 1 : 0,
              zIndex: 9999,
            }}
          >
            <div className={styles.dropdownSearch}>
              <input
                ref={inputRef}
                type='text'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder='Search'
                className={styles.dropdownSearchInput}
              />
            </div>

            <div className={styles.dropdownOptions}>
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <button
                    key={option.id}
                    type='button'
                    onClick={() => handleSelect(option)}
                    className={`${styles.dropdownOption} ${
                      value === option.value
                        ? styles.dropdownOptionSelected
                        : ''
                    }`}
                  >
                    {option.label}
                  </button>
                ))
              ) : (
                <div className={styles.dropdownEmpty}>No results found</div>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
