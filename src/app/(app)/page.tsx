import Link from "next/link";
import type { Metadata } from "next";
import { LessonPage } from "@/components/LessonPage";
import { StreakCard } from "@/components/StreakCard";
import { TodayHeader } from "@/components/TodayHeader";
import { requireSession } from "@/lib/auth";
import { getConfig } from "@/lib/config";
import { Icon } from "@/components/Icon";
import { buildWeek, formatLongDate, lessonToday } from "@/lib/lesson";
import styles from "./today.module.css";

export const metadata: Metadata = { title: "Hoje" };

export default async function TodayPage() {
  await requireSession();
  const { timeZone } = getConfig();
  const now = new Date();

  return (
    <>
      <section className={`screen ${styles.home}`}>
        <TodayHeader date={formatLongDate(now, timeZone)} />
        <StreakCard days={lessonToday.streakDays} week={buildWeek(now, timeZone)} />
        <LessonPage lesson={lessonToday} />
      </section>
      <div className="dock">
        <Link href="/aula" className="btn btn-primary">
          Começar a aula <Icon name="arrow" />
        </Link>
      </div>
    </>
  );
}
