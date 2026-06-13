import React, { Component, ErrorInfo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { logger } from '../../utils/logger';

interface Props {
  children: React.ReactNode;
  screenName?: string;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  componentStack: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, componentStack: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const componentStack = info.componentStack ?? null;
    this.setState({ componentStack });
    logger.crash.render(error, componentStack ?? undefined);

    if (__DEV__) {
      console.error(
        `[RENDER_ERROR] in ${this.props.screenName ?? 'unknown screen'}:\n` +
        `  Message: ${error.message}\n` +
        `  Stack:   ${error.stack?.split('\n').slice(0, 5).join('\n           ')}\n` +
        `  Tree:    ${componentStack?.split('\n').slice(0, 4).join('\n           ')}`,
      );
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, componentStack: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    const { error, componentStack } = this.state;
    const screen = this.props.screenName ?? 'unknown screen';

    return (
      <View style={styles.container}>
        <Text style={styles.icon}>✦</Text>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.subtitle}>
          {screen !== 'unknown screen' ? `Error in ${screen}` : 'An unexpected error occurred.'}
        </Text>

        {__DEV__ && error && (
          <ScrollView style={styles.debugBox} showsVerticalScrollIndicator={false}>
            <Text style={styles.debugLabel}>[RENDER_ERROR]</Text>
            <Text style={styles.debugMessage}>{error.message}</Text>
            {componentStack ? (
              <>
                <Text style={styles.debugLabel}>Component tree:</Text>
                <Text style={styles.debugStack}>
                  {componentStack.split('\n').slice(0, 8).join('\n')}
                </Text>
              </>
            ) : null}
            {error.stack ? (
              <>
                <Text style={styles.debugLabel}>JS stack:</Text>
                <Text style={styles.debugStack}>
                  {error.stack.split('\n').slice(0, 6).join('\n')}
                </Text>
              </>
            ) : null}
          </ScrollView>
        )}

        <Pressable style={styles.btn} onPress={this.handleRetry}>
          <Text style={styles.btnText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }
}

// Wraps a single screen with its own isolated error boundary so one crash
// doesn't take down the whole navigation tree.
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  screenName: string,
): React.FC<P> {
  return function BoundedScreen(props: P) {
    return (
      <ErrorBoundary screenName={screenName}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A2416',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  icon: {
    fontSize: 36,
    color: 'rgba(111,148,62,0.5)',
    marginBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Jakarta-SemiBold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
  },
  debugBox: {
    width: '100%',
    maxHeight: 220,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 24,
  },
  debugLabel: {
    color: '#6F943E',
    fontSize: 10,
    fontFamily: 'Nunito-Bold',
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 2,
  },
  debugMessage: {
    color: '#FF6B6B',
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    lineHeight: 18,
  },
  debugStack: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontFamily: 'Nunito-Regular',
    lineHeight: 16,
  },
  btn: {
    backgroundColor: '#6F943E',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 14,
  },
  btnText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Nunito-SemiBold',
  },
});
