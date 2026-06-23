import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: todos } = await supabase.from('todos').select()

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 p-8">
      <h1 className="text-xl font-bold mb-4 text-primary">Supabase Todo List Integration</h1>
      <ul className="space-y-2 list-disc pl-5">
        {todos && todos.length > 0 ? (
          todos.map((todo: any) => (
            <li key={todo.id} className="text-sm font-medium">{todo.name}</li>
          ))
        ) : (
          <li className="text-xs text-slate-500 italic">No items found in the &apos;todos&apos; table.</li>
        )}
      </ul>
    </div>
  )
}
