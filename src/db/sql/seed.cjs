// Seed opcional de dados demo (restrito: só deve ser rodado por um admin/dev,
// nunca exposto como endpoint público). Cria usuários de teste (um de cada
// role) e um catálogo de missões demo.
//
// Uso: node src/db/sql/seed.cjs
const { Client } = require("pg");
const bcrypt = require("bcryptjs");

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@127.0.0.1:5432/app_db";

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  try {
    const users = [
      { nome: "Admin Eco", email: "admin@ecoverify.app", senha: "admin123", role: "admin" },
      { nome: "Moderador Eco", email: "moderador@ecoverify.app", senha: "moderador123", role: "moderator" },
      { nome: "Cidadão Demo", email: "cidadao@ecoverify.app", senha: "cidadao123", role: "citizen" },
    ];

    for (const u of users) {
      const hash = await bcrypt.hash(u.senha, 10);
      await client.query(
        `insert into profiles (nome, email, password_hash, role)
         values ($1, $2, $3, $4)
         on conflict (email) do nothing`,
        [u.nome, u.email, hash, u.role],
      );
    }

    const { rows: adminRows } = await client.query(
      `select id from profiles where email = 'admin@ecoverify.app' limit 1`,
    );
    const adminId = adminRows[0]?.id ?? null;

    const missions = [
      {
        titulo: "Plantar uma árvore nativa",
        descricao:
          "Plante uma muda de árvore nativa em um espaço público ou em sua propriedade e registre o processo.",
        categoria: "plantio",
        pontos: 100,
        fone: 5.5,
      },
      {
        titulo: "Doação de alimentos não perecíveis",
        descricao:
          "Doe alimentos para uma instituição de caridade local e registre a entrega com foto e relatório.",
        categoria: "doacao",
        pontos: 60,
        fone: 3.0,
      },
      {
        titulo: "Reciclagem de materiais",
        descricao:
          "Separe e leve materiais recicláveis (plástico, papel, vidro ou metal) a um ponto de coleta.",
        categoria: "reciclagem",
        pontos: 40,
        fone: 2.0,
      },
      {
        titulo: "Mutirão de limpeza urbana",
        descricao:
          "Participe ou organize um mutirão de limpeza em praças, rios ou praias da sua cidade.",
        categoria: "mutirao",
        pontos: 80,
        fone: 4.0,
      },
      {
        titulo: "Ação ambiental livre",
        descricao:
          "Realize outra ação ambiental de impacto positivo não coberta pelas categorias acima e descreva-a em detalhes.",
        categoria: "outro",
        pontos: 30,
        fone: 1.5,
      },
    ];

    for (const m of missions) {
      const { rows } = await client.query(
        `select id from missions where titulo = $1 limit 1`,
        [m.titulo],
      );
      if (rows.length > 0) continue;
      await client.query(
        `insert into missions (titulo, descricao, categoria, pontos_recompensa, fone_recompensa_estimado, ativa, created_by)
         values ($1, $2, $3, $4, $5, true, $6)`,
        [m.titulo, m.descricao, m.categoria, m.pontos, m.fone, adminId],
      );
    }

    console.log("Seed concluído com sucesso.");
    console.log("Usuários demo:");
    for (const u of users) {
      console.log(`  ${u.role.padEnd(10)} ${u.email} / ${u.senha}`);
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
