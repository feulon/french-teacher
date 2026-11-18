import Link from "next/link";
import type { Metadata } from "next";
import { Icon } from "@/components/Icon";
import { LessonPage } from "@/components/LessonPage";
import { StreakCard } from "@/components/StreakCard";
import { TodayHeader } from "@/components/TodayHeader";
import { requireSession } from "@/lib/auth";
import { formatLongDate, type TodayLesson } from "@/lib/lesson";
import { todayOverview } from "@/lib/study";
import { studyContext } from "@/lib/study-context";
import styles from "./today.module.css";

export const metadata: Metadata = { title: "Hoje" };

function Dock({ today }: { today: TodayLesson }) {
  if (today.nextHref === null) {
    return (
      <div className="dock">
        <p className={styles.finished}>Tudo pronto por hoje. Escrever e Conversar com a IA chegam em breve.</p>
        <Link href="/aula/escutar" className="btn btn-ghost">
          Escutar de novo
        </Link>
      </div>
    );
  }
  return (
    <div className="dock">
      <Link href="/aula" className="btn btn-primary">
        {today.phase === "fresh" ? "Começar a aula" : "Continuar a aula"} <Icon name="arrow" />
      </Link>
    </div>
  );
}

export default async function TodayPage() {
  await requireSession();
  const ctx = studyContext();
  const overview = todayOverview(ctx);

  return (
    <>
      <section className={`screen ${styles.home}`}>
        <TodayHeader date={formatLongDate(new Date(ctx.now * 1000), ctx.timeZone)} />
        <StreakCard days={overview.streakDays} studiedToday={overview.studiedToday} week={overview.week} />
        <LessonPage today={overview.lesson} />
      </section>
      <Dock today={overview.lesson} />
    </>
  );
}
