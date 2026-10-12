async function request(path, options) {
  let res;
  try {
    res = await fetch(path, options);
  } catch {
    const e = new Error("Cannot reach the backend. Is it running on port 5000?");
    e.network = true;
    throw e;
  }
  let data = {};
  try {
    data = await res.json();
  } catch {
    /* non-JSON response */
  }
  if (!res.ok) {
    const e = new Error(data.error || `Request failed (${res.status})`);
    e.fields = data.fields || {};
    throw e;
  }
  return data;
}

export const predict = (form, signal) =>
  request("/api/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
    signal,
  });

export const getMetrics = () => request("/api/metrics");

export const getFairness = () => request("/api/fairness");

export const getDrift = (scenario = "shift") =>
  request(`/api/drift?scenario=${scenario}`, { method: "POST" });

export const uploadDrift = (file) => {
  const body = new FormData();
  body.append("file", file);
  return request("/api/drift", { method: "POST", body });
};

export const uploadBatch = (file) => {
  const body = new FormData();
  body.append("file", file);
  return request("/api/batch", { method: "POST", body });
};
