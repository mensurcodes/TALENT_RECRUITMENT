// app/api/login/route.ts
export async function POST(request: Request) {
  const { email, password } = await request.json();
  // db check, auth logic, etc.
  return Response.json({ success: true });
}
