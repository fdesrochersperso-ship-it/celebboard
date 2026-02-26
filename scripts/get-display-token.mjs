import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xkmhurjvmwlddkmbbvll.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const { data, error } = await supabase
  .from('organizations')
  .select('id, name, display_token')
  .order('created_at', { ascending: false })
  .limit(5)

if (error) {
  console.error('Error:', error.message)
  process.exit(1)
}

console.log(JSON.stringify(data, null, 2))
if (data?.length > 0) {
  const first = data[0]
  console.log('\n--- First org display URL ---')
  console.log(`http://localhost:3000/display/${first.display_token}`)
}
