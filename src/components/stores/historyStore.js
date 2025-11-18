import { create } from 'zustand';


const defaultRange = () => {
const end = new Date();
const start = new Date();
start.setDate(end.getDate() - 7);
return { start, end };
};


const useHistoryStore = create((set) => ({
range: defaultRange(),
filters: { keyword: '', doctorId: null, deptId: null, status: 'all' },
pagination: { pageIndex: 0, pageSize: 20 },
selected: null,


setRange: (range) => set({ range }),
setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch }, pagination: { ...s.pagination, pageIndex: 0 } })),
setPagination: (pagination) => set({ pagination }),
setSelected: (selected) => set({ selected }),
}));


export default useHistoryStore;