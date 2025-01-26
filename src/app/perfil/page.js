"use client";
import { useState, useEffect } from "react";
import { auth } from "../../../firebase";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Timestamp } from "firebase/firestore";

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
    const [hasBasicInfo, setHasBasicInfo] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            if (user) {
                // Obtener datos adicionales de Firestore
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    console.log("Datos de Firestore:", userData);
                    setFormData({
                        firstName: userData.firstName || "",
                        lastName: userData.lastName || "",
                        birthDate: userData.birthDate?.toDate()?.toLocaleDateString('en-CA') || "",
                        photoPerfil: null,
                    });
                     setHasBasicInfo(true); //Indica que ya tiene la info básica
                } else {
                  setHasBasicInfo(false);
                }
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        if (type === "file") {
            setFormData({ ...formData, photoPerfil: e.target.files[0] });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {

            // 2. Subir foto de perfil a Firebase Storage (si hay)
            let profileImageUrl = null;
            if (formData.photoPerfil) {
                const storageRef = ref(storage, `/profileImages/${user.uid}`);
                const snapshot = await uploadBytes(storageRef, formData.photoPerfil);
                profileImageUrl = await getDownloadURL(snapshot.ref);
            }
            // 3. Actualizar el perfil de Auth
            await updateProfile(user, {
                displayName: `${formData.firstName} ${formData.lastName}`,
                photoURL: profileImageUrl || null
            });
            // 4. Guardar datos del usuario en Firestore
            const birthDate = formData.birthDate ? Timestamp.fromDate(new Date(formData.birthDate)) : null;
            const userDoc = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                birthDate: birthDate,
                photoURL: profileImageUrl || null,
                role: "user" // Rol por defecto
            };

            await setDoc(doc(db, "users", user.uid), userDoc);


            setEditMode(false);

        } catch (error) {
            console.error("Error al actualizar el perfil:", error);
            alert(`Error al actualizar el perfil: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div>Cargando...</div>;
    }

    if (!user) {
        return <div>No has iniciado sesión.</div>;
    }

      if (editMode) {
        return (
            <div className="container mx-auto p-4">
                <h2 className="text-2xl font-bold mb-4">Editar Perfil</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Nombre
                        </label>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Apellido
                        </label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Fecha de Nacimiento
                        </label>
                        <input
                            type="date"
                            name="birthDate"
                            value={formData.birthDate}
                            onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Foto de Perfil
                        </label>
                        <input
                            type="file"
                            name="photoPerfil"
                            accept="image/*"
                            onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
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
        );
    }

    return (
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-bold mb-4">Perfil</h2>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
          <div className="w-full md:w-1/3 flex justify-center">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="Foto de Perfil"
                className="rounded-full w-48 h-48 object-cover"
              />
            ) : (
              <div className="rounded-full w-48 h-48 bg-gray-200 flex items-center justify-center text-gray-500">
                Sin Foto
              </div>
            )}
          </div>
          <div className="w-full md:w-2/3">
            <p>
              <span className="font-bold">Nombre:</span> {formData.firstName}
            </p>
            <p>
              <span className="font-bold">Apellido:</span> {formData.lastName}
            </p>
            <p>
              <span className="font-bold">Correo Electrónico:</span> {user.email}
            </p>
              <p>
                <span className="font-bold">Fecha de Nacimiento:</span> {formData.birthDate}
            </p>
            <button
              type="button"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-4"
              onClick={() => {
                  setEditMode(true)
              }}
            >
              Editar Foto
            </button>
          </div>
        </div>
      </div>
    );
};

export default ProfilePage;