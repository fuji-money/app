export async function fetchURL(url: string) {
  const res = await fetch(url)
  return await res.json()
}

export async function postData(url: string, data = {}) {
  const res = await fetch(url, {
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })
  if (!res.ok) {
    const errorMessage = await res.text()
    throw new Error(`${res.statusText}: ${errorMessage}`)
  }
  return await res.json()
}
