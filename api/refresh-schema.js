import { createClient } from "@supabase/supabase-js";

const handler = async (req, res) => {
  try {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data, error } = await supabase.rpc('exec_sql', { query: "NOTIFY pgrst, 'reload schema';" });
    
    if (error) {
      // Try direct query
      const { data: data2, error: error2 } = await supabase
        .from('users')
        .select('*')
        .limit(1);
      
      return res.status(200).json({ 
        ok: true, 
        message: "Schema cache refresh attempted",
        testQuery: { data: data2, error: error2 }
      });
    }
    
    return res.status(200).json({ ok: true, data });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: String(error) });
  }
};

export default handler;