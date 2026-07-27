/* ============================================================
   CONFIGURAÇÃO — o único arquivo que você precisa editar.

   Enquanto estiver em branco, o app roda em "modo local":
   funciona normalmente, mas salva só no seu navegador.

   Para a lista ser compartilhada, crie um projeto grátis no
   Supabase (supabase.com), rode o SQL de supabase-schema.sql e
   cole abaixo os dois valores de Settings > API.

   A "anon key" é pública por natureza — pode ficar aqui e ir
   pro GitHub sem problema. Nunca coloque a "service_role key".
   ============================================================ */

window.CONFIG = {
  SUPABASE_URL: "https://rarnvyfsmreisldbrdnx.supabase.co",       // ex: "https://abcdefghijk.supabase.co"
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhcm52eWZzbXJlaXNsZGJyZG54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4NTY5MDgsImV4cCI6MjEwMDQzMjkwOH0.Afjbl5nPa2oZmWPw6ARWNeF7JGD354rW9q4XzPUXiOo",  // ex: "eyJhbGciOiJIUzI1NiIsInR5cCI6..."

  // De quantos em quantos segundos buscar novidades dos outros.
  INTERVALO_SYNC: 4,
};
