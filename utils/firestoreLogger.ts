import AsyncStorage from '@react-native-async-storage/async-storage';

let readCount = 0;

export const logFirestoreRead = async (count: number = 1) => {
  readCount += count;
  console.log(`Firestore read count: ${readCount}`);
  await AsyncStorage.setItem('firestoreReadCount', readCount.toString());
};

export const getFirestoreReadCount = async (): Promise<number> => {
  const storedCount = await AsyncStorage.getItem('firestoreReadCount');
  return storedCount ? parseInt(storedCount, 10) : 0;
};

export const resetFirestoreReadCount = async () => {
  readCount = 0;
  await AsyncStorage.setItem('firestoreReadCount', '0');
};
