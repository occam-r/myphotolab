import Button from "@components/Button";
import Icon from "@components/Icon";
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
            isLandscape ? styles.controlsLandscape : null,
          ]}
        >
          <View style={[styles.previewContainer, isLandscape && { flex: 1 }]}>
            {capturedPhotos.length > 0 && (
              <Text style={styles.photoCount}>
                {capturedPhotos.length} Photo
                {capturedPhotos.length !== 1 ? "s" : ""}
              </Text>
            )}
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
              numColumns={isLandscape ? 1 : undefined}
              key={isLandscape ? "v" : "h"}
            />
          </View>

          <View
            style={[
              styles.actionButtons,
              isLandscape && styles.actionButtonsLandscape,
            ]}
          >
            {isLandscape && (
              <View style={styles.orientationIndicator}>
                <Icon
                  type="MaterialIcons"
                  name="screen-rotation"
                  size={18}
                  color={colors.background}
                />
                <Text style={styles.orientationText}>Landscape Mode</Text>
              </View>
            )}
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
    height: "30%",
    backgroundColor: "rgba(0,0,0,0.5)",
    width: "100%",
    bottom: 0,
    paddingBottom: 15,
    paddingTop: 10,
    justifyContent: "space-between",
  },
  controlsLandscape: {
    width: "25%",
    height: "100%",
    right: 0,
    top: 0,
    paddingVertical: 15,
    paddingHorizontal: 12,
    justifyContent: "space-between",
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255,255,255,0.2)",
  },
  message: {
    textAlign: "center",
    paddingBottom: 20,
    fontSize: 16,
    paddingHorizontal: 20,
  },
  previewContainer: {
    marginBottom: 10,
  },
  photoCount: {
    color: colors.background,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 10,
    marginBottom: 5,
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    overflow: "hidden",
    alignSelf: "center",
  },
  previewList: {
    marginVertical: 5,
    paddingHorizontal: 10,
  },
  previewListLandscape: {
    marginHorizontal: 5,
    paddingVertical: 5,
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
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginBottom: 15,
  },
  orientationText: {
    color: colors.background,
    fontSize: 12,
    marginLeft: 5,
    fontWeight: "500",
  },
  actionButtons: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  actionButtonsLandscape: {
    justifyContent: "center",
    paddingBottom: 20,
    alignItems: "center",
    width: "100%",
  },
  buttonContainer: {
    flexDirection: "row-reverse",
    width: "100%",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 10,
  },
  buttonContainerLandscape: {
    flexDirection: "column",
    width: "90%",
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
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  disabledButton: {
    opacity: 0.7,
    borderColor: "#cccccc",
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
    backgroundColor: "#f1f3f5",
    borderWidth: 1,
    borderColor: "#dee2e6",
    width: "90%",
  },
  closeButt: {
    width: "45%",
    backgroundColor: "#f1f3f5",
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  closeButtLandscape: {
    width: "100%",
    borderRadius: 10,
  },
  closeText: {
    fontSize: 16,
    color: "#495057",
    fontWeight: "600",
  },
  saveButton: {
    width: "90%",
  },
  saveText: {
    fontSize: 16,
    color: colors.background,
    fontWeight: "600",
  },
});
