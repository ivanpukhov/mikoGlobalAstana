import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, message } from "antd";
import api from "../api/api";

const GiftCertificatesPage = () => {
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchCertificates();
    }, []);

    const fetchCertificates = async () => {
        setLoading(true);
        try {
            const { data } = await api.get("/gift-certificates");
            setCertificates(data);
        } catch (error) {
            message.error("Ошибка при загрузке сертификатов");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/gift-certificates/${id}`);
            message.success("Сертификат удалён");
            fetchCertificates();
        } catch (error) {
            message.error("Ошибка при удалении");
        }
    };

    const handleAdd = async (values) => {
        try {
            await api.post("/gift-certificates", values);
            message.success("Сертификат добавлен");
            setModalVisible(false);
            form.resetFields();
            fetchCertificates();
        } catch (error) {
            message.error("Ошибка при добавлении");
        }
    };

    const columns = [
        { title: "ID", dataIndex: "id", key: "id" },
        { title: "Название", dataIndex: "name", key: "name" },
        {
            title: "Изображение",
            dataIndex: "imageUrl",
            key: "imageUrl",
            render: (url) => <img src={url} alt="Сертификат" width={100} />
        },
        {
            title: "Действия",
            key: "actions",
            render: (_, record) => (
                <Button danger onClick={() => handleDelete(record.id)}>
                    Удалить
                </Button>
            ),
        },
    ];

    return (
        <div>
            <Button type="primary" onClick={() => setModalVisible(true)}>Добавить сертификат</Button>
            <Table columns={columns} dataSource={certificates} loading={loading} rowKey="id" style={{ marginTop: 16 }} />

            <Modal
                title="Добавить сертификат"
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
            >
                <Form form={form} onFinish={handleAdd} layout="vertical">
                    <Form.Item name="name" label="Название" rules={[{ required: true, message: "Введите название" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="imageUrl" label="URL изображения" rules={[{ required: true, message: "Введите URL изображения" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit">Добавить</Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default GiftCertificatesPage;
