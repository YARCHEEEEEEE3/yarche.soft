# SAKYRA — головна студії (v7)

Поточний маршрут: титульна → #setup → #studio. Після збереження налаштувань наступні переходи з титулки одразу відкривають студію. #settings дозволяє редагувати назву, мову та формат. #workspace — сумісний псевдонім головної.

Головна відтворює новий референс із японською кімнатою, скляними рожевими панелями, навігацією, процесом створення й картками. На телефоні меню відкривається у діалозі, а панелі й картки розташовані вертикально.

Працює локально:

- Створення, редагування, дублювання, пошук і видалення проєктів із підтвердженням.
- Вибір обкладинки та формату, автоматичне збереження сценарію.
- JSON-експорт даних вибраного проєкту, без імітації відеофайлу.
- Перемикання української та англійської мови, налаштування, меню профілю й сповіщень.
- LocalStorage з резервом у пам’яті та видимим попередженням, якщо сховище недоступне.

Ancient Japan, Temple Stories та Moon Rituals — позначені демонстраційні приклади. Вони не рахуються як створені проєкти; активні генерації дорівнюють нулю. Озвучка, генерація сцен і відеоекспорт поки мають окремі екрани майбутнього функціоналу. Google-вхід усе ще потребує конфігурації. Бекенду, міжпристроєвої синхронізації та AI-генерації немає.

Зберігання: sakyra.studio.preferences.v1, sakyra.studio.projects.v1, sakyra.last-project-export. Дані залишаються в поточному браузері.

Перевірки: npm test; npm run build:pages; node scripts/check-pages.mjs. Playwright покриває весь шлях до студії, локальні проєкти, сценарій, справжній JSON-download, видалення, діалоги та фокус, помилки сховища й мобільну навігацію. Емуляція iPhone виконується у Chromium, не у фізичному Safari.

---

# SAKYRA — титульна сторінка та мобільний перехід

Поточний маршрут: / → титульна SAKYRA → «Відкрити студію» → #setup (налаштування). Посилання «На титульну» повертає на #login. Назад/уперед у браузері працюють; попереднє #workspace залишається сумісним із налаштуванням.

Google OAuth поки не налаштовано, тому основна кнопка відкриває чесно позначений тестовий перегляд без авторизації. Якщо додати Supabase-конфігурацію, кнопка знову запускає Google OAuth; справжня сесія веде на #setup.

На телефоні у вертикальній орієнтації використовується окрема композиція title-mobile.png на всю висоту екрана, без рожевих порожніх полів. При повороті вмикається широкий фон. Canvas враховує пропорції та cover-масштабування; зміна фонового зображення перевантажує WebGL-текстуру. Кнопка має висоту 60 px, збережені пелюстки, вода та reduced-motion.

## Перегляд на iPhone через GitHub Pages

Версія для GitHub Pages міститься в docs/: index.html, assets/ та scene/. Вона працює в підкаталозі /yarche.soft/, а браузер завантажує фони окремо й кешує їх. Для одного автономного HTML використовується npm run export:demo.

Щоб оновити її після змін: npm run build:pages.

У Settings → Pages виберіть Deploy from a branch → main → /docs → Save. Після успішної публікації GitHub покаже HTTPS-адресу: відкрийте її в Safari на iPhone. До завершення публікації ця адреса не вважається робочою.

Форма враховує безпечні відступи iPhone, має сенсорні кнопки й поля з текстом 16 px, щоб уникнути автоматичного збільшення Safari. Налаштування зберігаються окремо на кожному пристрої. Перевірки розмірів екрана виконані в Chromium; справжній Safari на iPhone тут недоступний.

# Попередній етап: перший запуск (v5)

Головний екран тепер відтворює новий референс налаштування студії: вечірній японський пейзаж, напівпрозора панель, рожева анімована рамка та SVG-декор. Фон створений image generation за прикладом користувача; це інтерпретація, не піксельно точна копія. Форма та логотип — окремі HTML/CSS/SVG елементи.

- Назва студії: 1–48 символів, пробіли по краях прибираються.
- Мова: українська або англійська; весь екран перемикається одразу.
- Формат: 16:9 / YouTube або 9:16 / Shorts, доступні клавіатурою radio-кнопки.
- «Увійти в студію» зберігає параметри в localStorage (sakyra.studio.preferences.v1) й показує підтвердження з можливістю редагування. Це дизайн першого запуску, а не справжня авторизація чи готовий відеоредактор.
- Помилки localStorage обробляються без втрати введених даних. У локальних HTML збереження залежить від політики браузера.
- Canvas анімує пелюстки та воду, CSS — рамку. Приховані вкладки й reduced-motion зупиняють ефекти.
- Попередня сторінка входу залишається за #login.

    npm ci
    npm run dev -- --port 5173
    npm test
    npm run export:demo -- /workspace/scratch/sakyra/SAKYRA-v5.html

Автономний HTML містить усі зображення, шрифт, стилі та скрипти. Поточні браузерні перевірки покривають форму, збереження, мови, валідацію, помилки сховища, клавіатуру, мобільний екран, анімації та попередню сторінку входу.

---

# SAKYRA — living scene (v4)

Оновлена сторінка входу на основі затвердженої композиції користувача. Фон відредаговано через image generation: прибрані застиглі пелюстки, намальована кнопка та яскравий сонячний слід під мостом. Новий PNG має 1672 × 941 px: це очищена ілюстрація, не справжній 4K-оригінал. Оригінальний JPEG збережений у public/scene/reference.jpg.

Кнопка відтворена HTML/CSS із живим текстом, SVG-значком Google, стрілкою, напівпрозорим рожевим склом та ореолом. Вона залишається чіткою при масштабуванні.

## Рух сцени

- WebGL локально викривляє воду: дві хвилі, рух віддзеркалень і дрібні сріблясті брижі.
- Крона й кінчики гілок ледь погойдуються; хмари повільно зміщуються; тепле світло ліхтарів пульсує.
- Сонце, логотип, міст і будинки закріплені. Суцільного переміщення сцени немає.
- 34 пелюстки падають з вітром, обертаються, коротко пливуть по воді та залишають кола.
- Без WebGL працює Canvas 2D для води й пелюсток; рух гілок та освітлення доступний у WebGL.
- Прихована вкладка призупиняє цикли. Reduced motion показує статичну сцену без падаючих пелюсток. Рендер обмежений 2560 px; при тривалих повільних кадрах роздільність знижується.

## Запуск

Node.js 22.12+.

    npm ci
    npm run dev -- --port 5173
    npm test
    npm run export:demo -- /workspace/scratch/sakyra/SAKYRA-v4.html

Автономний HTML містить PNG, JavaScript, CSS, SVG та шрифт і відкривається подвійним кліком без сервера. OAuth потребує налаштованого сайту.

Композиція повністю поміщається в екран із пропорціями 1672:941; на інших пропорціях залишаються рожеві поля. На телефоні кнопка має мінімальний розмір 245 × 50 px.

Playwright перевіряє композицію, справжню кнопку, клавіатурний вхід, рух води й пелюсток, паузу в прихованій вкладці, reduced-motion, Canvas fallback та мобільний екран. Автономний файл додатково перевіряється без мережі. Це перевірка Chromium у Linux; окремі Safari/macOS та Windows перевірки не виконувались.

## Google OAuth

Без конфігурації натискання повідомляє, що Google-вхід ще не підключено. Паролів або фальшивого успішного входу немає.

1. Створіть Supabase-проєкт і Google OAuth Client ID типу Web application.
2. У Google Console додайте Supabase callback https://<project-ref>.supabase.co/auth/v1/callback.
3. У Supabase → Authentication → Providers → Google введіть Client ID та Client Secret. Secret залишається у Supabase.
4. У Supabase → URL Configuration задайте Site URL та redirect URLs: наприклад http://localhost:5173/ і production HTTPS-адресу.
5. Скопіюйте .env.example у .env.local, заповніть VITE_SUPABASE_URL і VITE_SUPABASE_PUBLISHABLE_KEY публічним publishable/anon ключем.
6. Перезапустіть сервер або перебудуйте застосунок.

Використано PKCE. Лише справжня Supabase-сесія відкриває заглушку #workspace; реальна робоча область та генерація не реалізовані. OAuth потребує HTTP(S)-хостингу, конфігурації й окремої перевірки з Google-акаунтом.

Попередні версії та резервні копії: /workspace/scratch/sakyra/.

### Script workspace

The `#scripts` tab is a responsive, local-first editor in the studio's pink glass style. Typing starts a saved project; the selected project survives a tab refresh. It includes live word/character counts, separate new drafts, confirmed text clearing and a next-step link to voiceover.

UTF-8 `.txt` imports create a new project without overwriting the current draft. Files are limited to 100 KB and scripts to 20,000 characters; invalid encoding and oversized input are rejected. “Generate script / Test” opens an explicitly labelled local template builder, not an AI API. Voice generation remains a preview.

Validation: `npx playwright test tests/script.spec.ts tests/dashboard.spec.ts` covers persistence, project selection, imports, preservation of drafts, templates, clearing and mobile layouts.

### Voice workspace

`#voice` contains six illustrated demo profiles, language/gender/age/mood filters, editable preview text, speed and pitch controls, a script-based duration estimate, and navigation to video. Voice preferences are saved with the selected project; a separate local draft supports trying the page without a project.

Preview uses the browser's Web Speech API when a matching Ukrainian or English device voice exists. The UI identifies this as a device preview, animates playback only after speech actually starts, and stops speech on settings changes, navigation and tab hiding. Unsupported browsers or unavailable languages show a clear explanation. Profiles are design presets, not six connected AI voices; generation opens a test dialog and does not claim to create an audio file.

Validation: `npx playwright test tests/voice.spec.ts` covers filters, persistence, duration estimates, mocked speech lifecycle, unavailable voices, honest generation state, and desktop/mobile layouts. Actual voice availability and sound depend on the user's browser and installed system voices.

### Video storyboard demo

`#video` implements a saved, approval-gated workflow: create demo characters → review names/descriptions and approve → review the scene plan → approve and prepare photos → optionally run individual, selected or batch animation tests. A persistent demo label distinguishes prepared artwork and simulated jobs from AI generation. Animation tests produce no video file.

Duration options range from 30 seconds to 30 minutes, with 4/6/8-second scenes. The count is `ceil(duration / sceneLength)` and the final scene is shortened to match the exact total. Long projects render at most 12 large scene cards per page. Scene detail dialogs edit character, location, shot and prompt. Editing a prepared frame clears only its photo/animation status and requires scene approval again. Configuration changes after review require an explicit restart confirmation.

Six visual style references are available in a gallery. The selected style is saved for a future generation integration; this demo continues to show prepared anime scenes, which repeat in longer projects. Character edits affect generated demo plan text. Script excerpts are copied into scene prompts with a length cap; the original script is unchanged.

State lives in `project.video` (included in JSON export), or a separate browser draft when no project is selected. Timed demo jobs clean up on navigation; partial photo and animation results persist, and photo preparation can resume. No network generation requests are made. Storage errors are surfaced.

Validation: `npx playwright test tests/video.spec.ts tests/script.spec.ts tests/voice.spec.ts tests/dashboard.spec.ts`. Video checks cover approvals, per-frame/batch animation, reloads, project isolation, resumable jobs, style selection, 20-minute scene counts, final scene duration, editing invalidation, pagination, and mobile layouts.
