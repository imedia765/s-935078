export interface FailedLoginResponse {
  locked: boolean;
  attempts: number;
  max_attempts: number;
  lockout_duration: string;
}

export interface LoginState {
  memberNumber: string;
  password: string;
  loading: boolean;
  error: string | null;
}