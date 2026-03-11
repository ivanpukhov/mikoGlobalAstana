import React, { useEffect, useState } from "react";
import { Table, Button, Space, Typography, Input, Select, Spin, Modal, InputNumber } from "antd";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/api";
import { useMediaQuery } from "react-responsive";

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

const ProductListPage = () => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [searchValue, setSearchValue] = useState("");
    const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });
    const [loading, setLoading] = useState(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [discountValue, setDiscountValue] = useState(0);
    const [discountType, setDiscountType] = useState("");
    const navigate = useNavigate();
    const isSmallScreen = useMediaQuery({ query: "(max-width: 768px)" });
    const [searchParams, setSearchParams] = useSearchParams();
    const defaultCityId = 1;

    useEffect(() => {
        const categoryFromURL = searchParams.get("category") || "";
        const searchFromURL = searchParams.get("search") || "";
        const pageFromURL = parseInt(searchParams.get("page")) || 1;
        const pageSizeFromURL = parseInt(searchParams.get("pageSize")) || 50;
        setSelectedCategory(categoryFromURL);
        setSearchValue(searchFromURL);
        setPagination({ current: pageFromURL, pageSize: pageSizeFromURL });
    }, [searchParams]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const { data } = await api.get("/products");
            const transformedProducts = data.map((product) => ({
                ...product,
                categoryName: product.category?.name,
                categoryId: product.category?.id,
                subcategoryName: product.subcategory?.name,
                defaultPrice: product.prices[0]?.price || 0,
                defaultDiscount: product.prices[0]?.discount || 0,
                imageUrl: `/api${product.image}`,
            }));
            setProducts(transformedProducts);
            setFilteredProducts(filterProducts(transformedProducts, selectedCategory, searchValue));
            const uniqueCategories = Array.from(new Map(transformedProducts.map((p) => [p.categoryId, { id: p.categoryId, name: p.categoryName }])).values()).filter(cat => cat.id);
            setCategories(uniqueCategories);
        } catch (error) {
            console.error("Ошибка загрузки товаров:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const filterProducts = (products, category, search) => {
        const lowercasedSearch = search.toLowerCase();
        return products.filter((product) =>
            (category ? product.categoryId?.toString() === category : true) &&
            (product.name.toLowerCase().includes(lowercasedSearch) ||
                product.subcategoryName?.toLowerCase().includes(lowercasedSearch))
        );
    };

    useEffect(() => {
        setFilteredProducts(filterProducts(products, selectedCategory, searchValue));
    }, [selectedCategory, searchValue, products]);

    const handleSearch = (value) => {
        setSearchValue(value);
        updateURL({ search: value, page: 1 });
    };

    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
        updateURL({ category, page: 1 });
    };

    const updateURL = (updates) => {
        setSearchParams((prev) => {
            const newParams = new URLSearchParams(prev);
            Object.entries(updates).forEach(([key, value]) => {
                if (value) {
                    newParams.set(key, value);
                } else {
                    newParams.delete(key);
                }
            });
            return newParams;
        });
    };

    const handleTableChange = (pagination) => {
        setPagination(pagination);
        updateURL({ page: pagination.current, pageSize: pagination.pageSize });
    };

    const handleRowSelectionChange = (selectedKeys) => {
        setSelectedRowKeys(selectedKeys);
    };

    const handleDiscountUpdate = async () => {
        try {
            if (discountType === "selected") {
                await api.patch(`/${defaultCityId}/multiple/discount`, { discount: discountValue, productIds: selectedRowKeys });
                setSelectedRowKeys([]);
            } else if (discountType === "category") {
                await api.patch(`/${defaultCityId}/category/${selectedCategory}/discount`, { discount: discountValue });
            }
            setIsModalVisible(false);
            setDiscountValue(0);
            setDiscountType("");
            fetchProducts();
        } catch (error) {
            console.error("Ошибка обновления скидки:", error);
        }
    };

    const columns = [
        {
            title: "Название",
            dataIndex: "name",
            key: "name",
            render: (text) => <strong>{text}</strong>,
        },
        {
            title: "Категория",
            dataIndex: "categoryName",
            key: "categoryName",
        },
        {
            title: "Подкатегория",
            dataIndex: "subcategoryName",
            key: "subcategoryName",
        },
        {
            title: "Цена",
            dataIndex: "defaultPrice",
            key: "defaultPrice",
            render: (price) => `${price.toLocaleString()} ₸`,
        },
        {
            title: "Действия",
            key: "actions",
            render: (_, record) => (
                <Space direction={isSmallScreen ? "vertical" : "horizontal"}>
                    <Button type="primary" onClick={() => navigate(`/admin/products/view/${record.id}`)}>Подробно</Button>
                    <Button type="default" onClick={() => navigate(`/admin/products/edit/${record.id}`)}>Изменить</Button>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: "20px" }}>
            <Title level={3} style={{ marginBottom: 16 }}>Список товаров</Title>
            <Space style={{ marginBottom: 16, width: "100%" }} direction="vertical">
                <Space wrap>
                    <Search placeholder="Поиск по названию или подкатегории" allowClear value={searchValue} onChange={(e) => handleSearch(e.target.value)} style={{ maxWidth: 400 }} />
                    <Select placeholder="Выберите категорию" allowClear value={selectedCategory} onChange={handleCategoryChange} style={{ minWidth: 200 }}>
                        {categories.map((category) => (
                            <Option key={category.id} value={category.id.toString()}>{category.name}</Option>
                        ))}
                    </Select>
                </Space>
                <Space wrap>
                    {selectedRowKeys.length > 0 && (
                        <Button type="primary" onClick={() => { setDiscountType("selected"); setIsModalVisible(true); }}>
                            Установить скидку для выбранных товаров
                        </Button>
                    )}
                    {selectedCategory && (
                        <Button type="primary" onClick={() => { setDiscountType("category"); setIsModalVisible(true); }}>
                            Установить скидку для категории
                        </Button>
                    )}
                    <Button type="primary" onClick={() => navigate("/admin/products/create")}>
                        Добавить товар
                    </Button>
                </Space>
            </Space>
            {loading ? (
                <div style={{ textAlign: "center", marginTop: 50 }}>
                    <Spin size="large" />
                </div>
            ) : (
                <Table
                    dataSource={filteredProducts}
                    columns={columns}
                    rowKey="id"
                    bordered
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        showSizeChanger: true,
                        pageSizeOptions: ["20", "50", "100", "200"],
                    }}
                    onChange={handleTableChange}
                    rowSelection={{
                        selectedRowKeys,
                        onChange: handleRowSelectionChange
                    }}
                    style={{
                        background: "#fff",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                        borderRadius: "8px",
                    }}
                />
            )}
            <Modal
                title="Установить скидку"
                visible={isModalVisible}
                onOk={handleDiscountUpdate}
                onCancel={() => { setIsModalVisible(false); setDiscountValue(0); setDiscountType(""); }}
            >
                <InputNumber
                    min={0}
                    max={100}
                    value={discountValue}
                    onChange={(value) => setDiscountValue(value)}
                    style={{ width: "100%" }}
                />
            </Modal>
        </div>
    );
};

export default ProductListPage;
