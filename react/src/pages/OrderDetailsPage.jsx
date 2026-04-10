import React, {useEffect, useRef, useState} from "react";
import {Button, Descriptions, message, Table, Typography, Select, Tag} from "antd";
import api from "../api/api";
import {useNavigate, useParams} from "react-router-dom";

import logo from "../images/logo-admin.svg";
import { formatCurrency } from "../utils/formatters";

const {Title} = Typography;

const OrderDetailsPage = () => {
    const {orderId} = useParams();
    const [order, setOrder] = useState(null);
    const printRef = useRef();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleStatusChange = async (newStatus) => {
        try {
            await api.patch(`/orders/${order.id}/status`, {status: newStatus});
            message.success(`Статус заказа обновлён: ${newStatus}`);
            fetchOrderDetails(); // обновим заказ
        } catch (error) {
            console.error("Ошибка при изменении статуса:", error);
            message.error("Ошибка при изменении статуса");
        }
    };

    const handleDeleteOrder = async () => {
        setLoading(true);
        try {
            await api.delete(`/orders/${orderId}`);
            navigate(-1);
        } catch (error) {
            console.error("Ошибка при удалении заказа:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOrderDetails = async () => {
        try {
            const {data} = await api.get(`/orders/${orderId}`);
            const updatedItems = await Promise.all(data.items.map(async (item) => {
                const {data: productData} = await api.get(`/products/${item.productId}`);
                const priceInfo = productData.prices.find(price => price.cityId === data.cityId);
                const productPrice = priceInfo ? priceInfo.price : 0;
                const productDiscount = priceInfo ? priceInfo.discount : 0;
                const productTotal = productPrice - (productPrice * (productDiscount / 100));
                return {...item, productPrice, productDiscount, productTotal, productFull: productData};
            }));
            setOrder({...data, items: updatedItems});
        } catch (error) {
            console.error("Ошибка загрузки деталей заказа:", error);
        }
    };

    useEffect(() => {
        fetchOrderDetails();
    }, [orderId]);

    const handlePrint = () => {
        const printContent = printRef.current;
        const printWindow = window.open("", "", "width=800,height=600");
        printWindow.document.write(printContent.outerHTML);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    };

    if (!order) {
        return <div>Загрузка...</div>;
    }

    const columns = [
        {
            title: "№",
            dataIndex: "id",
            key: "id",
            render: (text, record, index) => index + 1,
        },
        {
            title: "Название товара",
            dataIndex: ["product", "name"],
            key: "name",
        },
        {
            title: "Количество",
            dataIndex: "quantity",
            key: "quantity",
        },
        {
            title: "Цена",
            dataIndex: "productPrice",
            key: "productPrice",
            render: (price) => formatCurrency(price),
        },
        {
            title: "Скидка",
            dataIndex: "productDiscount",
            key: "productDiscount",
        },
        {
            title: "Цена за единицу",
            dataIndex: "productTotal",
            key: "productTotal",
            render: (price) => formatCurrency(price),
        },
        {
            title: "Итого",
            key: "totalPrice",
            render: (text, record) => formatCurrency(record.productTotal * record.quantity),
        },
    ];

    return (
        <div>
            <div style={{display: "flex", gap: "10px", marginBottom: "20px"}}>
                <Button type="primary" onClick={handlePrint}>
                    Распечатать накладную
                </Button>
                <Button type="danger" onClick={handleDeleteOrder} loading={loading}>
                    Удалить заказ
                </Button>
            </div>
            <div style={{marginBottom: "20px"}}>
                <span style={{marginRight: 8}}>Статус заказа:</span>
                <Tag color={
                    order.status === "выполнен" ? "green" :
                        order.status === "в обработке" ? "blue" :
                            order.status === "отклонен" ? "red" : "default"
                }>
                    {order.status || "не установлен"}
                </Tag>
                <Select
                    value={order.status || undefined}
                    onChange={handleStatusChange}
                    placeholder="Выберите статус"
                    style={{width: 200, marginLeft: 10}}
                    options={[
                        {value: "в обработке", label: "В обработке"},
                        {value: "выполнен", label: "Выполнен"},
                        {value: "отклонен", label: "Отклонен"},
                    ]}
                />
            </div>


            <div ref={printRef} style={{padding: "20px", background: "white", border: "1px solid #ddd"}}>
                <div style={{textAlign: "center", marginBottom: "20px"}}>
                    <img src={logo} alt="Логотип" style={{width: "150px"}}/>
                </div>
                <Title level={3} style={{textAlign: "center"}}>
                    Накладная на заказ #{order.id}
                </Title>
                <Descriptions bordered column={1} size="middle">
                    <Descriptions.Item label="Имя клиента">{order.customerName}</Descriptions.Item>
                    <Descriptions.Item label="Телефон">{order.customerPhone}</Descriptions.Item>
                    <Descriptions.Item label="Город">{order.city.name}</Descriptions.Item>
                    <Descriptions.Item label="Адрес">{order.customerAddress}</Descriptions.Item>
                    <Descriptions.Item label="Метод оплаты">{order.paymentMethod}</Descriptions.Item>
                    <Descriptions.Item label="Метод доставки">{order.deliveryMethod}</Descriptions.Item>
                    <Descriptions.Item label="Общая сумма">{formatCurrency(order.totalAmount)}</Descriptions.Item>
                    <Descriptions.Item label="Дата создания">
                        {new Date(order.createdAt).toLocaleString()}
                    </Descriptions.Item>
                    {order.promoCode && (
                        <Descriptions.Item label="Промокод">
                            {order.promoCode.name} ({order.promoCode.discountPercentage}% скидка)
                        </Descriptions.Item>
                    )}
                    {order.giftCertificateCode && (
                        <Descriptions.Item label="Сертификат">
                            {order.giftCertificateCode}
                        </Descriptions.Item>
                    )}
                </Descriptions>
                <Title level={4} style={{marginTop: "20px"}}>
                    Список товаров
                </Title>
                <Table
                    dataSource={order.items}
                    columns={columns}
                    rowKey="id"
                    pagination={false}
                    bordered
                    style={{marginTop: "10px"}}
                />
                <div style={{marginTop: "30px", textAlign: "right"}}>
                    <p>
                        <b>Итоговая сумма:</b> {formatCurrency(order.totalAmount)}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailsPage;
