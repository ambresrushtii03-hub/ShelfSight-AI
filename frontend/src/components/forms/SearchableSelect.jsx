import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  label,
  disabled = false,
}) {
  const id = useId();
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const optionRefs = useRef([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = options.find((option) => option.value === value);
  const filtered = options.filter((option) => option.label.toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }

    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, []);

  function choose(option) {
    onChange(option.value);
    setQuery('');
    setOpen(false);
  }

  function handleSearchKeyDown(event) {
    if (event.key === 'ArrowDown' && filtered.length) {
      event.preventDefault();
      optionRefs.current[0]?.focus();
    }
    if (event.key === 'Escape') setOpen(false);
  }

  function handleOptionKeyDown(event, index) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      optionRefs.current[(index + 1) % filtered.length]?.focus();
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (index === 0) inputRef.current?.focus();
      else optionRefs.current[index - 1]?.focus();
    }
    if (event.key === 'Escape') {
      setOpen(false);
      rootRef.current?.querySelector('button[role="combobox"]')?.focus();
    }
  }

  return (
    <div className={`searchable-select${open ? ' searchable-select-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="searchable-select-trigger"
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-controls={`searchable-options-${id}`}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => {
          setQuery('');
          setOpen((current) => !current);
        }}
      >
        <span className={selected ? '' : 'searchable-select-placeholder'}>{selected?.label || placeholder}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && <div className="searchable-select-menu" id={`searchable-options-${id}`}>
        <label className="searchable-select-search"><Search size={15} aria-hidden="true" /><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={handleSearchKeyDown} placeholder="Type to search" aria-label={`Search ${label.toLowerCase()}`} /></label>
        <div className="searchable-select-options" role="listbox" aria-label={label}>
          {filtered.map((option, index) => <button
            type="button"
            role="option"
            aria-selected={option.value === value}
            className="searchable-select-option"
            key={option.value}
            ref={(element) => { optionRefs.current[index] = element; }}
            onKeyDown={(event) => handleOptionKeyDown(event, index)}
            onClick={() => choose(option)}
          >{option.label}</button>)}
          {!filtered.length && <p className="searchable-select-empty">No matching options</p>}
        </div>
      </div>}
    </div>
  );
}