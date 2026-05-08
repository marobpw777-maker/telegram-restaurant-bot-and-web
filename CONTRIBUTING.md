# Contributing

Этот репозиторий можно использовать как демонстрационный стенд и основу для доработки.

## Перед началом

- проверьте, что установлены Python и Node.js;
- не добавляйте в репозиторий `.env`, `venv`, `node_modules`, `dist`, `*.db`, `*.sqlite` и логи;
- все локальные секреты храните только в переменных окружения.

## Локальный запуск

### Backend

```bat
cd BOTREST
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

### Frontend

```bat
cd Веб-интерфейс\app
npm install
npm run dev
```

## Проверки перед PR

- backend собирается и импортируется без ошибок;
- frontend собирается через `npm run build`;
- админка открывается через `#/admin`;
- тексты интерфейса не содержат грубых опечаток;
- новые изменения не ломают бронирование, авторизацию и маршрут админки.

## Стиль коммитов

Пишите коротко и по делу. Например:

- `fix: restore admin route`
- `feat: improve booking reminder text`
- `docs: add deployment notes`

## Что не присылать в PR

- секреты и токены;
- локальные базы;
- сгенерированные папки сборки;
- большие бинарные артефакты без необходимости.
