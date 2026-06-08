import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const ChatScreen: React.FC = () => (
  <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
    <View style={styles.center}>
      <Text style={styles.mark}>✦</Text>
      <Text style={styles.title}>AI Plant Doctor</Text>
      <Text style={styles.body}>
        Coming soon — ask anything about your plants by name.
      </Text>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F1E8',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  mark: {
    fontSize: 40,
    color: 'rgba(111,148,62,0.4)',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Cormorant-SemiBold',
    color: '#111111',
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    fontFamily: 'Nunito-Regular',
    color: '#9E9A94',
    textAlign: 'center',
    lineHeight: 22,
  },
});
