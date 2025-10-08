/* eslint-disable no-console */
require('dotenv').config();

const base = process.env.BASE_URL || 'http://localhost:3000';

async function req(path, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch (_) { json = { raw: text }; }
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${JSON.stringify(json)}`);
  return json;
}

async function login(email, password) {
  const r = await req('/api/auth/login', { method: 'POST', body: { email, password } });
  return { token: r.data.tokens.accessToken, user: r.data.user };
}

async function main() {
  const out = [];
  const push = (msg) => out.push(msg) && console.log(msg);

  await req('/health'); push('Health OK');
  await req('/api/public/metrics'); push('Public metrics OK');
  await req('/api/public/home'); push('Public home OK');

  // Newsletter
  const testEmail = `test_${Date.now()}@example.com`;
  await req('/api/newsletter/subscribe', { method: 'POST', body: { email: testEmail } });
  await req('/api/newsletter/unsubscribe', { method: 'DELETE', body: { email: testEmail } }); push('Newsletter OK');

  // Logins (seeded by scripts/seed.js)
  const admin = await login('monu2feb2004@gmail.com', 'Monu@2004'); push('Admin login OK');
  const mentor = await login('mentor@example.com', 'Mentor@2024'); push('Mentor login OK');
  const leader = await login('leader@example.com', 'Leader@2024'); push('Leader login OK');

  // Users
  await req('/api/users/me', { token: admin.token }); push('Users me OK');
  await req('/api/users', { token: admin.token }); push('Users list OK');

  // Projects
  const pCreate = await req('/api/projects', { method: 'POST', token: admin.token, body: {
    title: `Test Project ${Date.now()}`,
    description: 'End-to-end test project',
    category: 'Testing', status: 'upcoming', teamLeaderId: leader.user.id, mentorId: mentor.user.id,
  }});
  const projectId = pCreate.data.project._id || pCreate.data.project.id; push('Project create OK');
  await req(`/api/projects/${projectId}`, { method: 'PUT', token: admin.token, body: { status: 'ongoing' } }); push('Project update OK');
  await req(`/api/projects/${projectId}/members`, { method: 'POST', token: mentor.token, body: { userId: admin.user.id, role: 'Coordinator' } }); push('Project add member OK');
  await req(`/api/projects/${projectId}/milestones`, { method: 'POST', token: leader.token, body: { title: 'Milestone 1', dueDate: new Date(Date.now()+3*864e5).toISOString() } }); push('Project milestone add OK');

  // Workshops
  const wCreate = await req('/api/workshops', { method: 'POST', token: mentor.token, body: {
    title: `Test Workshop ${Date.now()}`,
    description: 'End-to-end test workshop',
    instructorId: mentor.user.id, level: 'beginner', maxParticipants: 10,
    startDate: new Date(Date.now()+5*864e5).toISOString(), endDate: new Date(Date.now()+5*864e5+3*3600e3).toISOString(),
  }}); const workshopId = wCreate.data.item._id; push('Workshop create OK');
  await req(`/api/workshops/${workshopId}/register`, { method: 'POST', token: admin.token }); push('Workshop register OK');
  await req(`/api/workshops/${workshopId}/register`, { method: 'DELETE', token: admin.token }); push('Workshop unregister OK');

  // Inventory
  const cat = await req('/api/inventory/categories', { method: 'POST', token: admin.token, body: { name: `Cat ${Date.now()}` } });
  const categoryId = cat.data.item._id; push('Inventory category create OK');
  const eq = await req('/api/inventory/equipment', { method: 'POST', token: admin.token, body: { name: `Eq ${Date.now()}`, categoryId, currentQuantity: 2 } });
  const eqId = eq.data.item._id; push('Equipment create OK');
  await req(`/api/inventory/equipment/${eqId}/checkout`, { method: 'POST', token: admin.token, body: { quantity: 1 } }); push('Equipment checkout OK');
  await req(`/api/inventory/equipment/${eqId}/return`, { method: 'PUT', token: admin.token, body: {} }); push('Equipment return OK');

  // Events
  const ev = await req('/api/events', { method: 'POST', token: mentor.token, body: {
    title: `Test Event ${Date.now()}`, description: 'Event for tests', type: 'technical', startDate: new Date(Date.now()+2*864e5).toISOString(), endDate: new Date(Date.now()+2*864e5+2*3600e3).toISOString()
  }}); const eventId = ev.data.item._id; push('Event create OK');
  await req(`/api/events/${eventId}`, { method: 'PUT', token: mentor.token, body: { isFeatured: true } }); push('Event update OK');

  // News
  const ncat = await req('/api/news/categories', { method: 'POST', token: mentor.token, body: { name: `NewsCat ${Date.now()}` } });
  const ncatId = ncat.data.item._id; push('News category create OK');
  const news = await req('/api/news', { method: 'POST', token: mentor.token, body: { title: `News ${Date.now()}`, content: 'Long content...', authorId: admin.user.id, categoryId: ncatId, isPublished: true, publishedAt: new Date().toISOString() } });
  const newsId = news.data.item._id; push('News create OK');
  await req(`/api/news/${newsId}`, { method: 'PUT', token: mentor.token, body: { isFeatured: true } }); push('News update OK');

  // Media
  const mcat = await req('/api/media/categories', { method: 'POST', token: admin.token, body: { name: `MediaCat ${Date.now()}` } });
  const mcatId = mcat.data.item._id; push('Media category create OK');
  const media = await req('/api/media', { method: 'POST', token: admin.token, body: { title: 'Test Image', fileUrl: 'https://example.com/img.jpg', fileType: 'image', uploadedBy: admin.user.id, categoryId: mcatId } });
  const mediaId = media.data.item._id; push('Media create OK');
  await req(`/api/media/${mediaId}`, { method: 'PUT', token: admin.token, body: { isFeatured: true } }); push('Media update OK');

  // Project Requests
  const pr = await req('/api/project-requests', { method: 'POST', token: leader.token, body: { title: `PR ${Date.now()}`, description: 'Long desc', teamSize: 3, estimatedDurationMonths: 6 } });
  const prId = pr.data.item._id; push('PR create OK');
  await req(`/api/project-requests/${prId}/approve`, { method: 'POST', token: mentor.token, body: {} }); push('PR approve OK');

  // Research areas
  await req('/api/research-areas'); push('Research areas list OK');

  console.log('\nAll API tests passed.');
}

main().catch((e) => { console.error('API tests failed:', e); process.exit(1); });


