import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6">
        <h1 className="text-2xl font-bold text-primary-700">CalSnap</h1>
        <div className="flex gap-3">
          <Link
            href="/auth/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100 transition"
          >
            Войти
          </Link>
          <Link
            href="/auth/register"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition"
          >
            Начать
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-20 text-center">
        <h2 className="text-4xl font-bold leading-tight text-gray-900 sm:text-5xl">
          Умный трекинг питания
          <br />
          <span className="text-primary">с ИИ-анализом фото</span>
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
          Сфотографируй еду — получи калории и БЖУ за секунды. Персональное меню,
          дневник питания и графики прогресса. Всё бесплатно.
        </p>

        <Link
          href="/auth/register"
          className="mt-10 inline-block rounded-xl bg-primary px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-primary-dark transition"
        >
          Начать бесплатно
        </Link>

        <div className="mt-20 grid gap-8 sm:grid-cols-3">
          {[
            { icon: '📸', title: 'Фото-анализ', desc: 'Сфотографируй блюдо — ИИ определит КБЖУ' },
            { icon: '🍽️', title: 'ИИ-меню', desc: 'Персональный план питания под твою цель' },
            { icon: '📈', title: 'Прогресс', desc: 'Графики веса, калорий и БЖУ' },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
              <div className="text-4xl">{f.icon}</div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
