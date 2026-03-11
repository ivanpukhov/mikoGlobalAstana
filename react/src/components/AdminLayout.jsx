import React, { useState, useEffect } from "react";
import { Layout, Menu, Select, Drawer, Button, Typography } from "antd";
import { Link, Outlet, useNavigate } from "react-router-dom";
import {
    MenuOutlined,
    ClockCircleOutlined,
    UserOutlined,
    TagsOutlined,
    ShoppingCartOutlined,
    BarChartOutlined,
    HomeOutlined,
    GiftOutlined,
    LogoutOutlined,
    BellOutlined,
} from "@ant-design/icons";
import api from "../api/api";
import logo from "../images/logo-admin.svg";

const { Header, Content, Sider } = Layout;
const { Option } = Select;
const { Text } = Typography;

const AdminLayout = () => {
    const [cities, setCities] = useState([]);
    const [selectedCity, setSelectedCity] = useState(localStorage.getItem("adminCity") || "all");
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [menuVisible, setMenuVisible] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const adminName = localStorage.getItem("adminName");

    useEffect(() => {
        if (!token) {
            navigate("/admin/login");
        }
        fetchCities();
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        window.addEventListener("resize", handleResize);
        return () => {
            clearInterval(timer);
            window.removeEventListener("resize", handleResize);
        };
    }, [token, navigate]);

    const fetchCities = async () => {
        try {
            const { data } = await api.get("/cities");
            setCities(data);
        } catch (error) {
            console.error("Ошибка загрузки городов:", error);
        }
    };

    const handleResize = () => {
        setIsMobile(window.innerWidth <= 768);
    };

    const handleCityChange = (cityId) => {
        setSelectedCity(cityId);
        localStorage.setItem("adminCity", cityId);
        window.location.reload();
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("adminName");
        navigate("/admin/login");
    };

    const sidebarItems = [
        { key: "1", icon: <ShoppingCartOutlined />, label: <Link to="/admin/products">Товары</Link> },
        { key: "2", icon: <HomeOutlined />, label: <Link to="/admin/cities">Города</Link> },
        { key: "3", icon: <ShoppingCartOutlined />, label: <Link to="/admin/orders">Заказы</Link> },
        { key: "4", icon: <BarChartOutlined />, label: <Link to="/admin/statistics">Статистика</Link> },
        { key: "5", icon: <UserOutlined />, label: <Link to="/admin/users">Пользователи</Link> },
        { key: "6", icon: <TagsOutlined />, label: <Link to="/admin/promocodes">Промокоды</Link> },
        { key: "8", icon: <GiftOutlined />, label: <Link to="/admin/gift-certificates">Подарочные сертификаты</Link> },
        { key: "9", icon: <GiftOutlined />, label: <Link to="/admin/purchased-certificates">Купленные сертификаты</Link> },
        { key: "10", icon: <BellOutlined />, label: <Link to="/admin/notifications">Уведомления</Link> },
        { key: "7", icon: <LogoutOutlined />, label: <Button type="link" onClick={handleLogout}>Выход</Button> },
    ];

    return (
        <Layout style={{ minHeight: "100vh" }}>
            {!isMobile && (
                <Sider collapsible width={220} style={{ background: "#001529" }}>
                    <Menu theme="dark" mode="inline" items={sidebarItems} />
                </Sider>
            )}
            {isMobile && (
                <Drawer
                    placement="left"
                    closable
                    onClose={() => setMenuVisible(false)}
                    open={menuVisible}
                    bodyStyle={{ padding: 0 }}
                >
                    <Menu theme="dark" mode="inline" items={sidebarItems} />
                </Drawer>
            )}
            <Layout>
                <Header style={{ display: "flex", justifyContent: "space-between", padding: "0 16px", background: "#f0f2f5", color: "#000" }}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                        {isMobile && <Button icon={<MenuOutlined />} type="text" onClick={() => setMenuVisible(true)} />}
                        <img src={logo} alt="Логотип" style={{ height: "40px", marginRight: "16px" }} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <ClockCircleOutlined style={{ color: "#1890ff" }} />
                        <Text style={{ color: "#000" }}>{currentTime.toLocaleTimeString()}</Text>
                        <UserOutlined style={{ color: "#1890ff" }} />
                        <Text style={{ color: "#000" }}>Привет, {adminName || "Админ"}!</Text>
                        <Select value={selectedCity} onChange={handleCityChange} style={{ width: "200px" }}>
                            <Option value="all">Все города</Option>
                            {cities.map((city) => (
                                <Option key={city.id} value={city.id.toString()}>{city.name}</Option>
                            ))}
                        </Select>
                    </div>
                </Header>
                <Content style={{ margin: "16px", padding: isMobile ? "8px" : "24px" }}>
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default AdminLayout;
