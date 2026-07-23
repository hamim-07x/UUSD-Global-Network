import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

export const syncToFirebase = async (collection: string, id: string, data: any) => {
  try {
    await setDoc(doc(db, collection, id), data);
  } catch (error) {
    console.log(`Error syncing ${collection} to Firebase:`, error);
  }
};
