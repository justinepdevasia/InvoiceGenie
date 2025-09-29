import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

const CameraScreen = ({ navigation, route }: any) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [type, setType] = useState(CameraType.back);
  const [processing, setProcessing] = useState(false);
  const cameraRef = useRef<Camera>(null);

  // Get project ID from route params if provided
  const projectId = route?.params?.projectId;

  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();

      setHasPermission(cameraStatus === 'granted' && mediaStatus === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        setProcessing(true);

        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
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

  const processDocument = async (uri: string, base64: string) => {
    try {
      // First, create an invoice record
      const invoiceData = {
        user_id: user?.id,
        project_id: projectId || null,
        original_filename: `scan_${Date.now()}.jpg`,
        file_type: 'image/jpeg',
        file_size: Math.ceil(base64.length * 0.75), // Approximate file size
        processing_status: 'pending',
      };

      // In a real implementation, this would be an API call to create the invoice record
      // For now, we'll simulate the OCR processing
      console.log('Processing document...', invoiceData);

      // Simulate API call to process OCR
      const ocrResponse = await processOCR(base64, 'scan.jpg', 'image/jpeg');

      if (ocrResponse.success) {
        Alert.alert(
          'Success!',
          'Document processed successfully. The extracted data will be available in your documents.',
          [
            {
              text: 'View Documents',
              onPress: () => {
                navigation.navigate('Documents');
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
    }
  };

  // Mock OCR processing function - in real app, this would call the API
  const processOCR = async (base64Data: string, fileName: string, fileType: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock successful response
    return {
      success: true,
      data: {
        invoice_data_id: 'mock-id',
        extracted: {
          invoice_number: 'INV-001',
          vendor_name: 'Sample Vendor',
          total_amount: 100.00,
          currency: 'USD',
        },
        confidence_score: 0.95,
      },
    };
  };

  const toggleCameraType = () => {
    setType(current =>
      current === CameraType.back ? CameraType.front : CameraType.back
    );
  };

  if (hasPermission === null) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.text, { color: theme.colors.text }]}>
          Requesting permissions...
        </Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.text, { color: theme.colors.text }]}>
          Camera permission is required to scan documents
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    camera: {
      flex: 1,
      width: width,
    },
    buttonContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingVertical: theme.spacing.xl,
      paddingHorizontal: theme.spacing.lg,
    },
    captureButton: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: 'white',
      justifyContent: 'center',
      alignItems: 'center',
      opacity: processing ? 0.5 : 1,
    },
    captureButtonInner: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.colors.primary,
    },
    sideButton: {
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    sideButtonText: {
      color: 'white',
      fontSize: theme.fontSize.sm,
      fontWeight: '600',
    },
    text: {
      fontSize: theme.fontSize.lg,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
    },
    button: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
    },
    buttonText: {
      color: 'white',
      fontSize: theme.fontSize.md,
      fontWeight: '600',
    },
    instructions: {
      position: 'absolute',
      top: 100,
      left: 0,
      right: 0,
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
    },
    instructionText: {
      color: 'white',
      fontSize: theme.fontSize.md,
      textAlign: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
    },
  });

  return (
    <View style={styles.container}>
      <Camera style={styles.camera} type={type} ref={cameraRef}>
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            📄 Position the document within the frame and tap the capture button
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.sideButton} onPress={() => navigation.goBack()}>
            <Text style={styles.sideButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.captureButton}
            onPress={takePicture}
            disabled={processing}
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.sideButton} onPress={toggleCameraType}>
            <Text style={styles.sideButtonText}>Flip</Text>
          </TouchableOpacity>
        </View>
      </Camera>

      {processing && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: 'white', fontSize: 18, marginBottom: 20 }}>
            Processing document...
          </Text>
        </View>
      )}
    </View>
  );
};

export default CameraScreen;