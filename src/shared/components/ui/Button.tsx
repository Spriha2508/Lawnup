import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps } from 'react-native';
import { colors } from '../../../constants/colors';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-primary',
  secondary: 'bg-primaryLight',
  outline: 'bg-transparent border-2 border-primary',
  ghost: 'bg-transparent',
  danger: 'bg-error',
};

const textClasses: Record<Variant, string> = {
  primary: 'text-white',
  secondary: 'text-white',
  outline: 'text-primary',
  ghost: 'text-primary',
  danger: 'text-white',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-4 py-2 rounded-lg',
  md: 'px-6 py-3.5 rounded-xl',
  lg: 'px-8 py-4 rounded-2xl',
};

const textSizeClasses: Record<Size, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export const Button: React.FC<ButtonProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  ...props
}) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      className={[
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
        isDisabled ? 'opacity-50' : '',
        'items-center justify-center flex-row',
      ].join(' ')}
      disabled={isDisabled}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : '#fff'}
        />
      ) : (
        <Text
          className={[textClasses[variant], textSizeClasses[size], 'font-nunito-bold'].join(' ')}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};
