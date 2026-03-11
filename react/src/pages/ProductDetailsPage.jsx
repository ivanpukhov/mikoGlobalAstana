import React, {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {Button, Card, Image, Input, message, Modal, Spin, Table, Typography} from "antd";
import {ArrowLeftOutlined, LoadingOutlined} from "@ant-design/icons";
import api from "../api/api";

const ProductDetailsPage = () => {
    const {id} = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [cities, setCities] = useState([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingCityActions, setLoadingCityActions] = useState({});
    const [priceModalVisible, setPriceModalVisible] = useState(false);
    const [discountModalVisible, setDiscountModalVisible] = useState(false);
    const [selectedCity, setSelectedCity] = useState(null);
    const [newPrice, setNewPrice] = useState("");
    const [newDiscount, setNewDiscount] = useState("");

    useEffect(() => {
        fetchProductDetails();
        fetchCities();
    }, [id]);

    const fetchProductDetails = async () => {
        try {
            const {data} = await api.get(`/products/${id}`);
            setProduct({...data, imageUrl: `/api${data.image}`});
        } catch (error) {
            console.error("Ошибка загрузки деталей товара:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCities = async () => {
        try {
            const {data} = await api.get("/cities");
            setCities(data);
        } catch (error) {
            console.error("Ошибка загрузки списка городов:", error);
        }
    };

    const getCityName = (cityId) => {
        const city = cities.find((city) => city.id === cityId);
        return city ? city.name : "Неизвестный город";
    };

    const handleDelete = async () => {
        Modal.confirm({
            title: "Удалить товар?",
            content: "Это действие нельзя отменить.",
            okText: "Удалить",
            okType: "danger",
            cancelText: "Отмена",
            onOk: async () => {
                setIsDeleting(true);
                try {
                    await api.delete(`/products/${id}`);
                    message.success("Товар удалён!");
                    navigate(-1);
                } catch (error) {
                    console.error("Ошибка удаления:", error);
                    message.error("Не удалось удалить товар.");
                } finally {
                    setIsDeleting(false);
                }
            },
        });
    };

    const handleToggleAvailability = async (cityId, availability) => {
        setLoadingCityActions((prev) => ({...prev, [cityId]: true}));
        try {
            await api.patch(`/products/${cityId}/products/${id}/availability`, {availability});
            message.success(availability ? "Товар доступен" : "Товар снят с продажи");
            fetchProductDetails();
        } catch (error) {
            console.error("Ошибка изменения доступности:", error);
            message.error("Ошибка обновления");
        } finally {
            setLoadingCityActions((prev) => ({...prev, [cityId]: false}));
        }
    };

    const openPriceModal = (cityId, currentPrice) => {
        setSelectedCity(cityId);
        setNewPrice(currentPrice);
        setPriceModalVisible(true);
    };

    const openDiscountModal = (cityId, currentDiscount) => {
        setSelectedCity(cityId);
        setNewDiscount(currentDiscount);
        setDiscountModalVisible(true);
    };

    const handlePriceUpdate = async () => {
        if (!newPrice || newPrice <= 0) {
            message.error("Введите корректную цену.");
            return;
        }
        try {
            await api.patch(`/products/${selectedCity}/products/${id}/price`, {price: newPrice});
            message.success("Цена обновлена!");
            fetchProductDetails();
        } catch (error) {
            console.error("Ошибка обновления цены:", error);
            message.error("Ошибка при обновлении цены.");
        } finally {
            setPriceModalVisible(false);
        }
    };

    const handleDiscountUpdate = async () => {
        if (newDiscount < 0) {
            message.error("Введите корректную скидку.");
            return;
        }
        try {
            await api.patch(`/products/${selectedCity}/products/${id}/discount`, {discount: newDiscount});
            message.success("Скидка обновлена!");
            fetchProductDetails();
        } catch (error) {
            console.error("Ошибка обновления скидки:", error);
            message.error("Ошибка при обновлении скидки.");
        } finally {
            setDiscountModalVisible(false);
        }
    };

    const columns = [
        {
            title: "Город",
            dataIndex: "cityId",
            key: "cityId",
            render: (cityId) => getCityName(cityId),
        },
        {
            title: "Цена (₸)",
            dataIndex: "price",
            key: "price",
        },
        {
            title: "Скидка (%)",
            dataIndex: "discount",
            key: "discount",
        },
        {
            title: "В наличии",
            dataIndex: "availability",
            key: "availability",
            render: (availability) => (availability ? "Да" : "Нет"),
        },
        {
            title: "Действие",
            key: "action",
            render: (_, record) => (
                <div style={{display: "flex", flexDirection: "column", gap: 10}}>

                    <Button
                        type={record.availability ? "danger" : "primary"}
                        loading={loadingCityActions[record.cityId]}
                        onClick={() => handleToggleAvailability(record.cityId, !record.availability)}
                    >
                        {record.availability ? "Снять с продажи" : "Вернуть в продажу"}
                    </Button>
                    <Button
                        type="default"
                        onClick={() => openPriceModal(record.cityId, record.price)}
                    >
                        Изменить цену
                    </Button>
                    <Button
                        type="default"
                        onClick={() => openDiscountModal(record.cityId, record.discount)}
                    >
                        Изменить скидку
                    </Button>
                </div>
            ),
        },
    ];

    if (loading) {
        return (
            <div style={{display: "flex", justifyContent: "center", alignItems: "center", height: "100vh"}}>
                <Spin indicator={<LoadingOutlined style={{fontSize: 48}} spin/>}/>
            </div>
        );
    }

    return (
        <div style={{maxWidth: "900px", margin: "20px auto"}}>
            <Button onClick={() => navigate(-1)} type="primary" size="large" block icon={<ArrowLeftOutlined/>}>
                Назад
            </Button>
            <Card
                style={{marginTop: "20px", boxShadow: "0px 4px 10px rgba(0,0,0,0.1)", borderRadius: "10px"}}
                bodyStyle={{padding: "20px"}}
                cover={<Image src={product.imageUrl} alt={product.name}
                              style={{width: "100%", height: "300px", objectFit: "cover"}}/>}
            >
                <Typography.Title level={3} style={{textAlign: "center"}}>{product.name}</Typography.Title>
                <Typography.Paragraph style={{textAlign: "justify"}}>
                    <div dangerouslySetInnerHTML={{__html: product.description}}/>
                </Typography.Paragraph>
                <Typography.Title level={4}>Цены и доступность</Typography.Title>
                <div style={{overflowX: "auto"}}>
                    <Table
                        columns={columns}
                        dataSource={product.prices}
                        rowKey="cityId"
                        pagination={false}
                        scroll={{x: true}}
                        style={{wordBreak: "normal", whiteSpace: "nowrap"}}
                    />
                </div>
                <div style={{marginTop: "20px", display: "flex", justifyContent: "space-between"}}>
                    <Button type="primary"
                            onClick={() => navigate(`/admin/products/edit/${product.id}`)}>Изменить</Button>
                    <Button type="danger" loading={isDeleting} onClick={handleDelete}>Удалить</Button>
                </div>
            </Card>
            <Modal
                title="Изменение цены"
                visible={priceModalVisible}
                onCancel={() => setPriceModalVisible(false)}
                onOk={handlePriceUpdate}
                okText="Сохранить"
                cancelText="Отмена"
            >
                <Input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="Введите новую цену"
                />
            </Modal>
            <Modal
                title="Изменение скидки"
                visible={discountModalVisible}
                onCancel={() => setDiscountModalVisible(false)}
                onOk={handleDiscountUpdate}
                okText="Сохранить"
                cancelText="Отмена"
            >
                <Input
                    type="number"
                    value={newDiscount}
                    onChange={(e) => setNewDiscount(e.target.value)}
                    placeholder="Введите новую скидку"
                />
            </Modal>
        </div>
    );
};

export default ProductDetailsPage;
