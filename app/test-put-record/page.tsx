"use client";

import { useState } from "react";

const DEFAULT_COLLECTION = "org.hypercerts.claim.rights";
const DEFAULT_RKEY = "test-put-record-001";
const DEFAULT_RECORD = JSON.stringify(
  {
    $type: "org.hypercerts.claim.rights",
    rightsName: "Test Rights",
    rightsType: "CC0",
    rightsDescription: "Testing putRecord",
    createdAt: "2025-01-01T00:00:00.000Z",
  },
  null,
  2,
);

export default function TestPutRecordPage() {
  const [collection, setCollection] = useState(DEFAULT_COLLECTION);
  const [rkey, setRkey] = useState(DEFAULT_RKEY);
  const [recordJson, setRecordJson] = useState(DEFAULT_RECORD);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    let record: unknown;
    try {
      record = JSON.parse(recordJson);
    } catch {
      setError("Invalid JSON in record field");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/test-put-record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collection, rkey, record }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Unknown error");
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{ maxWidth: 640, margin: "2rem auto", fontFamily: "monospace" }}
    >
      <h1 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>
        Test putRecord
      </h1>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        <label>
          <div style={{ marginBottom: "0.25rem" }}>Collection</div>
          <input
            type="text"
            value={collection}
            onChange={(e) => setCollection(e.target.value)}
            style={{
              width: "100%",
              padding: "0.4rem",
              boxSizing: "border-box",
            }}
          />
        </label>
        <label>
          <div style={{ marginBottom: "0.25rem" }}>rkey</div>
          <input
            type="text"
            value={rkey}
            onChange={(e) => setRkey(e.target.value)}
            style={{
              width: "100%",
              padding: "0.4rem",
              boxSizing: "border-box",
            }}
          />
        </label>
        <label>
          <div style={{ marginBottom: "0.25rem" }}>Record JSON</div>
          <textarea
            value={recordJson}
            onChange={(e) => setRecordJson(e.target.value)}
            rows={12}
            style={{
              width: "100%",
              padding: "0.4rem",
              boxSizing: "border-box",
              fontFamily: "monospace",
            }}
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "0.5rem 1rem",
            cursor: loading ? "not-allowed" : "pointer",
            width: "fit-content",
          }}
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
      </form>

      {error && (
        <div style={{ marginTop: "1rem", color: "red" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result !== null && (
        <div style={{ marginTop: "1rem" }}>
          <strong>Response:</strong>
          <pre
            style={{
              background: "#f4f4f4",
              padding: "1rem",
              overflowX: "auto",
            }}
          >
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
