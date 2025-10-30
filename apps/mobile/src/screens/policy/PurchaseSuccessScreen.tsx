/**
 * Purchase Success Screen - Temporary Placeholder
 * TODO: Implement full design from docs/designs/投保成功界面.png
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'PurchaseSuccess'>;

export default function PurchaseSuccessScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F111A" />

      <View style={styles.content}>
        <Text style={styles.successIcon}>✓</Text>
        <Text style={styles.title}>Purchase Successful!</Text>
        <Text style={styles.subtitle}>
          Your insurance policy has been created
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Products')}
          activeOpacity={0.9}
        >
          <Text style={styles.buttonText}>Back to Products</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F111A',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  successIcon: {
    fontSize: 80,
    color: '#10B981',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 48,
  },
  button: {
    backgroundColor: '#FFD54F',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F111A',
  },
});
