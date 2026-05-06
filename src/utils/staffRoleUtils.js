export const ADMIN_NURSE_POSITION = "Quầy tiếp nhận";

export function isAdministrativeNurseStaff(item, effectiveRole) {
  const role = (effectiveRole || item?.role || item?.vaiTro || "")
    .toString()
    .toLowerCase()
    .trim();

  const rawType = (
    item?.roleType ||
    item?.vai_tro_cong_tac ||
    item?.loaiYTa ||
    item?.loai_y_ta ||
    item?.nurseType ||
    item?.nurse_kind ||
    item?.chucVu ||
    item?.ChucVu ||
    ""
  )
    .toString()
    .toLowerCase()
    .trim();

  return (
    (role === "nurse" || role === "y_ta") &&
    (rawType === "administrative" ||
      rawType === "hanh_chinh" ||
      rawType === "hanhchinh" ||
      rawType === "y_ta_hanh_chinh" ||
      rawType.includes("hành chính"))
  );
}
