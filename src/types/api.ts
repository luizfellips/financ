export type FieldIssue = {
  path: string;
  message: string;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: PaginationMeta;
};

export type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: FieldIssue[];
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
