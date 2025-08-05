interface AlertProps {
  type: "info" | "error" | "warning" | "success";
  children: React.ReactNode;
}

const Alert: React.FC<AlertProps> = ({ type = "info", children }) => {
  const typeClasses = {
    info: "bg-blue-50 text-blue-700 border-blue-200",
    error: "bg-red-50 text-red-700 border-red-200",
    warning: "bg-yellow-50 text-yellow-700 border-yellow-200",
    success: "bg-green-50 text-green-700 border-green-200",
  };

  return <div className={`p-4 mb-4 rounded-md border ${typeClasses[type]}`}>{children}</div>;
};

export default Alert;
