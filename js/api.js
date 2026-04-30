// api.js — all Supabase calls for the classroom portal

const SUPABASE_URL = 'https://hhyhulqngdkwsxhymmcd.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoeWh1bHFuZ2Rrd3N4aHltbWNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMzEyMDEsImV4cCI6MjA5MjcwNzIwMX0.dmSy7Q8Je5lEY4XCFzwvfPnkBYLebPE0yZMhy6Y8czI'

const h = () => ({
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
})

async function get(table, params) {
  const p = new URLSearchParams(params)
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${p}`, { headers: h() })
  const d = await r.json()
  return r.ok ? { data: d, error: null } : { data: null, error: d }
}

async function post(table, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...h(), 'Prefer': 'return=representation' },
    body: JSON.stringify(body)
  })
  const d = await r.json()
  return r.ok ? { data: Array.isArray(d) ? d[0] : d, error: null } : { data: null, error: d }
}

/**
 * Look up a teacher + school + class by class code.
 * Returns { teacher, school, class } or error.
 */
export async function lookupClassCode(code) {
  const { data, error } = await get('teachers', {
    class_code: `eq.${code.trim().toUpperCase()}`,
    select: 'id,name,title,class_code,school_id,schools(id,name,slug,accent_color,secondary_color,tagline,city,state,logo_url)',
    limit: '1'
  })
  if (error || !data?.length) return { data: null, error: error || 'not_found' }
  const teacher = data[0]
  const school  = teacher.schools

  const { data: clsData, error: clsErr } = await get('classes', {
    teacher_id: `eq.${teacher.id}`,
    select: 'id,name,grade_level,subject,period,academic_year',
    limit: '1'
  })
  if (clsErr || !clsData?.length) return { data: null, error: clsErr || 'no_class' }

  return { data: { teacher, school, cls: clsData[0] }, error: null }
}

/**
 * Fetch roster for a class, sorted alphabetically.
 */
export async function fetchRoster(classId) {
  return get('students', {
    class_id: `eq.${classId}`,
    select: 'id,first_name,last_name,display_name',
    order: 'last_name.asc,first_name.asc'
  })
}

/**
 * Fetch courses assigned to a class.
 */
export async function fetchClassCourses(classId) {
  return get('class_courses', {
    class_id: `eq.${classId}`,
    select: 'course_id,courses(id,title,description,accent_color,status,audience,duration_months)'
  })
}

/**
 * Create or refresh a student session. Stores in localStorage too.
 */
export async function startSession(studentId, classId, schoolId) {
  const { data, error } = await post('student_sessions', {
    student_id: studentId,
    class_id: classId,
    school_id: schoolId
  })
  if (!error && data) {
    localStorage.setItem('cp_session', JSON.stringify({
      sessionId: data.id,
      studentId,
      classId,
      schoolId,
      ts: Date.now()
    }))
  }
  return { data, error }
}

/**
 * Load session from localStorage. Returns null if missing or >12h old.
 */
export function loadSession() {
  try {
    const raw = localStorage.getItem('cp_session')
    if (!raw) return null
    const s = JSON.parse(raw)
    if (Date.now() - s.ts > 12 * 60 * 60 * 1000) {
      localStorage.removeItem('cp_session')
      return null
    }
    return s
  } catch { return null }
}

export function clearSession() {
  localStorage.removeItem('cp_session')
  localStorage.removeItem('cp_context')
}

/**
 * Save full context (school, teacher, class, student) to localStorage.
 */
export function saveContext(ctx) {
  localStorage.setItem('cp_context', JSON.stringify(ctx))
}

export function loadContext() {
  try { return JSON.parse(localStorage.getItem('cp_context')) } catch { return null }
}

export function escHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
