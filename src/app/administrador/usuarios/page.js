"use client";
import { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../../firebase'; // Import your Firebase config
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../../firebase';
import { createUserWithEmailAndPassword, } from 'firebase/auth';
import { deleteUser } from "firebase/auth"

const UsuariosPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [newUser, setNewUser] = useState({ firstName: '', lastName: '', email: '', birthDate: '', password: '' });
    const [editingUsers, setEditingUsers] = useState({});

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            setIsAdmin(false);
            if (user) {
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    setIsAdmin(userData.role === 'admin');
                }
            }
        });

        return () => unsubscribe();
    }, []);


    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const usersCollection = collection(db, 'users');
                const usersSnapshot = await getDocs(usersCollection);
                const usersData = usersSnapshot.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        firstName: data.firstName || '',
                        lastName: data.lastName || '',
                        email: data.email || '',
                        birthDate: data.birthDate ? data.birthDate.toDate().toLocaleDateString('en-CA') : '',
                        photoURL: data.photoURL || '',
                        role: data.role || 'user',
                        authId: data.authId || null
                    };
                });
                setUsers(usersData);
            } catch (error) {
                console.error('Error fetching users:', error);
                alert(`Error al obtener usuarios: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);


    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewUser({ ...newUser, [name]: value });
    };


    const handleAddUser = async () => {
        try {
            // Create user in Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, newUser.email, newUser.password);
            const user = userCredential.user;

            // Add user document to Firestore
            const userDoc = await addDoc(collection(db, 'users'), {
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                email: newUser.email,
                birthDate: newUser.birthDate ? new Date(newUser.birthDate) : null,
                role: 'user',
                authId: user.uid
            });
            setUsers([...users, { id: userDoc.id, ...newUser, role: 'user', authId: user.uid }]);
            setNewUser({ firstName: '', lastName: '', email: '', birthDate: '', password: '' });
        } catch (error) {
            console.error('Error adding user:', error);
            alert(`Error al agregar usuario: ${error.message}`);
        }
    };


    const handleEditToggle = (userId) => {
        setEditingUsers(prevEditingUsers => ({
            ...prevEditingUsers,
            [userId]: !prevEditingUsers[userId]
        }));
    };

    const handleUpdateUser = async (id, updatedUser) => {
        try {
            const userDoc = doc(db, 'users', id);
            await updateDoc(userDoc, updatedUser);
            setUsers(prevUsers => {
                return prevUsers.map(user =>
                    user.id === id ? { ...user, ...updatedUser } : user
                );
            });
            setEditingUsers(prevEditingUsers => ({
                ...prevEditingUsers,
                [id]: false
            }));
        } catch (error) {
            console.error('Error updating user:', error);
            alert(`Error al actualizar usuario: ${error.message}`);
        }
    };


    const handleDeleteUser = async (id) => {
        try {
            const userToDelete = users.find(user => user.id === id);
            if (!userToDelete || !userToDelete.authId) {
                console.error("No se encontro el usuario en auth con el id", id);
                alert("No se encontro el usuario en auth");
                return;
            }
            const userAuth = auth.currentUser;
            if (userAuth && userAuth.uid === userToDelete.authId) {
                console.error("No se puede borrar el usuario en auth");
                alert("No se puede borrar el usuario en auth");
                return
            }

          // Fetch the user using their authId (UID)
            const userAuthToDelete = await auth.currentUser;
            if (userAuthToDelete) {
              try {
               await deleteUser(userAuthToDelete);
              } catch (error){
                   console.error("Error deleting user from authentication:", error);
                alert(`Error al eliminar usuario de autenticación: ${error.message}`);
              }
            }
            // Delete the user's document from Firestore
            await deleteDoc(doc(db, 'users', id));

            setUsers(users.filter(user => user.id !== id));
        } catch (error) {
            console.error("Error deleting user:", error);
            alert(`Error al eliminar usuario: ${error.message}`);
        }
    };


    if (loading) {
        return <div>Cargando Usuarios...</div>;
    }
    if (!currentUser || !isAdmin) {
        return (
            <div className="container mx-auto p-6 bg-pink-100 rounded-lg shadow-lg">
                <p>No tienes permisos para ver esta página</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-6 bg-pink-100 rounded-lg shadow-lg">
            <h2 className="text-3xl font-bold text-center text-pink-600 mb-4">Lista de Usuarios</h2>
            <div className="mb-4">
                <input
                    type="text"
                    name="firstName"
                    placeholder="Nombre"
                    value={newUser.firstName}
                    onChange={handleInputChange}
                    className="mr-2 p-2 border rounded"
                />
                <input
                    type="text"
                    name="lastName"
                    placeholder="Apellido"
                    value={newUser.lastName}
                    onChange={handleInputChange}
                    className="mr-2 p-2 border rounded"
                />
                <input
                    type="email"
                    name="email"
                    placeholder="Correo"
                    value={newUser.email}
                    onChange={handleInputChange}
                    className="mr-2 p-2 border rounded"
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Contraseña"
                    value={newUser.password}
                    onChange={handleInputChange}
                    className="mr-2 p-2 border rounded"
                />
                <input
                    type="date"
                    name="birthDate"
                    placeholder="Fecha de Nacimiento"
                    value={newUser.birthDate}
                    onChange={handleInputChange}
                    className="mr-2 p-2 border rounded"
                />
                <button onClick={handleAddUser} className="p-2 bg-pink-600 text-white rounded">Agregar Usuario</button>
            </div>
            {users.length === 0 ? (
                <p className="text-center">No hay usuarios registrados.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white shadow rounded-lg">
                        <thead className="bg-pink-200">
                            <tr>
                                <th className="py-2 px-4 border-b text-left">Nombre</th>
                                <th className="py-2 px-4 border-b text-left">Apellido</th>
                                <th className="py-2 px-4 border-b text-left">Fecha de Nacimiento</th>
                                <th className="py-2 px-4 border-b text-left">Correo</th>
                                <th className="py-2 px-4 border-b text-left">Rol</th>
                                <th className="py-2 px-4 border-b text-left">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-pink-50">
                                    <td className="py-2 px-4 border-b">
                                        {editingUsers[user.id] ? (
                                            <input
                                                type="text"
                                                value={user.firstName}
                                                onChange={(e) => handleUpdateUser(user.id, { ...user, firstName: e.target.value })}
                                                className="p-1 border rounded"
                                            />
                                        ) : (
                                            <span>{user.firstName}</span>
                                        )}
                                    </td>
                                    <td className="py-2 px-4 border-b">
                                        {editingUsers[user.id] ? (
                                            <input
                                                type="text"
                                                value={user.lastName}
                                                onChange={(e) => handleUpdateUser(user.id, { ...user, lastName: e.target.value })}
                                                className="p-1 border rounded"
                                            />
                                        ) : (
                                            <span>{user.lastName}</span>
                                        )}
                                    </td>
                                    <td className="py-2 px-4 border-b">
                                        {editingUsers[user.id] ? (
                                            <input
                                                type="date"
                                                value={user.birthDate}
                                                onChange={(e) => handleUpdateUser(user.id, { ...user, birthDate: e.target.value })}
                                                className="p-1 border rounded"
                                            />
                                        ) : (
                                            <span>{user.birthDate}</span>
                                        )}
                                    </td>
                                    <td className="py-2 px-4 border-b">
                                        {editingUsers[user.id] ? (
                                            <input
                                                type="email"
                                                value={user.email}
                                                onChange={(e) => handleUpdateUser(user.id, { ...user, email: e.target.value })}
                                                className="p-1 border rounded"
                                            />
                                        ) : (
                                            <span>{user.email}</span>
                                        )}
                                    </td>
                                    <td className="py-2 px-4 border-b">
                                        {editingUsers[user.id] ? (
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleUpdateUser(user.id, { ...user, role: e.target.value })}
                                                className="p-1 border rounded"
                                            >
                                                <option value="user">User</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        ) : (
                                            <span>{user.role}</span>
                                        )}
                                    </td>
                                    <td className="py-2 px-4 border-b">
                                        {editingUsers[user.id] ? (
                                            <button onClick={() => handleEditToggle(user.id)} className="p-2 bg-gray-600 text-white rounded mr-1">
                                                Cancelar
                                            </button>
                                        ) : (
                                            <button onClick={() => handleEditToggle(user.id)} className="p-2 bg-blue-600 text-white rounded mr-1">
                                                Editar
                                            </button>
                                        )}
                                        <button onClick={() => handleDeleteUser(user.id)} className="p-2 bg-red-600 text-white rounded">Eliminar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default UsuariosPage;