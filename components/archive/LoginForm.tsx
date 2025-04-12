import React from "react";

interface LoginFormProps {
  onLogin: (email: string) => Promise<void>;
  isLoading: boolean;
  email: string;
  onEmailChange: (email: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onLogin,
  isLoading,
  email,
  onEmailChange,
}) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onLogin(email);
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h3>Login with Email</h3>
      <div className="archive-form-group">
        <label className="archive-form-label">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          className="archive-form-input"
          placeholder="your-email@example.com"
          required
        />
      </div>
      <button
        type="submit"
        className="archive-auth-button"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <span className="button-spinner"></span>
            Verifying...
          </>
        ) : (
          "Login"
        )}
      </button>
      <p className="form-note">
        You&apos;ll receive a verification email to confirm your identity
      </p>
    </form>
  );
};
