
interface InstructionsProps {
  isReset: boolean;
  isVerification?: boolean;
}

export const Instructions = ({ isReset, isVerification }: InstructionsProps) => {
  if (isVerification) {
    return (
      <p className="text-sm text-muted-foreground mb-6 text-center">
        Please wait while we verify your email address. This will only take a moment.
      </p>
    );
  }

  if (isReset) {
    return (
      <p className="text-sm text-muted-foreground mb-6 text-center">
        Please enter your new password below. Your password should be at least 8 characters long.
      </p>
    );
  }

  return (
    <p className="text-sm text-muted-foreground mb-6 text-center">
      Enter your member number and we'll send you instructions to reset your password.
      {" "}If you have a temporary email address, you'll need to provide your personal email address.
    </p>
  );
};
