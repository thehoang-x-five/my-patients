// src/api/historyMock.js
// Mock data + mock API riêng cho History

// Lượt khám (khám bệnh) mẫu
const visitsMock = [
  {
    visitCode: "LSK20241117001",
    date: "2024-11-17T09:00:00",
    id: "BN000001",
    name: "Nguyễn Văn A",
    dept: "Khám nội tổng quát",
    deptCode: "NOI_TQ",
    type: "clinic", // clinic | service
    doctor: "BS. Trần Thị B",
    note: "Đau đầu, mệt mỏi, sốt nhẹ.",
    diagnosis: {
      main: "Cảm cúm",
      sub: "Theo dõi viêm đường hô hấp trên",
      plan: "Nghỉ ngơi, uống nhiều nước, dùng thuốc theo toa.",
      advice:
        "Tăng cường dinh dưỡng, theo dõi nhiệt độ, tái khám nếu không giảm sau 3 ngày.",
    },
    examRows: [
      { label: "Khám toàn thân", value: "Mệt, sốt 38.2°C" },
      { label: "Khám hô hấp", value: "Ho khan, không ran phổi rõ" },
    ],
    services: [
      {
        code: "XN_MAU_CO_BAN",
        name: "Xét nghiệm máu cơ bản",
        price: 150000,
      },
    ],
    fees: {
      examFee: 100000,
      serviceFee: 150000,
      drugsFee: 150000,
    },
    prescriptionId: "RX20241117001",
  }, {
    visitCode: "LSK20241117001",
    date: "2024-11-17T09:00:00",
    id: "BN000001",
    name: "Nguyễn Văn A",
    dept: "Khám nội tổng quát",
    deptCode: "NOI_TQ",
    type: "clinic", // clinic | service
    doctor: "BS. Trần Thị B",
    note: "Đau đầu, mệt mỏi, sốt nhẹ.",
    diagnosis: {
      main: "Cảm cúm",
      sub: "Theo dõi viêm đường hô hấp trên",
      plan: "Nghỉ ngơi, uống nhiều nước, dùng thuốc theo toa.",
      advice:
        "Tăng cường dinh dưỡng, theo dõi nhiệt độ, tái khám nếu không giảm sau 3 ngày.",
    },
    examRows: [
      { label: "Khám toàn thân", value: "Mệt, sốt 38.2°C" },
      { label: "Khám hô hấp", value: "Ho khan, không ran phổi rõ" },
    ],
    services: [
      {
        code: "XN_MAU_CO_BAN",
        name: "Xét nghiệm máu cơ bản",
        price: 150000,
      },
    ],
    fees: {
      examFee: 100000,
      serviceFee: 150000,
      drugsFee: 150000,
    },
    prescriptionId: "RX20241117001",
  }, {
    visitCode: "LSK20241117001",
    date: "2024-11-17T09:00:00",
    id: "BN000001",
    name: "Nguyễn Văn A",
    dept: "Khám nội tổng quát",
    deptCode: "NOI_TQ",
    type: "clinic", // clinic | service
    doctor: "BS. Trần Thị B",
    note: "Đau đầu, mệt mỏi, sốt nhẹ.",
    diagnosis: {
      main: "Cảm cúm",
      sub: "Theo dõi viêm đường hô hấp trên",
      plan: "Nghỉ ngơi, uống nhiều nước, dùng thuốc theo toa.",
      advice:
        "Tăng cường dinh dưỡng, theo dõi nhiệt độ, tái khám nếu không giảm sau 3 ngày.",
    },
    examRows: [
      { label: "Khám toàn thân", value: "Mệt, sốt 38.2°C" },
      { label: "Khám hô hấp", value: "Ho khan, không ran phổi rõ" },
    ],
    services: [
      {
        code: "XN_MAU_CO_BAN",
        name: "Xét nghiệm máu cơ bản",
        price: 150000,
      },
    ],
    fees: {
      examFee: 100000,
      serviceFee: 150000,
      drugsFee: 150000,
    },
    prescriptionId: "RX20241117001",
  }, {
    visitCode: "LSK20241117001",
    date: "2024-11-17T09:00:00",
    id: "BN000001",
    name: "Nguyễn Văn A",
    dept: "Khám nội tổng quát",
    deptCode: "NOI_TQ",
    type: "clinic", // clinic | service
    doctor: "BS. Trần Thị B",
    note: "Đau đầu, mệt mỏi, sốt nhẹ.",
    diagnosis: {
      main: "Cảm cúm",
      sub: "Theo dõi viêm đường hô hấp trên",
      plan: "Nghỉ ngơi, uống nhiều nước, dùng thuốc theo toa.",
      advice:
        "Tăng cường dinh dưỡng, theo dõi nhiệt độ, tái khám nếu không giảm sau 3 ngày.",
    },
    examRows: [
      { label: "Khám toàn thân", value: "Mệt, sốt 38.2°C" },
      { label: "Khám hô hấp", value: "Ho khan, không ran phổi rõ" },
    ],
    services: [
      {
        code: "XN_MAU_CO_BAN",
        name: "Xét nghiệm máu cơ bản",
        price: 150000,
      },
    ],
    fees: {
      examFee: 100000,
      serviceFee: 150000,
      drugsFee: 150000,
    },
    prescriptionId: "RX20241117001",
  },
  {
    visitCode: "LSK20241117002",
    date: "2024-11-17T10:30:00",
    id: "BN000002",
    name: "Trần Thị C",
    dept: "Khám dịch vụ",
    deptCode: "DV_TONG_QUAT",
    type: "service",
    doctor: "BS. Nguyễn Văn D",
    note: "Khám sức khỏe tổng quát dịch vụ.",
    diagnosis: {
      main: "Khám sức khỏe định kỳ",
      sub: "",
      plan: "Làm các CLS theo gói dịch vụ, tư vấn sau khi có kết quả.",
      advice: "Giữ chế độ sinh hoạt lành mạnh.",
    },
    examRows: [],
    services: [
      {
        code: "DV_GOI_TQ",
        name: "Gói khám tổng quát dịch vụ",
        price: 1200000,
      },
    ],
    fees: {
      examFee: 0,
      serviceFee: 1200000,
      drugsFee: 0,
    },
    prescriptionId: null,
  },
];
  
  // Giao dịch (hoa_don_thanh_toan) mẫu
  const transactionsMock = [
    {
      invoiceId: "HD20241117001",
      date: "2024-11-17T09:20:00",
      id: "BN000001",
      name: "Nguyễn Văn A",
      amount: 250000,
      money: 250000,
      content: "Thu tiền khám lâm sàng lần khám sáng 17/11.",
      kind: "kham_lam_sang",
      status: "da_thu",
      method: "tien_mat",
      staffId: "NS001",
      staffName: "Thu ngân 1",
      examId: "PKLS20241117001",
      clsId: null,
      rxId: null,
    },
    {
      invoiceId: "HD20241117002",
      date: "2024-11-17T09:40:00",
      id: "BN000001",
      name: "Nguyễn Văn A",
      amount: 150000,
      money: 150000,
      content: "Thu tiền cận lâm sàng - Xét nghiệm máu cơ bản.",
      kind: "can_lam_sang",
      status: "da_thu",
      method: "tien_mat",
      staffId: "NS001",
      staffName: "Thu ngân 1",
      examId: null,
      clsId: "PKCLS20241117001",
      rxId: null,
    },
    {
      invoiceId: "HD20241117003",
      date: "2024-11-17T09:50:00",
      id: "BN000001",
      name: "Nguyễn Văn A",
      amount: 150000,
      money: 150000,
      content: "Thu tiền đơn thuốc RX20241117001.",
      kind: "thuoc",
      status: "da_thu",
      method: "tien_mat",
      staffId: "NS002",
      staffName: "Thu ngân 2",
      examId: null,
      clsId: null,
      rxId: "RX20241117001",
    },
    {
      invoiceId: "HD20241117004",
      date: "2024-11-17T11:15:00",
      id: "BN000003",
      name: "Lê Văn D",
      amount: 300000,
      money: 300000,
      content: "Thu tiền khám.",
      kind: "kham_lam_sang",
      status: "da_thu",
      method: "tien_mat",
      staffId: "NS003",
      staffName: "Thu ngân 3",
      examId: "PKLS20241117002",
      clsId: "PKCLS20241117002",
      rxId: null,
    },
  ];
  
  export const mockHistoryApi = {
    async listVisits() {
      return visitsMock;
    },
    async listTransactions() {
      return transactionsMock;
    },
  };
  