import React, { useState } from "react";
import { Form, Input, Button, Typography, message } from "antd";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

const { Title } = Typography;

const LoginPage = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (values) => {
        try {
            setLoading(true);
            const { data } = await api.post("/users/login", values);
            const city = data.user.cityId === null ? "all" : data.user.cityId.toString();

            localStorage.setItem("token", data.token);
            localStorage.setItem("adminName", data.user.name);
            localStorage.setItem("phoneNumber", data.user.phoneNumber);
            localStorage.setItem("adminCity", city);

            message.success(data.message || "Успешный вход");
            navigate(`/admin/statistics?city=${city}`);
        } catch (error) {
            console.error("Ошибка авторизации:", error);
            message.error("Ошибка входа. Проверьте данные.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
            <div style={{ width: "100%", maxWidth: "400px" }}>
                <Title level={3}>Вход в админку</Title>
                <Form onFinish={handleLogin} layout="vertical">
                    <Form.Item
                        label="Номер телефона"
                        name="phoneNumber"
                        rules={[
                            { required: true, message: "Введите номер телефона" },
                            { pattern: /^\+?\d{10,15}$/, message: "Введите корректный номер телефона" },
                        ]}
                    >
                        <Input placeholder="+77012345678" />
                    </Form.Item>
                    <Form.Item
                        label="Пароль"
                        name="password"
                        rules={[{ required: true, message: "Введите пароль" }]}
                    >
                        <Input.Password />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block>
                            Войти
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        </div>
    );
};

export default LoginPage;
