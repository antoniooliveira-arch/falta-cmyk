import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizePeriod(periodo: string): string | null {
  const value = periodo.trim().toLowerCase();

  const match = value.match(/^(20\d{2})-(0[1-9]|1[0-2])$/);
  if (match) return `${match[1]}-${match[2]}`;

  const year = value.match(/20\d{2}/)?.[0];
  const months = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  const month = months.findIndex(name => value.includes(name));
  if (!year || month < 0) return null;

  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export function formatDateBR(date: string | Date): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);
  return d.toLocaleDateString("pt-BR");
}

export function maskDate(value: string): string {
  const nums = value.replace(/\D/g, "");
  if (nums.length <= 2) return nums;
  if (nums.length <= 4) return `${nums.slice(0, 2)}/${nums.slice(2)}`;
  return `${nums.slice(0, 2)}/${nums.slice(2, 4)}/${nums.slice(4, 8)}`;
}
