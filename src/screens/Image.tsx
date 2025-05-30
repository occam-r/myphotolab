import Button from "@components/Button";
import Icon from "@components/Icon";
import { imageInitialState, imageReducer } from "@reducer/Images";
import colors from "@utils/colors";
import * as ImagePicker from "expo-image-picker";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { useAnimatedRef } from "react-native-reanimated";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { Images } from "@lib/images";
import type { CameraCapturedPicture } from "expo-camera";
import Sortable, {
  OrderChangeParams,
  SortableGridRenderItem,
} from "react-native-sortables";
import CameraScreen from "./Camera";

interface GridItemProps {
  item: Images;
  onDeleteImage: () => void;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: Images[];
  onSaved: (images: Images[]) => void;
  isLandscape: boolean;
}

const GridItem = memo(({ item, onDeleteImage }: GridItemProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <View style={styles.card}>
      {isLoading && <View style={[styles.image, styles.imagePlaceholder]} />}
      {hasError ? (
        <View style={[styles.image, styles.imageError]}>
          <Icon
            type="MaterialIcons"
            name="broken-image"
            size={32}
            color={colors.textSecondary}
          />
        </View>
      ) : (
        <Image
          style={styles.image}
          source={{ uri: item.uri }}
          resizeMode="cover"
          fadeDuration={300}
          accessibilityLabel={`Image ${item.id}`}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
            console.error(`Failed to load image: ${item.uri}`);
          }}
        />
      )}
      <Sortable.Pressable
        style={styles.deleteButton}
        onPress={onDeleteImage}
        accessibilityLabel="Delete image"
        accessibilityHint="Removes this image from the collection"
      >
        <Icon
          type="MaterialIcons"
          name="delete"
          size={24}
          color={colors.error}
        />
      </Sortable.Pressable>
    </View>
  );
});

const ImageModal = ({ isOpen, onClose, data, onSaved, isLandscape }: Props) => {
  const scrollableRef = useAnimatedRef<Animated.ScrollView>();
  const [state, dispatch] = useReducer(imageReducer, imageInitialState);
  const [showCamera, setShowCamera] = useState(false);

  const COLUMNS = useMemo(() => (isLandscape ? 4 : 2), [isLandscape]);

  const { orderChanged, sectionImages } = state;

  const initialData = useMemo(() => {
    return {
      sectionImages: data,
    };
  }, [data]);

  useEffect(() => {
    if (isOpen) {
      dispatch({ type: "SET_MODAL_DATA", payload: initialData });
    }
  }, [isOpen, initialData]);

  const eventHandlers = useMemo(
    () => ({
      deleteImage: (id: string) =>
        dispatch({ type: "DELETE_IMAGE", payload: id }),
    }),
    [],
  );

  const renderItem: SortableGridRenderItem<Images> = useCallback(
    ({ item }) => (
      <GridItem
        item={item}
        onDeleteImage={() => eventHandlers.deleteImage(item.id)}
      />
    ),
    [eventHandlers],
  );

  const handleOrderChange = useCallback((params: OrderChangeParams) => {
    dispatch({ type: "UPDATE_ORDER", payload: params });
  }, []);

  const handleOnClose = useCallback(() => {
    dispatch({
      type: "SET_MODAL_DATA",
      payload: {
        sectionImages: [],
      },
    });
    onClose();
  }, [onClose]);

  const handleOnSaved = useCallback(() => {
    try {
      if (orderChanged?.indexToKey) {
        const imageMap = new Map(sectionImages.map((item) => [item.id, item]));

        const newData: Images[] = [];

        for (const key of orderChanged.indexToKey) {
          const image = imageMap.get(key);
          if (image) {
            newData.push(image);
          }
        }

        onSaved(newData);
      } else {
        onSaved(sectionImages);
      }

      handleOnClose();
    } catch (error) {
      console.error("Error saving modifications:", error);
      ToastAndroid.show("Failed to save changes", ToastAndroid.SHORT);
    }
  }, [orderChanged, sectionImages, onSaved, handleOnClose]);

  const handleImagePick = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        aspect: [4, 3],
        quality: 0.8,
        exif: false,
        base64: false,
      });

      if (result.canceled) {
        return;
      }

      if (!result.assets || result.assets.length === 0) {
        ToastAndroid.show(`No images were selected`, ToastAndroid.SHORT);
        return;
      }

      await processPickedImages(result.assets);
    } catch (error) {
      console.error("Error picking images:", error);
      ToastAndroid.show(
        `Failed to load images: ${error instanceof Error ? error.message : "Unknown error"}`,
        ToastAndroid.SHORT,
      );
    }
  }, []);

  const processPickedImages = useCallback(
    async (
      assets: ImagePicker.ImagePickerAsset[] | CameraCapturedPicture[],
    ) => {
      if (!assets || assets.length === 0) {
        return;
      }

      const timestamp = Date.now();

      try {
        const totalAssets = assets.length;

        const allNewImages = assets.map((asset, index) => ({
          name:
            (asset as ImagePicker.ImagePickerAsset).fileName ||
            `Image-${index + 1}`,
          type:
            (asset as ImagePicker.ImagePickerAsset).mimeType || "image/jpeg",
          lastModified: timestamp,
          size: (asset as ImagePicker.ImagePickerAsset).fileSize || 0,
          id: `${timestamp}-${index}`,
          uri: asset.uri,
        }));

        dispatch({
          type: "SET_MODAL_DATA",
          payload: {
            sectionImages: [...sectionImages, ...allNewImages],
          },
        });

        setTimeout(() => {
          scrollableRef.current?.scrollToEnd({
            animated: true,
          });
        }, 100);

        if (totalAssets > 5) {
          ToastAndroid.show(`Added ${totalAssets} images`, ToastAndroid.SHORT);
        }
      } catch (error) {
        console.error("Error processing images:", error);
        ToastAndroid.show("Failed to process images", ToastAndroid.SHORT);
      }
    },
    [sectionImages, scrollableRef],
  );

  const handleCameraSave = useCallback(
    async (images: Array<CameraCapturedPicture>) => {
      setShowCamera(false);
      await processPickedImages(images);
    },
    [processPickedImages],
  );

  const keyExtractor = useCallback((item: Images) => item.id, []);

  if (showCamera) {
    return (
      <View>
        <Modal
          visible={isOpen}
          animationType="slide"
          onRequestClose={() => setShowCamera(false)}
          statusBarTranslucent
          navigationBarTranslucent
          supportedOrientations={["portrait", "landscape"]}
        >
          <CameraScreen
            onClose={() => setShowCamera(false)}
            onFinish={handleCameraSave}
            isLandscape={isLandscape}
          />
        </Modal>
      </View>
    );
  }

  return (
    <View>
      <Modal
        visible={isOpen}
        animationType="slide"
        onRequestClose={handleOnClose}
        statusBarTranslucent
        navigationBarTranslucent
        supportedOrientations={["portrait", "landscape"]}
      >
        <SafeAreaProvider>
          <SafeAreaView style={styles.container}>
            <GestureHandlerRootView style={styles.container}>
              <Animated.ScrollView
                ref={scrollableRef}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                  styles.scrollContent,
                  isLandscape && styles.scrollContentLandscape,
                  sectionImages.length === 0 && styles.emptyStateContainer,
                ]}
                removeClippedSubviews={true}
                scrollEventThrottle={16}
              >
                {sectionImages.length === 0 ? (
                  <View style={styles.emptyStateContent}>
                    <Icon
                      type="MaterialIcons"
                      name="photo-library"
                      size={64}
                      color={colors.primary}
                    />
                    <Text style={styles.emptyStateTitle}>No Images Added</Text>
                    <Text style={styles.emptyStateText}>
                      Tap "Take Photo" to use your camera or "Gallery" to select
                      images from your device.
                    </Text>
                    <View style={styles.emptyStateArrow}>
                      <Icon
                        type="MaterialIcons"
                        name="arrow-downward"
                        size={32}
                        color={colors.primary}
                      />
                    </View>
                  </View>
                ) : (
                  <Sortable.Grid
                    onOrderChange={handleOrderChange}
                    columnGap={10}
                    columns={COLUMNS}
                    data={sectionImages}
                    renderItem={renderItem}
                    rowGap={10}
                    keyExtractor={keyExtractor}
                    scrollableRef={scrollableRef}
                  />
                )}
              </Animated.ScrollView>
              <View
                style={[styles.footer, isLandscape && styles.footerLandscape]}
              >
                {isLandscape ? (
                  <View style={styles.footerRowLandscape}>
                    <Button
                      title="Close"
                      onPress={handleOnClose}
                      style={[
                        styles.footerButtonLandscape,
                        styles.closeButtonLandscape,
                      ]}
                      textStyle={styles.closeText}
                    />
                    <Button
                      onPress={() => setShowCamera(true)}
                      style={[
                        styles.footerButtonLandscape,
                        styles.cameraGalleryLandscape,
                      ]}
                      title="Take Photo"
                      textStyle={styles.text}
                      icon="camera"
                    />
                    <Button
                      onPress={handleImagePick}
                      style={[
                        styles.footerButtonLandscape,
                        styles.cameraGalleryLandscape,
                      ]}
                      title="Gallery"
                      textStyle={styles.text}
                      icon="image"
                    />
                    <Button
                      title="Save"
                      onPress={handleOnSaved}
                      style={[
                        styles.footerButtonLandscape,
                        styles.saveButtonLandscape,
                      ]}
                      textStyle={styles.saveText}
                    />
                  </View>
                ) : (
                  <>
                    <View style={styles.footerRowPortrait}>
                      <Button
                        onPress={() => setShowCamera(true)}
                        style={styles.cameraGalleryPortrait}
                        title="Take Photo"
                        textStyle={styles.text}
                        icon="camera"
                        accessibilityLabel="Take Photo"
                        accessibilityHint="Opens camera to take new photos"
                      />
                      <Button
                        onPress={handleImagePick}
                        style={styles.cameraGalleryPortrait}
                        title="Gallery"
                        textStyle={styles.text}
                        icon="image"
                        accessibilityLabel="Gallery"
                        accessibilityHint="Opens device gallery to select photos"
                      />
                    </View>
                    <View style={styles.footerRowPortrait}>
                      <Button
                        title="Close"
                        onPress={handleOnClose}
                        style={styles.closeButtonPortrait}
                        textStyle={styles.closeText}
                        accessibilityLabel="Close"
                        accessibilityHint="Closes the image editor without saving"
                      />
                      <Button
                        title="Save"
                        onPress={handleOnSaved}
                        style={styles.saveButtonPortrait}
                        textStyle={styles.saveText}
                        accessibilityLabel="Save"
                        accessibilityHint="Saves the current image arrangement"
                      />
                    </View>
                  </>
                )}
              </View>
            </GestureHandlerRootView>
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  scrollContentLandscape: {},
  emptyStateContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyStateContent: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  emptyStateArrow: {
    marginTop: 20,
    opacity: 0.8,
  },
  card: {
    borderRadius: 12,
    backgroundColor: colors.background,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 200,
  },
  imagePlaceholder: {
    backgroundColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  imageError: {
    backgroundColor: colors.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    position: "absolute",
    right: 8,
    top: 8,
    backgroundColor: colors.photoControls,
    borderRadius: 12,
    padding: 4,
  },
  checkboxContainer: {
    justifyContent: "space-between",
    padding: 8,
  },
  checkbox: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.white,
  },
  footer: {
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  footerLandscape: {
    paddingHorizontal: 12,
  },
  footerRowPortrait: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  footerRowLandscape: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    gap: 8,
  },
  cameraGalleryPortrait: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: colors.primary,
    backgroundColor: colors.background,
    marginHorizontal: 4,
  },
  closeButtonPortrait: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  saveButtonPortrait: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  footerButtonLandscape: {
    flex: 1,
    justifyContent: "center",
    borderRadius: 12,
    paddingVertical: 10,
  },
  cameraGalleryLandscape: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },
  closeButtonLandscape: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveButtonLandscape: {
    backgroundColor: colors.primary,
  },
  footerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    gap: 12,
  },
  cameraGallery: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: colors.primary,
    backgroundColor: colors.background,
    marginTop: 8,
  },
  saveText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: "600",
  },
  closeText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
});

export default memo(ImageModal);
