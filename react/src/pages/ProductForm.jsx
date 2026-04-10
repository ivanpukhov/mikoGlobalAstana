import React, { useEffect, useState, Suspense, lazy } from "react";
import { Form, Input, InputNumber, Select, Button, Upload, Spin } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import api from "../api/api";
import { useNavigate } from "react-router-dom";
import "react-quill/dist/quill.snow.css";

const ReactQuill = lazy(() => import("react-quill"));

const ProductForm = ({ initialValues = {}, productId = null }) => {
    const [categories, setCategories] = useState([]);
    const [cities, setCities] = useState([]);
    const [fileList, setFileList] = useState([]);
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const [description, setDescription] = useState(initialValues.description || "");
    const [loading, setLoading] = useState(false);

    const fetchCategoriesAndCities = async () => {
        try {
            const [categoriesData, citiesData] = await Promise.all([
                api.get("/categories"),
                api.get("/cities"),
            ]);
            setCategories(categoriesData.data);
            setCities(citiesData.data);
        } catch (error) {
            console.error("Ошибка загрузки данных:", error);
        }
    };

    const handleFormSubmit = async (values) => {
        setLoading(true);
        const productData = {
            name: values.name,
            categoryName: values.categoryName,
            subcategoryName: values.subcategoryName,
            defaultPrice: values.defaultPrice,
            defaultDiscount: values.defaultDiscount || 0,
            cityPrices: values.cityPrices,
            description,
            attributes: values.attributes || [],
        };

        const formData = new FormData();
        formData.append("products", JSON.stringify([productData]));

        if (fileList.length > 0) {
            formData.append("image", fileList[0].originFileObj);
        }

        try {
            if (productId) {
                await api.patch(`/products/update/${productId}`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            } else {
                await api.post("/products/more", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            }
            navigate(-1);
        } catch (error) {
            console.error("Ошибка сохранения товара:", error.response?.data || error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategoriesAndCities();
    }, []);

    useEffect(() => {
        if (Object.keys(initialValues).length > 0) {
            form.setFieldsValue(initialValues);
            if (initialValues.imageUrl) {
                setFileList([
                    {
                        uid: "-1",
                        name: "Текущее изображение",
                        status: "done",
                        url: initialValues.imageUrl,
                    },
                ]);
            }
        }
    }, [initialValues]);

    const uploadProps = {
        fileList,
        onChange: ({ fileList }) => setFileList(fileList),
        beforeUpload: () => false,
        listType: "picture",
    };

    const quillModules = {
        toolbar: [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic", "underline", "strike"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["link", "image"],
            ["clean"],
        ],
    };

    return (
        <Spin spinning={loading} tip="Сохранение...">
            <Form
                form={form}
                layout="vertical"
                onFinish={handleFormSubmit}
                initialValues={initialValues}
            >
                <Form.Item
                    name="name"
                    label="Название"
                    rules={[{ required: true, message: "Введите название" }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item label="Описание">
                    <Suspense fallback={<div>Загрузка редактора...</div>}>
                        <ReactQuill
                            theme="snow"
                            value={description}
                            modules={quillModules}
                            onChange={setDescription}
                            style={{ height: "300px", marginBottom: "20px" }}
                        />
                    </Suspense>
                </Form.Item>

                <Form.Item
                    name="categoryName"
                    label="Категория"
                    rules={[{ required: true, message: "Выберите категорию" }]}
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
                    <InputNumber min={0} precision={0} step={1} style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item name="defaultDiscount" label="Скидка по умолчанию (%)">
                    <InputNumber min={0} max={100} style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item name="cityPrices" label="Цены и скидки для городов">
                    <Form.List name="cityPrices">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name }) => (
                                    <div key={key} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                                        <Form.Item name={[name, "cityId"]}>
                                            <Select placeholder="Город">
                                                {cities.map((city) => (
                                                    <Select.Option key={city.id} value={city.id}>
                                                        {city.name}
                                                    </Select.Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                        <Form.Item name={[name, "price"]}>
                                            <InputNumber min={0} precision={0} step={1} placeholder="Цена" />
                                        </Form.Item>
                                        <Form.Item name={[name, "discount"]}>
                                            <InputNumber min={0} max={100} placeholder="Скидка (%)" />
                                        </Form.Item>
                                        <Button onClick={() => remove(name)}>Удалить</Button>
                                    </div>
                                ))}
                                <Button onClick={() => add()}>Добавить город</Button>
                            </>
                        )}
                    </Form.List>
                </Form.Item>

                <Form.Item name="attributes" label="Атрибуты">
                    <Form.List name="attributes">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name }) => (
                                    <div key={key} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                                        <Form.Item name={[name, "name"]}>
                                            <Input placeholder="Название атрибута" />
                                        </Form.Item>
                                        <Form.Item name={[name, "value"]}>
                                            <Input placeholder="Значение" />
                                        </Form.Item>
                                        <Button onClick={() => remove(name)}>Удалить</Button>
                                    </div>
                                ))}
                                <Button onClick={() => add()}>Добавить атрибут</Button>
                            </>
                        )}
                    </Form.List>
                </Form.Item>

                <Form.Item name="image" label="Изображение">
                    <Upload {...uploadProps}>
                        <Button icon={<UploadOutlined />}>Загрузить изображение</Button>
                    </Upload>
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" disabled={loading}>
                        {loading ? "Сохранение..." : "Сохранить"}
                    </Button>
                </Form.Item>
            </Form>
        </Spin>
    );
};

export default ProductForm;
