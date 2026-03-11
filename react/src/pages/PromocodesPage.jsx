import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, InputNumber, DatePicker, message } from "antd";
import api from "../api/api";
import moment from "moment";

const PromocodesPage = () => {
    const [promocodes, setPromocodes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [currentPromo, setCurrentPromo] = useState(null);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchPromocodes();
    }, []);

    const fetchPromocodes = async () => {
        setLoading(true);
        try {
            const { data } = await api.get("/promocodes");
            setPromocodes(data);
        } catch (error) {
            message.error("Ошибка загрузки промокодов");
        }
        setLoading(false);
    };

    const handleDelete = async (name) => {
        try {
            await api.delete(`/promocodes/${name}`);
            message.success("Промокод удален");
            fetchPromocodes();
        } catch {
            message.error("Ошибка при удалении");
        }
    };

    const handleEdit = (promo) => {
        setCurrentPromo(promo);
        setModalVisible(true);
        form.setFieldsValue({
            ...promo,
            expirationDate: moment(promo.expirationDate),
        });
    };

    const handleAdd = () => {
        setCurrentPromo(null);
        form.resetFields();
        setModalVisible(true);
    };

    const handleSave = async (values) => {
        try {
            const requestData = {
                ...values,
                expirationDate: values.expirationDate.toISOString(),
            };

            if (currentPromo) {
                await api.put(`/promocodes/${currentPromo.name}`, requestData);
                message.success("Промокод обновлен");
            } else {
                await api.post("/promocodes", requestData);
                message.success("Промокод добавлен");
            }

            setModalVisible(false);
            fetchPromocodes();
        } catch {
            message.error("Ошибка сохранения");
        }
    };

    return (
        <div>
            <Button type="primary" style={{ marginBottom: 16 }} onClick={handleAdd}>
                Добавить промокод
            </Button>
            <Table
                dataSource={promocodes}
                rowKey="id"
                loading={loading}
                columns={[
                    { title: "Название", dataIndex: "name" },
                    { title: "Скидка (%)", dataIndex: "discountPercentage" },
                    { title: "Сумма скидки", dataIndex: "discountAmount" },
                    { title: "Ограничение", dataIndex: "usageLimit" },
                    { title: "Использовано", dataIndex: "usageCount" },
                    { title: "Срок действия", dataIndex: "expirationDate", render: (text) => moment(text).format("YYYY-MM-DD") },
                    {
                        title: "Действия",
                        render: (_, record) => (
                            <>
                                <Button onClick={() => handleEdit(record)} style={{ marginRight: 8 }}>
                                    Изменить
                                </Button>
                                <Button danger onClick={() => handleDelete(record.name)}>
                                    Удалить
                                </Button>
                            </>
                        )
                    }
                ]}
            />

            <Modal
                title={currentPromo ? "Редактировать промокод" : "Добавить промокод"}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                onOk={() => form.submit()}
            >
                <Form form={form} layout="vertical" onFinish={handleSave}>
                    <Form.Item name="name" label="Название" rules={[{ required: true, message: "Введите название" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="discountPercentage" label="Скидка (%)">
                        <InputNumber min={0} max={100} style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item name="discountAmount" label="Сумма скидки">
                        <InputNumber min={0} style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item name="usageLimit" label="Лимит использования">
                        <InputNumber min={1} style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item name="expirationDate" label="Дата окончания">
                        <DatePicker style={{ width: "100%" }} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default PromocodesPage;
