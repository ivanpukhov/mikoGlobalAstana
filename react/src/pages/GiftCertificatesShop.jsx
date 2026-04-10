import React, { useEffect, useState } from "react";
import { Card, Row, Col, Button, Modal, Form, Input, InputNumber, message } from "antd";
import api from "../api/api";

const GiftCertificatesShop = () => {
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedCertificate, setSelectedCertificate] = useState(null);
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
            message.error("Ошибка загрузки сертификатов");
        } finally {
            setLoading(false);
        }
    };

    const handleGift = (certificate) => {
        setSelectedCertificate(certificate);
        setModalVisible(true);
        form.setFieldsValue({ amount: 10000 });
    };

    const handleSendGift = async (values) => {
        if (!selectedCertificate) return;

        try {
            await api.post("/purchased-certificates", {
                giftCertificateId: selectedCertificate.id,
                ...values,
            });
            message.success("Сертификат успешно отправлен!");
            setModalVisible(false);
            form.resetFields();
        } catch (error) {
            message.error("Ошибка при отправке подарка");
        }
    };

    return (
        <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
            <h1 style={{ textAlign: "left", marginBottom: "20px" }}>Подарочные сертификаты</h1>

            <Row gutter={[16, 16]} justify="center">
                {certificates.map((cert) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={cert.id}>
                        <Card
                            hoverable
                            cover={<img src={cert.imageUrl} alt={cert.name} style={{ width: "100%", height: "auto", borderRadius: "8px" }} />}
                            style={{ borderRadius: "10px", overflow: "hidden" }}
                        >
                            <h3 style={{ textAlign: "center", fontSize: "16px", fontWeight: "bold", marginBottom: 20}}>{cert.name}</h3>
                            <Button  block onClick={() => handleGift(cert)}>
                                🎁 Подарить
                            </Button>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Модальное окно для отправки подарка */}
            <Modal
                title="🎁 Отправить сертификат"
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
            >
                <Form form={form} onFinish={handleSendGift} layout="vertical">
                    <Form.Item name="senderPhone" label="Ваш телефон" rules={[{ required: true, message: "Введите ваш номер телефона" }]}>
                        <Input placeholder="+77005553311" />
                    </Form.Item>
                    <Form.Item name="recipientPhone" label="Телефон получателя" rules={[{ required: true, message: "Введите номер получателя" }]}>
                        <Input placeholder="+77001234567" />
                    </Form.Item>
                    <Form.Item name="amount" label="Сумма" rules={[{ required: true, message: "Введите сумму" }]}>
                        <InputNumber min={1000} max={100000} precision={0} step={1} style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item name="message" label="Сообщение" rules={[{ required: true, message: "Введите сообщение" }]}>
                        <Input.TextArea rows={3} placeholder="Поздравляю тебя с праздником!" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" block>
                            ✨ Отправить сертификат
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default GiftCertificatesShop;
