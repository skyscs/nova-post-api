# Быстрый запуск NovaPost API

## Что реализовано

✅ **Полная архитектура API** с использованием Bun + Hono + TypeScript
✅ **PostGIS база данных** для геопространственного поиска
✅ **Автоматическое обновление** данных из NovaPost API по cron
✅ **Docker контейнеризация** для простого развертывания
✅ **GitHub Actions** для автоматического деплоя
✅ **Полная документация** API и архитектуры

## Структура проекта

```
nova-post-api/
├── src/
│   ├── types/           # TypeScript интерфейсы
│   ├── utils/           # Утилиты (database, logger)
│   ├── services/        # Бизнес-логика
│   ├── routes/          # API маршруты
│   └── index.ts         # Главный файл
├── docker/
│   └── init.sql         # SQL инициализация
├── docs/
│   └── README.md        # Подробная документация
├── .github/workflows/
│   └── deploy.yml       # CI/CD pipeline
├── docker-compose.yml   # Docker конфигурация
├── Dockerfile          # Образ приложения
└── env.example         # Пример переменных окружения
```

## Основные возможности

### 🌍 Геопространственный поиск
- Поиск ближайших отделений по координатам
- Фильтрация по радиусу
- Эффективные PostGIS запросы

### 🔍 Поиск и фильтрация
- Поиск по стране и городу
- Получение списка стран и городов
- Пагинация результатов

### 🔄 Автоматическое обновление
- Ежедневная проверка новых версий NovaPost API
- Автоматическая загрузка и обновление базы данных
- Логирование всех операций

### 📊 Мониторинг
- Health check endpoints
- Статус системы
- История обновлений

## API Endpoints

| Endpoint | Описание |
|----------|----------|
| `GET /api/v1/divisions/nearby` | Поиск ближайших отделений |
| `GET /api/v1/divisions/search` | Поиск по фильтрам |
| `GET /api/v1/divisions/:id` | Получить отделение по ID |
| `GET /api/v1/divisions/countries` | Список стран |
| `GET /api/v1/divisions/countries/:code/cities` | Города по стране |
| `GET /api/v1/system/health` | Проверка здоровья |
| `GET /api/v1/system/status` | Статус системы |
| `POST /api/v1/system/update` | Ручное обновление |

## Запуск для разработки

1. **Установить зависимости:**
   ```bash
   bun install
   ```

2. **Настроить окружение:**
   ```bash
   cp env.example .env
   # Отредактировать .env файл
   ```

3. **Запустить PostgreSQL с PostGIS:**
   ```bash
   docker-compose up -d postgres
   ```

4. **Запустить в режиме разработки:**
   ```bash
   bun run dev
   ```

## Продакшн деплой

1. **Настроить GitHub Secrets:**
   - `HOST`, `USERNAME`, `SSH_KEY`, `PORT`
   - `DATABASE_URL`, `APP_PORT`
   - `NOVA_POST_API_URL`
   - Остальные переменные из env.example

2. **Выполнить push в main:**
   ```bash
   git push origin main
   ```

3. **GitHub Actions автоматически:**
   - Соберет проект
   - Развернет на сервере
   - Запустит Docker контейнеры
   - Проверит работоспособность

## Примеры использования

```bash
# Найти ближайшие отделения в Киеве
curl "http://localhost:3001/api/v1/divisions/nearby?lat=50.4501&lng=30.5234&radius=10"

# Поиск по стране
curl "http://localhost:3001/api/v1/divisions/search?country=Ukraine&limit=10"

# Получить все страны
curl "http://localhost:3001/api/v1/divisions/countries"

# Проверить здоровье API
curl "http://localhost:3001/api/v1/system/health"

# Запустить обновление вручную
curl -X POST "http://localhost:3001/api/v1/system/update"
```

## Технические особенности

- **Bun** - быстрая среда выполнения JavaScript/TypeScript
- **Hono** - легкий веб-фреймворк
- **PostGIS** - расширение PostgreSQL для геопространственных данных
- **Docker** - контейнеризация для простого развертывания
- **TypeScript** - строгая типизация
- **Winston** - структурированное логирование
- **Cron** - автоматические задачи

Проект готов к использованию и развертыванию! 🚀 