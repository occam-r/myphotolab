import Button from "@components/Button";
import colors from "@utils/colors";
import {
  CameraCapturedPicture,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { saveToLibraryAsync, usePermissions } from "expo-media-library";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  ListRenderItem,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PHOTO_OPTIONS = {
  quality: 1,
  exif: true,
  skipProcessing: false,
};

interface Props {
  onFinish: (photos: CameraCapturedPicture[]) => void;
  onClose: () => void;
  isLandscape: boolean;
}

const CameraScreen = ({ onFinish, onClose, isLandscape }: Props) => {
  const cameraRef = useRef<CameraView>(null);
  const { bottom } = useSafeAreaInsets();

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [libraryPermission, requestLibraryPermission] = usePermissions();

  const [capturedPhotos, setCapturedPhotos] = useState<CameraCapturedPicture[]>(
    [],
  );
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const requestPermissions = async () => {
      if (!cameraPermission?.granted) {
        await requestCameraPermission();
      }
      if (!libraryPermission?.granted) {
        await requestLibraryPermission();
      }
    };

    requestPermissions();
  }, [cameraPermission, requestCameraPermission]);

  const takePicture = useCallback(async () => {
    if (!cameraRef.current || isProcessing) return;

    setIsProcessing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync(PHOTO_OPTIONS);

      if (photo?.uri) {
        setCapturedPhotos((prev) => [...prev, photo]);

        if (libraryPermission?.granted) {
          saveToLibraryAsync(photo.uri);
        }
      }
    } catch (error) {
      console.error("Error taking picture:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing]);

  const handleFinish = useCallback(() => {
    onFinish(capturedPhotos);
  }, [capturedPhotos, onFinish]);

  const openSettings = useCallback(() => {
    Linking.openSettings();
  }, []);

  const renderThumbnail = useCallback<ListRenderItem<CameraCapturedPicture>>(
    ({ item }) => (
      <View style={styles.thumbnailContainer}>
        <Image
          source={{ uri: item.uri }}
          style={styles.thumbnail}
          onError={(error) =>
            console.error("Image loading error:", error.nativeEvent.error)
          }
        />
      </View>
    ),
    [],
  );

  const keyExtractor = useCallback(
    (_: any, index: number) => `photo-${index}`,
    [],
  );

  if (!cameraPermission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!cameraPermission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to show the camera.
        </Text>
        <Button
          onPress={openSettings}
          title="Grant permission"
          style={styles.saveButton}
          textStyle={styles.saveText}
        />
        <Button
          onPress={onClose}
          title="Close"
          style={styles.closeButton}
          textStyle={styles.closeText}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          ref={cameraRef}
          responsiveOrientationWhenOrientationLocked
          autofocus="on"
        />

        <View
          style={[
            styles.controls,
            isLandscape
              ? styles.controlsLandscape
              : {
                  paddingBottom: bottom,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: colors.cameraControls,
                },
          ]}
        >
          <View style={styles.previewContainer}>
            <FlatList
              horizontal={!isLandscape}
              data={capturedPhotos}
              renderItem={renderThumbnail}
              keyExtractor={keyExtractor}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[
                styles.previewList,
                isLandscape && styles.previewListLandscape,
              ]}
              initialNumToRender={5}
              maxToRenderPerBatch={10}
              windowSize={5}
              removeClippedSubviews={true}
              numColumns={isLandscape ? 2 : undefined}
              key={isLandscape ? "v" : "h"}
            />
          </View>

          <View
            style={[
              styles.actionButtons,
              isLandscape && styles.actionButtonsLandscape,
            ]}
          >
            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePicture}
              disabled={isProcessing}
              activeOpacity={0.7}
            >
              {isProcessing ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : (
                <View style={styles.innerCircle} />
              )}
            </TouchableOpacity>

            <View
              style={[
                styles.buttonContainer,
                isLandscape && styles.buttonContainerLandscape,
              ]}
            >
              <Button
                title={`Ok (${capturedPhotos.length})`}
                onPress={handleFinish}
                disabled={capturedPhotos.length === 0}
                style={
                  isLandscape
                    ? [styles.finishButton, styles.finishButtonLandscape]
                    : [styles.finishButton]
                }
                textStyle={styles.saveText}
              />

              <Button
                title={"Close"}
                onPress={onClose}
                style={
                  isLandscape
                    ? [styles.closeButt, styles.closeButtLandscape]
                    : [styles.closeButt]
                }
                textStyle={styles.closeText}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default memo(CameraScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraContainer: {
    flex: 1,
    width: "100%",
    flexDirection: "row",
  },
  camera: {
    flex: 1,
    width: "100%",
  },
  controls: {
    position: "absolute",
    backgroundColor: colors.modal,
    width: "100%",
    bottom: 0,
    justifyContent: "space-between",
  },
  controlsLandscape: {
    width: "24%",
    height: "100%",
    right: 0,
    top: 0,
    borderLeftWidth: 1,
    borderLeftColor: colors.cameraControls,
  },
  message: {
    textAlign: "center",
    paddingBottom: 20,
    fontSize: 16,
    paddingHorizontal: 20,
  },
  previewContainer: {
    flex: 1,
  },
  photoCount: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 10,
    marginBottom: 5,
    textAlign: "center",
    backgroundColor: colors.modal,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    overflow: "hidden",
    alignSelf: "center",
  },
  previewList: {
    paddingHorizontal: 12,
  },
  previewListLandscape: {
    paddingTop: 12,
    alignItems: "center",
  },
  thumbnailContainer: {
    padding: 2,
    borderRadius: 10,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 6,
    resizeMode: "cover",
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },
  orientationIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.modal,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginBottom: 15,
  },
  orientationText: {
    color: colors.white,
    fontSize: 12,
    marginLeft: 5,
    fontWeight: "500",
  },
  actionButtons: {
    justifyContent: "flex-end",
    alignItems: "center",
  },
  actionButtonsLandscape: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingBottom: 12,
  },
  buttonContainer: {
    flexDirection: "row-reverse",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  buttonContainerLandscape: {
    flexDirection: "column",
    alignItems: "center",
  },
  captureButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: colors.background,
    borderRadius: 50,
    width: 70,
    height: 70,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  disabledButton: {
    opacity: 0.7,
    borderColor: colors.textSecondary,
  },
  innerCircle: {
    backgroundColor: colors.background,
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  finishButton: {
    width: "45%",
  },
  finishButtonLandscape: {
    width: "100%",
    marginBottom: 12,
    borderRadius: 10,
  },
  closeButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    width: "90%",
  },
  closeButt: {
    width: "45%",
    backgroundColor: colors.cameraControls,
    borderWidth: 1,
    borderColor: colors.border,
  },
  closeButtLandscape: {
    width: "100%",
    borderRadius: 10,
  },
  closeText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  saveButton: {
    width: "90%",
  },
  saveText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: "600",
  },
});
