import React, { useState, useEffect } from "react";
import { Card, Row, Col, Typography, Select, Spin, Space } from "antd";
import api from "../api/api";
import moment from "moment";
import "moment/locale/ru";
import { formatCurrency } from "../utils/formatters";

moment.locale("ru");

const { Title, Text } = Typography;

const StatisticsPage = () => {
    const [statistics, setStatistics] = useState(null);
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState([moment().subtract(1, "months").startOf("day"), moment().endOf("day")]);
    const [selectedPeriod, setSelectedPeriod] = useState("last_month");

    const [error, setError] = useState("");

    const dateOptions = [
        { label: "Сегодня", value: "today" },
        { label: "Вчера", value: "yesterday" },
        { label: "За последнюю неделю", value: "last_week" },
        { label: "За последний месяц", value: "last_month" },
    ];

    const getDateRange = (value) => {
        switch (value) {
            case "today":
                return [moment().startOf("day"), moment().endOf("day")];
            case "yesterday":
                return [
                    moment().subtract(1, "days").startOf("day"),
                    moment().subtract(1, "days").endOf("day"),
                ];
            case "last_week":
                return [moment().subtract(7, "days").startOf("day"), moment().endOf("day")];
            case "last_month":
                return [moment().subtract(1, "months").startOf("day"), moment().endOf("day")];
            default:
                return [moment().startOf("day"), moment().endOf("day")];
        }
    };

    const handleDateChange = (value) => {
        const range = getDateRange(value);
        setDateRange(range);
        setSelectedPeriod(value);
    };

    const fetchCities = async () => {
        try {
            const { data } = await api.get("/cities");
            setCities(data);
        } catch {
            setError("Ошибка загрузки городов.");
        }
    };

    const fetchStatistics = async () => {
        setLoading(true);
        try {
            const cityId = localStorage.getItem("adminCity") || "all";
            const startDate = dateRange[0].format("YYYY-MM-DDTHH:mm:ss");
            const endDate = dateRange[1].format("YYYY-MM-DDTHH:mm:ss");
            const { data } = await api.get(
                `/orders/statistics?cityId=${cityId}&startDate=${startDate}&endDate=${endDate}`
            );
            setStatistics(data);
        } catch {
            setError("Ошибка загрузки данных. Повторите попытку позже.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCities();
    }, []);

    useEffect(() => {
        fetchStatistics();
    }, [dateRange]);

    if (loading)
        return (
            <div style={{ textAlign: "center", padding: "50px" }}>
                <Spin size="large" />
            </div>
        );
    if (error) return <div>{error}</div>;

    const formatNumber = (value) => (value !== null ? new Intl.NumberFormat("ru-RU").format(value) : "—");

    return (
        <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
                <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
                    <Col>
                        <Title level={3}>Статистика заказов</Title>
                        <Text type="secondary">Информация за выбранный период</Text>
                    </Col>
                    <Col>
                        <Select
                            options={dateOptions}
                            style={{ width: 200, borderRadius: "10px" }}
                            value={selectedPeriod}
                            onChange={handleDateChange}
                        />
                    </Col>
                </Row>

                <Row gutter={[24, 24]}>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Card
                            title="Общее количество заказов"
                            style={{
                                borderRadius: "12px",
                                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                                textAlign: "center",
                            }}
                        >
                            <Text style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                                {formatNumber(statistics.totalOrders)}
                            </Text>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Card
                            title="Общая сумма заказов"
                            style={{
                                borderRadius: "12px",
                                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                                textAlign: "center",
                            }}
                        >
                            <Text style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                                {formatCurrency(statistics.totalAmount)}
                            </Text>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Card
                            title="Средний чек"
                            style={{
                                borderRadius: "12px",
                                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                                textAlign: "center",
                            }}
                        >
                            <Text style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                                {formatCurrency(statistics.averageOrderAmount)}
                            </Text>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Card
                            title="Повторные заказы"
                            style={{
                                borderRadius: "12px",
                                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                                textAlign: "center",
                            }}
                        >
                            <Text style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                                {formatNumber(statistics.repeatOrderRate)}%
                            </Text>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Card
                            title="Уникальные клиенты"
                            style={{
                                borderRadius: "12px",
                                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                                textAlign: "center",
                            }}
                        >
                            <Text style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                                {formatNumber(statistics.uniqueCustomersCount)}
                            </Text>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <Card
                            title="Среднее количество товаров"
                            style={{
                                borderRadius: "12px",
                                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                                textAlign: "center",
                            }}
                        >
                            <Text style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                                {formatNumber(statistics.averageItemsPerOrder)}
                            </Text>
                        </Card>
                    </Col>

                    {statistics.geoDistribution?.length > 0 ? (
                        statistics.geoDistribution.map((item, index) => {
                            const cityName = cities.find((c) => c.id === item.cityId)?.name || `Город ID ${item.cityId}`;
                            return (
                                <Col xs={24} sm={12} md={8} lg={6} key={index}>
                                    <Card
                                        title={`Город: ${cityName}`}
                                        style={{
                                            borderRadius: "12px",
                                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                                            textAlign: "center",
                                        }}
                                    >
                                        <Text style={{ fontSize: "1.1rem" }}>Заказы: {item.orderCount}</Text>
                                        <br />
                                        <Text style={{ fontSize: "1.1rem" }}>Выручка: {formatCurrency(item.totalRevenue)}</Text>
                                    </Card>
                                </Col>
                            );
                        })
                    ) : (
                        <></>
                    )}
                </Row>
            </Space>
        </div>
    );
};

export default StatisticsPage;
