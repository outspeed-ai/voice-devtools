import React from "react";

const Card = ({ title, children, className = "" }) => (
  <div
    className={`bg-white shadow rounded-lg overflow-hidden mb-6 ${className}`}
  >
    {title && (
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      </div>
    )}
    <div className="px-6 py-4">{children}</div>
  </div>
);

export default Card;
