/**
 * Policy Detail Screen - Insurance Detail Page
 * Matches design: docs/designs/保险细节页面.png
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'PolicyDetail'>;

// Mock data
const MOCK_POLICY_META = {
  max: '8,000,000 USDC',
  premium: '60 USDC',
  amount: '600 USDC',
  period: { from: '2025-09-16', to: '2026-05-03' },
};

export default function PolicyDetailScreen({ navigation }: Props) {
  const [walletAddress, setWalletAddress] = useState('0x83B6e7E65F223336b7531CCAb6468017a5EB7f77');
  const [insuranceAmount, setInsuranceAmount] = useState('');

  // Validation states
  const isWalletValid = walletAddress.length > 0;
  const isAmountValid = insuranceAmount.length > 0 && parseFloat(insuranceAmount) > 0;

  const handleConfirm = () => {
    if (!isWalletValid || !isAmountValid) {
      return;
    }
    // Navigate to PurchaseSuccess
    navigation.navigate('ContractSign', {policyId: 'POL-20251026-001'});
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0F111A" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../../../assets/cohe-capitl-app-logo.png')}
            style={styles.logoSmall}
            resizeMode="contain"
          />
          <Text style={styles.logoText}>COHE.CAPITL</Text>
        </View>
        <View style={styles.addressBadge}>
          <Text style={styles.addressText}>0xA8...B0Fn</Text>
        </View>
      </View>

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Text style={styles.backText}>← BACK</Text>
      </TouchableOpacity>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Text style={styles.title}>YULILY SHIELD INSURANCE</Text>

        {/* Description */}
        <Text style={styles.description}>
          A Coinbase Custody Cover claim is valid if Coinbase Custody suffers a loss
          of funds of 10% or more are passed on to all users OR if Coinbase Custody
          allows a withdrawal without prior notice and more Members who purchase
          Coinbase Custody Cover are halted continuously for 100 days or more.{' '}
          <Text style={styles.emailLink}>toucustdiy@zemail.io</Text> Minimum cover
          purchase of $10k is required in order to avoid
        </Text>

        {/* Insurance Wallet Address */}
        <View style={styles.formSection}>
          <Text style={styles.label}>Insurance Wallet Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter wallet address"
            placeholderTextColor="#6B7280"
            value={walletAddress}
            onChangeText={setWalletAddress}
          />
        </View>

        {/* Insurance Amount - Valid State */}
        <View style={styles.formSection}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Insurance Amount</Text>
            <Text style={styles.maxText}>Max:{MOCK_POLICY_META.max}</Text>
          </View>
          <View style={styles.amountInputContainer}>
            <TextInput
              style={styles.amountInput}
              placeholder="3000"
              placeholderTextColor="#6B7280"
              value={insuranceAmount}
              onChangeText={setInsuranceAmount}
              keyboardType="numeric"
            />
            <Image
              source={require('../../../assets/token-usdc.png')}
              style={styles.tokenIcon}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Insurance Amount - Error State (shown when invalid) */}
        {!isAmountValid && insuranceAmount.length > 0 && (
          <View style={[styles.formSection, styles.errorSection]}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Insurance Amount</Text>
              <Text style={styles.maxText}>Max:{MOCK_POLICY_META.max}</Text>
            </View>
            <View style={[styles.amountInputContainer, styles.errorBorder]}>
              <TextInput
                style={styles.amountInput}
                placeholder="0"
                placeholderTextColor="#6B7280"
                value={insuranceAmount}
                onChangeText={setInsuranceAmount}
                keyboardType="numeric"
              />
              <Image
                source={require('../../../assets/token-usdc.png')}
                style={styles.tokenIcon}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.errorText}>Please enter a valid number</Text>
          </View>
        )}

        {/* Insurance Period */}
        <View style={styles.formSection}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Insurance Period</Text>
            <Text style={styles.daysText}>Days</Text>
          </View>
          <Text style={styles.periodValue}>90</Text>
        </View>

        {/* Overview Section */}
        <View style={styles.overviewSection}>
          <Text style={styles.sectionTitle}>Overview</Text>

          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>Listing</Text>
            <View style={styles.listingValue}>
              <Image
                source={require('../../../assets/cohe-capitl-app-logo.png')}
                style={styles.listingLogo}
                resizeMode="contain"
              />
              <Text style={styles.overviewValueText}>COHE.CAPITL</Text>
            </View>
          </View>

          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>Insurance Amount</Text>
            <Text style={styles.overviewValueText}>{MOCK_POLICY_META.amount}</Text>
          </View>

          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>Insurance Period</Text>
            <Text style={styles.overviewValueText}>
              {MOCK_POLICY_META.period.from} ~ {MOCK_POLICY_META.period.to}
            </Text>
          </View>

          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>Insurance Cost</Text>
            <Text style={styles.overviewValueText}>{MOCK_POLICY_META.premium}</Text>
          </View>
        </View>

        {/* Terms & Conditions */}
        <View style={styles.termsSection}>
          <Text style={styles.sectionTitle}>Terms & Conditions</Text>

          <Text style={styles.termsIntro}>
            COHE Capitl insurance protects against a loss of funds due to:
          </Text>

          {/* Green checkmarks - covered items */}
          <View style={styles.termItem}>
            <View style={styles.checkmarkGreen}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
            <Text style={styles.termText}>Smart Contract Exploits, Hacks</Text>
          </View>

          <View style={styles.termItem}>
            <View style={styles.checkmarkGreen}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
            <Text style={styles.termText}>Oracle Failure</Text>
          </View>

          <View style={styles.termItem}>
            <View style={styles.checkmarkGreen}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
            <Text style={styles.termText}>Governance Takeovers</Text>
          </View>

          <Text style={styles.termsIntro}>
            COHE Capitl insurance has these exclusions, including but limited to
          </Text>

          {/* Red X marks - exclusions */}
          <View style={styles.termItem}>
            <View style={styles.checkmarkRed}>
              <Text style={styles.checkmarkText}>✕</Text>
            </View>
            <Text style={styles.termText}>
              A Loss Of Value Of Any Asset (i.e., Depeg Event)
            </Text>
          </View>

          <View style={styles.termItem}>
            <View style={styles.checkmarkRed}>
              <Text style={styles.checkmarkText}>✕</Text>
            </View>
            <Text style={styles.termText}>
              Losses Due To Phishing, Private Key Security Breaches, Malware, Etc.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>
            Filing a claim
          </Text>

          <View style={styles.termItem}>
            <View style={styles.bulletPoint} />
            <Text style={styles.termText}>
              You Must Provide Proof Of Loss When Submitting Your Claim
            </Text>
          </View>

          <View style={styles.termItem}>
            <View style={styles.bulletPoint} />
            <Text style={styles.termText}>
              You Must Provide Proof Of Loss When Submitting Your Claim
            </Text>
          </View>
        </View>

        {/* Disclaimer Card */}
        <View style={styles.disclaimerCard}>
          <Text style={styles.disclaimerText}>
            This cover is not a contract of insurance. Cover is provided on a
            discretionary basis with Nexus Mutual members having the final say on which
            claims are paid. Cover is not complete cover, meaning{' '}
            <Text style={styles.disclaimerLink}>here</Text>
          </Text>
        </View>

        {/* Confirm Button */}
        <TouchableOpacity
          style={[
            styles.confirmButton,
            (!isWalletValid || !isAmountValid) && styles.confirmButtonDisabled,
          ]}
          onPress={handleConfirm}
          disabled={!isWalletValid || !isAmountValid}
          activeOpacity={0.9}
        >
          <Text style={styles.confirmButtonText}>Confirm Insurance</Text>
        </TouchableOpacity>

        {/* Bottom spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F111A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoSmall: {
    width: 24,
    height: 24,
  },
  logoText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  addressBadge: {
    backgroundColor: '#FFD54F',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F111A',
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  backText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 16,
  },
  description: {
    fontSize: 13,
    lineHeight: 20,
    color: '#9CA3AF',
    marginBottom: 24,
  },
  emailLink: {
    color: '#FFD54F',
    textDecorationLine: 'underline',
  },
  formSection: {
    marginBottom: 20,
  },
  errorSection: {
    marginTop: -20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  maxText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  daysText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  input: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: '#FFFFFF',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  errorBorder: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    paddingVertical: 8,
  },
  tokenIcon: {
    width: 32,
    height: 32,
    marginLeft: 12,
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    marginTop: 6,
  },
  periodValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  overviewSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 24,
    marginBottom: 16,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  overviewLabel: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  listingValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listingLogo: {
    width: 16,
    height: 16,
    marginRight: 6,
  },
  overviewValueText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  termsSection: {
    marginBottom: 24,
  },
  termsIntro: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 16,
    marginBottom: 12,
  },
  termItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  checkmarkGreen: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkmarkRed: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkmarkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9CA3AF',
    marginRight: 12,
    marginTop: 8,
  },
  termText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: '#E5E7EB',
  },
  disclaimerCard: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  disclaimerText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#9CA3AF',
  },
  disclaimerLink: {
    color: '#60A5FA',
    textDecorationLine: 'underline',
  },
  confirmButton: {
    backgroundColor: '#FFD54F',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#FFD54F',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmButtonDisabled: {
    backgroundColor: '#374151',
    shadowOpacity: 0,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F111A',
  },
});
