import { createClient } from "@supabase/supabase-js";

const handler = async (req, res) => {
  if (req.method === "GET") {
    try {
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.VITE_SUPABASE_ANON_KEY
      );
      
      const { data, error } = await supabase.from("users").select("id").limit(1);
      
      if (error) throw error;
      
      return res.status(200).json({ ok: true, count: data.length, data: data[0] });
    } catch (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ error: error.message || String(error), stack: error.stack });
    }
  }
  return res.status(405).json({ error: "Method not allowed" });
};

export default handler;