import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, InputNumber, Select, Upload, Image } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import api from "../api/api";

const ProductsPage = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [cities, setCities] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [detailedProduct, setDetailedProduct] = useState(null);
    const [form] = Form.useForm();

    const fetchProducts = async () => {
        try {
            const { data } = await api.get("/products");
            const transformedProducts = data.map((product) => ({
                ...product,
                categoryName: product.category?.name,
                subcategoryName: product.subcategory?.name,
                defaultPrice: product.prices[0]?.price || 0,
                defaultDiscount: product.prices[0]?.discount || 0,
                cityPrices: product.prices.map((price) => ({
                    cityId: price.cityId,
                    price: price.price,
                    discount: price.discount,
                })),
                imageUrl: `/api${product.image}`,
            }));
            setProducts(transformedProducts);
        } catch (error) {
            console.error("Ошибка загрузки товаров:", error);
        }
    };

    const fetchCategories = async () => {
        try {
            const { data } = await api.get("/categories");
            setCategories(data);
        } catch (error) {
            console.error("Ошибка загрузки категорий:", error);
        }
    };

    const fetchCities = async () => {
        try {
            const { data } = await api.get("/cities");
            setCities(data);
        } catch (error) {
            console.error("Ошибка загрузки городов:", error);
        }
    };

    const fetchProductDetails = async (id) => {
        try {
            const { data } = await api.get(`/products/${id}`);
            setDetailedProduct({
                ...data,
                imageUrl: `/api${data.image}`,
            });
            setIsDetailModalOpen(true);
        } catch (error) {
            console.error("Ошибка загрузки деталей товара:", error);
        }
    };

    const handleAddOrEditProduct = async (values) => {
        const productData = {
            name: values.name,
            description: values.description,
            categoryName: values.categoryName,
            subcategoryName: values.subcategoryName,
            defaultPrice: values.defaultPrice,
            defaultDiscount: values.defaultDiscount || 0,
            cityPrices: values.cityPrices,
        };

        const formData = new FormData();
        formData.append("products", JSON.stringify([productData]));

        if (values.image && values.image.originFileObj) {
            formData.append("image", values.image.originFileObj);
        }

        try {
            if (editingProduct) {
                await api.patch(`/products/update/${editingProduct.id}`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            } else {
                await api.post("/products/more", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            }

            fetchProducts();
            setIsModalOpen(false);
            setEditingProduct(null);
            form.resetFields();
        } catch (error) {
            console.error(
                editingProduct ? "Ошибка редактирования товара:" : "Ошибка добавления товара:",
                error.response?.data || error.message
            );
        }
    };

    const handleEditClick = (product) => {
        setEditingProduct(product);
        form.setFieldsValue({
            name: product.name,
            description: product.description,
            categoryName: product.categoryName,
            subcategoryName: product.subcategoryName,
            defaultPrice: product.defaultPrice,
            defaultDiscount: product.defaultDiscount,
            cityPrices: product.cityPrices,
        });
        setIsModalOpen(true);
    };

    useEffect(() => {
        fetchProducts();
        fetchCategories();
        fetchCities();
    }, []);

    const columns = [
        {
            title: "Изображение",
            dataIndex: "imageUrl",
            key: "imageUrl",
            render: (src) => <Image src={src} alt="product" width={50} />,
        },
        { title: "Название", dataIndex: "name", key: "name" },
        { title: "Описание", dataIndex: "description", key: "description" },
        { title: "Категория", dataIndex: "categoryName", key: "categoryName" },
        { title: "Подкатегория", dataIndex: "subcategoryName", key: "subcategoryName" },
        { title: "Цена (по умолчанию)", dataIndex: "defaultPrice", key: "defaultPrice" },
        { title: "Скидка (%)", dataIndex: "defaultDiscount", key: "defaultDiscount" },
        {
            title: "Действия",
            key: "actions",
            render: (_, record) => (
                <>
                    <Button type="link" onClick={() => handleEditClick(record)}>
                        Изменить
                    </Button>
                    <Button type="link" onClick={() => fetchProductDetails(record.id)}>
                        Подробно
                    </Button>
                </>
            ),
        },
    ];

    return (
        <>
            <Button
                type="primary"
                onClick={() => {
                    setIsModalOpen(true);
                    setEditingProduct(null);
                    form.resetFields();
                }}
                style={{ marginBottom: 16 }}
            >
                Добавить товар
            </Button>
            <Table dataSource={products} columns={columns} rowKey="id" />

            <Modal
                title={editingProduct ? "Изменить товар" : "Добавить товар"}
                visible={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={() => form.submit()}
            >
                <Form form={form} onFinish={handleAddOrEditProduct} layout="vertical">
                    <Form.Item
                        name="name"
                        label="Название"
                        rules={[{ required: true, message: "Введите название" }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item name="description" label="Описание">
                        <Input.TextArea />
                    </Form.Item>
                    <Form.Item
                        name="categoryName"
                        label="Категория"
                        rules={[{ required: true, message: "Выберите или введите категорию" }]}
                    >
                        <Select
                            showSearch
                            placeholder="Выберите категорию"
                            dropdownRender={(menu) => (
                                <>
                                    {menu}
                                    <div style={{ padding: "8px" }}>
                                        <Input
                                            placeholder="Новая категория"
                                            onPressEnter={(e) => {
                                                const value = e.target.value;
                                                if (value) {
                                                    setCategories([...categories, { name: value }]);
                                                    form.setFieldsValue({ categoryName: value });
                                                    e.target.value = "";
                                                }
                                            }}
                                        />
                                    </div>
                                </>
                            )}
                        >
                            {categories.map((category) => (
                                <Select.Option key={category.name} value={category.name}>
                                    {category.name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="subcategoryName"
                        label="Подкатегория"
                        rules={[{ required: true, message: "Введите подкатегорию" }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="defaultPrice"
                        label="Цена по умолчанию"
                        rules={[{ required: true, message: "Введите цену" }]}
                    >
                        <InputNumber min={0} style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item
                        name="defaultDiscount"
                        label="Скидка по умолчанию (%)"
                    >
                        <InputNumber min={0} max={100} style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item
                        name="cityPrices"
                        label="Цены и скидки для городов"
                        rules={[{ required: true, message: "Укажите цены для городов" }]}
                    >
                        <Form.List name="cityPrices">
                            {(fields, { add, remove }) => (
                                <>
                                    {fields.map((field) => (
                                        <div key={field.key} style={{ display: "flex", gap: "8px" }}>
                                            <Form.Item
                                                {...field}
                                                name={[field.name, "cityId"]}
                                                fieldKey={[field.fieldKey, "cityId"]}
                                                rules={[{ required: true, message: "Выберите город" }]}
                                            >
                                                <Select placeholder="Город">
                                                    {cities.map((city) => (
                                                        <Select.Option key={city.id} value={city.id}>
                                                            {city.name}
                                                        </Select.Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>
                                            <Form.Item
                                                {...field}
                                                name={[field.name, "price"]}
                                                fieldKey={[field.fieldKey, "price"]}
                                                rules={[{ required: true, message: "Введите цену" }]}
                                            >
                                                <InputNumber min={0} placeholder="Цена" />
                                            </Form.Item>
                                            <Form.Item
                                                {...field}
                                                name={[field.name, "discount"]}
                                                fieldKey={[field.fieldKey, "discount"]}
                                            >
                                                <InputNumber min={0} max={100} placeholder="Скидка (%)" />
                                            </Form.Item>
                                            <Button onClick={() => remove(field.name)}>Удалить</Button>
                                        </div>
                                    ))}
                                    <Button onClick={() => add()}>Добавить город</Button>
                                </>
                            )}
                        </Form.List>
                    </Form.Item>
                    <Form.Item
                        name="image"
                        label="Изображение"
                        valuePropName="file"
                        getValueFromEvent={(e) => e?.fileList?.[0] || null}
                    >
                        <Upload beforeUpload={() => false} maxCount={1}>
                            <Button icon={<UploadOutlined />}>Загрузить изображение</Button>
                        </Upload>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="Детали товара"
                visible={isDetailModalOpen}
                onCancel={() => setIsDetailModalOpen(false)}
                footer={null}
            >
                {detailedProduct && (
                    <>
                        <Image src={detailedProduct.imageUrl} alt="product" style={{ marginBottom: 16 }} />
                        <p><strong>Название:</strong> {detailedProduct.name}</p>
                        <p><strong>Описание:</strong> {detailedProduct.description}</p>
                        <p><strong>Категория:</strong> {detailedProduct.category?.name}</p>
                        <p><strong>Подкатегория:</strong> {detailedProduct.subcategory?.name}</p>
                        <p><strong>Цены по городам:</strong></p>
                        <ul>
                            {detailedProduct.prices.map((price) => (
                                <li key={price.id}>
                                    Город {price.cityId}: {price.price} тг, Скидка: {price.discount}%
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </Modal>
        </>
    );
};

export default ProductsPage;
