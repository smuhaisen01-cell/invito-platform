let setLoading = null;
export const setLoadingSetter = (setter) => {
  setLoading = setter;
};
export const getLoadingSetter = () => setLoading; 