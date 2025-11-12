import { z } from "zod";

// Register validation schema
export const registerSchema = z.object({
  userName: z.string().min(3, "Kullanıcı adı en az 3 karakter olmalı"),
  fullName: z.string().min(2, "Ad soyad en az 2 karakter olmalı"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Şifreler eşleşmiyor",
  path: ["confirmPassword"],
});

// Login validation schema
export const loginSchema = z.object({
  userName: z.string().min(1, "Kullanıcı adı gerekli"),
  password: z.string().min(1, "Şifre gerekli"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
