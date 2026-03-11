import React, { useState, useEffect } from "react";
import { Modal, Select, Spin } from "antd";
import api from "../../api/api";

const { Option } = Select;

export const CityModal = ({ open, onClose, onCitySelect }) => {
    const [cities, setCities] = useState([]);
    const [selectedCity, setSelectedCity] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCities = async () => {
            try {
                setLoading(true);
                const response = await api.get("/cities");
                if (response.data && response.data.length > 0) {
                    setCities(response.data);
                } else {
                    console.error("Данные отсутствуют: ", response.data);
                }
            } catch (error) {
                console.error("Ошибка при получении городов:", error);
            } finally {
                setLoading(false);
            }
        };

        if (open) fetchCities();
    }, [open]);

    const handleCityChange = (value) => {
        const city = cities.find((c) => c.id === value);
        setSelectedCity(city);
    };

    const handleOk = () => {
        if (selectedCity) {
            onCitySelect(selectedCity);
            onClose();
        }
    };

    return (
        <Modal
            title="Выберите ваш город"
            open={open}
            onOk={handleOk}
            okText="Сохранить"
            cancelText="Отмена"
            centered
            maskClosable={false} // Запрещает закрытие кликом вне окна
            closable={false} // Убирает крестик для закрытия
            okButtonProps={{
                disabled: !selectedCity, // Отключить кнопку, если город не выбран
                style: { backgroundColor: "#0CE3CB", color: "#fff" },
            }}
        >
            <Spin spinning={loading} tip="Загрузка городов...">
                {!loading && (
                    <Select
                        showSearch
                        placeholder="Выберите город"
                        optionFilterProp="children"
                        onChange={handleCityChange}
                        style={{ width: "100%" }}
                    >
                        {cities.map((city) => (
                            <Option key={city.id} value={city.id}>
                                {city.name}
                            </Option>
                        ))}
                    </Select>
                )}
            </Spin>
        </Modal>
    );
};
