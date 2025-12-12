import { Document, Model, PopulateOptions } from "mongoose";

interface PaginateOptions {
  page?: any;
  pageSize?: any;
  populate?: PopulateOptions | (string | PopulateOptions)[];
  queryOption?: Record<string, unknown> | null;
  sort?: Record<string, 1 | -1>;
  select?: { [key: string]: 1 | 0 } | any;
}

interface PaginateResult<T> {
  items: T[];
  meta: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}

export const paginate = async <T extends Document>(
  model: Model<T>,
  query: Record<string, unknown> = {},
  options: PaginateOptions = {}
): Promise<PaginateResult<T>> => {
  const {
    page = 1,
    pageSize = 10,
    populate = "" as any,
    queryOption = null,
    sort = {},
    select,
  } = options;

  const skip = (page - 1) * pageSize;

  const [totalItems, items] = await Promise.all([
    model.countDocuments(query),
    model
      .find(query, queryOption || undefined)
      .skip(skip)
      .limit(pageSize)
      .populate(populate)
      .sort(sort)
      .select(select),
  ]);

  return {
    items,
    meta: {
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
      currentPage: Number(page),
      pageSize: Number(pageSize),
    },
  };
};
