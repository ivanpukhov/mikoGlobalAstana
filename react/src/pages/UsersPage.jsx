import React, { useState, useEffect } from "react";
import { Table, Button, Typography, message, Popconfirm } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

const { Title } = Typography;

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const { data } = await api.get("/users");
            setUsers(data);
        } catch (error) {
            console.error("Ошибка загрузки пользователей:", error);
            message.error("Не удалось загрузить список пользователей.");
        } finally {
            setLoading(false);
        }
    };

    const deleteUser = async (id) => {
        try {
            await api.delete(`/users/${id}`);
            message.success("Пользователь успешно удалён.");
            setUsers((prevUsers) => prevUsers.filter((user) => user.id !== id));
        } catch (error) {
            console.error("Ошибка удаления пользователя:", error);
            message.error("Не удалось удалить пользователя.");
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const columns = [
        {
            title: "Имя",
            dataIndex: "name",
            key: "name",
        },
        {
            title: "Номер телефона",
            dataIndex: "phoneNumber",
            key: "phoneNumber",
        },
        {
            title: "Город",
            dataIndex: ["city", "name"],
            key: "city",
        },
        {
            title: "Действия",
            key: "actions",
            render: (_, record) => (
                <Popconfirm
                    title="Вы уверены, что хотите удалить этого пользователя?"
                    onConfirm={() => deleteUser(record.id)}
                    okText="Да"
                    cancelText="Нет"
                >
                    <Button type="primary" danger>
                        Удалить
                    </Button>
                </Popconfirm>
            ),
        },
    ];

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <Title level={3}>Пользователи</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/admin/users/create")}>
                    Добавить пользователя
                </Button>
            </div>
            <Table
                columns={columns}
                dataSource={users}
                rowKey={(record) => record.id}
                loading={loading}
                pagination={{ pageSize: 10 }}
            />
        </div>
    );
};

export default UsersPage;
