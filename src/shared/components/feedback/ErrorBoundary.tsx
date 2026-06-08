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
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#1A2416' }}>
          <Text style={{ fontSize: 36, marginBottom: 16, color: 'rgba(111,148,62,0.5)' }}>✦</Text>
          <Text style={{ color: '#fff', fontSize: 20, fontFamily: 'Cormorant-SemiBold', textAlign: 'center', marginBottom: 8 }}>
            Something went wrong
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, textAlign: 'center', marginBottom: 32 }}>
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
