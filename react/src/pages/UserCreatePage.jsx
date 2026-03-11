import React, { useState, useEffect } from "react";
import { Form, Input, Button, Select, Typography, message } from "antd";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

const { Title } = Typography;
const { Option } = Select;

const UserCreatePage = () => {
    const [loading, setLoading] = useState(false);
    const [cities, setCities] = useState([]);
    const navigate = useNavigate();

    const fetchCities = async () => {
        try {
            const { data } = await api.get("/cities");
            setCities(data);
        } catch (error) {
            console.error("Ошибка загрузки городов:", error);
            message.error("Не удалось загрузить список городов.");
        }
    };

    useEffect(() => {
        fetchCities();
    }, []);

    const handleSubmit = async (values) => {
        try {
            setLoading(true);

            const payload = {
                ...values,
                cityId: values.cityId === "all" ? null : values.cityId
            };

            await api.post("/users/create", payload);
            message.success("Пользователь успешно добавлен.");
            navigate("/admin/users");
        } catch (error) {
            console.error("Ошибка добавления пользователя:", error);
            message.error(error.response?.data?.message || "Не удалось добавить пользователя.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
            <Title level={3}>Добавить нового пользователя</Title>
            <Form layout="vertical" onFinish={handleSubmit}>
                <Form.Item
                    label="Имя"
                    name="name"
                    rules={[{ required: true, message: "Введите имя пользователя." }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    label="Номер телефона"
                    name="phoneNumber"
                    rules={[
                        { required: true, message: "Введите номер телефона." },
                        { pattern: /^\+?\d{10,15}$/, message: "Введите корректный номер телефона." },
                    ]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    label="Город"
                    name="cityId"
                    rules={[{ required: true, message: "Выберите город." }]}
                >
                    <Select placeholder="Выберите город">
                        <Option key="all" value="all">
                            Все города
                        </Option>
                        {cities.map((city) => (
                            <Option key={city.id} value={city.id}>
                                {city.name}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        Добавить
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};

export default UserCreatePage;
