import React, { useEffect, useState } from "react";
import { Table, Select, Row, Col, Button, Space } from "antd";
import { FilterOutlined, CalendarOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import moment from "moment";
import useBreakpoint from "antd/lib/grid/hooks/useBreakpoint";
import { formatCurrency } from "../utils/formatters";

const { Option } = Select;

const OrdersPage = () => {
    const [allOrders, setAllOrders] = useState([]);
    const [orders, setOrders] = useState([]);
    const [deliveryMethod, setDeliveryMethod] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState(null);
    const [status, setStatus] = useState("all");
    const [period, setPeriod] = useState("today");
    const navigate = useNavigate();
    const screens = useBreakpoint();

    const selectedCity = localStorage.getItem("adminCity") || "all";

    const fetchOrders = async () => {
        try {
            const params = new URLSearchParams();
            if (selectedCity !== "all") params.append("cityId", selectedCity);
            const url = `/orders${params.toString() ? `?${params.toString()}` : ""}`;
            const { data } = await api.get(url);
            setAllOrders(data);
        } catch (error) {
            console.error("Ошибка загрузки заказов:", error);
            setAllOrders([]);
        }
    };

    const filterOrders = () => {
        let filtered = [...allOrders];

        if (deliveryMethod) {
            filtered = filtered.filter(order => order.deliveryMethod === deliveryMethod);
        }
        if (paymentMethod) {
            filtered = filtered.filter(order => order.paymentMethod === paymentMethod);
        }
        if (status && status !== "all") {
            if (status === null) {
                filtered = filtered.filter(order => !order.status);
            } else {
                filtered = filtered.filter(order => order.status === status);
            }
        }
        if (period !== "all") {
            const today = moment().startOf("day");
            const ranges = {
                today: [today, today.clone().endOf("day")],
                yesterday: [today.clone().subtract(1, "day"), today.clone().subtract(1, "day").endOf("day")],
                week: [today.clone().subtract(6, "days"), today.clone().endOf("day")],
                month: [today.clone().subtract(29, "days"), today.clone().endOf("day")],
            };
            const [start, end] = ranges[period];
            filtered = filtered.filter(order => {
                const created = moment(order.createdAt);
                return created.isBetween(start, end, undefined, '[]');
            });
        }

        setOrders(filtered);
    };

    useEffect(() => {
        fetchOrders();
    }, [selectedCity]);

    useEffect(() => {
        filterOrders();
    }, [allOrders, deliveryMethod, paymentMethod, status, period]);

    const getStatusLabel = (status) => {
        if (!status) return "Новый";
        if (status === "в обработке") return "В обработке";
        if (status === "выполнен") return "Выполнен";
        if (status === "отклонен") return "Отклонён";
        return status;
    };

    const statusButtons = [
        { label: "Все", value: "all" },
        { label: "Новый", value: null },
        { label: "В обработке", value: "в обработке" },
        { label: "Выполнен", value: "выполнен" },
        { label: "Отклонён", value: "отклонен" }
    ];

    const periodButtons = [
        { label: "Сегодня", value: "today" },
        { label: "Вчера", value: "yesterday" },
        { label: "Неделя", value: "week" },
        { label: "Месяц", value: "month" },
        { label: "Все", value: "all" }
    ];

    const viewOrderDetails = (orderId) => {
        navigate(`/admin/orders/${orderId}`);
    };

    const columns = screens.xs ? [
        {
            title: "Заказ",
            key: "compact",
            render: (_, record) => (
                <div onClick={() => viewOrderDetails(record.id)}>
                    <div><strong>{record.customerName || "Не указано"}</strong></div>
                    <div>{record.customerPhone}</div>
                    <div>{record.city?.name}</div>
                    <div>{formatCurrency(record.totalAmount)}</div>
                    <div>{moment(record.createdAt).format("DD.MM.YYYY")}</div>
                    <div>{getStatusLabel(record.status)}</div>
                </div>
            )
        }
    ] : [
        {
            title: "Имя клиента",
            dataIndex: "customerName",
            key: "customerName",
            render: (text, record) => (
                <a onClick={() => viewOrderDetails(record.id)}>{text || "Не указано"}</a>
            )
        },
        {
            title: "Телефон",
            dataIndex: "customerPhone",
            key: "customerPhone"
        },
        {
            title: "Город",
            dataIndex: ["city", "name"],
            key: "city"
        },
        {
            title: "Сумма (₸)",
            dataIndex: "totalAmount",
            key: "totalAmount",
            render: (amount) => formatCurrency(amount),
        },
        {
            title: "Дата",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (text) => moment(text).format("DD.MM.YYYY")
        },
        {
            title: "Статус",
            dataIndex: "status",
            key: "status",
            render: (text) => getStatusLabel(text)
        }
    ];

    return (
        <div className="orders-page-container">
            <Row gutter={[16, 24]} className="filter-section">
                <Col span={24} style={{ marginBottom: 8 }}>
                    <h4 style={{ marginBottom: 8 }}><FilterOutlined /> Фильтр по статусу</h4>
                    <Space wrap>
                        {statusButtons.map(btn => (
                            <Button
                                key={btn.label}
                                type={(btn.value === status || (btn.value === null && !status)) ? "primary" : "default"}
                                onClick={() => setStatus(btn.value)}
                            >
                                {btn.label}
                            </Button>
                        ))}
                    </Space>
                </Col>
                <Col span={24} style={{ marginBottom: 8 }}>
                    <h4 style={{ marginBottom: 8 }}><CalendarOutlined /> Фильтр по дате</h4>
                    <Space wrap>
                        {periodButtons.map(btn => (
                            <Button
                                key={btn.value}
                                type={period === btn.value ? "primary" : "default"}
                                onClick={() => setPeriod(btn.value)}
                            >
                                {btn.label}
                            </Button>
                        ))}
                    </Space>
                </Col>
                <Col xs={24} sm={12} md={8}>
                    <Select
                        placeholder="Способ доставки"
                        value={deliveryMethod}
                        onChange={setDeliveryMethod}
                        style={{ width: "100%" }}
                        allowClear
                    >
                        <Option value="delivery">Доставка</Option>
                        <Option value="pickup">Самовывоз</Option>
                    </Select>
                </Col>
                <Col xs={24} sm={12} md={8}>
                    <Select
                        placeholder="Способ оплаты"
                        value={paymentMethod}
                        onChange={setPaymentMethod}
                        style={{ width: "100%" }}
                        allowClear
                    >
                        <Option value="card">Карта</Option>
                        <Option value="cash">Наличные</Option>
                    </Select>
                </Col>
            </Row>

            <Table
                style={{ marginTop: 24 }}
                dataSource={orders}
                columns={columns}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                scroll={{ x: "max-content" }}
            />
        </div>
    );
};

export default OrdersPage;
