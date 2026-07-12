import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function traduzirErroSupabase(mensagem: string): string {
  if (!mensagem) return "Deu um erro desconhecido, tenta de novo.";
  
  const msgLower = mensagem.toLowerCase();
  
  if (msgLower.includes("user already registered")) return "Tchê, esse e-mail já tá cadastrado aqui!";
  if (msgLower.includes("invalid login credentials")) return "E-mail ou senha furados, confere aí!";
  if (msgLower.includes("password should be at least")) return "Essa senha tá muito fraquinha, bota no mínimo 6 letras.";
  if (msgLower.includes("rate limit exceeded")) return "Calma o facho! Tentou demais. Espera um minutinho e tenta de novo.";
  if (msgLower.includes("email link is invalid or has expired")) return "Esse link de e-mail já era, pede outro.";
  if (msgLower.includes("network error") || msgLower.includes("failed to fetch")) return "Sem internet, vivente! Confere tua conexão.";
  
  return `Eita, deu ruim: ${mensagem}`;
}
