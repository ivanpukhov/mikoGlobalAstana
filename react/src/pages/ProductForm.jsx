import { Suspense, lazy, useEffect, useState } from 'react';
import {
    ActionIcon,
    Button,
    Card,
    Combobox,
    Group,
    Input,
    InputBase,
    Loader,
    NumberInput,
    Select,
    Stack,
    Text,
    TextInput,
    Title,
    useCombobox,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash, IconUpload } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = lazy(() => import('react-quill'));

const quillModules = {
    toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image'],
        ['clean'],
    ],
};

const ProductForm = ({ initialValues = {}, productId = null }) => {
    const [categories, setCategories] = useState([]);
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Form fields
    const [name, setName] = useState(initialValues.name || '');
    const [description, setDescription] = useState(initialValues.description || '');
    const [categoryName, setCategoryName] = useState(initialValues.categoryName || '');
    const [subcategoryName, setSubcategoryName] = useState(initialValues.subcategoryName || '');
    const [defaultPrice, setDefaultPrice] = useState(initialValues.defaultPrice || 0);
    const [defaultDiscount, setDefaultDiscount] = useState(initialValues.defaultDiscount || 0);
    const [cityPrices, setCityPrices] = useState(initialValues.cityPrices || []);
    const [attributes, setAttributes] = useState(initialValues.attributes || []);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(initialValues.imageUrl || '');
    const [newCategory, setNewCategory] = useState('');

    const combobox = useCombobox({ onDropdownClose: () => combobox.resetSelectedOption() });

    useEffect(() => {
        Promise.all([api.get('/categories'), api.get('/cities')])
            .then(([catRes, cityRes]) => {
                setCategories(catRes.data);
                setCities(cityRes.data);
            })
            .catch(console.error);
    }, []);

    // Reset when initialValues change (edit mode)
    useEffect(() => {
        if (Object.keys(initialValues).length > 0) {
            setName(initialValues.name || '');
            setDescription(initialValues.description || '');
            setCategoryName(initialValues.categoryName || '');
            setSubcategoryName(initialValues.subcategoryName || '');
            setDefaultPrice(initialValues.defaultPrice || 0);
            setDefaultDiscount(initialValues.defaultDiscount || 0);
            setCityPrices(initialValues.cityPrices || []);
            setAttributes(initialValues.attributes || []);
            setImagePreview(initialValues.imageUrl || '');
        }
    }, [initialValues.name]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const addCityPrice = () => setCityPrices((prev) => [...prev, { cityId: '', price: 0, discount: 0 }]);
    const removeCityPrice = (idx) => setCityPrices((prev) => prev.filter((_, i) => i !== idx));
    const updateCityPrice = (idx, field, val) =>
        setCityPrices((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: val } : item)));

    const addAttribute = () => setAttributes((prev) => [...prev, { name: '', value: '' }]);
    const removeAttribute = (idx) => setAttributes((prev) => prev.filter((_, i) => i !== idx));
    const updateAttribute = (idx, field, val) =>
        setAttributes((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: val } : item)));

    const handleSubmit = async () => {
        if (!name.trim()) {
            notifications.show({ color: 'red', message: 'Введите название товара' });
            return;
        }
        if (!categoryName.trim()) {
            notifications.show({ color: 'red', message: 'Выберите категорию' });
            return;
        }
        if (!subcategoryName.trim()) {
            notifications.show({ color: 'red', message: 'Введите подкатегорию' });
            return;
        }

        setLoading(true);
        const productData = {
            name,
            categoryName,
            subcategoryName,
            defaultPrice,
            defaultDiscount: defaultDiscount || 0,
            cityPrices,
            description,
            attributes: attributes || [],
        };

        const formData = new FormData();
        formData.append('products', JSON.stringify([productData]));
        if (imageFile) formData.append('image', imageFile);

        try {
            if (productId) {
                await api.patch(`/products/update/${productId}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            } else {
                await api.post('/products/more', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }
            notifications.show({ color: 'teal', message: 'Товар сохранён' });
            navigate(-1);
        } catch (error) {
            notifications.show({
                color: 'red',
                message: error.response?.data?.message || 'Ошибка сохранения товара',
            });
        } finally {
            setLoading(false);
        }
    };

    const categoryOptions = [
        ...categories.map((c) => c.name),
        ...(newCategory && !categories.find((c) => c.name === newCategory) ? [newCategory] : []),
    ];

    return (
        <Stack gap="lg">
            <TextInput
                label="Название"
                value={name}
                onChange={(e) => setName(e.target.value)}
                radius="md"
                required
            />

            {/* Category combobox with ability to add new */}
            <Stack gap={4}>
                <Text size="sm" fw={500}>Категория <Text span c="red">*</Text></Text>
                <Combobox
                    store={combobox}
                    onOptionSubmit={(val) => {
                        setCategoryName(val);
                        combobox.closeDropdown();
                    }}
                >
                    <Combobox.Target>
                        <InputBase
                            component="input"
                            value={categoryName}
                            onChange={(e) => {
                                setCategoryName(e.target.value);
                                combobox.openDropdown();
                            }}
                            onClick={() => combobox.openDropdown()}
                            placeholder="Выберите или введите категорию"
                            radius="md"
                        />
                    </Combobox.Target>
                    <Combobox.Dropdown>
                        <Combobox.Options>
                            {categoryOptions
                                .filter((c) => c.toLowerCase().includes(categoryName.toLowerCase()))
                                .map((c) => (
                                    <Combobox.Option key={c} value={c}>{c}</Combobox.Option>
                                ))}
                            {categoryName && !categoryOptions.includes(categoryName) && (
                                <Combobox.Option value={categoryName}>
                                    + Создать «{categoryName}»
                                </Combobox.Option>
                            )}
                        </Combobox.Options>
                    </Combobox.Dropdown>
                </Combobox>
            </Stack>

            <TextInput
                label="Подкатегория"
                value={subcategoryName}
                onChange={(e) => setSubcategoryName(e.target.value)}
                radius="md"
                required
            />

            <NumberInput
                label="Цена по умолчанию"
                value={defaultPrice}
                onChange={setDefaultPrice}
                min={0}
                step={100}
                radius="md"
                required
            />

            <NumberInput
                label="Скидка по умолчанию (%)"
                value={defaultDiscount}
                onChange={setDefaultDiscount}
                min={0}
                max={100}
                radius="md"
            />

            {/* Description with ReactQuill */}
            <Stack gap={4}>
                <Text size="sm" fw={500}>Описание</Text>
                <Suspense fallback={<Loader size="sm" color="miko" />}>
                    <ReactQuill
                        theme="snow"
                        value={description}
                        modules={quillModules}
                        onChange={setDescription}
                        style={{ height: 300, marginBottom: 52 }}
                    />
                </Suspense>
            </Stack>

            {/* City prices */}
            <Card withBorder radius="lg" p="md">
                <Stack gap="sm">
                    <Group justify="space-between">
                        <Title order={5}>Цены и скидки по городам</Title>
                        <Button
                            size="xs"
                            leftSection={<IconPlus size={14} />}
                            variant="light"
                            color="miko"
                            radius="md"
                            onClick={addCityPrice}
                        >
                            Добавить город
                        </Button>
                    </Group>
                    {cityPrices.map((cp, idx) => (
                        <Group key={idx} gap="xs" wrap="nowrap" align="flex-end">
                            <Select
                                placeholder="Город"
                                value={cp.cityId?.toString() || null}
                                onChange={(v) => updateCityPrice(idx, 'cityId', v ? parseInt(v) : '')}
                                data={cities.map((c) => ({ value: c.id.toString(), label: c.name }))}
                                radius="md"
                                style={{ flex: 2 }}
                            />
                            <NumberInput
                                placeholder="Цена"
                                value={cp.price}
                                onChange={(v) => updateCityPrice(idx, 'price', v)}
                                min={0}
                                step={100}
                                radius="md"
                                style={{ flex: 2 }}
                            />
                            <NumberInput
                                placeholder="Скидка %"
                                value={cp.discount}
                                onChange={(v) => updateCityPrice(idx, 'discount', v)}
                                min={0}
                                max={100}
                                radius="md"
                                style={{ flex: 1 }}
                            />
                            <ActionIcon
                                color="red"
                                variant="light"
                                radius="md"
                                onClick={() => removeCityPrice(idx)}
                                mb={1}
                            >
                                <IconTrash size={14} />
                            </ActionIcon>
                        </Group>
                    ))}
                </Stack>
            </Card>

            {/* Attributes */}
            <Card withBorder radius="lg" p="md">
                <Stack gap="sm">
                    <Group justify="space-between">
                        <Title order={5}>Атрибуты</Title>
                        <Button
                            size="xs"
                            leftSection={<IconPlus size={14} />}
                            variant="light"
                            color="miko"
                            radius="md"
                            onClick={addAttribute}
                        >
                            Добавить атрибут
                        </Button>
                    </Group>
                    {attributes.map((attr, idx) => (
                        <Group key={idx} gap="xs" wrap="nowrap" align="flex-end">
                            <TextInput
                                placeholder="Название атрибута"
                                value={attr.name}
                                onChange={(e) => updateAttribute(idx, 'name', e.target.value)}
                                radius="md"
                                style={{ flex: 1 }}
                            />
                            <TextInput
                                placeholder="Значение"
                                value={attr.value}
                                onChange={(e) => updateAttribute(idx, 'value', e.target.value)}
                                radius="md"
                                style={{ flex: 1 }}
                            />
                            <ActionIcon
                                color="red"
                                variant="light"
                                radius="md"
                                onClick={() => removeAttribute(idx)}
                                mb={1}
                            >
                                <IconTrash size={14} />
                            </ActionIcon>
                        </Group>
                    ))}
                </Stack>
            </Card>

            {/* Image upload */}
            <Stack gap={4}>
                <Text size="sm" fw={500}>Изображение</Text>
                <label>
                    <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleImageChange}
                    />
                    <Button
                        component="span"
                        leftSection={<IconUpload size={16} />}
                        variant="default"
                        radius="md"
                        style={{ cursor: 'pointer' }}
                    >
                        Загрузить изображение
                    </Button>
                </label>
                {imagePreview && (
                    <img
                        src={imagePreview}
                        alt="preview"
                        style={{ maxWidth: 200, borderRadius: 8, marginTop: 8 }}
                    />
                )}
            </Stack>

            <Button
                color="miko"
                radius="md"
                loading={loading}
                onClick={handleSubmit}
                mt="sm"
            >
                {productId ? 'Сохранить изменения' : 'Создать товар'}
            </Button>
        </Stack>
    );
};

export default ProductForm;
