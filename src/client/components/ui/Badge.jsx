import React from "react";

const Badge = ({ label, type = "default" }) => {
  const typeClasses = {
    default: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    error: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeClasses[type]}`}
    >
      {label}
    </span>
  );
};

export default Badge;
