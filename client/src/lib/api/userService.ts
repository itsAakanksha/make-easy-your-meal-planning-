import apiClient from "./apiClient";
import {
  User,
  UserPreferences,
  UserLoginRequest,
  UserRegisterRequest,
  UserResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest
} from "./types";

class UserService {
  /**
   * Register a new user
   */
  async register(data: UserRegisterRequest): Promise<UserResponse> {
    return apiClient.post<UserResponse>("/users/register", data);
  }
  
  /**
   * Login user
   */
  async login(data: UserLoginRequest): Promise<UserResponse> {
    return apiClient.post<UserResponse>("/users/login", data);
  }
  
  /**
   * Logout user
   */
  async logout(): Promise<void> {
    return apiClient.post<void>("/users/logout");
  }
  
  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>("/users/me");
  }
  
  /**
   * Update user profile
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    return apiClient.patch<User>("/users/profile", data);
  }
  
  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    return apiClient.post<void>("/users/change-password", {
      currentPassword,
      newPassword
    });
  }
  
  /**
   * Forgot password request
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    return apiClient.post<void>("/users/forgot-password", data);
  }
  
  /**
   * Reset password with token
   */
  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    return apiClient.post<void>("/users/reset-password", data);
  }
  
  /**
   * Verify email
   */
  async verifyEmail(token: string): Promise<void> {
    return apiClient.post<void>(`/users/verify-email/${token}`);
  }
  
  /**
   * Resend verification email
   */
  async resendVerificationEmail(): Promise<void> {
    return apiClient.post<void>("/users/resend-verification");
  }
  
  /**
   * Get user preferences
   */
  async getUserPreferences(): Promise<UserPreferences> {
    return apiClient.get<UserPreferences>("/users/preferences");
  }
  
  /**
   * Update user preferences
   */
  async updateUserPreferences(data: Partial<UserPreferences>): Promise<UserPreferences> {
    return apiClient.patch<UserPreferences>("/users/preferences", data);
  }
  
  /**
   * Delete user account
   */
  async deleteAccount(password: string): Promise<void> {
    return apiClient.delete<void>("/users/account", {
      data: { password }
    });
  }
  
  /**
   * Get user activity
   */
  async getUserActivity(): Promise<any> {
    return apiClient.get<any>("/users/activity");
  }
  
  /**
   * Link social account
   */
  async linkSocialAccount(provider: string, token: string): Promise<void> {
    return apiClient.post<void>(`/users/social/${provider}/link`, { token });
  }
  
  /**
   * Unlink social account
   */
  async unlinkSocialAccount(provider: string): Promise<void> {
    return apiClient.delete<void>(`/users/social/${provider}/unlink`);
  }
}

export const userService = new UserService();
export default userService;