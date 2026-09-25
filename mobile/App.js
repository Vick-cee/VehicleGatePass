import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import api, { loginOfficer, verifyScan, getAssignedGate, getShiftLogs, logoutOfficer } from './src/services/api';

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [user, setUser] = useState(null);
  const [officerProfile, setOfficerProfile] = useState(null);
  const [assignedGate, setAssignedGate] = useState(null);
  const [loading, setLoading] = useState(true);

  // Officer Scanner State
  const [direction, setDirection] = useState('ENTRY'); // 'ENTRY' | 'EXIT'
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'manual' | 'history'
  const [scanned, setScanned] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [manualToken, setManualToken] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [shiftLogs, setShiftLogs] = useState([]);

  // Auth Inputs
  const [email, setEmail] = useState('officer1@university.edu');
  const [password, setPassword] = useState('Password123!');
  const [serverUrl, setServerUrl] = useState(api.defaults.baseURL);
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('@officer_token');
      const storedUser = await AsyncStorage.getItem('@officer_user');
      const storedProfile = await AsyncStorage.getItem('@officer_profile');

      if (storedToken && storedUser) {
        setUser(JSON.parse(storedUser));
        if (storedProfile) setOfficerProfile(JSON.parse(storedProfile));
        loadGateData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadGateData = async () => {
    try {
      const data = await getAssignedGate();
      if (data.assignedGate) setAssignedGate(data.assignedGate);
    } catch (e) {
      console.log('Could not load gate assignment:', e.message);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      api.defaults.baseURL = serverUrl;
      const data = await loginOfficer(email.trim(), password);
      setUser(data.user);
      setOfficerProfile(data.officerProfile || null);
      loadGateData();
    } catch (err) {
      Alert.alert('Login Failed', err.response?.data?.message || err.message || 'Check server URL and credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutOfficer();
    setUser(null);
    setOfficerProfile(null);
    setAssignedGate(null);
    setScanResult(null);
  };

  const handleBarcodeScanned = async ({ data }) => {
    if (scanned || verifying || scanResult) return;
    setScanned(true);
    handleVerifyToken(data);
  };

  const handleVerifyToken = async (token) => {
    if (!token || !token.trim()) return;
    setVerifying(true);
    try {
      const result = await verifyScan({
        qrToken: token.trim(),
        direction,
        gateId: assignedGate?._id || undefined,
      });
      setScanResult(result);
    } catch (err) {
      setScanResult({
        isValid: false,
        verificationStatus: 'INVALID',
        movementAction: direction === 'ENTRY' ? 'CHECKED_IN' : 'CHECKED_OUT',
        failureReason: err.response?.data?.message || err.message || 'Verification failed',
        direction,
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleResetScanner = () => {
    setScanResult(null);
    setManualToken('');
    setTimeout(() => {
      setScanned(false);
    }, 1500);
  };

  const loadHistory = async () => {
    try {
      const data = await getShiftLogs();
      setShiftLogs(data.logs || []);
    } catch (e) {
      console.log('Error loading shift logs:', e.message);
    }
  };

  // ----------------------------------------------------
  // RENDER: Loading
  // ----------------------------------------------------
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#006633" />
        <Text style={styles.loadingText}>Initializing KASU Gate Scanner...</Text>
      </View>
    );
  }

  // ----------------------------------------------------
  // RENDER: Login Screen
  // ----------------------------------------------------
  if (!user) {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0b0f19" />
        <ScrollView contentContainerStyle={styles.loginScroll}>
          <View style={styles.brandHeader}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>KASU</Text>
            </View>
            <Text style={styles.title}>KASU Gate Security</Text>
            <Text style={styles.subtitle}>Mobile QR Verification & Perimeter Scanner</Text>
          </View>

          <View style={styles.loginCard}>
            <Text style={styles.cardHeader}>Gate Officer Authentication</Text>

            <Text style={styles.label}>Officer Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="officer1@university.edu"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor="#64748b"
            />

            <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
              <Text style={styles.primaryButtonText}>Sign In to Terminal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.configToggle}
              onPress={() => setShowConfig(!showConfig)}
            >
              <Text style={styles.configToggleText}>
                {showConfig ? 'Hide Server IP Configuration' : 'Configure Backend Server IP'}
              </Text>
            </TouchableOpacity>

            {showConfig && (
              <View style={styles.configBox}>
                <Text style={styles.configLabel}>REST API Base URL:</Text>
                <TextInput
                  style={styles.configInput}
                  value={serverUrl}
                  onChangeText={setServerUrl}
                  placeholder="http://192.168.1.X:5000/api"
                  placeholderTextColor="#64748b"
                  autoCapitalize="none"
                />
                <Text style={styles.configHelp}>
                  For Physical Phone via Expo Go: http://[YOUR_LOCAL_WIFI_IP]:5000/api
                </Text>
              </View>
            )}
          </View>

          {/* Quick Persona Demo Buttons */}
          <View style={styles.quickBox}>
            <Text style={styles.quickTitle}>Quick Demo Officers:</Text>
            <TouchableOpacity
              style={styles.quickBtn}
              onPress={() => {
                setEmail('officer1@university.edu');
                setPassword('Password123!');
              }}
            >
              <Text style={styles.quickBtnText}>Officer Marcus (KASU Main Entry Gate)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickBtn}
              onPress={() => {
                setEmail('officer2@university.edu');
                setPassword('Password123!');
              }}
            >
              <Text style={styles.quickBtnText}>Officer Sarah (KASU Main Exit Gate)</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ----------------------------------------------------
  // RENDER: Main Scanner Interface
  // ----------------------------------------------------
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0b0f19" />

      {/* Top Gate Banner */}
      <View style={styles.topBanner}>
        <View>
          <View style={styles.statusRow}>
            <View style={styles.pulseDot} />
            <Text style={styles.gateCode}>{assignedGate?.code || 'GATE-ENTRY'}</Text>
            <Text style={styles.onDutyTag}>ON DUTY</Text>
          </View>
          <Text style={styles.gateName}>{assignedGate?.name || (direction === 'ENTRY' ? 'KASU Main Entry Gate' : 'KASU Main Exit Gate')}</Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Two Gates / Direction Selection */}
      <View style={styles.directionBar}>
        <TouchableOpacity
          style={[styles.dirBtn, direction === 'ENTRY' && styles.dirBtnActiveEntry]}
          onPress={() => setDirection('ENTRY')}
        >
          <Text style={[styles.dirText, direction === 'ENTRY' && styles.dirTextActive]}>
            ⬇ ENTRY GATE (CHECK IN)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.dirBtn, direction === 'EXIT' && styles.dirBtnActiveExit]}
          onPress={() => setDirection('EXIT')}
        >
          <Text style={[styles.dirText, direction === 'EXIT' && styles.dirTextActive]}>
            ⬆ EXIT GATE (CHECK OUT)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Controls */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'camera' && styles.tabBtnActive]}
          onPress={() => setActiveTab('camera')}
        >
          <Text style={[styles.tabText, activeTab === 'camera' && styles.tabTextActive]}>
            📷 Camera Scanner
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'manual' && styles.tabBtnActive]}
          onPress={() => setActiveTab('manual')}
        >
          <Text style={[styles.tabText, activeTab === 'manual' && styles.tabTextActive]}>
            ⌨ Manual Input
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'history' && styles.tabBtnActive]}
          onPress={() => {
            setActiveTab('history');
            loadHistory();
          }}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            📋 Shift Logs
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main View Area */}
      {activeTab === 'camera' && (
        <View style={styles.scannerWrapper}>
          {!permission?.granted ? (
            <View style={styles.permissionBox}>
              <Text style={styles.permText}>Camera permission required for QR barcode scanning in Expo Go.</Text>
              <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
                <Text style={styles.primaryButtonText}>Grant Camera Permission</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.cameraContainer}>
              <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: ['qr'],
                }}
                onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
              />
              {/* Viewfinder Target */}
              <View style={styles.viewfinderTarget}>
                <View style={styles.cornerTL} />
                <View style={styles.cornerTR} />
                <View style={styles.cornerBL} />
                <View style={styles.cornerBR} />
                <Text style={styles.targetLabel}>
                  ALIGN KASU PASS QR &bull; {direction === 'ENTRY' ? 'CHECK IN' : 'CHECK OUT'}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {activeTab === 'manual' && (
        <View style={styles.manualContainer}>
          <Text style={styles.manualTitle}>Manual Token Verification</Text>
          <TextInput
            style={styles.manualInput}
            value={manualToken}
            onChangeText={setManualToken}
            placeholder="Enter pass token (e.g. UGP-STUDENT-VALID)"
            placeholderTextColor="#64748b"
            autoCapitalize="characters"
          />
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => handleVerifyToken(manualToken)}
            disabled={verifying || !manualToken.trim()}
          >
            <Text style={styles.primaryButtonText}>
              {verifying ? 'Verifying...' : `Verify & ${direction === 'ENTRY' ? 'Check In' : 'Check Out'}`}
            </Text>
          </TouchableOpacity>

          <Text style={styles.testHeader}>Quick Test Passes:</Text>
          <TouchableOpacity
            style={styles.testButton}
            onPress={() => handleVerifyToken('UGP-STUDENT-VALID')}
          >
            <Text style={styles.testBtnText}>✓ Student Valid Pass (UNI-789-ST)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.testButton}
            onPress={() => handleVerifyToken('UGP-STAFF-VALID')}
          >
            <Text style={styles.testBtnText}>✓ Staff Valid Pass (FAC-404-OK)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.testButton}
            onPress={() => handleVerifyToken('UGP-SUSPENDED-TEST')}
          >
            <Text style={styles.testBtnText}>⚠️ Suspended Pass (SUS-555-ZZ)</Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'history' && (
        <ScrollView style={styles.historyContainer}>
          <Text style={styles.historyTitle}>Current Shift Clearance Logs</Text>
          {shiftLogs.length === 0 ? (
            <Text style={styles.emptyText}>No scans recorded on current shift.</Text>
          ) : (
            shiftLogs.map((log) => (
              <View key={log._id} style={styles.logCard}>
                <View style={styles.logLeft}>
                  <Text style={styles.logPlate}>{log.licensePlate}</Text>
                  <Text style={styles.logOwner}>{log.ownerName} ({log.ownerRole})</Text>
                </View>
                <View style={styles.logRight}>
                  <Text style={styles.logDir}>{log.direction === 'ENTRY' ? 'CHECKED IN' : 'CHECKED OUT'}</Text>
                  <Text
                    style={[
                      styles.logStatus,
                      log.verificationStatus === 'VALID' ? styles.statusValid : styles.statusInvalid,
                    ]}
                  >
                    {log.verificationStatus}
                  </Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Verification Result Modal */}
      <Modal visible={!!scanResult} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.resultCard}>
            {/* Status Header */}
            <View
              style={[
                styles.resultHeader,
                scanResult?.isValid
                  ? scanResult?.direction === 'ENTRY'
                    ? styles.headerCheckIn
                    : styles.headerCheckOut
                  : styles.headerInvalid,
              ]}
            >
              <Text style={styles.resultStatusText}>
                {scanResult?.isValid
                  ? scanResult?.direction === 'ENTRY'
                    ? 'CHECKED IN'
                    : 'CHECKED OUT'
                  : 'ACCESS DENIED'}
              </Text>
              <Text style={styles.resultSubStatus}>
                {scanResult?.isValid
                  ? scanResult?.direction === 'ENTRY'
                    ? 'ENTRY GRANTED & LOGGED ON CAMPUS'
                    : 'EXIT CLEARED & LOGGED OFF CAMPUS'
                  : scanResult?.verificationStatus}
                {' '}&bull; {scanResult?.gate?.name || (direction === 'ENTRY' ? 'KASU Main Entry Gate' : 'KASU Main Exit Gate')}
              </Text>
            </View>

            {/* Error reason */}
            {!scanResult?.isValid && scanResult?.failureReason ? (
              <View style={styles.failureBox}>
                <Text style={styles.failureLabel}>REJECTION REASON:</Text>
                <Text style={styles.failureText}>{scanResult.failureReason}</Text>
              </View>
            ) : null}

            {/* Vehicle Details */}
            {scanResult?.vehicleDetails ? (
              <View style={styles.vehicleDetailsBox}>
                <View style={styles.plateBadge}>
                  <Text style={styles.plateText}>{scanResult.vehicleDetails.registrationNumber}</Text>
                  <Text style={styles.plateSub}>
                    {scanResult.vehicleDetails.make} {scanResult.vehicleDetails.model} &bull; {scanResult.vehicleDetails.colour}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoKey}>Driver / Owner:</Text>
                  <Text style={styles.infoVal}>{scanResult.ownerDetails?.fullName || 'N/A'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoKey}>Affiliation:</Text>
                  <Text style={styles.infoVal}>{scanResult.ownerDetails?.role}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoKey}>ID / Ref:</Text>
                  <Text style={styles.infoVal}>{scanResult.ownerDetails?.idNumber || '—'}</Text>
                </View>
                {scanResult.ownerDetails?.department ? (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoKey}>Department:</Text>
                    <Text style={styles.infoVal}>{scanResult.ownerDetails.department}</Text>
                  </View>
                ) : null}
                <View style={styles.infoRow}>
                  <Text style={styles.infoKey}>Movement Status:</Text>
                  <Text style={[styles.infoVal, { color: scanResult.direction === 'ENTRY' ? '#22c55e' : '#f87171', fontWeight: '900' }]}>
                    {scanResult.direction === 'ENTRY' ? 'CHECKED IN (ON CAMPUS)' : 'CHECKED OUT (OFF CAMPUS)'}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Action button */}
            <TouchableOpacity style={styles.dismissBtn} onPress={handleResetScanner}>
              <Text style={styles.dismissBtnText}>SCAN NEXT VEHICLE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f19' },
  centerContainer: { flex: 1, backgroundColor: '#0b0f19', alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#f5f5f7', marginTop: 12, fontSize: 13, fontWeight: '700' },
  loginContainer: { flex: 1, backgroundColor: '#0b0f19' },
  loginScroll: { padding: 24, justifyContent: 'center' },
  brandHeader: { alignItems: 'center', marginBottom: 24, marginTop: 40 },
  logoBadge: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#990000', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 2, borderColor: '#006633' },
  logoText: { color: '#fffdf7', fontWeight: '900', fontSize: 16 },
  title: { fontSize: 24, fontWeight: '900', color: '#f5f5f7', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#94a3b8', marginTop: 4, textAlign: 'center' },
  loginCard: { backgroundColor: '#111827', padding: 22, borderRadius: 24, borderWidth: 1, borderColor: '#1f2937' },
  cardHeader: { color: '#fffdf7', fontSize: 16, fontWeight: '900', marginBottom: 16 },
  label: { color: '#94a3b8', fontSize: 11, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase' },
  input: { backgroundColor: '#030712', color: '#fffdf7', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#374151', fontSize: 14, marginBottom: 14 },
  primaryButton: { backgroundColor: '#006633', padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 8 },
  primaryButtonText: { color: '#fffdf7', fontWeight: '900', fontSize: 14, letterSpacing: 0.5 },
  configToggle: { marginTop: 14, alignItems: 'center' },
  configToggleText: { color: '#38bdf8', fontSize: 12, fontWeight: '600' },
  configBox: { marginTop: 12, padding: 12, backgroundColor: '#030712', borderRadius: 12, borderWidth: 1, borderColor: '#1f2937' },
  configLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  configInput: { color: '#38bdf8', fontSize: 12, paddingVertical: 6, borderBottomWidth: 1, borderColor: '#374151', fontFamily: 'monospace' },
  configHelp: { color: '#64748b', fontSize: 10, marginTop: 4, lineHeight: 14 },
  quickBox: { marginTop: 24, padding: 16, backgroundColor: '#111827', borderRadius: 20, borderWidth: 1, borderColor: '#1f2937' },
  quickTitle: { color: '#fbbf24', fontSize: 12, fontWeight: '800', marginBottom: 10, textTransform: 'uppercase' },
  quickBtn: { backgroundColor: '#1f2937', padding: 12, borderRadius: 12, marginBottom: 8 },
  quickBtnText: { color: '#f5f5f7', fontSize: 12, fontWeight: '700' },

  // Top Banner
  topBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#111827', borderBottomWidth: 1, borderColor: '#1f2937' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' },
  gateCode: { color: '#94a3b8', fontSize: 11, fontFamily: 'monospace', fontWeight: '700' },
  onDutyTag: { backgroundColor: '#052e16', color: '#4ade80', fontSize: 9, fontWeight: '900', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  gateName: { color: '#f5f5f7', fontSize: 16, fontWeight: '900', marginTop: 2 },
  logoutBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#1f2937', borderRadius: 8 },
  logoutBtnText: { color: '#f87171', fontSize: 11, fontWeight: '700' },

  // Direction Bar
  directionBar: { flexDirection: 'row', padding: 12, gap: 10 },
  dirBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937', alignItems: 'center' },
  dirBtnActiveEntry: { backgroundColor: '#006633', borderColor: '#22c55e' },
  dirBtnActiveExit: { backgroundColor: '#990000', borderColor: '#ef4444' },
  dirText: { color: '#64748b', fontSize: 11, fontWeight: '900' },
  dirTextActive: { color: '#fffdf7' },

  // Tabs
  tabsRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 8, gap: 8 },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: '#111827', alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#006633' },
  tabText: { color: '#64748b', fontSize: 11, fontWeight: '700' },
  tabTextActive: { color: '#fffdf7', fontWeight: '900' },

  // Scanner Wrapper
  scannerWrapper: { flex: 1, margin: 12, borderRadius: 24, overflow: 'hidden', backgroundColor: '#000' },
  cameraContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  viewfinderTarget: { width: 250, height: 250, borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.4)', borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  cornerTL: { position: 'absolute', top: -2, left: -2, width: 28, height: 28, borderTopWidth: 4, borderLeftWidth: 4, borderColor: '#22c55e', borderTopLeftRadius: 16 },
  cornerTR: { position: 'absolute', top: -2, right: -2, width: 28, height: 28, borderTopWidth: 4, borderRightWidth: 4, borderColor: '#22c55e', borderTopRightRadius: 16 },
  cornerBL: { position: 'absolute', bottom: -2, left: -2, width: 28, height: 28, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: '#22c55e', borderBottomLeftRadius: 16 },
  cornerBR: { position: 'absolute', bottom: -2, right: -2, width: 28, height: 28, borderBottomWidth: 4, borderRightWidth: 4, borderColor: '#22c55e', borderBottomRightRadius: 16 },
  targetLabel: { color: '#22c55e', fontSize: 10, fontWeight: '900', letterSpacing: 1, backgroundColor: 'rgba(2, 6, 23, 0.85)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, textAlign: 'center' },
  permissionBox: { padding: 24, alignItems: 'center' },
  permText: { color: '#94a3b8', textAlign: 'center', marginBottom: 16 },

  // Manual Tab
  manualContainer: { flex: 1, padding: 16, backgroundColor: '#111827', margin: 12, borderRadius: 24 },
  manualTitle: { color: '#fffdf7', fontSize: 15, fontWeight: '800', marginBottom: 12 },
  manualInput: { backgroundColor: '#030712', color: '#fffdf7', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#374151', fontFamily: 'monospace', fontSize: 13, marginBottom: 12 },
  testHeader: { color: '#94a3b8', fontSize: 11, fontWeight: '700', marginTop: 20, marginBottom: 10, textTransform: 'uppercase' },
  testButton: { backgroundColor: '#1f2937', padding: 12, borderRadius: 12, marginBottom: 8 },
  testBtnText: { color: '#f5f5f7', fontSize: 12, fontWeight: '600' },

  // History Tab
  historyContainer: { flex: 1, padding: 12 },
  historyTitle: { color: '#fffdf7', fontSize: 16, fontWeight: '900', marginBottom: 12 },
  emptyText: { color: '#64748b', textAlign: 'center', marginTop: 40 },
  logCard: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, backgroundColor: '#111827', borderRadius: 16, borderWidth: 1, borderColor: '#1f2937', marginBottom: 8 },
  logPlate: { color: '#fbbf24', fontFamily: 'monospace', fontWeight: '900', fontSize: 15 },
  logOwner: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  logRight: { alignItems: 'flex-end' },
  logDir: { color: '#f5f5f7', fontSize: 10, fontWeight: '800' },
  logStatus: { fontSize: 11, fontWeight: '900', marginTop: 2 },
  statusValid: { color: '#22c55e' },
  statusInvalid: { color: '#f87171' },

  // Result Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(11, 15, 25, 0.95)', justifyContent: 'center', padding: 20 },
  resultCard: { backgroundColor: '#111827', borderRadius: 28, padding: 20, borderWidth: 1, borderColor: '#1f2937' },
  resultHeader: { padding: 20, borderRadius: 20, alignItems: 'center', marginBottom: 16 },
  headerCheckIn: { backgroundColor: '#006633' },
  headerCheckOut: { backgroundColor: '#990000' },
  headerInvalid: { backgroundColor: '#b91c1c' },
  resultStatusText: { color: '#fffdf7', fontSize: 26, fontWeight: '900', letterSpacing: 1, textAlign: 'center' },
  resultSubStatus: { color: 'rgba(255, 253, 247, 0.9)', fontSize: 10, fontWeight: '800', marginTop: 6, textTransform: 'uppercase', textAlign: 'center' },
  failureBox: { backgroundColor: '#450a0a', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#991b1b', marginBottom: 14 },
  failureLabel: { color: '#f87171', fontSize: 10, fontWeight: '900' },
  failureText: { color: '#fecaca', fontSize: 12, marginTop: 2 },
  vehicleDetailsBox: { backgroundColor: '#030712', padding: 16, borderRadius: 18, borderWidth: 1, borderColor: '#1f2937', marginBottom: 16 },
  plateBadge: { alignItems: 'center', paddingBottom: 12, borderBottomWidth: 1, borderColor: '#1f2937', marginBottom: 10 },
  plateText: { color: '#fbbf24', fontSize: 26, fontWeight: '900', fontFamily: 'monospace', letterSpacing: 1 },
  plateSub: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  infoKey: { color: '#64748b', fontSize: 12 },
  infoVal: { color: '#f5f5f7', fontSize: 12, fontWeight: '700' },
  dismissBtn: { backgroundColor: '#1f2937', padding: 16, borderRadius: 16, alignItems: 'center' },
  dismissBtnText: { color: '#fffdf7', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },
});
