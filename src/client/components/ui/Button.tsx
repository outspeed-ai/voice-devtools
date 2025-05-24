import { twMerge } from "tailwind-merge";

interface ButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "outline";
  disabled?: boolean;
  icon?: React.ReactNode;

  /**
   * Only applied when an icon is present
   */
  iconClassName?: string;

  title?: string;

  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  icon,
  title,
  iconClassName = "",
  className = "",
}) => {
  const baseClasses =
    " flex items-center justify-center gap-1 p-4 py-2 rounded-md font-medium transition-colors hover:opacity-90 transition-opacity disabled:opacity-50";
  const variantClasses = {
    primary: "bg-gray-800 text-white",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50",
  };

  if (!children && !icon) {
    throw new Error("Button must have either children or an icon");
  }

  return (
    <button
      className={twMerge(baseClasses, variantClasses[variant], disabled && "opacity-50 cursor-not-allowed", className)}
      onClick={onClick}
      title={title}
      disabled={disabled}
    >
      {icon && <span className={twMerge(children ? "mr-2" : "", iconClassName)}>{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
