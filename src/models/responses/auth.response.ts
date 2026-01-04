export type AuthResType = {
  access_token?: string;
  refresh_token?: string;

  message?: string;

  user?: {
    _id?: string;
    name?: string;
    email?: string;
    username?: string;
    avatar?: string;
    cover_photo?: string;
    bio?: string;
    location?: string;
    website?: string;
    date_of_birth?: Date;
    created_at?: Date;
    updated_at?: Date;
    verify?: number;
  };

  data?: any;
};

export type LoginResType = {
  access_token: string;
  refresh_token: string;
};

export type RegisterResType = {
  access_token: string;
  refresh_token: string;
};

export type LogoutResType = {
  message: string;
};

export type VerifyEmailResType = {
  access_token: string;
  refresh_token: string;
};

export type ForgotPasswordResType = {
  message: string;
};

export type ResetPasswordResType = {
  message: string;
};
