import React from "react";

const Input = ({
  type = "text",
  value,
  onChange,
  placeholder = "",
  disabled = false,
  error = "",
  icon,
  className = "",
  ...props
}) => {
  return (
    <div className="w-full">
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">
            {icon}
          </div>
        )}

        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full
            ${icon ? "pl-10" : "pl-4"} pr-4 py-3
            rounded-2xl
            border border-[var(--line)]
            bg-white/90
            text-[var(--ink)]
            outline-none
            placeholder-[var(--muted)]
            focus:border-[var(--accent)]
            focus:ring-4 focus:ring-[#1f7a72]/10
            disabled:cursor-not-allowed disabled:opacity-50
            ${error ? "ring-2 ring-red-500" : ""}
            ${className}
          `}
          {...props}
        />
      </div>

      {error ? <p className="mt-1 text-sm text-red-500">{error}</p> : null}
    </div>
  );
};

export default Input;
