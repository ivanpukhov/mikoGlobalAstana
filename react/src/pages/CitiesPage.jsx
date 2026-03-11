import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input } from "antd";
import api from "../api/api";

const CitiesPage = () => {
    const [cities, setCities] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();

    const fetchCities = async () => {
        try {
            const { data } = await api.get("/cities");
            setCities(data);
        } catch (error) {
            console.error("Ошибка загрузки городов:", error);
        }
    };

    const handleAddCity = async (values) => {
        try {
            await api.post("/cities", values);
            fetchCities();
            setIsModalOpen(false);
            form.resetFields();
        } catch (error) {
            console.error("Ошибка добавления города:", error);
        }
    };

    useEffect(() => {
        fetchCities();
    }, []);

    const columns = [
        { title: "ID", dataIndex: "id", key: "id" },
        { title: "Название", dataIndex: "name", key: "name" },
    ];

    return (
        <>
            <Button
                type="primary"
                onClick={() => setIsModalOpen(true)}
                style={{ marginBottom: 16 }}
            >
                Добавить город
            </Button>
            <Table dataSource={cities} columns={columns} rowKey="id" />

            <Modal
                title="Добавить город"
                visible={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={() => form.submit()}
            >
                <Form form={form} onFinish={handleAddCity}>
                    <Form.Item
                        name="name"
                        label="Название города"
                        rules={[{ required: true, message: "Введите название города" }]}
                    >
                        <Input />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default CitiesPage;
