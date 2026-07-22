import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ActionIcon, Badge, Box, Button, Card, Divider, FileButton, Grid, Group, Image, Loader, NumberInput, Paper, Select, Stack, Switch, Tabs, TagsInput, Text, TextInput, Textarea, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconGripVertical, IconPhoto, IconPlus, IconTrash, IconUpload } from '@tabler/icons-react';
import api, { getApiErrorMessage } from '../api/api';
import { resolveImage } from '../utils/resolveImage';
import classes from './RecipeEditor.module.css';

// react-quill is CommonJS. Loading it the same way as ProductForm prevents
// Vite from mixing static and dynamic interop wrappers in the production bundle.
const ReactQuill = lazy(() => import('react-quill'));

const empty = { title: '', slug: '', excerpt: '', content: '', category: '', tags: [], ingredients: [{ name: '', amount: '', group: '' }], steps: [{ title: '', text: '' }], servings: 4, prepTime: 15, cookTime: 30, difficulty: 'easy', calories: '', isPublished: false, isFeatured: false, seoTitle: '', seoDescription: '' };
const slugify = (value) => value.toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9]+/gi, '-').replace(/^-+|-+$/g, '');
const quillModules = { toolbar: [[{ header: [2, 3, false] }], ['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['blockquote', 'link'], ['clean']] };

export default function RecipeEditorPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [form, setForm] = useState(empty);
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState('');
    const [saving, setSaving] = useState(false);
    const [slugTouched, setSlugTouched] = useState(false);
    const set = (field, value) => setForm((current) => ({ ...current, [field]: value }));

    useEffect(() => {
        if (!id) return;
        api.get(`/recipes/admin/${id}`).then(({ data }) => { setForm({ ...empty, ...data, tags: data.tags || [], ingredients: data.ingredients?.length ? data.ingredients : empty.ingredients, steps: data.steps?.length ? data.steps : empty.steps }); setPreview(resolveImage(data.image, '')); setSlugTouched(true); }).catch(() => { notifications.show({ color: 'red', message: 'Рецепт не найден.' }); navigate('/admin/recipes'); });
    }, [id, navigate]);

    const previewSrc = useMemo(() => file ? URL.createObjectURL(file) : preview, [file, preview]);
    useEffect(() => () => { if (previewSrc?.startsWith('blob:')) URL.revokeObjectURL(previewSrc); }, [previewSrc]);

    const updateList = (field, index, key, value) => setForm((current) => ({ ...current, [field]: current[field].map((item, i) => i === index ? { ...item, [key]: value } : item) }));
    const addList = (field, value) => setForm((current) => ({ ...current, [field]: [...current[field], value] }));
    const removeList = (field, index) => setForm((current) => ({ ...current, [field]: current[field].filter((_, i) => i !== index) }));

    const save = async () => {
        if (!form.title.trim()) return notifications.show({ color: 'red', message: 'Укажите название рецепта.' });
        if (form.isPublished && !form.ingredients.some((item) => item.name.trim())) return notifications.show({ color: 'red', message: 'Для публикации добавьте ингредиенты.' });
        if (form.isPublished && !form.steps.some((item) => item.text.trim())) return notifications.show({ color: 'red', message: 'Для публикации добавьте шаги приготовления.' });
        setSaving(true);
        const data = new FormData();
        Object.entries(form).forEach(([key, value]) => data.append(key, Array.isArray(value) ? JSON.stringify(value) : String(value ?? '')));
        if (file) data.append('image', file);
        try {
            const response = id ? await api.put(`/recipes/admin/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }) : await api.post('/recipes/admin', data, { headers: { 'Content-Type': 'multipart/form-data' } });
            notifications.show({ color: 'teal', message: form.isPublished ? 'Рецепт сохранён и опубликован.' : 'Черновик сохранён.' });
            navigate(`/admin/recipes/edit/${response.data.id}`);
        } catch (error) { notifications.show({ color: 'red', message: getApiErrorMessage(error, 'Не удалось сохранить рецепт.') }); }
        finally { setSaving(false); }
    };

    return <Stack gap="lg" className={classes.editor}>
        <Group justify="space-between" align="center"><Group><ActionIcon component={Link} to="/admin/recipes" variant="light" color="gray" size="lg"><IconArrowLeft /></ActionIcon><div><Group gap="xs"><Title order={2}>{id ? 'Редактирование рецепта' : 'Новый рецепт'}</Title><Badge color={form.isPublished ? 'teal' : 'gray'}>{form.isPublished ? 'Опубликован' : 'Черновик'}</Badge></Group><Text c="dimmed">Все изменения появятся на сайте после сохранения</Text></div></Group><Button color="miko" loading={saving} onClick={save}>{form.isPublished ? 'Сохранить и опубликовать' : 'Сохранить черновик'}</Button></Group>

        <Grid gutter="lg" align="flex-start"><Grid.Col span={{ base: 12, lg: 8 }}><Stack gap="lg">
            <Card withBorder p="lg"><Stack>
                <TextInput label="Название" placeholder="Например, Том-ям с креветками" required value={form.title} onChange={(e) => { set('title', e.target.value); if (!slugTouched) set('slug', slugify(e.target.value)); }} />
                <Textarea label="Короткое описание" description="Показывается на карточке и под заголовком" minRows={3} maxLength={300} value={form.excerpt} onChange={(e) => set('excerpt', e.target.value)} />
                <Box><Text fw={600} mb={6}>Вступление и советы</Text><Text size="sm" c="dimmed" mb="xs">Форматированный текст перед шагами приготовления</Text><Suspense fallback={<Box className={classes.editorLoader}><Loader color="miko" size="sm" /><Text size="sm" c="dimmed">Загрузка редактора…</Text></Box>}><ReactQuill theme="snow" value={form.content} onChange={(value) => set('content', value)} modules={quillModules} className={classes.quill} /></Suspense></Box>
            </Stack></Card>

            <Card withBorder p="lg"><Group justify="space-between" mb="md"><div><Title order={3}>Ингредиенты</Title><Text c="dimmed" size="sm">Количество, единица измерения и необязательная группа</Text></div><Button variant="light" color="miko" leftSection={<IconPlus size={16}/>} onClick={() => addList('ingredients', { name: '', amount: '', group: '' })}>Добавить</Button></Group>
                <Stack gap="sm">{form.ingredients.map((item, index) => <Paper withBorder p="sm" key={index}><Group align="flex-end" wrap="nowrap"><IconGripVertical size={18} color="#a1a1aa"/><TextInput label={index === 0 ? 'Ингредиент' : null} placeholder="Куриное филе" value={item.name} onChange={(e) => updateList('ingredients', index, 'name', e.target.value)} style={{ flex: 2 }}/><TextInput label={index === 0 ? 'Количество' : null} placeholder="300 г" value={item.amount} onChange={(e) => updateList('ingredients', index, 'amount', e.target.value)} style={{ flex: 1 }}/><TextInput label={index === 0 ? 'Группа' : null} placeholder="Для соуса" value={item.group} onChange={(e) => updateList('ingredients', index, 'group', e.target.value)} style={{ flex: 1 }}/><ActionIcon color="red" variant="light" mb={2} disabled={form.ingredients.length === 1} onClick={() => removeList('ingredients', index)}><IconTrash size={17}/></ActionIcon></Group></Paper>)}</Stack>
            </Card>

            <Card withBorder p="lg"><Group justify="space-between" mb="md"><div><Title order={3}>Шаги приготовления</Title><Text c="dimmed" size="sm">Разбейте рецепт на простые понятные действия</Text></div><Button variant="light" color="miko" leftSection={<IconPlus size={16}/>} onClick={() => addList('steps', { title: '', text: '' })}>Добавить шаг</Button></Group>
                <Stack>{form.steps.map((step, index) => <Paper withBorder p="md" key={index}><Group align="flex-start" wrap="nowrap"><div className={classes.stepBadge}>{index + 1}</div><Stack gap="xs" style={{ flex: 1 }}><TextInput placeholder="Название шага (необязательно)" value={step.title} onChange={(e) => updateList('steps', index, 'title', e.target.value)}/><Textarea placeholder="Подробно опишите действие…" minRows={3} value={step.text} onChange={(e) => updateList('steps', index, 'text', e.target.value)}/></Stack><ActionIcon color="red" variant="light" disabled={form.steps.length === 1} onClick={() => removeList('steps', index)}><IconTrash size={17}/></ActionIcon></Group></Paper>)}</Stack>
            </Card>
        </Stack></Grid.Col>

        <Grid.Col span={{ base: 12, lg: 4 }}><Stack gap="lg" className={classes.sidebar}>
            <Card withBorder p="lg"><Title order={3} mb="md">Публикация</Title><Stack><Switch label="Опубликовать на сайте" description="Черновик виден только администраторам" color="miko" checked={form.isPublished} onChange={(e) => set('isPublished', e.currentTarget.checked)}/><Switch label="Рекомендованный рецепт" description="Поднимется выше остальных" color="yellow" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.currentTarget.checked)}/><Divider/><Button color="miko" fullWidth loading={saving} onClick={save}>Сохранить</Button></Stack></Card>
            <Card withBorder p="lg"><Title order={3} mb="md">Обложка</Title><Stack>{previewSrc ? <Image src={previewSrc} h={220} radius="md" fit="cover"/> : <Box className={classes.placeholder}><IconPhoto size={38}/><Text c="dimmed">Добавьте фото блюда</Text></Box>}<FileButton onChange={setFile} accept="image/png,image/jpeg,image/webp"><Button variant="light" color="miko" leftSection={<IconUpload size={17}/>}>{previewSrc ? 'Заменить фото' : 'Загрузить фото'}</Button></FileButton><Text size="xs" c="dimmed">JPG, PNG или WEBP. Рекомендуется горизонтальное фото от 1200 px.</Text></Stack></Card>
            <Card withBorder p="lg"><Title order={3} mb="md">Классификация</Title><Stack><TextInput label="Категория" placeholder="Завтраки" value={form.category} onChange={(e) => set('category', e.target.value)}/><TagsInput label="Теги" placeholder="Введите тег и нажмите Enter" value={form.tags} onChange={(value) => set('tags', value)} clearable /></Stack></Card>
            <Card withBorder p="lg"><Title order={3} mb="md">Параметры блюда</Title><Grid><Grid.Col span={6}><NumberInput label="Подготовка, мин" min={0} value={form.prepTime} onChange={(v) => set('prepTime', v)}/></Grid.Col><Grid.Col span={6}><NumberInput label="Готовка, мин" min={0} value={form.cookTime} onChange={(v) => set('cookTime', v)}/></Grid.Col><Grid.Col span={6}><NumberInput label="Порций" min={1} value={form.servings} onChange={(v) => set('servings', v)}/></Grid.Col><Grid.Col span={6}><NumberInput label="Ккал / порция" min={0} value={form.calories} onChange={(v) => set('calories', v)}/></Grid.Col></Grid><Select mt="md" label="Сложность" value={form.difficulty} onChange={(v) => set('difficulty', v)} data={[{ value: 'easy', label: 'Легко' }, { value: 'medium', label: 'Средне' }, { value: 'hard', label: 'Сложно' }]}/></Card>
            <Card withBorder p="lg"><Tabs defaultValue="url"><Tabs.List grow><Tabs.Tab value="url">URL</Tabs.Tab><Tabs.Tab value="seo">SEO</Tabs.Tab></Tabs.List><Tabs.Panel value="url" pt="md"><TextInput label="Адрес страницы" leftSection={<Text size="xs">/</Text>} value={form.slug} onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)); }}/></Tabs.Panel><Tabs.Panel value="seo" pt="md"><Stack><TextInput label="SEO-заголовок" value={form.seoTitle} onChange={(e) => set('seoTitle', e.target.value)} maxLength={70}/><Textarea label="Meta-описание" value={form.seoDescription} onChange={(e) => set('seoDescription', e.target.value)} maxLength={170}/></Stack></Tabs.Panel></Tabs></Card>
        </Stack></Grid.Col></Grid>
    </Stack>;
}
