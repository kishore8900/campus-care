import React, { forwardRef } from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode; variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; size?: 'small' | 'default' };

const Button = forwardRef<HTMLButtonElement, Props>(function Button({ children, className = "", variant = 'primary', size = 'default', type = 'button', ...rest }, ref) {
  return (
    <button ref={ref} type={type} className={`button button-${variant} button-${size} ${className}`} {...rest}>
      {children}
    </button>
  );
})
export default Button
