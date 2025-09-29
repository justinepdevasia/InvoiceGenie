import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Animated,
  SafeAreaView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

const CameraScreen = ({ navigation, route }: any) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaPermission, setMediaPermission] = useState<any>(null);
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [processing, setProcessing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  // Get project ID from route params if provided
  const projectId = route?.params?.projectId;

  useEffect(() => {
    (async () => {
      try {
        console.log('Requesting media library permissions...');
        const mediaResult = await MediaLibrary.requestPermissionsAsync();
        console.log('Media library permission result:', mediaResult);
        setMediaPermission(mediaResult.status === 'granted');
      } catch (error) {
        // Media library permissions are optional - app can still work without them
        console.warn('Media library permissions not available:', error);
        setMediaPermission(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!cameraPermission) {
      console.log('Requesting camera permissions...');
      requestCameraPermission();
    }
  }, []);

  useEffect(() => {
    const scanAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    scanAnimation.start();
    return () => scanAnimation.stop();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        setProcessing(true);

        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
          skipProcessing: false,
        });

        if (photo.base64) {
          await processDocument(photo.uri, photo.base64);
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture');
      } finally {
        setProcessing(false);
      }
    }
  };

  const pickImageFromGallery = async () => {
    try {
      setProcessing(true);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Allow full document view without cropping
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        await processDocument(result.assets[0].uri, result.assets[0].base64);
      } else {
        setProcessing(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image from gallery');
      setProcessing(false);
    }
  };

  const pickPDFDocument = async () => {
    try {
      setProcessing(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setProcessing(false);
        return;
      }

      const document = result.assets[0];

      // Read the PDF file as base64
      const base64 = await FileSystem.readAsStringAsync(document.uri, {
        encoding: 'base64',
      });

      // Process the PDF document
      await processDocumentFile(document.uri, base64, document.name, 'application/pdf');
    } catch (error) {
      console.error('Error picking PDF:', error);
      Alert.alert('Error', 'Failed to pick PDF document');
      setProcessing(false);
    }
  };

  const processDocument = async (uri: string, base64: string) => {
    await processDocumentFile(uri, base64, `scan_${Date.now()}.jpg`, 'image/jpeg');
  };

  const processDocumentFile = async (uri: string, base64: string, fileName: string, fileType: string) => {
    try {
      // Check if project is selected
      if (!projectId) {
        Alert.alert(
          'Project Required',
          'Please select a project before uploading a document.',
          [
            {
              text: 'Select Project',
              onPress: () => {
                navigation.goBack();
                setTimeout(() => {
                  navigation.navigate('Main', { screen: 'Projects' });
                }, 100);
              },
            },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        setProcessing(false);
        return;
      }

      // First, upload the file to Supabase and create an invoice record
      const uploadResult = await uploadToSupabaseAndCreateInvoice(base64, fileName, fileType);

      if (!uploadResult.success || !uploadResult.invoiceId) {
        throw new Error(uploadResult.error || 'Failed to upload document');
      }

      // Then process OCR with the invoice ID
      const ocrResponse = await processOCR(uploadResult.invoiceId, base64, fileName, fileType);

      if (ocrResponse.success) {
        Alert.alert(
          'Success!',
          'Document processed successfully.',
          [
            {
              text: 'View Documents',
              onPress: () => {
                // Navigate back and then to Documents tab
                navigation.goBack();
                setTimeout(() => {
                  navigation.navigate('Main', {
                    screen: 'Documents'
                  });
                }, 100);
              },
            },
            {
              text: 'Scan Another',
              style: 'cancel',
            },
          ]
        );
      } else {
        throw new Error(ocrResponse.error || 'OCR processing failed');
      }
    } catch (error) {
      console.error('Error processing document:', error);

      Alert.alert(
        'Processing Error',
        'Failed to process the document. Please try again.',
        [
          {
            text: 'Retry',
            onPress: takePicture,
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } finally {
      setProcessing(false);
    }
  };

  // Upload file to Supabase storage and create invoice record
  const uploadToSupabaseAndCreateInvoice = async (base64: string, fileName: string, fileType: string) => {
    try {
      const { supabase } = await import('../../lib/supabase');

      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Generate unique file path
      const fileExt = fileType === 'application/pdf' ? 'pdf' : 'jpg';
      const filePath = `${currentUser.id}/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.]/g, '_')}.${fileExt}`;

      // Decode base64 to binary string for React Native
      const decode = (str: string): string => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        let output = '';

        str = str.replace(/[^A-Za-z0-9+/=]/g, '');

        for (let i = 0; i < str.length; i += 4) {
          const enc1 = chars.indexOf(str.charAt(i));
          const enc2 = chars.indexOf(str.charAt(i + 1));
          const enc3 = chars.indexOf(str.charAt(i + 2));
          const enc4 = chars.indexOf(str.charAt(i + 3));

          const chr1 = (enc1 << 2) | (enc2 >> 4);
          const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
          const chr3 = ((enc3 & 3) << 6) | enc4;

          output += String.fromCharCode(chr1);
          if (enc3 !== 64) output += String.fromCharCode(chr2);
          if (enc4 !== 64) output += String.fromCharCode(chr3);
        }

        return output;
      };

      // Convert base64 to ArrayBuffer for React Native
      const binaryString = decode(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const arrayBuffer = bytes.buffer;

      console.log('Uploading file:', filePath, 'Size:', arrayBuffer.byteLength);

      // Upload to Supabase storage using ArrayBuffer directly
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, arrayBuffer, {
          contentType: fileType,
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('File uploaded successfully to:', filePath);

      // Create invoice record - project_id is required
      if (!projectId) {
        throw new Error('Project ID is required');
      }

      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          user_id: currentUser.id,
          project_id: projectId,
          original_file_name: fileName,
          file_type: fileType,
          file_size: arrayBuffer.byteLength,
          file_path: filePath,
          processing_status: 'pending'
        })
        .select()
        .single();

      if (invoiceError) {
        console.error('Invoice creation error:', invoiceError);
        throw invoiceError;
      }

      console.log('Invoice created:', invoiceData.id);

      return {
        success: true,
        invoiceId: invoiceData.id,
        filePath: filePath
      };
    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  };

  // Real OCR processing function - calls the web app API
  const processOCR = async (invoiceId: string, base64Data: string, fileName: string, fileType: string) => {
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

      // Get auth session token
      const { supabase } = await import('../../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No authentication session');
      }

      const response = await fetch(`${apiUrl}/api/ocr/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          invoiceId: invoiceId,
          base64Data: base64Data,
          fileName: fileName,
          fileType: fileType,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'OCR processing failed');
      }

      return result;
    } catch (error) {
      console.error('OCR API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'OCR processing failed',
      };
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlash(current => current === 'off' ? 'on' : 'off');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000',
    },
    camera: {
      flex: 1,
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'space-between',
    },
    topControls: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.xxl,
    },
    controlButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    scanFrame: {
      position: 'absolute',
      top: '25%',
      left: '10%',
      right: '10%',
      height: height * 0.4,
      borderWidth: 2,
      borderColor: theme.colors.primary,
      borderRadius: theme.borderRadius.lg,
      backgroundColor: 'transparent',
    },
    cornerTL: {
      position: 'absolute',
      top: -2,
      left: -2,
      width: 20,
      height: 20,
      borderTopWidth: 4,
      borderLeftWidth: 4,
      borderColor: '#FFFFFF',
    },
    cornerTR: {
      position: 'absolute',
      top: -2,
      right: -2,
      width: 20,
      height: 20,
      borderTopWidth: 4,
      borderRightWidth: 4,
      borderColor: '#FFFFFF',
    },
    cornerBL: {
      position: 'absolute',
      bottom: -2,
      left: -2,
      width: 20,
      height: 20,
      borderBottomWidth: 4,
      borderLeftWidth: 4,
      borderColor: '#FFFFFF',
    },
    cornerBR: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 20,
      height: 20,
      borderBottomWidth: 4,
      borderRightWidth: 4,
      borderColor: '#FFFFFF',
    },
    scanLine: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: 2,
      backgroundColor: theme.colors.primary,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 4,
    },
    instructionContainer: {
      position: 'absolute',
      bottom: '45%',
      left: 0,
      right: 0,
      alignItems: 'center',
    },
    instructionText: {
      color: '#FFFFFF',
      fontSize: theme.fontSize.lg,
      fontWeight: theme.fontWeight.semibold,
      textAlign: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.lg,
      marginHorizontal: theme.spacing.xl,
    },
    bottomControls: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.xxl,
      alignItems: 'center',
    },
    captureButtonContainer: {
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    captureButton: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      borderWidth: 4,
      borderColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    captureButtonInner: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#FFFFFF',
    },
    captureText: {
      color: '#FFFFFF',
      fontSize: theme.fontSize.md,
      fontWeight: theme.fontWeight.medium,
    },
    bottomActions: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '100%',
    },
    actionButton: {
      alignItems: 'center',
    },
    actionButtonContainer: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    actionButtonText: {
      color: '#FFFFFF',
      fontSize: theme.fontSize.xs,
      fontWeight: theme.fontWeight.medium,
    },
    permissionContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xl,
    },
    permissionIcon: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: `${theme.colors.primary}15`,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
    },
    permissionTitle: {
      fontSize: theme.fontSize.xxl,
      fontWeight: theme.fontWeight.bold,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    permissionSubtitle: {
      fontSize: theme.fontSize.lg,
      textAlign: 'center',
      lineHeight: 24,
    },
    processingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    processingText: {
      color: '#FFFFFF',
      fontSize: theme.fontSize.lg,
      fontWeight: theme.fontWeight.semibold,
      marginTop: theme.spacing.lg,
    },
  });

  const scanLineTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, height * 0.4 - 4],
  });

  if (!cameraPermission) {
    return (
      <SafeAreaView style={[styles.permissionContainer, { backgroundColor: theme.colors.background }]}>
        <View style={styles.permissionIcon}>
          <Ionicons name="camera-outline" size={60} color={theme.colors.primary} />
        </View>
        <Text style={[styles.permissionTitle, { color: theme.colors.text }]}>
          Requesting Permissions...
        </Text>
        <Text style={[styles.permissionSubtitle, { color: theme.colors.textSecondary }]}>
          Please wait while we request camera access
        </Text>
      </SafeAreaView>
    );
  }

  if (!cameraPermission.granted) {
    return (
      <SafeAreaView style={[styles.permissionContainer, { backgroundColor: theme.colors.background }]}>
        <View style={styles.permissionIcon}>
          <Ionicons name="camera-outline" size={60} color={theme.colors.primary} />
        </View>
        <Text style={[styles.permissionTitle, { color: theme.colors.text }]}>
          Camera Permission Required
        </Text>
        <Text style={[styles.permissionSubtitle, { color: theme.colors.textSecondary }]}>
          We need access to your camera to scan documents and receipts.
        </Text>
        <TouchableOpacity
          onPress={requestCameraPermission}
          style={{
            backgroundColor: theme.colors.primary,
            paddingHorizontal: theme.spacing.xl,
            paddingVertical: theme.spacing.lg,
            borderRadius: theme.borderRadius.md,
            marginTop: theme.spacing.xl,
          }}
        >
          <Text style={{
            color: '#FFFFFF',
            fontSize: theme.fontSize.lg,
            fontWeight: theme.fontWeight.semibold,
            textAlign: 'center',
          }}>
            Grant Permission
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            backgroundColor: 'transparent',
            paddingHorizontal: theme.spacing.xl,
            paddingVertical: theme.spacing.lg,
            borderRadius: theme.borderRadius.md,
            marginTop: theme.spacing.md,
          }}
        >
          <Text style={{
            color: theme.colors.primary,
            fontSize: theme.fontSize.lg,
            fontWeight: theme.fontWeight.semibold,
            textAlign: 'center',
          }}>
            Go Back
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        flash={flash}
        ref={cameraRef}
      />

      {/* Overlay - positioned absolutely on top of camera */}
      <View style={styles.overlay}>
        {/* Top Controls */}
        <View style={styles.topControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.controlButton,
              { backgroundColor: flash === 'on' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.5)' }
            ]}
            onPress={toggleFlash}
          >
            <Ionicons
              name={flash === 'on' ? "flash" : "flash-off"}
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        {/* Scan Frame */}
        <View style={styles.scanFrame}>
          <View style={styles.cornerTL} />
          <View style={styles.cornerTR} />
          <View style={styles.cornerBL} />
          <View style={styles.cornerBR} />

          <Animated.View
            style={[
              styles.scanLine,
              {
                transform: [{ translateY: scanLineTranslateY }],
              },
            ]}
          />
        </View>

        {/* Instructions */}
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionText}>
            Position document within the frame
          </Text>
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <View style={styles.captureButtonContainer}>
            <TouchableOpacity
              style={[styles.captureButton, { opacity: processing ? 0.5 : 1 }]}
              onPress={takePicture}
              disabled={processing}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
            <Text style={styles.captureText}>
              {processing ? 'Processing...' : 'Tap to capture'}
            </Text>
          </View>

          <View style={styles.bottomActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={pickImageFromGallery}
              disabled={processing}
            >
              <View style={styles.actionButtonContainer}>
                <Ionicons name="images-outline" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.actionButtonText}>Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={pickPDFDocument}
              disabled={processing}
            >
              <View style={styles.actionButtonContainer}>
                <Ionicons name="document-outline" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.actionButtonText}>PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={toggleCameraFacing}
              disabled={processing}
            >
              <View style={styles.actionButtonContainer}>
                <Ionicons name="camera-reverse-outline" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.actionButtonText}>Flip</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Processing Overlay */}
      {processing && (
        <View style={styles.processingOverlay}>
          <Ionicons name="sync" size={40} color="#FFFFFF" />
          <Text style={styles.processingText}>Processing document...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default CameraScreen;