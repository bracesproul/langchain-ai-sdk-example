"use client";

import React from "react";

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-md py-12 flex flex-col stretch">
      <a href="/stream">Streaming example</a>
      <a href="/tools">Tool calling example</a>
      <a href="/agent">Agent streaming example</a>
    </div>
  );
}
