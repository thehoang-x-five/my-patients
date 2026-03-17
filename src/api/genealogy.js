// src/api/genealogy.js
// API layer for Genealogy (Pha hệ) feature 

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { http } from "./http.js";

// ===== API Functions =====

/** Lấy cây pha hệ đa đời */
export async function getGenealogyTree(maBenhNhan) {
  const res = await http.get(`/patients/${maBenhNhan}/genealogy`);
  return res.data;
}

/** Liên kết cha/mẹ */
export async function linkParents(maBenhNhan, { MaCha, MaMe }) {
  const res = await http.post(`/patients/${maBenhNhan}/link-parents`, {
    MaCha,
    MaMe,
  });
  return res.data;
}

/** Lấy tiền sử bệnh gia đình */
export async function getFamilyDiseases(maBenhNhan) {
  const res = await http.get(`/patients/${maBenhNhan}/family-diseases`);
  return res.data;
}

// ===== React Query Hooks =====

export function useGenealogyTree(maBenhNhan, options = {}) {
  return useQuery({
    queryKey: ["genealogy-tree", maBenhNhan],
    queryFn: () => getGenealogyTree(maBenhNhan),
    enabled: !!maBenhNhan,
    staleTime: 60_000,
    ...options,
  });
}

export function useFamilyDiseases(maBenhNhan, options = {}) {
  return useQuery({
    queryKey: ["family-diseases", maBenhNhan],
    queryFn: () => getFamilyDiseases(maBenhNhan),
    enabled: !!maBenhNhan,
    staleTime: 60_000,
    ...options,
  });
}

export function useLinkParents() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ maBenhNhan, MaCha, MaMe }) =>
      linkParents(maBenhNhan, { MaCha, MaMe }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries(["genealogy-tree", variables.maBenhNhan]);
      qc.invalidateQueries(["family-diseases", variables.maBenhNhan]);
    },
  });
}
