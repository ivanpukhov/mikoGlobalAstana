import { Table, Button, Tag, message, Modal } from "antd";
import api from "../api/api";
import {useEffect, useState} from "react";
import { formatCurrency } from "../utils/formatters";

const PurchasedCertificatesPage = () => {
    const [purchasedCertificates, setPurchasedCertificates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [markUsedLoading, setMarkUsedLoading] = useState(false);

    useEffect(() => {
        fetchPurchasedCertificates();
    }, []);

    const fetchPurchasedCertificates = async () => {
        setLoading(true);
        try {
            const { data } = await api.get("/purchased-certificates");
            setPurchasedCertificates(data);
        } catch (error) {
            message.error("Ошибка загрузки заказов на сертификаты");
        } finally {
            setLoading(false);
        }
    };

    const confirmPayment = async (id) => {
        setConfirmLoading(true);
        try {
            await api.put(`/purchased-certificates/${id}/confirm-payment`);
            message.success("Оплата подтверждена, сертификат ожидает активации");
            fetchPurchasedCertificates();
        } catch (error) {
            message.error("Ошибка при подтверждении оплаты");
        } finally {
            setConfirmLoading(false);
        }
    };

    const markAsUsed = async (id) => {
        setMarkUsedLoading(true);
        try {
            await api.put(`/purchased-certificates/${id}/mark-used`);
            message.success("Сертификат отмечен как использованный");
            fetchPurchasedCertificates();
        } catch (error) {
            message.error("Ошибка при обновлении статуса");
        } finally {
            setMarkUsedLoading(false);
        }
    };

    const deleteCertificate = (id) => {
        Modal.confirm({
            title: "Удалить заказ?",
            content: "Вы уверены, что хотите удалить этот заказ на сертификат?",
            okText: "Удалить",
            okType: "danger",
            cancelText: "Отмена",
            async onOk() {
                setDeleteLoading(true);
                try {
                    await api.delete(`/purchased-certificates/${id}`);
                    message.success("Заказ на сертификат удалён");
                    fetchPurchasedCertificates();
                } catch (error) {
                    message.error("Ошибка при удалении");
                } finally {
                    setDeleteLoading(false);
                }
            },
        });
    };

    const columns = [
        { title: "ID", dataIndex: "id", key: "id" },
        { title: "Отправитель", dataIndex: "senderPhone", key: "senderPhone" },
        { title: "Получатель", dataIndex: "recipientPhone", key: "recipientPhone" },
        { title: "Сумма", dataIndex: "amount", key: "amount", render: (amount) => formatCurrency(amount, "KZT") },
        { title: "Сообщение", dataIndex: "message", key: "message" },
        { title: "Код", dataIndex: "code", key: "code" },
        {
            title: "Статус",
            dataIndex: "status",
            key: "status",
            render: (status) => (
                <Tag color={status === "активирован" ? "green" : "orange"}>
                    {status.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: "Действия",
            key: "actions",
            render: (_, record) => (
                <div style={{ display: "flex", gap: "10px" }}>
                    {record.status == "ожидает оплаты" && (
                        <Button type="primary" onClick={() => confirmPayment(record.id)} loading={confirmLoading}>
                            Подтвердить оплату
                        </Button>
                    )}
                    {record.status === "активирован" && (
                        <Button type="default" onClick={() => markAsUsed(record.id)} loading={markUsedLoading}>
                            Отметить как использованный
                        </Button>
                    )}
                    <Button danger onClick={() => deleteCertificate(record.id)} loading={deleteLoading}>
                        Удалить
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div style={{ padding: "20px" }}>
            <h1 style={{ textAlign: "center", marginBottom: "20px" }}>📜 Купленные сертификаты</h1>
            <Table
                columns={columns}
                dataSource={purchasedCertificates}
                loading={loading}
                rowKey="id"
                bordered
                pagination={{ pageSize: 10 }}
            />
        </div>
    );
};

export default PurchasedCertificatesPage;
