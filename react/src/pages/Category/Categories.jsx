import api from "../../api/api";
import { useEffect, useState } from "react";
import { List, Card, Typography, Empty } from "antd";
import { Link } from "react-router-dom";
import { SmileOutlined } from "@ant-design/icons";
import "./Categories.css"; // Подключение CSS

const { Title } = Typography;

export const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await api.get(`/categories`);
                setCategories(response.data);
            } catch (error) {
                console.error("Ошибка при загрузке категорий:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    const renderCategory = (category) => (
        <List.Item>
            <Link to={`/catalog/${category.id}`}>
                <Card
                    className="category-card" // Добавляем класс для карточки
                    hoverable
                    bodyStyle={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                    }}
                >
                    <SmileOutlined
                        style={{ fontSize: "40px", color: "#fff", marginBottom: "10px" }}
                    />
                    <Title
                        level={5}
                        style={{
                            margin: 0,
                            color: "#ffffff",
                            fontSize: "18px",
                            fontWeight: "bold",
                        }}
                    >
                        {category.name}
                    </Title>
                </Card>
            </Link>
        </List.Item>
    );

    return (
        <div style={{ padding: "20px" }}>
            <div style={{ marginBottom: "30px", textAlign: "center" }}>
                <Title level={2} style={{ fontWeight: "bold" }}>
                    Список категорий
                </Title>
            </div>
            {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "50px" }}>
                    <Empty description="Загрузка категорий..." />
                </div>
            ) : categories.length > 0 ? (
                <List
                    grid={{
                        gutter: 20,
                        xs: 2,
                        sm: 3,
                        md: 4,
                        lg: 5,
                        xl: 6,
                    }}
                    dataSource={categories}
                    renderItem={renderCategory}
                />
            ) : (
                <Empty
                    description="Категории пока отсутствуют"
                    style={{ marginTop: "50px" }}
                />
            )}
        </div>
    );
};
