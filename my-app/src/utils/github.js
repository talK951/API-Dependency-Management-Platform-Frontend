export async function fetchGithubFile(fullName, path, ref, token) {
  const url = ref
    ? `https://api.github.com/repos/${fullName}/contents/${path}?ref=${ref}`
    : `https://api.github.com/repos/${fullName}/contents/${path}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const err = new Error(`GitHub ${res.status}: ${path}`);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  return atob(data.content.replace(/\n/g, ''));
}
