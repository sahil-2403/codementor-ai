import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

export const listWithPagination = async ({ model, filter = {}, query = {}, populate = [], select = null, lean = true }) => {
  const { page, limit, skip, sort } = parsePagination(query);
  let dbQuery = model.find(filter).sort(sort).skip(skip).limit(limit);
  if (select) dbQuery = dbQuery.select(select);
  for (const pop of populate) dbQuery = dbQuery.populate(pop);
  if (lean) dbQuery = dbQuery.lean();
  const [items, total] = await Promise.all([dbQuery, model.countDocuments(filter)]);
  return { items, pagination: buildPaginationMeta({ page, limit, total }) };
};

export const buildTextSearchFilter = (searchRegex, fields = []) => {
  if (!searchRegex || !fields.length) return {};
  return { $or: fields.map((field) => ({ [field]: searchRegex })) };
};
