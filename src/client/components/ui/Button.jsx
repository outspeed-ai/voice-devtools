import { twMerge } from "tailwind-merge";

const Button = ({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  icon,
  className = "",
}) => {
  const baseClasses =
    " flex items-center gap-1 p-4 py-2 rounded-md font-medium transition-colors hover:opacity-90 transition-opacity";
  const variantClasses = {
    primary: "bg-gray-800 text-white",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50",
  };

  return (
    <button
      className={twMerge(
        baseClasses,
        variantClasses[variant],
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
};

export default Button;
