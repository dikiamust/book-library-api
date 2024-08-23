const baseBorrowing = {
  id: 1,
  memberId: 1,
  bookId: 1,
  borrowDate: '2024-08-23T07:29:49.729Z',
  createdAt: '2024-08-23T07:29:49.729Z',
  updatedAt: '2024-08-23T07:29:49.729Z',
};

export const createBorrowing = {
  ...baseBorrowing,
  returnDate: null,
};

export const createReturnBorrowing = {
  ...baseBorrowing,
  returnDate: '2024-08-30T07:29:49.729Z',
};
