import { useState } from 'react';

export default function usePagination({ initialPage = 1, itemsPerPage = 10 } = {}) {
  const [page, setPage] = useState(initialPage);
  const [items, setItems] = useState([]);
  const [hasMore, setHasMore] = useState(true);

  const resetPagination = () => {
    setPage(initialPage);
    setItems([]);
    setHasMore(true);
  };

  const appendItems = (newItems, totalCount = null) => {
    if (!newItems || newItems.length === 0) {
      setHasMore(false);
      return;
    }

    setItems(prev => [...prev, ...newItems]);

    if (totalCount !== null && (page * itemsPerPage >= totalCount)) {
      setHasMore(false);
    } else if (newItems.length < itemsPerPage) {
      setHasMore(false);
    }
  };

  const nextPage = () => setPage(prev => prev + 1);

  return {
    page,
    items,
    setItems,
    hasMore,
    nextPage,
    resetPagination,
    appendItems,
    itemsPerPage,
  };
}
