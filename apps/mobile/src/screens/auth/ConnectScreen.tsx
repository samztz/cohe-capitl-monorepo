/**
 * Connect Screen - Welcome Page
 * Matches design: docs/designs/欢迎页面.png
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Connect'>;

const { width } = Dimensions.get('window');

export default function ConnectScreen({ navigation }: Props) {
  const handleContactUs = () => {
    // TODO: Implement contact us functionality
    console.log('Contact us pressed');
  };

  const handleConnectWallet = () => {
    // TODO: Implement wallet connection
    // For now, navigate to Products for testing
    navigation.navigate('Products');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F111A" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoTitleContainer}>
          <Image
            source={require('../../../assets/cohe-capitl-app-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.titleText}>COHE.CAPITL</Text>
        </View>
        <TouchableOpacity
          style={styles.contactButton}
          onPress={handleContactUs}
          activeOpacity={0.8}
        >
          <Text style={styles.contactButtonText}>Contact us</Text>
        </TouchableOpacity>
      </View>

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.shieldContainer}>
          <Image
            source={require('../../../assets/welcome-logo.png')}
            style={styles.shieldImage}
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            THE <Text style={styles.titleHighlight}>FIRST</Text> CRYPTO
          </Text>
          <Text style={styles.title}>INSURANCE</Text>
          <Text style={styles.title}>ALTERNATIVE</Text>
        </View>

        {/* Subtitle */}
        <Text style={styles.subtitle}>COVERING CRYPTO SINCE 2025</Text>
      </View>

      {/* Connect Button */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.connectButton}
          onPress={handleConnectWallet}
          activeOpacity={0.9}
        >
          <Text style={styles.connectButtonText}>Connect Wallet</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  logoTitleContainer: {
    width: 'auto',
    display: 'flex',
    justifyContent: 'flex-start',
    flexDirection: 'row',
    borderRadius: 4,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderColor: 'white',
    paddingTop: 50, // 考虑状态栏高度
    paddingBottom: 10,
  },
  titleText:{
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  logo: {
    width: 32,
    height: 32,
  },
  contactButton: {
    backgroundColor: '#FFD54F',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
  },
  contactButtonText: {
    color: '#0F111A',
    fontSize: 13,
    fontWeight: '600',
  },
  heroSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  shieldContainer: {
    marginBottom: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldImage: {
    width: width * 0.65,
    height: width * 0.65,
    maxWidth: 280,
    maxHeight: 280,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 36,
  },
  titleHighlight: {
    color: '#FFD54F',
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 2,
    textAlign: 'center',
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: 48,
    alignItems: 'center',
  },
  connectButton: {
    backgroundColor: '#FFD54F',
    width: '70%',
    minWidth: 200,
    maxWidth: 280,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
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
  connectButtonText: {
    color: '#0F111A',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
