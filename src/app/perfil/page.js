"use client";
import { useState, useEffect } from "react";
import { auth } from "../../../firebase";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    Timestamp
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Link from "next/link";

const db = getFirestore();
const storage = getStorage();

const ProfilePage = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        birthDate: "",
        photoPerfil: null,
    });
    const [userRole, setUserRole] = useState("user");

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            if (user) {
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    const birthDate = userData.birthDate ? userData.birthDate.toDate().toLocaleDateString('en-CA') : "";
                    setFormData({
                        firstName: userData.firstName || "",
                        lastName: userData.lastName || "",
                        birthDate: birthDate,
                        photoPerfil: null,
                    });
                    setUserRole(userData.role || "user");
                }
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleChange = (e) => {
        const { name, value, type } = e.target;

        if (type === "file") {
            setFormData(prevFormData => ({ ...prevFormData, photoPerfil: e.target.files[0] }));
        } else {
            setFormData(prevFormData => ({ ...prevFormData, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let profileImageUrl = user.photoURL;

            if (formData.photoPerfil) {
                const storageRef = ref(storage, `profileImages/${user.uid}`);
                const snapshot = await uploadBytes(storageRef, formData.photoPerfil);
                profileImageUrl = await getDownloadURL(snapshot.ref);
            }

            await updateProfile(user, {
                displayName: `${formData.firstName} ${formData.lastName}`,
                photoURL: profileImageUrl
            });

            const birthDate = formData.birthDate
                ? Timestamp.fromDate(new Date(formData.birthDate + 'T00:00:00'))
                : null;

            const userDoc = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                birthDate: birthDate,
                photoURL: profileImageUrl,
                role: userRole // Keep the current role
            };

            await setDoc(doc(db, "users", user.uid), userDoc);

            setEditMode(false);
        } catch (error) {
            console.error("Error updating profile:", error);
            alert(`Error updating profile: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const today = new Date();
    const birthDate = formData.birthDate ? new Date(formData.birthDate) : null;

    const isBirthday = birthDate &&
        today.getUTCDate() === birthDate.getUTCDate() &&
        today.getUTCMonth() === birthDate.getUTCMonth();

    if (loading) {
        return <div>Cargando...</div>;
    }

    if (!user) {
        return (
             <div className="flex justify-center items-center py-8">
              <div className="container mx-auto p-6 bg-pink-100 rounded-lg shadow-lg">
                <p>
                    Debes <Link href="/login" className="text-blue-500">iniciar sesión</Link> para ver tu perfil.
                </p>
               </div>
            </div>
        )
    }

    if (editMode) {
        return (
            <div className="flex justify-center items-center py-8">
               <div className="container mx-auto p-6 bg-white rounded-lg shadow-lg max-w-md">
                <h2 className="text-3xl font-bold text-center text-pink-600 mb-4">Editar Perfil</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-pink-600 font-medium mb-2">
                            Nombre
                        </label>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            className="shadow-lg border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-pink-600 font-medium mb-2">
                            Apellido
                        </label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            className="shadow-lg border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-pink-600 font-medium mb-2">
                            Fecha de Nacimiento
                        </label>
                        <input
                            type="date"
                            name="birthDate"
                            value={formData.birthDate}
                            onChange={handleChange}
                            className="shadow-lg border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-pink-600 font-medium mb-2">
                            Foto de Perfil
                        </label>
                        <input
                            type="file"
                            name="photoPerfil"
                            accept="image/*"
                            onChange={handleChange}
                            className="shadow-lg border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"

                        />
                    </div>

                    <button
                        type="submit"
                        className="bg-pink-500 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
                        disabled={loading}
                    >
                        {loading ? "Cargando..." : "Guardar Cambios"}
                    </button>
                    <button
                        type="button"
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ml-2"
                        onClick={() => {
                            setEditMode(false);
                        }}
                    >
                        Cancelar
                    </button>
                </form>
            </div>
           </div>
        );
    }

    return (
          <div className="flex justify-center items-center py-12">
              <div className="container mx-auto p-4 md:p-6 bg-white rounded-lg shadow-lg max-w-md">
            <h2 className="text-3xl font-bold text-center text-pink-600 mb-4">Perfil</h2>

            <div className="flex flex-col items-center gap-4">
                <div className="w-48 h-48 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                    {user?.photoURL ? (
                        <img
                            src={user.photoURL}
                            alt="Foto de Perfil"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                         <p className="text-gray-500">Sin foto</p>
                    )}
                </div>

                <div className="w-full text-center">
                     <p className="mb-2">
                         <span className="font-bold text-pink-600">Nombre:</span> {formData.firstName}
                    </p>
                    <p className="mb-2">
                         <span className="font-bold text-pink-600">Apellido:</span> {formData.lastName}
                    </p>
                    <p className="mb-2">
                         <span className="font-bold text-pink-600">Correo Electrónico:</span> {user.email}
                    </p>
                    <p className="mb-2">
                        <span className="font-bold text-pink-600">Fecha de Nacimiento:</span> {formData.birthDate}
                    </p>


                    {isBirthday && (
                        <div className="bg-pink-200 p-4 rounded-md mt-4 text-center">
                            <p className="text-xl font-bold text-pink-700">¡Feliz Cumpleaños! 🎉</p>
                            <p className="text-pink-600">Que tengas un día maravilloso.</p>
                        </div>
                    )}

                    <button
                        type="button"
                        className="bg-pink-500 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-4"
                        onClick={() => {
                            setEditMode(true);
                        }}
                    >
                        Editar Perfil
                    </button>
                </div>
            </div>
        </div>
          </div>
    );
};

export default ProfilePage;