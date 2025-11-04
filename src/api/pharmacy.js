// src/api/pharmacy.js
import { useQuery } from "@tanstack/react-query";
import { get } from "./http";

export const getStock = () => get("/pharmacy/stock");

export function useStock() {
  return useQuery({
    queryKey: ["stock"],
    queryFn: getStock,
    staleTime: 60_000,
  });
}
