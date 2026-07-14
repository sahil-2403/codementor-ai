import slugify from 'slugify';

export const generateSlug = (value) =>
  slugify(value, { lower: true, strict: true, trim: true });
