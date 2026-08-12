const normalizeText = (value) => String(value || '')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim();

export const generateSlug = (value) => normalizeText(value)
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');
