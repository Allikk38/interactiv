# interactiv
Вот файл **`README.md`**:

```markdown
# 🏙️ Тренажёр «Расставь ЖК на карте Новосибирска»

Интерактивный веб-тренажёр для обучения агентов недвижимости. Агент должен указать правильное расположение жилых комплексов на карте. Работает на GitHub Pages, не требует бэкенда.

## 🚀 Быстрый старт

1. Склонируйте репозиторий или скачайте файлы
2. Откройте `index.html` в браузере — тренажёр готов к работе
3. Для отправки ответов в Google Таблицу настройте интеграцию (см. ниже)

## 📁 Структура проекта

```
/
├── index.html          # Главная страница
├── css/
│   └── style.css       # Стили
├── js/
│   └── script.js       # Логика тренажёра
├── data/
│   └── jks.json        # Данные о ЖК
└── README.md           # Вы здесь
```

## 🗺️ Как работает карта

- Карта на базе **Leaflet + OpenStreetMap** — полностью бесплатно, без API-ключей
- Карта интерактивная: зум, панорамирование
- Агент выбирает ЖК из списка слева, затем кликает по карте
- Правильность определяется по расстоянию от точки клика до реальных координат ЖК
- Радиус погрешности для каждого ЖК задаётся в `jks.json` (в метрах)

## 📊 Настройка Google Таблицы

### 1. Создайте таблицу

Откройте [sheets.new](https://sheets.new), назовите «Тренажёр ЖК — ответы».  
В первой строке заголовки:

| Имя агента | ЖК | Правильно | Расстояние (м) | Время |
|---|---|---|---|---|
| | | | | |

### 2. Создайте скрипт

- В таблице: **Расширения → Apps Script**
- Вставьте код:

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  try {
    const data = JSON.parse(e.postData.contents);
    sheet.appendRow([
      data.agent_name,
      data.jk_name,
      data.is_correct ? 'Да' : 'Нет',
      data.distance_m,
      data.timestamp
    ]);
    return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

- Сохраните → **Развернуть → Новое развёртывание**
- Тип: **Веб-приложение**, доступ: **Все, в том числе анонимные**
- Скопируйте URL

### 3. Подключите к тренажёру

В файле `js/script.js` в первой строке замените:

```javascript
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/ВАШ_ID/exec';
```

## 🏢 Как добавить свои ЖК

Отредактируйте файл `data/jks.json`. Формат записи:

```json
{
  "id": 1,
  "name": "Название ЖК",
  "developer": "Застройщик",
  "lat": 55.0302,
  "lng": 82.9204,
  "radius": 500,
  "hint": "Подсказка, которая покажется при ошибке"
}
```

- `lat`, `lng` — реальные координаты ЖК (можно взять с Яндекс.Карт)
- `radius` — допустимая погрешность в метрах (500 м для центра, 800–1000 м для окраин)

## 🌐 Публикация на GitHub Pages

1. Загрузите все файлы в репозиторий GitHub
2. **Settings → Pages → Source: Deploy from a branch → main → / (root) → Save**
3. Через 1–2 минуты сайт будет доступен по ссылке

## 📱 Адаптивность

- Десктоп: карта справа, список ЖК слева
- Планшет и мобильные: список ЖК сверху, карта снизу
- Минимальная ширина экрана: 320px

## 🔧 Технологии

- HTML5, CSS3, JavaScript (ES6+)
- [Leaflet](https://leafletjs.com/) — интерактивная карта
- [OpenStreetMap](https://www.openstreetmap.org/) — бесплатные тайлы карты
- Google Apps Script — сбор ответов (опционально)

## 📝 Лицензия

Свободное использование. Разработано для внутреннего обучения агентов недвижимости.
```

---

**Все файлы готовы.** Полный комплект:

| Файл | Статус |
|---|---|
| `index.html` | ✅ |
| `css/style.css` | ✅ |
| `js/script.js` | ✅ |
| `data/jks.json` | ✅ |
| `README.md` | ✅ |

Осталось заменить `GOOGLE_SCRIPT_URL` в `script.js` и актуализировать `jks.json` под реальные ЖК заказчика. Могу помочь с этим, когда будут готовы данные.
