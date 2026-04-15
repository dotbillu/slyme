export async function handleResponse(res: Response) {
  let data;

  try {
    data = await res.json();
  } catch {
    throw new Error("Invalid server response");
  }

  if (!res.ok) {
    throw new Error(data?.error || "Something went wrong");
  }

  return data;
}
