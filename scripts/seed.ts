import "dotenv/config";
import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { db, pool } from "../src/db";
import {
  missions,
  notifications,
  pointsLedger,
  rewardQueue,
  submissions,
  users,
} from "../src/db/schema";

function fakeHash(seed: string) {
  let h1 = 0;
  let h2 = 0;
  for (let i = 0; i < seed.length; i++) {
    h1 = (h1 * 31 + seed.charCodeAt(i)) >>> 0;
    h2 = (h2 * 17 + seed.charCodeAt(i)) >>> 0;
  }
  return (h1.toString(16) + h2.toString(16)).padStart(64, "0").slice(0, 64);
}

function placeholderPhoto(seed: string) {
  return `https://picsum.photos/seed/ecoverify-${seed}/800/600`;
}

async function main() {
  console.log("🌱 Seeding EcoVerify demo data...");

  const passwordHash = await bcrypt.hash("123456", 10);

  const [ana] = await db
    .insert(users)
    .values({
      name: "Ana Souza",
      email: "ana@ecoverify.app",
      passwordHash,
      role: "citizen",
      walletAddress: "0xFONEaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      language: "pt",
    })
    .returning();

  const [marcos] = await db
    .insert(users)
    .values({
      name: "Marcos Lima",
      email: "marcos@ecoverify.app",
      passwordHash,
      role: "moderator",
      walletAddress: "0xFONEbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      language: "pt",
    })
    .returning();

  const [julia] = await db
    .insert(users)
    .values({
      name: "Júlia Ramos",
      email: "julia@ecoverify.app",
      passwordHash,
      role: "admin",
      walletAddress: "0xFONEcccccccccccccccccccccccccccccccccccc",
      language: "pt",
    })
    .returning();

  const extraSeeds: [string, string][] = [
    ["Bruno Alves", "bruno@ecoverify.app"],
    ["Carla Nunes", "carla@ecoverify.app"],
    ["Diego Farias", "diego@ecoverify.app"],
    ["Elisa Prado", "elisa@ecoverify.app"],
  ];
  const extraUsers = [];
  for (const [name, email] of extraSeeds) {
    const [u] = await db
      .insert(users)
      .values({ name, email, passwordHash, role: "citizen", language: "pt" })
      .returning();
    extraUsers.push(u);
  }

  const missionSeeds = [
    {
      title: "Plante uma árvore nativa",
      description:
        "Plante uma muda de espécie nativa em um espaço público ou no seu quintal e registre o processo.",
      category: "planting" as const,
      pointsReward: 50,
      foneReward: "2.00",
    },
    {
      title: "Doe alimentos ou roupas",
      description: "Leve uma doação a uma instituição local e comprove a entrega.",
      category: "donation" as const,
      pointsReward: 40,
      foneReward: "1.50",
    },
    {
      title: "Recicle materiais",
      description: "Separe plástico, papel, vidro ou metal e leve a um ponto de coleta.",
      category: "recycling" as const,
      pointsReward: 30,
      foneReward: "1.00",
    },
    {
      title: "Participe de um mutirão de limpeza",
      description: "Ajude a limpar uma praça, rio ou praia da sua cidade.",
      category: "cleanup" as const,
      pointsReward: 60,
      foneReward: "2.50",
    },
    {
      title: "Ação livre",
      description: "Realize outra ação ambiental positiva e descreva-a em detalhes.",
      category: "other" as const,
      pointsReward: 20,
      foneReward: "0.50",
    },
  ];

  const createdMissions: (typeof missions.$inferSelect)[] = [];
  for (const m of missionSeeds) {
    const [mission] = await db
      .insert(missions)
      .values({ ...m, createdBy: julia.id })
      .returning();
    createdMissions.push(mission);
  }
  const [mPlanting, mDonation, mRecycling, mCleanup, mOther] = createdMissions;

  async function addApprovedSubmission(
    userId: string,
    mission: (typeof createdMissions)[number],
    report: string,
    reviewerId: string,
    rewardStatus: "pending" | "processing" | "paid" | "failed" = "pending",
    seedKey?: string,
  ) {
    const [submission] = await db
      .insert(submissions)
      .values({
        userId,
        missionId: mission.id,
        photoUrl: placeholderPhoto(seedKey ?? `${userId}-${mission.id}`),
        photoHash: fakeHash(seedKey ?? `${userId}-${mission.id}-${report.slice(0, 10)}`),
        report,
        status: "approved",
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        latitude: "-23.550520",
        longitude: "-46.633308",
      })
      .returning();

    await db.insert(pointsLedger).values({ userId, submissionId: submission.id, points: mission.pointsReward });
    await db
      .update(users)
      .set({ totalPoints: sql`${users.totalPoints} + ${mission.pointsReward}` })
      .where(eq(users.id, userId));
    await db.insert(rewardQueue).values({
      userId,
      submissionId: submission.id,
      foneAmount: mission.foneReward,
      status: rewardStatus,
      network: rewardStatus === "paid" ? "EcoChain" : null,
      txHash: rewardStatus === "paid" ? "0xTX" + fakeHash(submission.id).slice(0, 20) : null,
    });
    return submission;
  }

  async function addPendingSubmission(
    userId: string,
    mission: (typeof createdMissions)[number],
    report: string,
    seedKey?: string,
  ) {
    return db
      .insert(submissions)
      .values({
        userId,
        missionId: mission.id,
        photoUrl: placeholderPhoto(seedKey ?? `${userId}-${mission.id}-pending`),
        photoHash: fakeHash(seedKey ?? `${userId}-${mission.id}-pending-${report.slice(0, 10)}`),
        report,
        status: "pending",
      })
      .returning();
  }

  async function addRejectedSubmission(
    userId: string,
    mission: (typeof createdMissions)[number],
    report: string,
    reviewerId: string,
    reason: string,
    seedKey?: string,
  ) {
    return db
      .insert(submissions)
      .values({
        userId,
        missionId: mission.id,
        photoUrl: placeholderPhoto(seedKey ?? `${userId}-${mission.id}-rejected`),
        photoHash: fakeHash(seedKey ?? `${userId}-${mission.id}-rejected-${report.slice(0, 10)}`),
        report,
        status: "rejected",
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        rejectionReason: reason,
      })
      .returning();
  }

  // Ana (citizen): approved, pending, rejected
  await addApprovedSubmission(
    ana.id,
    mPlanting,
    "Plantei uma muda de ipê amarelo na praça perto de casa junto com meus vizinhos. Foi uma manhã incrível e vamos continuar cuidando dela nos próximos meses.",
    marcos.id,
    "pending",
    "ana-approved-1",
  );
  await addPendingSubmission(
    ana.id,
    mRecycling,
    "Separei todo o plástico e vidro da minha casa neste mês e levei até o ponto de coleta do bairro Jardim das Flores.",
    "ana-pending-1",
  );
  await addRejectedSubmission(
    ana.id,
    mOther,
    "Fiz uma ação de conscientização com meus vizinhos sobre economia de água durante o fim de semana.",
    marcos.id,
    "A foto enviada não mostra claramente a ação relatada. Por favor, envie uma nova comprovação com mais detalhes visuais.",
    "ana-rejected-1",
  );

  // Marcos (moderator) also participates as a citizen
  await addApprovedSubmission(
    marcos.id,
    mDonation,
    "Levamos roupas de inverno e alimentos não perecíveis para o abrigo municipal, ajudando cerca de 30 famílias da região.",
    julia.id,
    "processing",
    "marcos-approved-1",
  );
  await addPendingSubmission(
    marcos.id,
    mCleanup,
    "Organizei um mutirão de limpeza na orla do rio com mais dez voluntários no último sábado de manhã.",
    "marcos-pending-1",
  );

  // Júlia (admin) also participates
  await addApprovedSubmission(
    julia.id,
    mCleanup,
    "Participei do mutirão de limpeza da praça central organizado pela prefeitura, recolhendo mais de 40kg de resíduos.",
    marcos.id,
    "paid",
    "julia-approved-1",
  );

  // Extra users for ranking diversity
  const extraReports = [
    "Plantei três mudas nativas no quintal da escola do bairro com o apoio dos alunos.",
    "Doei roupas de inverno para a campanha do agasalho da igreja local.",
    "Recolhi resíduos recicláveis do meu prédio inteiro e levei ao ecoponto mais próximo.",
    "Ajudei a organizar um mutirão de limpeza na praia durante o feriado prolongado.",
  ];
  const extraMissions = [mPlanting, mDonation, mRecycling, mCleanup];
  for (let i = 0; i < extraUsers.length; i++) {
    await addApprovedSubmission(
      extraUsers[i].id,
      extraMissions[i % extraMissions.length],
      extraReports[i % extraReports.length],
      marcos.id,
      i % 2 === 0 ? "paid" : "pending",
      `extra-${i}-approved`,
    );
  }
  // give Bruno a bit more so ranking looks natural
  await addApprovedSubmission(
    extraUsers[0].id,
    mCleanup,
    "Voltei a participar de outro mutirão de limpeza no mesmo mês, desta vez em um parque da cidade.",
    julia.id,
    "paid",
    "extra-0-approved-2",
  );

  // Notifications for Ana
  await db.insert(notifications).values([
    {
      userId: ana.id,
      type: "system",
      title: "Comprovação aprovada! 🎉",
      message: `Sua comprovação para "${mPlanting.title}" foi aprovada. Você ganhou ${mPlanting.pointsReward} pontos e ${mPlanting.foneReward} FONE entrou na fila de pagamento.`,
      isRead: false,
    },
    {
      userId: ana.id,
      type: "alert",
      title: "Comprovação rejeitada",
      message: `Sua comprovação para "${mOther.title}" foi rejeitada. Motivo: a foto enviada não mostra claramente a ação relatada.`,
      isRead: false,
    },
    {
      userId: ana.id,
      type: "admin",
      title: "Bem-vinda ao EcoVerify!",
      message: "Obrigada por fazer parte da nossa comunidade de guardiões do planeta. Continue enviando suas comprovações!",
      isRead: true,
    },
  ]);

  console.log("✅ Seed finished successfully.");
  console.log("Demo accounts (password: 123456):");
  console.log("  Cidadã:   ana@ecoverify.app");
  console.log("  Moderador: marcos@ecoverify.app");
  console.log("  Admin:     julia@ecoverify.app");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
