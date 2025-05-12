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
import { Image, Modal, StyleSheet, ToastAndroid, View } from "react-native";
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
  return (
    <View style={styles.card}>
      <Image
        style={styles.image}
        source={{ uri: item.uri }}
        resizeMode="cover"
        fadeDuration={300}
        accessibilityLabel={`Image ${item.id}`}
      />
      <Sortable.Pressable style={styles.deleteButton} onPress={onDeleteImage}>
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
  const CARD_HEIGHT = useMemo(() => (isLandscape ? 150 : 200), [isLandscape]);

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
        // Pass CARD_HEIGHT to GridItem if its style depends on it
      />
    ),
    [eventHandlers /*, CARD_HEIGHT if passed */],
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
      });

      if (result.canceled) {
        ToastAndroid.show(`You did not select any image`, ToastAndroid.SHORT);
        return;
      }

      await processPickedImages(result.assets);
    } catch (error) {
      console.error("Error picking images:", error);
      ToastAndroid.show("Failed to process images", ToastAndroid.SHORT);
    }
  }, [sectionImages]); // Removed processPickedImages from here as it's defined below

  const processPickedImages = useCallback(
    async (
      assets: ImagePicker.ImagePickerAsset[] | CameraCapturedPicture[],
    ) => {
      const timestamp = Date.now();

      const newImages = assets.map((asset, index) => ({
        name:
          (asset as ImagePicker.ImagePickerAsset).fileName ||
          `Image-${index + 1}`,
        type: (asset as ImagePicker.ImagePickerAsset).mimeType || "image/jpeg",
        lastModified: timestamp,
        size: (asset as ImagePicker.ImagePickerAsset).fileSize || 0,
        id: `${timestamp}-${index}`,
        uri: asset.uri,
        blob: (asset as ImagePicker.ImagePickerAsset).base64 ?? "",
      }));

      try {
        dispatch({
          type: "SET_MODAL_DATA",
          payload: {
            sectionImages: [...sectionImages, ...newImages],
          },
        });
        scrollableRef.current?.scrollToEnd({
          animated: true,
        });
      } catch (error) {
        console.error("Error processing images:", error);
        ToastAndroid.show("Failed to process images", ToastAndroid.SHORT);
      }
    },
    [sectionImages, scrollableRef], // Added scrollableRef
  );

  const handleCameraSave = useCallback(
    async (images: Array<CameraCapturedPicture>) => {
      setShowCamera(false);
      await processPickedImages(images);
    },
    [processPickedImages],
  );

  const keyExtractor = useCallback((item: Images) => item.id, []);

  // Dynamic styles for GridItem image if CARD_HEIGHT is used
  const gridItemImageStyle = useMemo(
    () => ({
      width: "100%",
      height: CARD_HEIGHT,
    }),
    [CARD_HEIGHT],
  );

  // Update GridItem to use dynamic CARD_HEIGHT if necessary
  // For this example, I'll assume styles.image in GridItem will adapt or you'll pass gridItemImageStyle
  // If GridItem's internal style for image needs CARD_HEIGHT, you'd pass it as a prop.
  // For simplicity, let's assume styles.image is sufficient or update GridItem separately.

  if (showCamera) {
    return (
      <View>
        <Modal
          visible={isOpen}
          statusBarTranslucent
          animationType="slide"
          onRequestClose={() => setShowCamera(false)}
        >
          <CameraScreen
            onClose={() => setShowCamera(false)}
            onFinish={handleCameraSave}
          />
        </Modal>
      </View>
    );
  }

  return (
    <View>
      <Modal
        visible={isOpen}
        statusBarTranslucent
        animationType="slide"
        onRequestClose={handleOnClose}
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
                ]}
              >
                <Sortable.Grid
                  onOrderChange={handleOrderChange}
                  columnGap={10}
                  columns={COLUMNS} // Use dynamic COLUMNS
                  data={sectionImages}
                  renderItem={renderItem}
                  rowGap={10}
                  keyExtractor={keyExtractor}
                  scrollableRef={scrollableRef}
                />
              </Animated.ScrollView>
              <View
                style={[styles.footer, isLandscape && styles.footerLandscape]}
              >
                {isLandscape ? (
                  <View style={styles.footerRowLandscape}>
                    <Button
                      onPress={() => setShowCamera(true)}
                      style={{
                        ...styles.footerButtonLandscape,
                        ...styles.cameraGalleryLandscape,
                      }}
                      title="Take Photo"
                      textStyle={styles.text}
                      icon="camera"
                    />
                    <Button
                      onPress={handleImagePick}
                      style={{
                        ...styles.footerButtonLandscape,
                        ...styles.cameraGalleryLandscape,
                      }}
                      title="Gallery"
                      textStyle={styles.text}
                      icon="image"
                    />
                    <Button
                      title="Close"
                      onPress={handleOnClose}
                      style={{
                        ...styles.footerButtonLandscape,
                        ...styles.closeButtonLandscape,
                      }}
                      textStyle={styles.closeText}
                    />
                    <Button
                      title="Save"
                      onPress={handleOnSaved}
                      style={{
                        ...styles.footerButtonLandscape,
                        ...styles.saveButtonLandscape,
                      }}
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
                      />
                      <Button
                        onPress={handleImagePick}
                        style={styles.cameraGalleryPortrait}
                        title="Gallery"
                        textStyle={styles.text}
                        icon="image"
                      />
                    </View>
                    <View style={styles.footerRowPortrait}>
                      <Button
                        title="Close"
                        onPress={handleOnClose}
                        style={styles.closeButtonPortrait}
                        textStyle={styles.closeText}
                      />
                      <Button
                        title="Save"
                        onPress={handleOnSaved}
                        style={styles.saveButtonPortrait}
                        textStyle={styles.saveText}
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
    // paddingBottom: 140, // Adjust if footer height changes significantly
    paddingHorizontal: 12,
  },
  scrollContentLandscape: {
    // paddingBottom: 80, // Example: Shorter footer in landscape
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
    // This style is inside GridItem, if it uses CARD_HEIGHT, GridItem needs update
    width: "100%",
    // height: CARD_HEIGHT, // If CARD_HEIGHT is dynamic, this needs to be handled in GridItem
    // For now, assuming GridItem's image style is flexible or uses a fixed height
    // that works for both orientations, or you pass CARD_HEIGHT as a prop to GridItem.
  },
  deleteButton: {
    position: "absolute",
    right: 8,
    top: 8,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
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
    color: colors.background,
  },
  footerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    gap: 12,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    paddingVertical: 8, // Added padding
  },
  footerLandscape: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  footerRowPortrait: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    marginBottom: 8, // Gap between rows in portrait
  },
  footerRowLandscape: {
    flexDirection: "row",
    justifyContent: "space-around", // Or space-between
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
    backgroundColor: "#f1f3f5",
    borderWidth: 1,
    borderColor: "#dee2e6",
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
    backgroundColor: "#f1f3f5",
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  saveButtonLandscape: {
    backgroundColor: colors.primary,
  },
  saveText: {
    fontSize: 16,
    color: colors.background,
    fontWeight: "600",
  },
  closeText: {
    fontSize: 16,
    color: "#495057",
    fontWeight: "600",
  },
  cameraGallery: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: colors.primary,
    backgroundColor: colors.background,
    marginTop: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
});

export default memo(ImageModal);
