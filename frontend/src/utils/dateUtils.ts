/**
 * Utility for formatting dates according to Venezuelan locale (es-VE, dd/MM/yyyy).
 */
export const formatDateVE = (dateVal?: string | Date | number | null, includeTime = true): string => {
  if (!dateVal) return 'N/A';
  
  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    if (!trimmed) return 'N/A';
    
    // If already in dd/MM/yyyy format (e.g. "26/07/2026 15:30:00" or "26/07/2026")
    if (trimmed.includes('/')) {
      if (!includeTime && trimmed.includes(' ')) {
        return trimmed.split(' ')[0];
      }
      return trimmed;
    }
    
    // If ISO or YYYY-MM-DD format (e.g., "2026-07-26T15:30:00" or "2026-07-26")
    if (trimmed.includes('-')) {
      const parts = trimmed.split('T');
      const dParts = parts[0].split('-');
      if (dParts.length === 3) {
        const day = dParts[2];
        const month = dParts[1];
        const year = dParts[0];
        if (includeTime && parts[1]) {
          const time = parts[1].substring(0, 8);
          return `${day}/${month}/${year} ${time}`;
        }
        return `${day}/${month}/${year}`;
      }
    }
  }

  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    
    return d.toLocaleString('es-VE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      ...(includeTime ? { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false } : {})
    });
  } catch {
    return String(dateVal);
  }
};

/**
 * Formats current date for report header emission string
 */
export const formatEmissionDateVE = (): string => {
  return new Date().toLocaleString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

/**
 * Formats date input string into dd/MM/yyyy HH:mm:ss format for backend API criteria,
 * preserving any custom time provided in dateStr.
 */
export const formatDateForCriteria = (dateStr?: string | null, isStart = true): string | null => {
  if (!dateStr || !dateStr.trim()) return null;
  const trimmed = dateStr.trim();
  
  let rawDate = trimmed;
  let rawTime = isStart ? '00:00:00' : '23:59:59';

  if (trimmed.includes('T')) {
    const parts = trimmed.split('T');
    rawDate = parts[0];
    if (parts[1] && parts[1].trim()) rawTime = parts[1].trim();
  } else if (trimmed.includes(' ')) {
    const parts = trimmed.split(' ');
    rawDate = parts[0];
    if (parts[1] && parts[1].trim()) rawTime = parts[1].trim();
  }

  // Ensure rawTime has HH:mm:ss format
  const tParts = rawTime.split(':');
  if (tParts.length === 2) {
    rawTime = `${tParts[0].padStart(2, '0')}:${tParts[1].padStart(2, '0')}:${isStart ? '00' : '59'}`;
  } else if (tParts.length === 3) {
    rawTime = `${tParts[0].padStart(2, '0')}:${tParts[1].padStart(2, '0')}:${tParts[2].substring(0, 2).padStart(2, '0')}`;
  }

  // If YYYY-MM-DD
  if (rawDate.includes('-')) {
    const dParts = rawDate.split('-');
    if (dParts.length === 3) {
      const year = dParts[0];
      const month = dParts[1].padStart(2, '0');
      const day = dParts[2].padStart(2, '0');
      return `${day}/${month}/${year} ${rawTime}`;
    }
  }

  // If DD/MM/YYYY
  if (rawDate.includes('/')) {
    const dParts = rawDate.split('/');
    if (dParts.length === 3) {
      const day = dParts[0].padStart(2, '0');
      const month = dParts[1].padStart(2, '0');
      const year = dParts[2].substring(0, 4);
      return `${day}/${month}/${year} ${rawTime}`;
    }
  }

  return `${rawDate} ${rawTime}`;
};
