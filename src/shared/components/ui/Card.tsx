import React from 'react';
import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses = { none: '', sm: 'p-3', md: 'p-4', lg: 'p-6' };

export const Card: React.FC<CardProps> = ({ children, padding = 'md', className = '', ...props }) => (
  <View
    className={`bg-surface rounded-2xl ${paddingClasses[padding]} ${className}`}
    style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}
    {...props}
  >
    {children}
  </View>
);
