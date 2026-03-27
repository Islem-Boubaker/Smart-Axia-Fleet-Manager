export const getPagination = (query) => {
  const page = Math.max(parseInt(query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || "10", 10), 1), 100);
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

export const getPagingData = (count, rows, page, limit) => {
  return {
    data: rows,
    meta: {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      pageSize: limit,
    },
  };
};