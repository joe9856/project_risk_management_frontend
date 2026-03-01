import { useState, useEffect } from "react";
import { getAdminUsers, updateAdminUser, deleteAdminUser, createAdminUser } from "./api";

export default function AdminUsers({ addToast }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState(null);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user' });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await getAdminUsers();
            if (res.success) setUsers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const res = await createAdminUser(newUser);
            if (res.success) {
                addToast("สร้างสำเร็จ", `ผู้ใช้งาน ${newUser.name} ถูกสร้างแล้ว รหัสผ่านคือ: ${newUser.password || '123456'}`, "success");
                setIsAddingNew(false);
                setNewUser({ name: '', email: '', password: '', role: 'user' });
                fetchUsers();
            } else {
                addToast("เกิดข้อผิดพลาด", res.message, "error");
            }
        } catch (err) {
            addToast("Error", "ไม่สามารถเชื่อมต่อฐานข้อมูลได้", "error");
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const res = await updateAdminUser(editingUser.id, editingUser);
            if (res.success) {
                addToast("อัปเดตสำเร็จ", "ข้อมูลผู้ใช้ถูกปรับปรุงเรียบร้อยแล้ว", "success");
                setEditingUser(null);
                fetchUsers();
            }
        } catch (err) {
            addToast("Error", "ไม่สามารถอัปเดตข้อมูลได้", "error");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้นี้?")) return;
        try {
            const res = await deleteAdminUser(id);
            if (res.success) {
                addToast("ลบสำเร็จ", "บัญชีผู้ใช้ถูกลบออกจากระบบแล้ว", "success");
                fetchUsers();
            } else {
                addToast("ข้อผิดพลาด", res.message, "error");
            }
        } catch (err) {
            addToast("Error", "เกิดข้อผิดพลาดในการลบข้อมูล", "error");
        }
    };

    if (loading) return <div style={{ padding: "2rem", textAlign: "center" }}>กำลังโหลดรายชื่อผู้ใช้...</div>;

    return (
        <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto", background: "#f8fafc", minHeight: "100vh" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <h2 style={{ color: "#1e293b" }}>จัดการผู้ใช้งาน (User Management)</h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span style={{ fontSize: "0.9rem", color: "#64748b" }}>รวม {users.length} คน</span>
                    <button
                        onClick={() => setIsAddingNew(true)}
                        style={{ padding: '0.6rem 1.2rem', borderRadius: '0.75rem', border: 'none', background: '#2563eb', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        ＋ เพิ่มผู้ใช้งานใหม่
                    </button>
                </div>
            </div>

            <div style={{ background: "white", borderRadius: "1rem", overflow: "hidden", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ background: "#f1f5f9", borderBottom: "1px solid #e2e8f0" }}>
                            <th style={{ padding: "1rem", textAlign: "left", color: "#64748b" }}>ID</th>
                            <th style={{ padding: "1rem", textAlign: "left", color: "#64748b" }}>ชื่อ-นามสกุล</th>
                            <th style={{ padding: "1rem", textAlign: "left", color: "#64748b" }}>อีเมล</th>
                            <th style={{ padding: "1rem", textAlign: "left", color: "#64748b" }}>สิทธิ์ (Role)</th>
                            <th style={{ padding: "1rem", textAlign: "center", color: "#64748b" }}>จัดการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => (
                            <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                <td style={{ padding: "1rem", color: "#64748b" }}>{u.id}</td>
                                <td style={{ padding: "1rem", fontWeight: "600", color: "#1e293b" }}>{u.name}</td>
                                <td style={{ padding: "1rem", color: "#64748b" }}>{u.email}</td>
                                <td style={{ padding: "1rem" }}>
                                    <span style={{
                                        padding: "0.25rem 0.6rem", borderRadius: "1rem", fontSize: "0.75rem", fontWeight: "bold",
                                        background: u.role === "admin" ? "#fee2e2" : "#e0f2fe",
                                        color: u.role === "admin" ? "#ef4444" : "#0369a1"
                                    }}>
                                        {u.role.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: "1rem", textAlign: "center" }}>
                                    <button onClick={() => setEditingUser(u)} style={{ marginRight: "0.5rem", padding: "0.4rem 0.8rem", borderRadius: "0.5rem", border: "1px solid #3b82f6", background: "transparent", color: "#2563eb", cursor: "pointer" }}>แก้ไข</button>
                                    <button onClick={() => handleDelete(u.id)} style={{ padding: "0.4rem 0.8rem", borderRadius: "0.5rem", border: "1px solid #ef4444", background: "transparent", color: "#ef4444", cursor: "pointer" }}>ลบ</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal เพิ่ม User ใหม่ */}
            {isAddingNew && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: "450px" }}>
                        <h3 style={{ marginBottom: "1.5rem" }}>สร้างผู้ใช้งานใหม่</h3>
                        <form onSubmit={handleCreate}>
                            <div style={{ marginBottom: "1rem" }}>
                                <label style={{ display: "block", fontSize: "0.9rem", color: "#64748b" }}>ชื่อ-นามสกุล</label>
                                <input
                                    type="text" required value={newUser.name}
                                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                    placeholder="เช่น สมชาย ใจดี"
                                    style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0" }}
                                />
                            </div>
                            <div style={{ marginBottom: "1rem" }}>
                                <label style={{ display: "block", fontSize: "0.9rem", color: "#64748b" }}>อีเมล</label>
                                <input
                                    type="email" required value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    placeholder="user@example.com"
                                    style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0" }}
                                />
                            </div>
                            <div style={{ marginBottom: "1rem" }}>
                                <label style={{ display: "block", fontSize: "0.9rem", color: "#64748b" }}>รหัสผ่าน (ถ้าว่างจะเป็น 123456)</label>
                                <input
                                    type="password" value={newUser.password}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                    style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0" }}
                                />
                            </div>
                            <div style={{ marginBottom: "2rem" }}>
                                <label style={{ display: "block", fontSize: "0.9rem", color: "#64748b" }}>สิทธิ์ (Role)</label>
                                <select
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                    style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0" }}
                                >
                                    <option value="user">USER</option>
                                    <option value="admin">ADMIN</option>
                                </select>
                            </div>
                            <div style={{ display: "flex", gap: "1rem" }}>
                                <button type="button" onClick={() => setIsAddingNew(false)} style={{ flex: 1, padding: "0.8rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", background: "white", cursor: "pointer" }}>ยกเลิก</button>
                                <button type="submit" style={{ flex: 1, padding: "0.8rem", borderRadius: "0.5rem", border: "none", background: "#2563eb", color: "white", fontWeight: "bold", cursor: "pointer" }}>สร้างบัญชี</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal แก้ไข User */}
            {editingUser && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: "450px" }}>
                        <h3 style={{ marginBottom: "1.5rem" }}>แก้ไขข้อมูลผู้ใช้งาน</h3>
                        <form onSubmit={handleUpdate}>
                            <div style={{ marginBottom: "1rem" }}>
                                <label style={{ display: "block", fontSize: "0.9rem", color: "#64748b" }}>ชื่อ</label>
                                <input
                                    type="text" value={editingUser.name}
                                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                                    style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0" }}
                                />
                            </div>
                            <div style={{ marginBottom: "1rem" }}>
                                <label style={{ display: "block", fontSize: "0.9rem", color: "#64748b" }}>อีเมล</label>
                                <input
                                    type="email" value={editingUser.email}
                                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                                    style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0" }}
                                />
                            </div>
                            <div style={{ marginBottom: "2rem" }}>
                                <label style={{ display: "block", fontSize: "0.9rem", color: "#64748b" }}>สิทธิ์ (Role)</label>
                                <select
                                    value={editingUser.role}
                                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                                    style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0" }}
                                >
                                    <option value="user">USER</option>
                                    <option value="admin">ADMIN</option>
                                </select>
                            </div>
                            <div style={{ display: "flex", gap: "1rem" }}>
                                <button type="button" onClick={() => setEditingUser(null)} style={{ flex: 1, padding: "0.8rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", background: "white", cursor: "pointer" }}>ยกเลิก</button>
                                <button type="submit" style={{ flex: 1, padding: "0.8rem", borderRadius: "0.5rem", border: "none", background: "#2563eb", color: "white", fontWeight: "bold", cursor: "pointer" }}>บันทึก</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
