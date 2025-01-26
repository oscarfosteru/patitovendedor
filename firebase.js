import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyDSasQDWO0NhuHOB8DS5g36ag6fnjIKCII",
    authDomain: "sunflowext.firebaseapp.com",
    projectId: "sunflowext",
    storageBucket: "sunflowext.firebasestorage.app",
    messagingSenderId: "277670465533",
    appId: "1:277670465533:web:2b1fd52587ecfec3201394"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage }; // exportamos los modulos auth, db y storage para usarlo en otras partes de la app
export default app; // exportamos la app de firebase para usarla en otras partes de la app