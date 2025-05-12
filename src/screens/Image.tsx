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

import type { CameraCapturedPicture } from "expo-camera";
import Sortable, {
  OrderChangeParams,
  SortableGridRenderItem,
} from "react-native-sortables";
import CameraScreen from "./Camera";
import { Images } from "@lib/images";

interface GridItemProps {
  item: Images;
  onDeleteImage: () => void;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: Images[];
  onSaved: (images: Images[]) => void;
}

const CARD_HEIGHT = 200;
const COLUMNS = 2;

const GridItem = memo(({ item, onDeleteImage }: GridItemProps) => {
  const imageSource = useMemo(
    () => ({
      uri:
        item.blob === "" ? item?.uri : `data:${item.type};base64,${item.blob}`,
    }),
    [item.type, item.blob, item?.uri],
  );

  return (
    <View style={styles.card}>
      <Image
        style={styles.image}
        source={imageSource}
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

const ImageModal = ({ isOpen, onClose, data, onSaved }: Props) => {
  const scrollableRef = useAnimatedRef<Animated.ScrollView>();
  const [state, dispatch] = useReducer(imageReducer, imageInitialState);
  const [showCamera, setShowCamera] = useState(false);

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
  }, [sectionImages]);

  const processPickedImages = useCallback(
    async (assets: ImagePicker.ImagePickerAsset[]) => {
      const timestamp = Date.now();

      const newImages = assets.map((asset, index) => ({
        name: asset.fileName || `Image-${index + 1}`,
        type: asset.mimeType || "image/jpeg",
        lastModified: timestamp,
        size: asset.fileSize || 0,
        id: `${timestamp}-${index}`,
        uri: asset.uri,
        blob: asset.base64 ?? "",
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
    [sectionImages],
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
                contentContainerStyle={styles.scrollContent}
              >
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
              </Animated.ScrollView>
              <View style={styles.footer}>
                <View style={styles.footerButton}>
                  <Button
                    onPress={() => setShowCamera(true)}
                    style={styles.cameraGallery}
                    title="Take Photo"
                    textStyle={styles.text}
                    icon="camera"
                  />
                  <Button
                    onPress={handleImagePick}
                    style={styles.cameraGallery}
                    title="Gallery"
                    textStyle={styles.text}
                    icon="image"
                  />
                </View>
                <View style={styles.footerButton}>
                  <Button
                    title="Close"
                    onPress={handleOnClose}
                    style={styles.closeButton}
                    textStyle={styles.closeText}
                  />
                  <Button
                    title="Save"
                    onPress={handleOnSaved}
                    style={styles.saveButton}
                    textStyle={styles.saveText}
                  />
                </View>
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
    paddingBottom: 140,
    paddingHorizontal: 12,
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
    height: CARD_HEIGHT,
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
    gap: 12,
  },
  saveButton: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: 12,
    marginTop: 0,
    marginBottom: 12,
  },
  closeButton: {
    flex: 1,
    backgroundColor: "#f1f3f5",
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 12,
    marginTop: 0,
    marginBottom: 12,
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
