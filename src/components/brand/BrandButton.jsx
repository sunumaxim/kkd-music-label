import React from 'react';

const VARIANTS = {
  primary: 'kkd-btn-primary',
  secondary: 'kkd-btn-secondary',
  outline: 'kkd-btn-outline',
};

export default function BrandButton({
  as = 'button',
  variant = 'primary',
  className = '',
  children,
  ...props
}) {
  const Comp = as;
  return (
    <Comp className={`${VARIANTS[variant] || VARIANTS.primary} ${className}`} {...props}>
      {children}
    </Comp>
  );
}