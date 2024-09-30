import { get, writable } from "svelte/store";
import { firebaseApp } from ".";
import { collection, CollectionReference, doc, getDoc, getFirestore, limit, onSnapshot, orderBy, query, setDoc, Timestamp } from "firebase/firestore";
import type { User } from "firebase/auth";
import type { FirestoreUser } from "../types/firestore_user";
import { v4 } from "uuid";
import type { Message } from "../types/message";

export const firestore = getFirestore(firebaseApp);

export const currentFirestoreUser = writable<FirestoreUser | null>(null);

const userCollection = collection(firestore, "users") as CollectionReference<FirestoreUser>;

export async function userChanges(user: User | null) {
    if (user === null) {
        currentFirestoreUser.set(null);
        return;
    }

    const userDocRef = doc(userCollection, user.uid);
    const userSnapshot = await getDoc(userDocRef);

    if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        currentFirestoreUser.set(userData);
        return;
    }

    const userData: FirestoreUser = {
        name: user.displayName || "User " + v4(),
        uid: user.uid,
        email: user.email || "",
        display_image_url: user.photoURL || null,
    }

    await setDoc(userDocRef, userData);
    currentFirestoreUser.set(userData);
}

const messageCollection = collection(firestore, "messages") as CollectionReference<Message>;

export async function sendMessage(content: string) {
    let userid = get(currentFirestoreUser)?.uid;

    if (userid === null) {
        return;
    }

    const docId = v4();
    const docRef = doc(firestore, "messages", docId);

    const docBody: Message = {
        content,
        date: new Date(),
        uid: docId,
        userid: userid!
    }

    await setDoc(docRef, docBody);
}

export const messagesState = writable<Message[]>([], (setState) => {
    const messagesQuery = query(messageCollection,
        orderBy("date", "desc"), limit(30));

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        setState(snapshot.docs.map((doc) => doc.data() as Message));
    });

    return unsubscribe;
});

export async function getUserData(userid: string) {
    const userDoc = doc(userCollection, userid);

    return (await getDoc(userDoc)).data();
}
