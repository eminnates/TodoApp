import { apiClient } from "@/lib/api-client";
import { LoginInput, RegisterInput } from "@/lib/validations/auth";

export interface AuthResponse {
  accessToken: string;
  expiresAt: string;
}

export interface UserResponse {
  id: string;
  userName: string;
  fullName: string;
}

export const authApi = {
  register: async (data: RegisterInput): Promise<UserResponse> => {
    const response = await apiClient.post("/api/auth/register", data);
    return response.data;
  },

  login: async (data: LoginInput): Promise<AuthResponse> => {
    const response = await apiClient.post("/api/auth/login", data);
    return response.data;
  },
};
