import React, { Component, ErrorInfo } from 'react';
import { View, Text } from 'react-native';
import { Button } from '../ui/Button';

interface Props { children: React.ReactNode }
interface State { hasError: boolean; error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center p-8 bg-background">
          <Text style={{ fontSize: 48 }} className="mb-4">🌿</Text>
          <Text className="text-text-primary text-xl font-nunito-bold text-center mb-2">
            Something went wrong
          </Text>
          <Text className="text-text-secondary text-sm text-center mb-8">
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </Text>
          <Button
            label="Try Again"
            onPress={() => this.setState({ hasError: false, error: null })}
            fullWidth
          />
        </View>
      );
    }
    return this.props.children;
  }
}
