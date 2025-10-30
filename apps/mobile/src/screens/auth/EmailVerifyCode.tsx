/**
 * Email Verification - Step 2: Enter Verification Code
 * Matches design: docs/designs/邮箱验证2.png
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'EmailVerifyCode'>;

// Mock data
const MOCK_CODE = '123456';
const COUNTDOWN_SECONDS = 30;

export default function EmailVerifyCode({ route, navigation }: Props) {
  const { email } = route.params;
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [isResending, setIsResending] = useState(false);

  // Validate code format (6 digits)
  const isCodeValid = /^\d{6}$/.test(code);
  const isButtonEnabled = isCodeValid && !isVerifying;

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerifyCode = async () => {
    if (!isCodeValid) {
      Alert.alert('Invalid Code', 'Please enter a 6-digit verification code');
      return;
    }

    try {
      setIsVerifying(true);

      // Mock API call - simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Mock verification
      if (code === MOCK_CODE) {
        Alert.alert(
          'Verification Successful',
          'Your email has been verified!',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate to Products screen
                console.log('ok pressed');
              },
            },
          ]
        );
        navigation.navigate('Products');
      } else {
        Alert.alert(
          'Verification Failed',
          'Invalid verification code. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to verify code');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;

    try {
      setIsResending(true);

      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Reset countdown
      setCountdown(COUNTDOWN_SECONDS);

      Alert.alert(
        'Code Resent',
        `A new verification code has been sent to ${email}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to resend verification code');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F111A" />

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Enter Verification Code</Text>
          <Text style={styles.subtitle}>
            We've sent a 6-digit code to
          </Text>
          <Text style={styles.email}>{email}</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Code Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Verification Code</Text>
            <TextInput
              style={[
                styles.input,
                !isCodeValid && code.length > 0 && styles.inputError,
              ]}
              placeholder="Enter 6-digit code"
              placeholderTextColor="#6B7280"
              value={code}
              onChangeText={(text) => {
                // Only allow digits and max 6 characters
                const filtered = text.replace(/[^0-9]/g, '').slice(0, 6);
                setCode(filtered);
              }}
              keyboardType="number-pad"
              maxLength={6}
              editable={!isVerifying}
            />
            {!isCodeValid && code.length > 0 && (
              <Text style={styles.errorText}>Code must be 6 digits</Text>
            )}
          </View>

          {/* Countdown & Resend */}
          <View style={styles.resendContainer}>
            {countdown > 0 ? (
              <Text style={styles.countdownText}>
                Resend code in {countdown}s
              </Text>
            ) : (
              <TouchableOpacity
                onPress={handleResendCode}
                disabled={isResending}
                activeOpacity={0.7}
              >
                <Text style={styles.resendButton}>
                  {isResending ? 'Sending...' : 'Resend Code'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Mock hint */}
          <View style={styles.hintContainer}>
            <Text style={styles.hintText}>
              Mock: Try "{MOCK_CODE}"
            </Text>
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            style={[
              styles.verifyButton,
              !isButtonEnabled && styles.verifyButtonDisabled,
            ]}
            onPress={handleVerifyCode}
            disabled={!isButtonEnabled}
            activeOpacity={0.8}
          >
            <Text style={styles.verifyButtonText}>
              {isVerifying ? 'Verifying...' : 'Verify'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 24,
  },
  header: {
    marginTop: 48,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#9CA3AF',
    lineHeight: 22,
  },
  email: {
    fontSize: 15,
    color: '#FFD54F',
    fontWeight: '600',
    marginTop: 4,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 20,
    color: '#FFFFFF',
    letterSpacing: 4,
    textAlign: 'center',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    marginTop: 6,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 24,
    minHeight: 24,
  },
  countdownText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  resendButton: {
    fontSize: 14,
    color: '#FFD54F',
    fontWeight: '600',
  },
  hintContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 32,
  },
  hintText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  verifyButton: {
    backgroundColor: '#FFD54F',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD54F',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  verifyButtonDisabled: {
    backgroundColor: '#374151',
    shadowOpacity: 0,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F111A',
  },
});
